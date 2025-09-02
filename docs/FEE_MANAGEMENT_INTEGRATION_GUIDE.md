# Fee Management System Integration Guide

## Overview

This guide explains how to integrate and use the comprehensive Fee Management System in your School ERP application.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Fee Management System                    │
├─────────────────────┬─────────────────────┬─────────────────┤
│   System Database   │   Tenant Database   │    Services     │
│                     │                     │                 │
│ • FeeConfiguration  │ • StudentFeeAssign. │ • FeeManagement │
│ • Trust             │ • FeeTransaction    │ • Configuration │
│                     │ • Student           │ • TenantConfig  │
└─────────────────────┴─────────────────────┴─────────────────┘
```

## System Components

### 1. Database Models

#### System Database Models
- **FeeConfiguration**: Central fee structure definitions
- **Trust**: Organization management

#### Tenant Database Models  
- **StudentFeeAssignment**: Student-specific fee assignments
- **FeeTransaction**: Payment and transaction tracking
- **Student**: Enhanced with fee-related fields

### 2. Services
- **FeeManagementService**: Core fee operations
- **TenantConfigurationService**: Configuration management

### 3. Controllers
- **FeeConfigurationController**: System-level fee management
- **StudentFeeController**: Student fee operations

## Setup Instructions

### 1. Database Migration

```javascript
// System Database Migration
const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('FeeConfigurations', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      trust_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Trusts',
          key: 'id'
        }
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      fee_components: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
      },
      discount_policies: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
      },
      payment_schedule: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      created_by: DataTypes.INTEGER,
      last_updated_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    });

    // Add indexes
    await queryInterface.addIndex('FeeConfigurations', ['trust_id']);
    await queryInterface.addIndex('FeeConfigurations', ['is_active']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('FeeConfigurations');
  }
};
```

```javascript
// Tenant Database Migration
module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('StudentFeeAssignments', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Students',
          key: 'id'
        }
      },
      fee_configuration_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      academic_year: {
        type: DataTypes.STRING,
        allowNull: false
      },
      calculated_fee_structure: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      individual_adjustments: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      discount_approvals: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      payment_overrides: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      is_structure_locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      assigned_by: DataTypes.INTEGER,
      last_updated_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    });

    await queryInterface.createTable('FeeTransactions', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Students',
          key: 'id'
        }
      },
      fee_assignment_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'StudentFeeAssignments',
          key: 'id'
        }
      },
      academic_year: {
        type: DataTypes.STRING,
        allowNull: false
      },
      transaction_number: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
      },
      receipt_number: {
        type: DataTypes.STRING,
        unique: true
      },
      transaction_type: {
        type: DataTypes.ENUM('payment', 'adjustment', 'reversal'),
        defaultValue: 'payment'
      },
      payment_method: {
        type: DataTypes.ENUM('cash', 'online', 'cheque', 'dd', 'card'),
        allowNull: false
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      fee_breakdown: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      transaction_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      balance_before: DataTypes.DECIMAL(10, 2),
      balance_after: DataTypes.DECIMAL(10, 2),
      processed_by: DataTypes.INTEGER,
      is_reversed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      reversal_reason: DataTypes.TEXT,
      reversed_by: DataTypes.INTEGER,
      reversed_at: DataTypes.DATE,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    });

    // Add indexes
    await queryInterface.addIndex('StudentFeeAssignments', ['student_id']);
    await queryInterface.addIndex('StudentFeeAssignments', ['academic_year']);
    await queryInterface.addIndex('StudentFeeAssignments', ['fee_configuration_id']);
    await queryInterface.addIndex('FeeTransactions', ['student_id']);
    await queryInterface.addIndex('FeeTransactions', ['transaction_number']);
    await queryInterface.addIndex('FeeTransactions', ['academic_year']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('FeeTransactions');
    await queryInterface.dropTable('StudentFeeAssignments');
  }
};
```

### 2. Route Integration

Add the fee routes to your main application:

```javascript
// routes/index.js
const feeConfigurationRoutes = require('../modules/school/routes/feeConfiguration');
const studentFeeRoutes = require('../modules/students/routes/studentFees');

// Mount fee routes
app.use('/api/fee-configurations', feeConfigurationRoutes);
app.use('/api/students/fees', studentFeeRoutes);
```

### 3. Middleware Setup

Ensure tenant and system database middleware is properly configured:

```javascript
// middleware/database.js
app.use(async (req, res, next) => {
  try {
    // System database connection
    req.systemDb = getSystemDatabase();
    
    // Tenant database connection (based on tenant context)
    if (req.tenant) {
      req.tenantDb = getTenantDatabase(req.tenant.code);
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});
```

## Usage Examples

### 1. Creating a Fee Configuration

```javascript
const feeConfigData = {
  trust_id: 1,
  name: "Grade 10 Fees 2024-25",
  fee_components: {
    tuition_fee: {
      label: "Tuition Fee",
      amount: 15000,
      frequency: "annual",
      category: "academic",
      is_mandatory: true
    },
    transport_fee: {
      label: "Transport Fee", 
      amount: 8000,
      frequency: "annual",
      category: "transport",
      is_mandatory: false,
      conditional: {
        field: "transport_required",
        value: true
      }
    }
  },
  discount_policies: {
    discounts: [
      {
        type: "sibling_discount",
        label: "Sibling Discount",
        discount_percentage: 10,
        applicable_components: ["tuition_fee"],
        conditions: {
          has_siblings_in_school: true
        }
      }
    ]
  },
  payment_schedule: {
    installment_plan: "monthly",
    due_date: 5,
    late_fee_percentage: 2,
    grace_period_days: 7
  }
};

// POST /api/fee-configurations
const response = await fetch('/api/fee-configurations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(feeConfigData)
});
```

### 2. Assigning Fee to Student

```javascript
const assignmentData = {
  fee_configuration_id: 1,
  academic_year: "2024-25",
  notes: "Standard fee assignment"
};

// POST /api/students/fees/123/assign-fee
const response = await fetch('/api/students/fees/123/assign-fee', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(assignmentData)
});
```

### 3. Processing Payment

```javascript
const paymentData = {
  student_id: 123,
  fee_assignment_id: 456,
  academic_year: "2024-25",
  payment_method: "online",
  total_amount: 5000,
  fee_breakdown: {
    tuition_fee: 4000,
    library_fee: 1000
  },
  transaction_notes: "Q1 fee payment"
};

// POST /api/students/fees/payment
const response = await fetch('/api/students/fees/payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(paymentData)
});
```

### 4. Applying Discount

```javascript
const discountData = {
  discount_type: "family_hardship",
  discount_percentage: 20,
  reason: "Financial difficulty due to job loss"
};

// POST /api/students/fees/assignment/456/discount
const response = await fetch('/api/students/fees/assignment/456/discount', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(discountData)
});
```

### 5. Getting Outstanding Fees

```javascript
// GET /api/students/fees/123/outstanding-fees?academic_year=2024-25
const response = await fetch('/api/students/fees/123/outstanding-fees?academic_year=2024-25');
const outstandingFees = await response.json();

console.log(outstandingFees.data);
// {
//   total_outstanding: 7500,
//   breakdown: { ... },
//   next_due_date: "2024-09-05",
//   overdue_amount: 1000
// }
```

## Configuration Options

### Fee Component Structure

```javascript
{
  component_key: {
    label: "Display Name",           // Required
    amount: 15000,                   // Required
    frequency: "annual|monthly",     // Required
    category: "academic|facility|transport|accommodation",
    is_mandatory: true|false,        // Required
    can_be_waived: true|false,       // Optional
    conditional: {                   // Optional
      field: "transport_required",
      value: true
    }
  }
}
```

### Discount Policy Structure

```javascript
{
  discounts: [
    {
      type: "unique_discount_type",     // Required
      label: "Display Name",            // Required
      discount_percentage: 10,          // Either percentage or amount
      discount_amount: 1000,            // Either percentage or amount
      max_discount_amount: 5000,        // Optional cap
      applicable_components: [...],     // Component keys
      conditions: {                     // Optional conditions
        field_name: expected_value
      }
    }
  ]
}
```

## API Endpoints

### Fee Configuration Management
- `GET /api/fee-configurations` - List configurations
- `GET /api/fee-configurations/:id` - Get specific configuration
- `POST /api/fee-configurations` - Create configuration
- `PUT /api/fee-configurations/:id` - Update configuration
- `DELETE /api/fee-configurations/:id` - Delete configuration
- `POST /api/fee-configurations/:id/clone` - Clone configuration
- `POST /api/fee-configurations/:id/calculate` - Preview calculation

### Student Fee Management
- `POST /api/students/fees/:student_id/assign-fee` - Assign fee
- `GET /api/students/fees/:student_id/fee-assignment` - Get assignment
- `PUT /api/students/fees/assignment/:assignment_id` - Update assignment
- `POST /api/students/fees/assignment/:assignment_id/discount` - Apply discount
- `POST /api/students/fees/payment` - Process payment
- `GET /api/students/fees/:student_id/payment-history` - Payment history
- `GET /api/students/fees/:student_id/outstanding-fees` - Outstanding fees
- `GET /api/students/fees/receipt/:transaction_id` - Generate receipt
- `POST /api/students/fees/payment/:transaction_id/reverse` - Reverse payment
- `POST /api/students/fees/assignment/:assignment_id/lock` - Lock structure

## Security Considerations

### 1. Authentication & Authorization
- All routes require authentication
- Implement role-based permissions:
  - `fee.config.create` - Create fee configurations
  - `fee.config.update` - Update fee configurations
  - `fee.assign` - Assign fees to students
  - `fee.payment.process` - Process payments
  - `fee.payment.reverse` - Reverse payments
  - `fee.discount.approve` - Apply discounts

### 2. Data Validation
- Validate all monetary amounts
- Ensure fee configuration integrity
- Verify student eligibility
- Check payment method validity

### 3. Audit Trail
- Log all fee configuration changes
- Track all payment transactions
- Record discount approvals
- Monitor fee structure modifications

## Error Handling

Common error scenarios and responses:

```javascript
// Fee configuration not found
{
  success: false,
  message: "Fee configuration not found",
  code: "FEE_CONFIG_NOT_FOUND"
}

// Student already has fee assignment
{
  success: false,
  message: "Student already has fee assignment for academic year 2024-25",
  code: "DUPLICATE_FEE_ASSIGNMENT"
}

// Insufficient payment amount
{
  success: false,
  message: "Payment amount cannot be greater than outstanding balance",
  code: "INVALID_PAYMENT_AMOUNT"
}

// Fee structure locked
{
  success: false,
  message: "Fee structure is locked and cannot be modified",
  code: "FEE_STRUCTURE_LOCKED"
}
```

## Performance Optimization

### 1. Caching Strategy
- Fee configurations are cached for 10 minutes
- Clear cache on configuration updates
- Use Redis for production environments

### 2. Database Indexing
- Index on `student_id` and `academic_year` for assignments
- Index on `transaction_number` for fast lookups
- Index on `fee_configuration_id` for system references

### 3. Query Optimization
- Use eager loading for related data
- Implement pagination for large result sets
- Use database transactions for payment processing

## Testing

Run the comprehensive test suite:

```bash
# Mock tests (no database required)
node tests/fee-system-mock-test.js

# Full integration tests (requires database setup)
node tests/fee-system-test.js
```

## Monitoring & Alerts

Set up monitoring for:
- Failed payment transactions
- Fee calculation errors
- Cache hit/miss ratios
- Database connection issues
- High outstanding fee amounts

## Future Enhancements

1. **Payment Gateway Integration**
   - Support for multiple payment providers
   - Automated reconciliation
   - Webhook handling

2. **Advanced Reporting**
   - Collection efficiency reports
   - Defaulter analysis
   - Revenue projections

3. **Mobile App Support**
   - REST API endpoints
   - Push notifications for due payments
   - Mobile receipt generation

4. **Automated Reminders**
   - Email/SMS payment reminders
   - Escalation workflows
   - Parent communication integration

This fee management system provides a robust, flexible foundation for handling all school fee-related operations while maintaining data integrity and supporting complex business rules.
