const db = require('../data/database-service');

class FeesService {
  async createFeeStructure(feeData, trustCode) {
    try {
      const sql = `
        INSERT INTO fee_structures (
          fee_head, class_id, academic_year_id, amount, due_date,
          is_mandatory, installments, late_fee_amount, late_fee_days,
          description, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await db.queryTrust(trustCode, sql, [
        feeData.fee_head,
        feeData.class_id,
        feeData.academic_year_id,
        feeData.amount,
        feeData.due_date,
        feeData.is_mandatory || true,
        feeData.installments || 1,
        feeData.late_fee_amount || 0,
        feeData.late_fee_days || 7,
        feeData.description || null,
        feeData.status || 'ACTIVE'
      ]);

      return { feeStructureId: result.insertId };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Fee structure already exists for this class and academic year');
      }
      throw new Error(`Failed to create fee structure: ${error.message}`);
    }
  }

  async updateFeeStructure(feeStructureId, feeData, trustCode) {
    try {
      const updateFields = [];
      const params = [];

      const allowedFields = [
        'amount',
        'due_date',
        'is_mandatory',
        'installments',
        'late_fee_amount',
        'late_fee_days',
        'description',
        'status'
      ];

      for (const field of allowedFields) {
        if (feeData[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          params.push(feeData[field]);
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      params.push(feeStructureId);

      const sql = `
        UPDATE fee_structures 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = ?
      `;

      const result = await db.queryTrust(trustCode, sql, params);

      if (result.affectedRows === 0) {
        throw new Error('Fee structure not found');
      }

      return { feeStructureId, updated: true };
    } catch (error) {
      throw new Error(`Failed to update fee structure: ${error.message}`);
    }
  }

  async getFeeStructures(filters, trustCode) {
    let sql = `
      SELECT fs.*, c.class_name, ay.year_name as academic_year
      FROM fee_structures fs
      LEFT JOIN classes c ON fs.class_id = c.id
      LEFT JOIN academic_years ay ON fs.academic_year_id = ay.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.class_id) {
      sql += ' AND fs.class_id = ?';
      params.push(filters.class_id);
    }

    if (filters.academic_year_id) {
      sql += ' AND fs.academic_year_id = ?';
      params.push(filters.academic_year_id);
    }

    if (filters.status) {
      sql += ' AND fs.status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY c.class_order ASC, fs.fee_head ASC';

    return await db.queryTrust(trustCode, sql, params);
  }

  async assignFeesToStudent(studentId, feeAssignments, trustCode) {
    try {
      return await db.transactionTrust(trustCode, async connection => {
        const results = [];

        for (const assignment of feeAssignments) {
          const sql = `
            INSERT INTO student_fee_assignments (
              student_id, fee_structure_id, assigned_amount, discount_amount,
              final_amount, due_date, assigned_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              assigned_amount = VALUES(assigned_amount),
              discount_amount = VALUES(discount_amount),
              final_amount = VALUES(final_amount),
              due_date = VALUES(due_date),
              updated_at = NOW()
          `;

          const discountAmount = assignment.discount_amount || 0;
          const finalAmount = assignment.assigned_amount - discountAmount;

          const [result] = await connection.execute(sql, [
            studentId,
            assignment.fee_structure_id,
            assignment.assigned_amount,
            discountAmount,
            finalAmount,
            assignment.due_date,
            assignment.assigned_by
          ]);

          results.push({
            feeStructureId: assignment.fee_structure_id,
            assignmentId: result.insertId || result.affectedRows,
            assigned: true
          });
        }

        return { assignments: results };
      });
    } catch (error) {
      throw new Error(`Failed to assign fees: ${error.message}`);
    }
  }

  async bulkAssignFees(classId, academicYearId, assignedBy, trustCode) {
    try {
      return await db.transactionTrust(trustCode, async connection => {
        // Get all students in the class
        const studentsSql = `
          SELECT id FROM students 
          WHERE class_id = ? AND academic_year_id = ? AND status = 'ACTIVE'
        `;
        const [students] = await connection.execute(studentsSql, [classId, academicYearId]);

        // Get fee structures for the class
        const feesSql = `
          SELECT id, amount, due_date FROM fee_structures 
          WHERE class_id = ? AND academic_year_id = ? AND status = 'ACTIVE'
        `;
        const [feeStructures] = await connection.execute(feesSql, [classId, academicYearId]);

        let assignmentCount = 0;

        for (const student of students) {
          for (const feeStructure of feeStructures) {
            const assignSql = `
              INSERT INTO student_fee_assignments (
                student_id, fee_structure_id, assigned_amount, 
                discount_amount, final_amount, due_date, assigned_by
              ) VALUES (?, ?, ?, 0, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                assigned_amount = VALUES(assigned_amount),
                final_amount = VALUES(final_amount),
                updated_at = NOW()
            `;

            await connection.execute(assignSql, [
              student.id,
              feeStructure.id,
              feeStructure.amount,
              feeStructure.amount,
              feeStructure.due_date,
              assignedBy
            ]);

            assignmentCount++;
          }
        }

        return { assignedCount: assignmentCount };
      });
    } catch (error) {
      throw new Error(`Failed to bulk assign fees: ${error.message}`);
    }
  }

  async collectFeePayment(paymentData, trustCode) {
    try {
      return await db.transactionTrust(trustCode, async connection => {
        // Generate receipt number
        const receiptNo = await this.generateReceiptNumber(trustCode);

        // Create fee receipt
        const receiptSql = `
          INSERT INTO fee_receipts (
            receipt_no, student_id, amount_paid, late_fee_paid, total_paid,
            payment_mode, payment_reference, bank_name, cheque_no, cheque_date,
            paid_date, academic_year_id, remarks, collected_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const totalPaid = (paymentData.amount_paid || 0) + (paymentData.late_fee_paid || 0);

        const [receiptResult] = await connection.execute(receiptSql, [
          receiptNo,
          paymentData.student_id,
          paymentData.amount_paid,
          paymentData.late_fee_paid || 0,
          totalPaid,
          paymentData.payment_mode,
          paymentData.payment_reference || null,
          paymentData.bank_name || null,
          paymentData.cheque_no || null,
          paymentData.cheque_date || null,
          paymentData.paid_date,
          paymentData.academic_year_id,
          paymentData.remarks || null,
          paymentData.collected_by
        ]);

        const receiptId = receiptResult.insertId;

        // Update fee assignment statuses
        if (paymentData.fee_assignments) {
          await this.updateFeeAssignmentStatuses(
            paymentData.fee_assignments,
            totalPaid,
            connection
          );
        }

        return { receiptId, receiptNo, totalPaid };
      });
    } catch (error) {
      throw new Error(`Failed to collect fee payment: ${error.message}`);
    }
  }

  async updateFeeAssignmentStatuses(feeAssignments, totalPaid, connection) {
    for (const assignment of feeAssignments) {
      const sql = `
        UPDATE student_fee_assignments 
        SET status = CASE 
          WHEN ? >= final_amount THEN 'PAID'
          WHEN ? > 0 THEN 'PARTIALLY_PAID'
          ELSE status
        END
        WHERE id = ?
      `;

      await connection.execute(sql, [
        assignment.amount_allocated,
        assignment.amount_allocated,
        assignment.assignment_id
      ]);
    }
  }

  async generateReceiptNumber(trustCode) {
    const year = new Date().getFullYear().toString();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

    const sql = `
      SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_no, 8) AS UNSIGNED)), 0) + 1 as next_seq
      FROM fee_receipts 
      WHERE receipt_no LIKE 'FEE${year}${month}%'
    `;

    const result = await db.queryTrust(trustCode, sql);
    const sequence = result[0].next_seq.toString().padStart(4, '0');

    return `FEE${year}${month}${sequence}`;
  }

  async getStudentFeeStatus(studentId, academicYearId, trustCode) {
    const sql = `
      SELECT 
        sfa.id as assignment_id,
        sfa.assigned_amount,
        sfa.discount_amount,
        sfa.final_amount,
        sfa.due_date,
        sfa.status,
        fs.fee_head,
        fs.is_mandatory,
        fs.late_fee_amount,
        fs.late_fee_days,
        COALESCE(payments.paid_amount, 0) as paid_amount,
        CASE 
          WHEN sfa.due_date < CURDATE() AND sfa.status != 'PAID' THEN 
            DATEDIFF(CURDATE(), sfa.due_date) * (fs.late_fee_amount / fs.late_fee_days)
          ELSE 0
        END as calculated_late_fee
      FROM student_fee_assignments sfa
      JOIN fee_structures fs ON sfa.fee_structure_id = fs.id
      LEFT JOIN (
        SELECT 
          student_id,
          SUM(amount_paid) as paid_amount
        FROM fee_receipts
        WHERE student_id = ? AND academic_year_id = ?
        GROUP BY student_id
      ) payments ON sfa.student_id = payments.student_id
      WHERE sfa.student_id = ? AND fs.academic_year_id = ?
      ORDER BY sfa.due_date ASC
    `;

    return await db.queryTrust(trustCode, sql, [
      studentId,
      academicYearId,
      studentId,
      academicYearId
    ]);
  }

  async getOutstandingFees(filters, trustCode) {
    let sql = `
      SELECT 
        s.id as student_id,
        s.admission_no,
        s.first_name,
        s.last_name,
        c.class_name,
        sec.section_name,
        sfa.final_amount - COALESCE(payments.paid_amount, 0) as outstanding_amount,
        sfa.due_date,
        DATEDIFF(CURDATE(), sfa.due_date) as days_overdue
      FROM student_fee_assignments sfa
      JOIN students s ON sfa.student_id = s.id
      JOIN fee_structures fs ON sfa.fee_structure_id = fs.id
      JOIN classes c ON s.class_id = c.id
      JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN (
        SELECT 
          student_id,
          SUM(amount_paid) as paid_amount
        FROM fee_receipts
        GROUP BY student_id
      ) payments ON s.id = payments.student_id
      WHERE sfa.status IN ('PENDING', 'OVERDUE')
        AND sfa.final_amount > COALESCE(payments.paid_amount, 0)
    `;

    const params = [];

    if (filters.school_id) {
      sql += ' AND s.school_id = ?';
      params.push(filters.school_id);
    }

    if (filters.class_id) {
      sql += ' AND s.class_id = ?';
      params.push(filters.class_id);
    }

    if (filters.academic_year_id) {
      sql += ' AND fs.academic_year_id = ?';
      params.push(filters.academic_year_id);
    }

    if (filters.overdue_only) {
      sql += ' AND sfa.due_date < CURDATE()';
    }

    sql += ' ORDER BY sfa.due_date ASC, s.first_name ASC';

    if (filters.limit) {
      sql += ` LIMIT ${parseInt(filters.limit)}`;
      if (filters.offset) {
        sql += ` OFFSET ${parseInt(filters.offset)}`;
      }
    }

    return await db.queryTrust(trustCode, sql, params);
  }

  async applyFeeDiscount(studentId, discountData, trustCode) {
    try {
      return await db.transactionTrust(trustCode, async connection => {
        // Create discount record
        const discountSql = `
          INSERT INTO fee_discounts (
            student_id, discount_type, discount_value, reason,
            valid_from, valid_until, approved_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [discountResult] = await connection.execute(discountSql, [
          studentId,
          discountData.discount_type,
          discountData.discount_value,
          discountData.reason,
          discountData.valid_from,
          discountData.valid_until || null,
          discountData.approved_by
        ]);

        const discountId = discountResult.insertId;

        // Apply discount to fee assignments
        if (discountData.fee_assignments) {
          await this.applyDiscountToAssignments(
            discountData.fee_assignments,
            discountData,
            connection
          );
        }

        return { discountId };
      });
    } catch (error) {
      throw new Error(`Failed to apply discount: ${error.message}`);
    }
  }

  async applyDiscountToAssignments(feeAssignments, discountData, connection) {
    for (const assignmentId of feeAssignments) {
      // Get current assignment
      const [assignments] = await connection.execute(
        'SELECT assigned_amount, discount_amount FROM student_fee_assignments WHERE id = ?',
        [assignmentId]
      );

      if (assignments.length === 0) continue;

      const assignment = assignments[0];
      let newDiscountAmount = assignment.discount_amount;

      // Calculate discount amount
      if (discountData.discount_type === 'PERCENTAGE') {
        newDiscountAmount += (assignment.assigned_amount * discountData.discount_value) / 100;
      } else if (discountData.discount_type === 'FIXED_AMOUNT') {
        newDiscountAmount += discountData.discount_value;
      }

      // Ensure discount doesn't exceed assigned amount
      newDiscountAmount = Math.min(newDiscountAmount, assignment.assigned_amount);

      const finalAmount = assignment.assigned_amount - newDiscountAmount;

      // Update assignment
      await connection.execute(
        `UPDATE student_fee_assignments 
         SET discount_amount = ?, final_amount = ?, updated_at = NOW()
         WHERE id = ?`,
        [newDiscountAmount, finalAmount, assignmentId]
      );
    }
  }

  async getFeeCollectionReport(filters, trustCode) {
    let sql = `
      SELECT 
        DATE(fr.paid_date) as collection_date,
        fr.payment_mode,
        COUNT(fr.id) as receipt_count,
        SUM(fr.total_paid) as total_collected,
        SUM(fr.amount_paid) as fee_amount,
        SUM(fr.late_fee_paid) as late_fee_amount
      FROM fee_receipts fr
      WHERE 1=1
    `;

    const params = [];

    if (filters.from_date) {
      sql += ' AND fr.paid_date >= ?';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      sql += ' AND fr.paid_date <= ?';
      params.push(filters.to_date);
    }

    if (filters.academic_year_id) {
      sql += ' AND fr.academic_year_id = ?';
      params.push(filters.academic_year_id);
    }

    if (filters.payment_mode) {
      sql += ' AND fr.payment_mode = ?';
      params.push(filters.payment_mode);
    }

    sql += ' GROUP BY DATE(fr.paid_date), fr.payment_mode';
    sql += ' ORDER BY collection_date DESC, fr.payment_mode ASC';

    return await db.queryTrust(trustCode, sql, params);
  }

  async getFeeDefaulters(filters, trustCode) {
    const sql = `
      SELECT 
        s.id as student_id,
        s.admission_no,
        s.first_name,
        s.last_name,
        c.class_name,
        sec.section_name,
        COUNT(sfa.id) as overdue_fees,
        SUM(sfa.final_amount - COALESCE(payments.paid_amount, 0)) as total_outstanding,
        MIN(sfa.due_date) as oldest_due_date,
        MAX(sfa.due_date) as latest_due_date
      FROM students s
      JOIN student_fee_assignments sfa ON s.id = sfa.student_id
      JOIN classes c ON s.class_id = c.id
      JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN (
        SELECT 
          student_id,
          SUM(amount_paid) as paid_amount
        FROM fee_receipts
        GROUP BY student_id
      ) payments ON s.id = payments.student_id
      WHERE sfa.due_date < CURDATE()
        AND sfa.final_amount > COALESCE(payments.paid_amount, 0)
        AND s.status = 'ACTIVE'
      GROUP BY s.id
      HAVING total_outstanding > 0
      ORDER BY oldest_due_date ASC, total_outstanding DESC
    `;

    return await db.queryTrust(trustCode, sql);
  }

  async getPaymentHistory(studentId, trustCode) {
    const sql = `
      SELECT 
        fr.receipt_no,
        fr.amount_paid,
        fr.late_fee_paid,
        fr.total_paid,
        fr.payment_mode,
        fr.payment_reference,
        fr.paid_date,
        fr.remarks,
        CONCAT(u.first_name, ' ', u.last_name) as collected_by_name
      FROM fee_receipts fr
      LEFT JOIN users u ON fr.collected_by = u.id
      WHERE fr.student_id = ?
      ORDER BY fr.paid_date DESC
    `;

    return await db.queryTrust(trustCode, sql, [studentId]);
  }

  async getFeeStatistics(filters, trustCode) {
    const sql = `
      SELECT 
        'TOTAL_ASSIGNED' as metric,
        SUM(sfa.final_amount) as value
      FROM student_fee_assignments sfa
      JOIN fee_structures fs ON sfa.fee_structure_id = fs.id
      WHERE fs.academic_year_id = ?
      
      UNION ALL
      
      SELECT 
        'TOTAL_COLLECTED' as metric,
        SUM(fr.total_paid) as value
      FROM fee_receipts fr
      WHERE fr.academic_year_id = ?
      
      UNION ALL
      
      SELECT 
        'TOTAL_OUTSTANDING' as metric,
        SUM(sfa.final_amount - COALESCE(payments.paid_amount, 0)) as value
      FROM student_fee_assignments sfa
      JOIN fee_structures fs ON sfa.fee_structure_id = fs.id
      LEFT JOIN (
        SELECT student_id, SUM(amount_paid) as paid_amount
        FROM fee_receipts
        WHERE academic_year_id = ?
        GROUP BY student_id
      ) payments ON sfa.student_id = payments.student_id
      WHERE fs.academic_year_id = ?
        AND sfa.final_amount > COALESCE(payments.paid_amount, 0)
    `;

    const academicYearId = filters.academic_year_id;
    const result = await db.queryTrust(trustCode, sql, [
      academicYearId,
      academicYearId,
      academicYearId,
      academicYearId
    ]);

    return result.reduce((acc, row) => {
      acc[row.metric] = row.value || 0;
      return acc;
    }, {});
  }

  // Payment Processing Methods
  async initiateOnlinePayment(paymentData, trustCode) {
    try {
      return await db.transactionTrust(trustCode, async connection => {
        // Generate unique transaction ID
        const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 1. Create payment transaction record
        const transactionSql = `
          INSERT INTO payment_transactions (
            transaction_id, gateway_name, fee_receipt_id,
            student_id, amount, currency, payment_method, status
          ) VALUES (?, ?, ?, ?, ?, 'INR', ?, 'INITIATED')
        `;

        const [result] = await connection.execute(transactionSql, [
          transactionId,
          paymentData.gateway_name,
          paymentData.fee_receipt_id || null,
          paymentData.student_id,
          paymentData.amount,
          paymentData.payment_method || 'ONLINE'
        ]);

        // 2. Get gateway configuration
        const gateway = await this.getPaymentGateway(paymentData.gateway_name);
        if (!gateway) {
          throw new Error('Payment gateway not configured');
        }

        // 3. Calculate convenience fee if applicable
        const convenienceFee = await this.calculateConvenienceFee(
          paymentData.amount,
          paymentData.payment_method,
          trustCode
        );

        const totalAmount = parseFloat(paymentData.amount) + convenienceFee;

        // 4. Initialize payment with gateway
        const gatewayResponse = await this.callGatewayAPI(gateway, {
          amount: Math.round(totalAmount * 100), // Convert to paisa/cents
          currency: 'INR',
          receipt: transactionId,
          notes: {
            student_id: paymentData.student_id,
            fee_receipt_id: paymentData.fee_receipt_id,
            convenience_fee: convenienceFee
          }
        });

        // 5. Update transaction with gateway response
        const updateSql = `
          UPDATE payment_transactions 
          SET gateway_transaction_id = ?, gateway_response = ?
          WHERE transaction_id = ?
        `;

        await connection.execute(updateSql, [
          gatewayResponse.id,
          JSON.stringify(gatewayResponse),
          transactionId
        ]);

        return {
          transaction_id: transactionId,
          gateway_order_id: gatewayResponse.id,
          amount: paymentData.amount,
          convenience_fee: convenienceFee,
          total_amount: totalAmount,
          payment_url: gatewayResponse.payment_url || null,
          gateway_response: gatewayResponse
        };
      });
    } catch (error) {
      throw new Error(`Failed to initiate payment: ${error.message}`);
    }
  }

  async handlePaymentCallback(callbackData, trustCode, gatewayName) {
    try {
      return await db.transactionTrust(trustCode, async connection => {
        // 1. Verify payment with gateway
        const verification = await this.verifyPaymentWithGateway(callbackData, gatewayName);

        if (!verification.success) {
          throw new Error('Payment verification failed');
        }

        // 2. Find transaction record
        const transactionSql = `
          SELECT * FROM payment_transactions 
          WHERE gateway_transaction_id = ? AND gateway_name = ?
        `;

        const [transactions] = await connection.execute(transactionSql, [
          verification.gateway_transaction_id,
          gatewayName
        ]);

        if (transactions.length === 0) {
          throw new Error('Transaction not found');
        }

        const transaction = transactions[0];

        // 3. Update transaction status
        const updateTransactionSql = `
          UPDATE payment_transactions 
          SET status = ?, gateway_response = ?, completed_at = NOW(), webhook_verified = 1
          WHERE id = ?
        `;

        await connection.execute(updateTransactionSql, [
          verification.status,
          JSON.stringify(verification.response),
          transaction.id
        ]);

        // 4. If payment successful, create/update fee receipt
        if (verification.status === 'SUCCESS') {
          await this.createFeeReceiptFromPayment(transaction, verification, connection);
        }

        return {
          transaction_id: transaction.transaction_id,
          status: verification.status,
          amount: verification.amount,
          payment_method: verification.payment_method
        };
      });
    } catch (error) {
      throw new Error(`Failed to process payment callback: ${error.message}`);
    }
  }

  async createFeeReceiptFromPayment(transaction, verification, connection) {
    // Generate receipt number
    const receiptNo = await this.generateReceiptNumber(connection);

    const receiptSql = `
      INSERT INTO fee_receipts (
        receipt_no, student_id, amount_paid, total_paid,
        payment_mode, payment_reference, paid_date,
        academic_year_id, collected_by, status
      ) VALUES (?, ?, ?, ?, 'ONLINE', ?, NOW(), ?, 1, 'CLEARED')
    `;

    // Get current academic year
    const yearSql = `SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1`;
    const [years] = await connection.execute(yearSql);
    const academicYearId = years[0]?.id || 1;

    const [receiptResult] = await connection.execute(receiptSql, [
      receiptNo,
      transaction.student_id,
      verification.amount,
      verification.amount,
      verification.gateway_transaction_id,
      academicYearId
    ]);

    // Update fee receipt ID in payment transaction
    const updateTxnSql = `
      UPDATE payment_transactions 
      SET fee_receipt_id = ? 
      WHERE id = ?
    `;

    await connection.execute(updateTxnSql, [receiptResult.insertId, transaction.id]);

    return receiptResult.insertId;
  }

  async calculateConvenienceFee(amount, paymentMethod, trustCode) {
    try {
      const sql = `
        SELECT convenience_fee_percentage, convenience_fee_fixed
        FROM payment_method_configs 
        WHERE method_type = ? AND is_enabled = 1
      `;

      const [methods] = await db.querySystem(sql, [paymentMethod]);

      if (methods.length === 0) {
        return 0;
      }

      const method = methods[0];
      const percentageFee = (amount * method.convenience_fee_percentage) / 100;
      const fixedFee = method.convenience_fee_fixed || 0;

      return Math.round((percentageFee + fixedFee) * 100) / 100; // Round to 2 decimals
    } catch (error) {
      console.error('Error calculating convenience fee:', error);
      return 0;
    }
  }

  async getPaymentGateway(gatewayName) {
    try {
      const sql = `
        SELECT * FROM payment_gateways 
        WHERE gateway_name = ? AND is_enabled = 1 AND status = 'ACTIVE'
      `;

      const [gateways] = await db.querySystem(sql, [gatewayName]);
      return gateways[0] || null;
    } catch (error) {
      throw new Error(`Failed to get payment gateway: ${error.message}`);
    }
  }

  async callGatewayAPI(gateway, paymentData) {
    // This would integrate with actual payment gateway APIs
    // For now, returning mock response
    const mockResponses = {
      RAZORPAY: {
        id: `order_${Math.random().toString(36).substr(2, 14)}`,
        amount: paymentData.amount,
        currency: paymentData.currency,
        receipt: paymentData.receipt,
        status: 'created',
        payment_url: `https://checkout.razorpay.com/v1/checkout.js`
      },
      PAYTM: {
        id: `ORDER_${Math.random().toString(36).substr(2, 14).toUpperCase()}`,
        amount: paymentData.amount,
        currency: paymentData.currency,
        receipt: paymentData.receipt,
        status: 'created',
        payment_url: `https://securegw-stage.paytm.in/theia/processTransaction`
      }
    };

    return mockResponses[gateway.gateway_type] || mockResponses.RAZORPAY;
  }

  async verifyPaymentWithGateway(callbackData, gatewayName) {
    // This would verify payment with actual gateway
    // For now, returning mock verification
    return {
      success: true,
      status: 'SUCCESS',
      gateway_transaction_id: callbackData.razorpay_order_id || callbackData.order_id,
      amount: callbackData.amount || 100,
      payment_method: 'ONLINE',
      response: callbackData
    };
  }

  async generateReceiptNumber(connection) {
    // Generate receipt number in format: FEE/2025/00001
    const year = new Date().getFullYear();
    const prefix = `FEE/${year}/`;

    const countSql = `
      SELECT COUNT(*) as count FROM fee_receipts 
      WHERE receipt_no LIKE ? AND YEAR(created_at) = ?
    `;

    const [result] = await connection.execute(countSql, [`${prefix}%`, year]);
    const count = result[0].count + 1;

    return `${prefix}${count.toString().padStart(5, '0')}`;
  }

  // Get payment transactions for a student
  async getPaymentTransactions(studentId, trustCode, filters = {}) {
    try {
      let sql = `
        SELECT pt.*, fr.receipt_no, fr.paid_date
        FROM payment_transactions pt
        LEFT JOIN fee_receipts fr ON pt.fee_receipt_id = fr.id
        WHERE pt.student_id = ?
      `;

      const params = [studentId];

      if (filters.status) {
        sql += ' AND pt.status = ?';
        params.push(filters.status);
      }

      if (filters.gateway_name) {
        sql += ' AND pt.gateway_name = ?';
        params.push(filters.gateway_name);
      }

      sql += ' ORDER BY pt.initiated_at DESC';

      if (filters.limit) {
        sql += ` LIMIT ${parseInt(filters.limit)}`;
      }

      return await db.queryTrust(trustCode, sql, params);
    } catch (error) {
      throw new Error(`Failed to get payment transactions: ${error.message}`);
    }
  }
}

module.exports = new FeesService();
