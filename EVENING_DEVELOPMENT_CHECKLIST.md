# Evening Development Session Checklist

## 📋 **IMMEDIATE ACTION ITEMS**

### **Setup (5 minutes)**

- [ ] `git pull origin main`
- [ ] `node server.js` (verify server starts)
- [ ] Review `REQUIREMENTS_GAP_ANALYSIS.md` (key missing components)

---

## 🚀 **DEVELOPMENT PRIORITY SEQUENCE (Following Our Tech Stack)**

### **SESSION 1: Fee Management Foundation (2-3 hours)**

#### **Database Schema Creation (Sequelize ORM)**

- [ ] Create `models/FeeStructure.js` (following existing model pattern)
- [ ] Create `models/FeePayment.js` (with Razorpay integration fields)
- [ ] Create `models/FeeReceipt.js` (PDF generation with existing `pdfkit`)
- [ ] Update `models/index.js` for new associations
- [ ] Create Sequelize migration file `YYYYMMDD-create-fee-management-tables.js`

#### **Service Layer (Following Existing Pattern)**

- [ ] Create `modules/fee/services/FeeService.js`
- [ ] Implement fee calculation engine with business rules
- [ ] Integrate Razorpay SDK (already in dependencies)
- [ ] Add payment webhook handling with `express` middleware
- [ ] Use existing `joi` validation patterns

#### **Controller & Routes (Following Architecture)**

- [ ] Create `modules/fee/controllers/FeeController.js`
- [ ] Create `modules/fee/routes/feeRoutes.js`
- [ ] Integrate with existing auth middleware (`requireAuth`, `validateTenant`)
- [ ] Update main `routes/index.js` to include fee routes

#### **API Endpoints (RESTful Pattern)**

```http
POST /api/fee-structures         # Create fee structure
GET  /api/fee-structures         # List fee structures with filters
GET  /api/fee-structures/:id     # Get specific fee structure
PUT  /api/fee-structures/:id     # Update fee structure
POST /api/payments               # Process payment (Razorpay)
GET  /api/payments/:id           # Get payment details
POST /api/receipts/generate      # Generate PDF receipt (pdfkit)
GET  /api/reports/collections    # Collection reports
GET  /api/reports/outstanding    # Outstanding dues report
```

### **SESSION 2: Enquiry Management System (1-2 hours)**

#### **Database Schema (Sequelize Models)**

- [ ] Create `models/Enquiry.js` (UUID primary key, following pattern)
- [ ] Create `models/EnquiryFollowup.js` (tracking activities)
- [ ] Create `models/EnquirySource.js` (lead source management)
- [ ] Add Sequelize migration for enquiry tables

#### **Lead Management Service**

- [ ] Create `modules/enquiry/services/EnquiryService.js`
- [ ] Implement lead scoring algorithm
- [ ] Add conversion tracking to student
- [ ] Integrate with existing email system (`@sendgrid/mail` or `nodemailer`)

#### **API Integration (Following Pattern)**

- [ ] Create `modules/enquiry/controllers/EnquiryController.js`
- [ ] Create `modules/enquiry/routes/enquiryRoutes.js`
- [ ] Use existing validation middleware with `joi`

#### **API Endpoints**

```http
POST /api/enquiries                  # Create enquiry/lead
GET  /api/enquiries                  # List enquiries with filters
GET  /api/enquiries/:id              # Get enquiry details
PUT  /api/enquiries/:id              # Update enquiry
POST /api/enquiries/:id/followup     # Add follow-up activity
POST /api/enquiries/:id/convert      # Convert to student application
GET  /api/reports/enquiry-analytics  # Conversion funnel reports
```

### **SESSION 3: Enhanced Admission Workflow (2 hours)**

#### **Database Updates (Existing Student Model)**

- [ ] Add government ID fields to `models/Student.js`:
  - `aadhaar_number` (VARCHAR(12) with validation)
  - `saral_id` (VARCHAR(20) for Maharashtra)
  - `cbse_uid` (VARCHAR(20) for CBSE schools)
- [ ] Add admission workflow stage tracking
- [ ] Update validation schema with `joi`

#### **Document Management (Using Existing Stack)**

- [ ] Create `models/StudentDocument.js` (enhance existing if present)
- [ ] Use existing `express-fileupload` for document uploads
- [ ] Integrate with existing file handling patterns
- [ ] Add document verification status workflow

#### **Government API Integration**

- [ ] Create service for Aadhaar verification (using `axios`)
- [ ] Add SARAL ID integration for Maharashtra
- [ ] CBSE UID integration for board schools
- [ ] Use existing `validator` library for ID format validation

#### **Enhanced Admission Stages**

```javascript
// Update Student model with admission stages
admission_stage: {
   type: DataTypes.ENUM(
      'ENQUIRY',
      'APPLICATION',
      'COUNSELING',
      'CONFIRMATION',
      'ENROLLED'
   ),
   defaultValue: 'ENQUIRY'
}
```

---

## 🧪 **TESTING PRIORITIES**

### **After Each Session**

- [ ] Test new API endpoints with REST Client
- [ ] Verify database schema updates
- [ ] Test integration with existing student system
- [ ] Update test files with new endpoints

### **Test File Updates**

- [ ] Create `fee-management-tests.http`
- [ ] Create `enquiry-management-tests.http`
- [ ] Update `student-integration-tests.http`

---

## 📊 **SUCCESS CRITERIA**

### **End of Evening Session**

- [ ] Fee structures can be created and managed
- [ ] Basic payment processing works
- [ ] Enquiry system captures and tracks leads
- [ ] Enhanced admission workflow implemented
- [ ] Government ID fields added to student profiles
- [ ] All new endpoints tested and working

### **Database Verification**

- [ ] New tables created successfully
- [ ] Model associations working
- [ ] Data integrity maintained
- [ ] Migration scripts (if needed) executed

### **Integration Verification**

- [ ] Existing student functionality unaffected
- [ ] New features integrate seamlessly
- [ ] API responses consistent with existing patterns
- [ ] Error handling follows established patterns

---

## 🔧 **TECHNICAL IMPLEMENTATION NOTES (Our Tech Stack)**

### **Payment Integration (Razorpay - Already in Dependencies)**

```javascript
// Using existing axios for Razorpay API calls
const axios = require("axios");

class PaymentService {
  constructor() {
    this.razorpay = {
      baseURL: "https://api.razorpay.com/v1/",
      auth: {
        username: process.env.RAZORPAY_KEY_ID,
        password: process.env.RAZORPAY_KEY_SECRET,
      },
    };
  }

  async createOrder(amount, currency = "INR") {
    try {
      const response = await axios.post(
        `${this.razorpay.baseURL}orders`,
        { amount: amount * 100, currency, receipt: `rcpt_${Date.now()}` },
        { auth: this.razorpay.auth },
      );
      return response.data;
    } catch (error) {
      logger.error("Razorpay order creation failed:", error);
      throw new Error("Payment order creation failed");
    }
  }
}
```

### **Email Templates (EJS Integration)**

```javascript
// Using existing EJS for email templates
const ejs = require("ejs");
const path = require("path");

// Create email template: views/emails/admission-confirmation.ejs
const emailTemplate = await ejs.renderFile(
  path.join(__dirname, "../../../views/emails/admission-confirmation.ejs"),
  {
    studentName: student.full_name,
    admissionNumber: student.admission_number,
    schoolName: school.name,
  },
);

// Send using existing @sendgrid/mail
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: student.email,
  from: school.email,
  subject: "Admission Confirmation",
  html: emailTemplate,
});
```

### **SMS Notifications (Twilio - Already in Dependencies)**

```javascript
// Using existing Twilio integration
const twilio = require("twilio");

class SMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  async sendAdmissionSMS(phone, message) {
    try {
      await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
    } catch (error) {
      logger.error("SMS sending failed:", error);
    }
  }
}
```

### **Fee Calculation Engine (Business Logic)**

```javascript
// Multi-layered fee calculation following our patterns
class FeeCalculationService {
  async calculateTotalFees(studentId, academicYear) {
    try {
      const { getTenantModels } = require("../../../models");
      const tenantModels = await getTenantModels(req.tenantCode);
      const { Student, FeeStructure, FeeAssignment } = tenantModels;

      const student = await Student.findByPk(studentId);

      // Trust-level fees (one-time/annual)
      const trustFees = await FeeStructure.findAll({
        where: {
          trust_id: student.trust_id,
          school_id: null, // Trust-wide fees
          academic_year: academicYear,
        },
      });

      // School-level fees (recurring)
      const schoolFees = await FeeStructure.findAll({
        where: {
          school_id: student.school_id,
          class_id: student.class_id,
          academic_year: academicYear,
        },
      });

      // Calculate discounts based on category
      const discounts = this.calculateDiscounts(student);

      const totalFees = [...trustFees, ...schoolFees].reduce(
        (sum, fee) => sum + parseFloat(fee.amount),
        0,
      );
      const totalDiscounts = discounts.reduce(
        (sum, discount) => sum + parseFloat(discount.amount),
        0,
      );

      return {
        trustFees: trustFees.reduce(
          (sum, fee) => sum + parseFloat(fee.amount),
          0,
        ),
        schoolFees: schoolFees.reduce(
          (sum, fee) => sum + parseFloat(fee.amount),
          0,
        ),
        totalFees,
        totalDiscounts,
        finalAmount: totalFees - totalDiscounts,
      };
    } catch (error) {
      logger.error("Fee calculation failed:", error);
      throw error;
    }
  }
}
```

### **Government ID Validation (Using Existing Validator)**

```javascript
const validator = require("validator");

// Aadhaar validation (12 digits)
const validateAadhaar = (aadhaar) => {
  return /^\d{12}$/.test(aadhaar);
};

// SARAL ID validation (Maharashtra format)
const validateSaralId = (saralId) => {
  return /^[A-Z]{2}\d{8}$/.test(saralId); // Format: MH12345678
};

// CBSE UID validation
const validateCBSEUID = (cbseUid) => {
  return /^\d{10}$/.test(cbseUid); // 10-digit number
};

// Add to Student model validation
const Student = sequelize.define("Student", {
  // ... existing fields
  aadhaar_number: {
    type: DataTypes.STRING(12),
    allowNull: true,
    validate: {
      isValidAadhaar: function (value) {
        if (value && !validateAadhaar(value)) {
          throw new Error("Invalid Aadhaar number format");
        }
      },
    },
  },
  saral_id: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isValidSaral: function (value) {
        if (value && !validateSaralId(value)) {
          throw new Error("Invalid SARAL ID format");
        }
      },
    },
  },
});
```

---

## 📝 **DOCUMENTATION UPDATES**

### **After Development**

- [ ] Update API documentation
- [ ] Update database schema documentation
- [ ] Create fee management user guide
- [ ] Update admission process documentation

### **Commit Messages**

```bash
feat: Implement fee management system with payment gateway
feat: Add enquiry management and lead tracking system
feat: Enhance admission workflow with 4-stage process
feat: Add government ID integration (Aadhaar, SARAL, CBSE)
```

---

**Time Estimate: 5-6 hours for complete implementation**
**Expected Completion: Major gaps addressed, system production-ready for fee management**
