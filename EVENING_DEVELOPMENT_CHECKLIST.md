# Evening Development Session Checklist

## 📋 **IMMEDIATE ACTION ITEMS**

### **Setup (5 minutes)**

- [ ] `git pull origin main`
- [ ] `node server.js` (verify server starts)
- [ ] Review `REQUIREMENTS_GAP_ANALYSIS.md` (key missing components)

---

## 🚀 **DEVELOPMENT PRIORITY SEQUENCE (Indian School System Implementation)**

### **SESSION 1: Indian School Foundation + Fee Management (2-3 hours)**

#### **Indian Education System Setup (Sequelize ORM)**

- [ ] Update `models/Class.js` - Add NEP stage classification (foundational/preparatory/middle/secondary)
- [ ] Enhance `models/Student.js` - Add Indian-specific fields (see INDIAN_EDUCATION_SYSTEM_GUIDE.md)
- [ ] Create `models/GovernmentCompliance.js` - Aadhaar, SARAL ID, CBSE UID tracking
- [ ] Update age validation rules for Indian classes (Nursery-XII)

#### **Fee Management for Indian Schools (Following Existing Pattern)**

- [ ] Create `models/IndianFeeStructure.js` (Trust + School level fees)
- [ ] Create `models/FeePayment.js` (with RTE reimbursement support)
- [ ] Create `models/FeeReceipt.js` (Government compliance format with `pdfkit`)
- [ ] Add category-based fee calculation (General/SC/ST/OBC/EWS)
- [ ] Implement RTE quota fee waiver system

#### **Service Layer for Indian Schools**

- [ ] Create `modules/fee/services/IndianFeeService.js`
- [ ] Add government scheme integration logic
- [ ] Implement multi-tier fee calculation engine
- [ ] Add scholarship and RTE benefit calculations
- [ ] Integrate Razorpay SDK with Indian compliance

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

### **SESSION 2: Enquiry Management for Indian Admissions (1-2 hours)**

#### **Database Schema for Indian Admissions (Sequelize Models)**

- [ ] Create `models/AdmissionEnquiry.js` - Lead capture for different classes
- [ ] Add admission type classification (Fresh/Readmission/Transfer)
- [ ] Add class-specific enquiry rules (Nursery/Class I/Class VI/Class IX/Class XI)
- [ ] Create `models/EnquiryFollowup.js` - Indian school follow-up patterns

#### **Enquiry Management Service for Indian Schools**

- [ ] Create `modules/enquiry/services/IndianEnquiryService.js`
- [ ] Implement age-based class eligibility validation
- [ ] Add NEP-compliant admission calendar (April-May for new academic year)
- [ ] Create conversion-to-application workflow with Indian documentation
- [ ] Integrate WhatsApp API for parent communication (common in Indian schools)

#### **API Endpoints for Indian Admissions**

```http
POST /api/enquiries/nursery         # Pre-primary admission enquiry (age 3-6)
POST /api/enquiries/primary         # Class I-V enquiry with age validation
POST /api/enquiries/secondary       # Class VI-VIII enquiry
POST /api/enquiries/higher          # Class IX-XII enquiry with stream selection
GET  /api/enquiries/age-check       # Age eligibility validation
POST /api/enquiries/rte             # RTE quota specific enquiry
GET  /api/enquiries/admission-calendar # Indian academic calendar dates
```

### **SESSION 3: Enhanced Admission Workflow for Indian Schools (2 hours)**

#### **4-Stage Indian Admission Workflow Implementation**

- [ ] **ENQUIRY STAGE** - Lead capture with class-specific age rules
- [ ] **APPLICATION STAGE** - Document collection (Birth cert, Aadhaar, TC, etc.)
- [ ] **ASSESSMENT STAGE** - Age-appropriate evaluation (interaction/written/entrance)
- [ ] **CONFIRMATION STAGE** - Fee payment + government compliance verification

#### **Government Document Integration (Indian Requirements)**

- [ ] Add Aadhaar number validation (12-digit with checksum)
- [ ] Implement SARAL ID integration (Maharashtra state requirement)
- [ ] Add CBSE UID support for CBSE affiliated schools
- [ ] Create document verification workflow for Indian documents
- [ ] Birth certificate validation for age verification

#### **Enhanced Student Model for Indian Schools**

```javascript
// Additional fields for Indian students (add to models/Student.js)
admission_type: ENUM('FRESH', 'READMISSION', 'TRANSFER', 'MID_TERM'),
admission_category: ENUM('GENERAL', 'SC', 'ST', 'OBC', 'EWS', 'NT-A', 'NT-B', 'NT-C'),
quota_type: ENUM('GENERAL', 'RTE', 'MANAGEMENT', 'NRI', 'SPORTS', 'STAFF_WARD'),
medium_of_instruction: ENUM('ENGLISH', 'HINDI', 'MARATHI', 'REGIONAL'),
board_affiliation: ENUM('CBSE', 'ICSE', 'STATE', 'IB'),
nep_stage: ENUM('FOUNDATIONAL', 'PREPARATORY', 'MIDDLE', 'SECONDARY'),
aadhaar_number: VARCHAR(12),
saral_id: VARCHAR(20),
cbse_uid: VARCHAR(20),
rte_eligible: BOOLEAN,
government_category_certificate: VARCHAR(255)
```

#### **Indian Admission Service Enhancement**

- [ ] Update `modules/student/services/StudentService.js`
- [ ] Add NEP 2020 compliant admission rules
- [ ] Implement RTE quota calculation (25% reservation)
- [ ] Add age-based class allocation logic
- [ ] Create government compliance verification

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

### **SESSION 4: Testing & Indian Compliance Verification (1 hour)**

#### **API Testing for Indian School Features**

- [ ] Create `tests/indian-admissions-tests.http` - Test NEP-compliant admission flow
- [ ] Create `tests/indian-fee-management-tests.http` - Test RTE fee calculations
- [ ] Create `tests/government-compliance-tests.http` - Test Aadhaar/SARAL validation
- [ ] Test age-based class allocation for Indian standards

#### **Government Compliance Testing**

- [ ] Verify Aadhaar number validation (12-digit with checksum)
- [ ] Test RTE quota calculations (25% reservation)
- [ ] Validate category-wise fee structures (General/SC/ST/OBC/EWS)
- [ ] Test admission calendar compliance (Indian academic year)

#### **Integration Testing with Existing System**

- [ ] Verify existing student functionality remains intact
- [ ] Test tenant-wise data isolation for multi-school setup
- [ ] Validate session management for Indian school users
- [ ] Test role-based access for Indian school staff

### **After Each Session**

- [ ] Test new API endpoints with REST Client
- [ ] Verify database schema updates for Indian requirements
- [ ] Test integration with existing student system
- [ ] Validate NEP 2020 compliance in admission flow
- [ ] Update test files with Indian school scenarios

### **Test File Updates for Indian Schools**

- [ ] Create `indian-fee-management-tests.http`
- [ ] Create `indian-enquiry-management-tests.http`
- [ ] Create `government-compliance-tests.http`
- [ ] Update `student-integration-tests.http` with Indian fields

---

## 📊 **SUCCESS CRITERIA (Indian School System)**

### **End of Evening Session - Indian School Compliance**

- [ ] Indian fee structures (Trust + School level) can be created and managed
- [ ] RTE quota and category-wise fee calculation working
- [ ] Multi-tier admission enquiry system (Nursery/Primary/Secondary/Higher)
- [ ] 4-stage Indian admission workflow implemented
- [ ] Government ID fields (Aadhaar/SARAL/CBSE UID) added and validated
- [ ] NEP 2020 stage classification working
- [ ] Age-based class allocation for Indian standards functional
- [ ] All Indian school specific endpoints tested and working

### **Database Verification - Indian Extensions**

- [ ] New tables for Indian school requirements created successfully
- [ ] Government compliance model associations working
- [ ] Indian-specific student fields properly integrated
- [ ] Migration scripts for Indian fields executed
- [ ] Multi-tier fee structure data integrity maintained

### **Indian Education System Integration Verification**

- [ ] Existing student functionality unaffected
- [ ] Indian school features integrate seamlessly with current system
- [ ] NEP 2020 compliance maintained throughout admission process
- [ ] Government category-wise processing works correctly
- [ ] RTE quota calculations accurate
- [ ] Multi-language support (English/Hindi/Regional) functional
- [ ] API responses consistent with existing patterns
- [ ] Error handling follows established patterns with Indian compliance messages

---

## 🔧 **TECHNICAL IMPLEMENTATION NOTES (Our Tech Stack)**

### **Payment Integration (Razorpay - Already in Dependencies)**

```javascript
// Using existing axios for Razorpay API calls
const axios = require('axios');

class PaymentService {
   constructor() {
      this.razorpay = {
         baseURL: 'https://api.razorpay.com/v1/',
         auth: {
            username: process.env.RAZORPAY_KEY_ID,
            password: process.env.RAZORPAY_KEY_SECRET,
         },
      };
   }

   async createOrder(amount, currency = 'INR') {
      try {
         const response = await axios.post(
            `${this.razorpay.baseURL}orders`,
            { amount: amount * 100, currency, receipt: `rcpt_${Date.now()}` },
            { auth: this.razorpay.auth }
         );
         return response.data;
      } catch (error) {
         logger.error('Razorpay order creation failed:', error);
         throw new Error('Payment order creation failed');
      }
   }
}
```

### **Email Templates (EJS Integration)**

```javascript
// Using existing EJS for email templates
const ejs = require('ejs');
const path = require('path');

// Create email template: views/emails/admission-confirmation.ejs
const emailTemplate = await ejs.renderFile(path.join(__dirname, '../../../views/emails/admission-confirmation.ejs'), {
   studentName: student.full_name,
   admissionNumber: student.admission_number,
   schoolName: school.name,
});

// Send using existing @sendgrid/mail
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
   to: student.email,
   from: school.email,
   subject: 'Admission Confirmation',
   html: emailTemplate,
});
```

### **SMS Notifications (Twilio - Already in Dependencies)**

```javascript
// Using existing Twilio integration
const twilio = require('twilio');

class SMSService {
   constructor() {
      this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
   }

   async sendAdmissionSMS(phone, message) {
      try {
         await this.client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone,
         });
      } catch (error) {
         logger.error('SMS sending failed:', error);
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
         const { getTenantModels } = require('../../../models');
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

         const totalFees = [...trustFees, ...schoolFees].reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
         const totalDiscounts = discounts.reduce((sum, discount) => sum + parseFloat(discount.amount), 0);

         return {
            trustFees: trustFees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0),
            schoolFees: schoolFees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0),
            totalFees,
            totalDiscounts,
            finalAmount: totalFees - totalDiscounts,
         };
      } catch (error) {
         logger.error('Fee calculation failed:', error);
         throw error;
      }
   }
}
```

### **Government ID Validation (Using Existing Validator)**

```javascript
const validator = require('validator');

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
const Student = sequelize.define('Student', {
   // ... existing fields
   aadhaar_number: {
      type: DataTypes.STRING(12),
      allowNull: true,
      validate: {
         isValidAadhaar: function (value) {
            if (value && !validateAadhaar(value)) {
               throw new Error('Invalid Aadhaar number format');
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
               throw new Error('Invalid SARAL ID format');
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
