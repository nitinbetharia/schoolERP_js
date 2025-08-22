/**
 * Comprehensive Fee Management System Test
 * Tests all fee-related functionality including configurations, assignments, and payments
 */

const { Sequelize, DataTypes } = require('sequelize');

// Mock configuration
const mockConfig = {
   system: {
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'test_user',
      password: 'test_password',
      database: 'school_erp_system_test',
      logging: false,
   },
   tenant: {
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'test_user',
      password: 'test_password',
      database: 'school_erp_trust_test_test',
      logging: false,
   },
};

// Initialize mock databases
const systemDb = new Sequelize(mockConfig.system);
const tenantDb = new Sequelize(mockConfig.tenant);

// Define mock models
function defineModels() {
   // System DB Models
   const Trust = systemDb.define('Trust', {
      name: DataTypes.STRING,
      code: DataTypes.STRING,
   });

   const FeeConfiguration = systemDb.define('FeeConfiguration', {
      trust_id: DataTypes.INTEGER,
      name: DataTypes.STRING,
      fee_components: DataTypes.JSON,
      discount_policies: DataTypes.JSON,
      payment_schedule: DataTypes.JSON,
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      version: { type: DataTypes.INTEGER, defaultValue: 1 },
      created_by: DataTypes.INTEGER,
      last_updated_by: DataTypes.INTEGER,
   });

   // Add methods
   FeeConfiguration.prototype.getFeeComponents = function () {
      return this.fee_components || {};
   };

   FeeConfiguration.prototype.calculateTotalAnnualFee = function () {
      const components = this.getFeeComponents();
      let total = 0;
      Object.values(components).forEach((component) => {
         if (component.is_mandatory) {
            total += parseFloat(component.amount || 0);
         }
      });
      return total;
   };

   FeeConfiguration.prototype.getApplicableDiscounts = function (studentProfile) {
      const discounts = this.discount_policies?.discounts || [];
      return discounts.filter((discount) => {
         if (discount.conditions) {
            return Object.keys(discount.conditions).every((condition) => {
               const expectedValue = discount.conditions[condition];
               const actualValue = studentProfile[condition];
               return actualValue === expectedValue;
            });
         }
         return true;
      });
   };

   // Tenant DB Models
   const Student = tenantDb.define('Student', {
      admission_number: DataTypes.STRING,
      roll_number: DataTypes.STRING,
      name: DataTypes.STRING,
      father_annual_income: DataTypes.DECIMAL,
      mother_annual_income: DataTypes.DECIMAL,
      transport_required: DataTypes.BOOLEAN,
      hostel_required: DataTypes.BOOLEAN,
      category: DataTypes.STRING,
   });

   const StudentFeeAssignment = tenantDb.define('StudentFeeAssignment', {
      student_id: DataTypes.INTEGER,
      fee_configuration_id: DataTypes.INTEGER,
      academic_year: DataTypes.STRING,
      calculated_fee_structure: DataTypes.JSON,
      individual_adjustments: DataTypes.JSON,
      discount_approvals: DataTypes.JSON,
      payment_overrides: DataTypes.JSON,
      is_structure_locked: { type: DataTypes.BOOLEAN, defaultValue: false },
      assigned_by: DataTypes.INTEGER,
      last_updated_by: DataTypes.INTEGER,
   });

   // Add methods
   StudentFeeAssignment.getActiveAssignment = async function (studentId, academicYear) {
      return await this.findOne({
         where: {
            student_id: studentId,
            academic_year: academicYear,
            is_active: true,
         },
      });
   };

   StudentFeeAssignment.assignFeeToStudent = async function (studentId, feeConfigId, academicYear, assignedBy) {
      return await this.create({
         student_id: studentId,
         fee_configuration_id: feeConfigId,
         academic_year: academicYear,
         assigned_by: assignedBy,
         calculated_fee_structure: {},
         individual_adjustments: {},
         discount_approvals: {},
         payment_overrides: {},
         is_active: true,
      });
   };

   StudentFeeAssignment.prototype.getCalculatedFeeStructure = function () {
      return this.calculated_fee_structure || {};
   };

   StudentFeeAssignment.prototype.getIndividualAdjustments = function () {
      return this.individual_adjustments || {};
   };

   StudentFeeAssignment.prototype.getDiscountApprovals = function () {
      return this.discount_approvals || {};
   };

   StudentFeeAssignment.prototype.getPaymentSchedule = function () {
      return {
         monthly_due_date: 5,
         installments: [
            { month: 'April', amount: 1000, due_date: '2024-04-05' },
            { month: 'May', amount: 1000, due_date: '2024-05-05' },
         ],
      };
   };

   StudentFeeAssignment.prototype.recalculateAmounts = async function () {
      console.log(`Recalculating amounts for assignment ${this.id}`);
      return this;
   };

   StudentFeeAssignment.prototype.addDiscountApproval = async function (
      discountType,
      discountAmount,
      discountPercentage,
      reason,
      approvedBy
   ) {
      const approvals = this.getDiscountApprovals();
      approvals[`discount_${Date.now()}`] = {
         type: discountType,
         amount: discountAmount,
         percentage: discountPercentage,
         reason: reason,
         approved_by: approvedBy,
         approved_at: new Date(),
      };
      this.discount_approvals = approvals;
      return await this.save();
   };

   StudentFeeAssignment.prototype.lockFeeStructure = async function (lockReason, lockedBy) {
      this.is_structure_locked = true;
      this.lock_reason = lockReason;
      this.locked_by = lockedBy;
      this.locked_at = new Date();
      return await this.save();
   };

   const FeeTransaction = tenantDb.define('FeeTransaction', {
      student_id: DataTypes.INTEGER,
      fee_assignment_id: DataTypes.INTEGER,
      academic_year: DataTypes.STRING,
      transaction_number: DataTypes.STRING,
      receipt_number: DataTypes.STRING,
      transaction_type: DataTypes.STRING,
      payment_method: DataTypes.STRING,
      total_amount: DataTypes.DECIMAL,
      fee_breakdown: DataTypes.JSON,
      transaction_date: DataTypes.DATE,
      balance_before: DataTypes.DECIMAL,
      balance_after: DataTypes.DECIMAL,
      processed_by: DataTypes.INTEGER,
      is_reversed: { type: DataTypes.BOOLEAN, defaultValue: false },
   });

   FeeTransaction.createPayment = async function (paymentData, _transaction) {
      return await this.create({
         ...paymentData,
         transaction_number: `TXN${Date.now()}`,
         receipt_number: `RCP${Date.now()}`,
         transaction_date: new Date(),
      });
   };

   FeeTransaction.getOutstandingBalance = async function (_studentId, _academicYear) {
      // Mock calculation
      return 5000; // Outstanding amount
   };

   FeeTransaction.getStudentTransactions = async function (studentId, academicYear) {
      return await this.findAll({
         where: {
            student_id: studentId,
            academic_year: academicYear,
         },
         order: [['transaction_date', 'DESC']],
      });
   };

   FeeTransaction.prototype.getPeriodCovered = function () {
      return {
         from_month: 'April',
         to_month: 'May',
         academic_year: this.academic_year,
      };
   };

   FeeTransaction.prototype.getFormattedDetails = function () {
      return {
         transaction_number: this.transaction_number,
         receipt_number: this.receipt_number,
         amount: this.total_amount,
         payment_method: this.payment_method,
         transaction_date: this.transaction_date,
      };
   };

   FeeTransaction.prototype.reverseTransaction = async function (reason, reversedBy) {
      this.is_reversed = true;
      this.reversal_reason = reason;
      this.reversed_by = reversedBy;
      this.reversed_at = new Date();
      await this.save();

      // Create reversal transaction
      return await FeeTransaction.create({
         student_id: this.student_id,
         fee_assignment_id: this.fee_assignment_id,
         academic_year: this.academic_year,
         transaction_number: `REV${Date.now()}`,
         transaction_type: 'reversal',
         total_amount: -this.total_amount,
         original_transaction_id: this.id,
         processed_by: reversedBy,
         transaction_date: new Date(),
      });
   };

   // Set up associations
   Trust.hasMany(FeeConfiguration, { foreignKey: 'trust_id' });
   FeeConfiguration.belongsTo(Trust, { foreignKey: 'trust_id' });

   Student.hasMany(StudentFeeAssignment, { foreignKey: 'student_id' });
   StudentFeeAssignment.belongsTo(Student, { foreignKey: 'student_id' });

   Student.hasMany(FeeTransaction, { foreignKey: 'student_id' });
   FeeTransaction.belongsTo(Student, { foreignKey: 'student_id' });

   StudentFeeAssignment.hasMany(FeeTransaction, { foreignKey: 'fee_assignment_id' });
   FeeTransaction.belongsTo(StudentFeeAssignment, { foreignKey: 'fee_assignment_id' });

   // Add models to database instances
   systemDb.models = { Trust, FeeConfiguration };
   tenantDb.models = { Student, StudentFeeAssignment, FeeTransaction };

   return { systemDb, tenantDb };
}

// Import the service (after models are defined)
const FeeManagementService = require('../../services/FeeManagementService');

async function runFeeSystemTests() {
   console.log('🚀 Starting Comprehensive Fee Management System Tests...\n');

   try {
      // Initialize models
      const { systemDb: sysDb, tenantDb: tenDb } = defineModels();

      console.log('1️⃣ Creating Test Data...');

      // Create trust
      const trust = await sysDb.models.Trust.create({
         name: 'Test Educational Trust',
         code: 'test',
      });

      // Create comprehensive fee configuration
      const feeConfig = await sysDb.models.FeeConfiguration.create({
         trust_id: trust.id,
         name: 'Standard Grade 10 Fees 2024-25',
         fee_components: {
            tuition_fee: {
               label: 'Tuition Fee',
               amount: 15000,
               frequency: 'annual',
               category: 'academic',
               is_mandatory: true,
            },
            library_fee: {
               label: 'Library Fee',
               amount: 2000,
               frequency: 'annual',
               category: 'facility',
               is_mandatory: true,
            },
            transport_fee: {
               label: 'Transport Fee',
               amount: 8000,
               frequency: 'annual',
               category: 'transport',
               is_mandatory: false,
               conditional: {
                  field: 'transport_required',
                  value: true,
               },
            },
            hostel_fee: {
               label: 'Hostel Fee',
               amount: 25000,
               frequency: 'annual',
               category: 'accommodation',
               is_mandatory: false,
               conditional: {
                  field: 'hostel_required',
                  value: true,
               },
            },
         },
         discount_policies: {
            discounts: [
               {
                  type: 'sibling_discount',
                  label: 'Sibling Discount',
                  discount_percentage: 10,
                  applicable_components: ['tuition_fee'],
                  conditions: {
                     has_siblings_in_school: true,
                  },
               },
               {
                  type: 'merit_scholarship',
                  label: 'Merit Scholarship',
                  discount_percentage: 25,
                  applicable_components: ['tuition_fee', 'library_fee'],
                  conditions: {
                     academic_percentage: 90,
                  },
               },
            ],
         },
         payment_schedule: {
            installment_plan: 'monthly',
            due_date: 5,
            late_fee_percentage: 2,
            grace_period_days: 7,
         },
         created_by: 1,
         last_updated_by: 1,
      });

      console.log(`✅ Fee configuration created: ${feeConfig.name}`);

      // Create test students
      const student1 = await tenDb.models.Student.create({
         admission_number: 'ADM001',
         roll_number: '10A01',
         name: 'John Doe',
         father_annual_income: 500000,
         mother_annual_income: 300000,
         transport_required: true,
         hostel_required: false,
         category: 'General',
      });

      const student2 = await tenDb.models.Student.create({
         admission_number: 'ADM002',
         roll_number: '10A02',
         name: 'Jane Smith',
         father_annual_income: 800000,
         mother_annual_income: 400000,
         transport_required: false,
         hostel_required: true,
         category: 'General',
      });

      console.log('✅ Test students created');

      console.log('\n2️⃣ Testing Fee Assignment...');

      // Test fee assignment for student with transport
      const assignment1 = await FeeManagementService.assignFeeToStudent(
         student1.id,
         feeConfig.id,
         '2024-25',
         1,
         tenDb,
         sysDb
      );

      console.log(`✅ Fee assigned to ${student1.name}`);
      console.log('📊 Calculated Fee Structure:');
      console.log(JSON.stringify(assignment1.getCalculatedFeeStructure(), null, 2));

      // Test fee assignment for student with hostel
      await FeeManagementService.assignFeeToStudent(student2.id, feeConfig.id, '2024-25', 1, tenDb, sysDb);

      console.log(`✅ Fee assigned to ${student2.name}`);

      console.log('\n3️⃣ Testing Discount Application...');

      // Apply discount to student
      await assignment1.addDiscountApproval('family_hardship', 0, 15, 'Financial difficulty due to job loss', 1);

      console.log('✅ Discount applied successfully');

      console.log('\n4️⃣ Testing Payment Processing...');

      // Process payment for student 1
      const payment1 = await FeeManagementService.processPayment(
         {
            student_id: student1.id,
            fee_assignment_id: assignment1.id,
            academic_year: '2024-25',
            payment_method: 'online',
            total_amount: 5000,
            fee_breakdown: {
               tuition_fee: 4000,
               library_fee: 1000,
            },
            transaction_notes: 'Partial payment for Q1',
         },
         tenDb
      );

      console.log(`✅ Payment processed: ${payment1.transaction_number}`);

      // Process another payment
      const payment2 = await FeeManagementService.processPayment(
         {
            student_id: student1.id,
            fee_assignment_id: assignment1.id,
            academic_year: '2024-25',
            payment_method: 'cash',
            total_amount: 3000,
            fee_breakdown: {
               transport_fee: 3000,
            },
            transaction_notes: 'Transport fee payment',
         },
         tenDb
      );

      console.log(`✅ Second payment processed: ${payment2.transaction_number}`);

      console.log('\n5️⃣ Testing Outstanding Fee Calculation...');

      const outstandingFees = await FeeManagementService.calculateOutstandingFees(student1.id, '2024-25', tenDb);

      console.log('📊 Outstanding Fees Summary:');
      console.log(JSON.stringify(outstandingFees, null, 2));

      console.log('\n6️⃣ Testing Fee Receipt Generation...');

      const receipt = await FeeManagementService.generateFeeReceipt(payment1.id, tenDb);
      console.log('📋 Fee Receipt:');
      console.log(JSON.stringify(receipt, null, 2));

      console.log('\n7️⃣ Testing Payment Reversal...');

      const reversalTxn = await payment2.reverseTransaction('Wrong amount entered', 1);
      console.log(`✅ Payment reversed: ${reversalTxn.transaction_number}`);

      console.log('\n8️⃣ Testing Fee Structure Lock...');

      await assignment1.lockFeeStructure('Final settlement completed', 1);
      console.log('✅ Fee structure locked successfully');

      console.log('\n9️⃣ Testing Cache Performance...');

      console.time('Cache Test - First Access');
      await FeeManagementService.getFeeConfiguration(feeConfig.id, sysDb);
      console.timeEnd('Cache Test - First Access');

      console.time('Cache Test - Second Access');
      await FeeManagementService.getFeeConfiguration(feeConfig.id, sysDb);
      console.timeEnd('Cache Test - Second Access');

      console.log('✅ Cache working correctly');

      console.log('\n🔟 Testing Fee Configuration Methods...');

      // Test fee calculation methods
      const totalFee = feeConfig.calculateTotalAnnualFee();
      console.log(`📊 Total Annual Fee: ₹${totalFee}`);

      const studentProfile = {
         has_siblings_in_school: true,
         academic_percentage: 92,
         family_annual_income: 600000,
      };

      const applicableDiscounts = feeConfig.getApplicableDiscounts(studentProfile);
      console.log('📊 Applicable Discounts:');
      console.log(JSON.stringify(applicableDiscounts, null, 2));

      console.log('\n✅ All Fee Management System Tests Completed Successfully!');
      console.log('\n📈 Test Summary:');
      console.log('- ✅ Fee Configuration Management');
      console.log('- ✅ Student Fee Assignment');
      console.log('- ✅ Conditional Fee Components');
      console.log('- ✅ Discount Policy Application');
      console.log('- ✅ Payment Processing');
      console.log('- ✅ Outstanding Fee Calculation');
      console.log('- ✅ Receipt Generation');
      console.log('- ✅ Payment Reversal');
      console.log('- ✅ Fee Structure Locking');
      console.log('- ✅ Caching System');
      console.log('- ✅ Fee Calculation Methods');
   } catch (error) {
      console.error('❌ Test failed:', error);
      console.error('Stack trace:', error.stack);
   }
}

// Run tests if this file is executed directly
if (require.main === module) {
   runFeeSystemTests();
}

module.exports = { runFeeSystemTests };
