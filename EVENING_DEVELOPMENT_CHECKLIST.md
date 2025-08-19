# Evening Development Session Checklist

## 📋 **IMMEDIATE ACTION ITEMS**

### **Setup (5 minutes)**

- [ ] `git pull origin main`
- [ ] `node server.js` (verify server starts)
- [ ] Review `REQUIREMENTS_GAP_ANALYSIS.md` (key missing components)

---

## 🚀 **DEVELOPMENT PRIORITY SEQUENCE (Indian School System Implementation)**

### **SESSION 1: Board Affiliation System + Auto-Compliance Setup (4-5 hours)**

#### **Board Affiliation & Auto-Compliance System (Sequelize ORM)**

- [ ] Create `models/SchoolProfile.js` - Central school profile with board affiliation
- [ ] Implement `BOARD_COMPLIANCE_MATRIX` - Auto-determine applicable laws/requirements
- [ ] Create auto-compliance hooks - Populate requirements based on board selection
- [ ] Add board-specific validation rules for students and staff

#### **Board-Specific Compliance Models**

- [ ] Create `models/CBSECompliance.js` - CBSE affiliation, CCE, three-language formula
- [ ] Create `models/CISCECompliance.js` - ICSE/ISC recognition, practical facilities
- [ ] Create `models/StateBoardCompliance.js` - State board registration, RTE compliance
- [ ] Create `models/InternationalBoardCompliance.js` - IB, Cambridge, American curriculum
- [ ] Create `models/NEPCompliance.js` - NEP 2020 holistic development tracking

#### **Enhanced Student Model with Board-Specific Validation**

- [ ] Update `models/Student.js` - Board-aware student model with dynamic fields
- [ ] Implement board-specific government ID requirements
- [ ] Add board-specific academic data structures (CCE, IB CAS, ICSE practicals)
- [ ] Create board-specific validation hooks and compliance checking
- [ ] Add automatic board requirement population on student creation

#### **UDISE+ School Registration System**

- [ ] Create `models/UDISESchool.js` - Comprehensive school master data
- [ ] Implement UDISE+ data export functionality (XML/JSON formats)
- [ ] Add class-wise enrollment tracking for government reporting
- [ ] Create infrastructure and facility tracking models
- [ ] Implement teacher qualification tracking for UDISE+ compliance
- [ ] Create `models/CISCECompliance.js` - ICSE/ISC specific requirements (practical tracking, projects)
- [ ] Create `models/InternationalBoard.js` - IB, Cambridge, American curriculum support
- [ ] Implement NEP 2020 assessment framework (competency-based, portfolio, 360-degree)
- [ ] Add multilingual education support (three-language formula tracking)
- [ ] Create vocational education module integration
- [ ] Implement holistic development tracking (co-curricular, life skills, values)
- [ ] Add digital literacy and technology integration tracking

#### **UDISE+ Compliance Implementation (Government Requirement)**

- [ ] Create `models/UDISESchool.js` - Comprehensive school registration with all mandatory fields
- [ ] Create `models/UDISEClassInfrastructure.js` - Class-wise enrollment and infrastructure data
- [ ] Create `models/UDISETeacher.js` - Teacher information for government reporting
- [ ] Create `models/UDISEFacilities.js` - School facilities and infrastructure tracking
- [ ] Implement UDISE+ student ID generation service
- [ ] Add UDISE+ data reporting functionality (annual school census)
- [ ] Create UDISE+ API integration for data validation
- [ ] Implement class-wise enrollment tracking for UDISE+ reporting
- [ ] Add academic year progression tracking
- [ ] Create UDISE+ data export functionality (XML/JSON formats as per government specs)
- [ ] Implement student learning outcome tracking for UDISE+ compliance
- [ ] Add infrastructure and facility tracking as per UDISE+ requirements
- [ ] Create school head/principal information management
- [ ] Implement teacher qualification and training tracking
- [ ] Add minority status and special category tracking
- [ ] Create medium of instruction management
- [ ] Implement distance and connectivity data tracking

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
# BOARD AFFILIATION & AUTO-COMPLIANCE APIS
GET  /api/school-profile         # Get comprehensive school profile with board info
PUT  /api/school-profile/board   # Update board affiliation (auto-sets compliance)
GET  /api/compliance/matrix      # Get applicable laws/requirements by board
POST /api/compliance/validate    # Validate school compliance status
GET  /api/compliance/checklist   # Get board-specific compliance checklist

# STUDENT BOARD-SPECIFIC APIS
POST /api/students/validate-board # Validate student against board requirements
GET  /api/students/:id/compliance # Check student's board compliance status
PUT  /api/students/:id/board-data # Update board-specific student data
GET  /api/students/requirements   # Get required fields by student's board

# FEE MANAGEMENT APIS
POST /api/fee-structures         # Create fee structure
GET  /api/fee-structures         # List fee structures with filters
GET  /api/fee-structures/:id     # Get specific fee structure
PUT  /api/fee-structures/:id     # Update fee structure
POST /api/payments               # Process payment (Razorpay)
GET  /api/payments/:id           # Get payment details
POST /api/receipts/generate      # Generate PDF receipt (pdfkit)
GET  /api/reports/collections    # Collection reports
GET  /api/reports/outstanding    # Outstanding dues report

# UDISE+ COMPLIANCE APIS
# School Registration & Management
POST /api/udise/school           # Register new school with UDISE+ data
GET  /api/udise/school/:code     # Get comprehensive UDISE school data
PUT  /api/udise/school/:code     # Update school registration details
GET  /api/udise/enrollment       # Get class-wise enrollment for UDISE+ reporting
POST /api/udise/data-export      # Export UDISE+ data (XML/JSON)
GET  /api/udise/compliance       # Check UDISE+ compliance status
PUT  /api/udise/student/:id      # Update UDISE+ student data
POST /api/udise/verify           # Verify UDISE+ data before submission

# BOARD AFFILIATION APIS
POST /api/boards/cbse            # CBSE school registration and compliance
GET  /api/boards/cbse/:code      # Get CBSE affiliation details
PUT  /api/boards/cbse/compliance # Update CBSE compliance status
POST /api/boards/cisce           # CISCE registration and requirements
GET  /api/boards/international   # International board configurations
PUT  /api/boards/affiliation     # Update board affiliation details

# NEP 2020 COMPLIANCE APIS
POST /api/nep/assessment         # Create competency-based assessment
GET  /api/nep/portfolio/:id      # Get student portfolio (NEP requirement)
PUT  /api/nep/holistic-dev       # Update holistic development data
POST /api/nep/multilingual       # Configure three-language formula
GET  /api/nep/vocational         # Get vocational education options
PUT  /api/nep/digital-literacy   # Update digital literacy progress
POST /api/nep/life-skills        # Record life skills assessment
GET  /api/nep/competency/:id     # Get competency mapping results
GET  /api/udise/schools          # List schools with UDISE+ compliance status

# Infrastructure & Facilities Management
POST /api/udise/facilities       # Add/update school facilities data
GET  /api/udise/facilities/:code # Get school facilities information
POST /api/udise/infrastructure   # Update infrastructure details

# Class-wise Data Management
POST /api/udise/class-data       # Add class-wise enrollment data
GET  /api/udise/enrollment/:code # Get class-wise enrollment for UDISE+ reporting
PUT  /api/udise/enrollment/:id   # Update enrollment data

# Teacher Information Management
POST /api/udise/teachers         # Add teacher information
GET  /api/udise/teachers/:code   # Get school teachers data
PUT  /api/udise/teacher/:id      # Update teacher information

# Student ID & Compliance
POST /api/udise/student-id       # Generate UDISE+ student ID
PUT  /api/udise/student/:id      # Update UDISE+ student data

# Reporting & Data Export
POST /api/udise/data-export      # Export UDISE+ data (XML/JSON)
GET  /api/udise/compliance       # Check UDISE+ compliance status
POST /api/udise/annual-census    # Generate annual census report
GET  /api/udise/reports          # Get various UDISE+ reports
POST /api/udise/verify           # Verify UDISE+ data before submission
GET  /api/udise/validation       # Validate data completeness for submission
```

### **SESSION 2: Fee Management for Indian Schools (2-3 hours)**

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

### **SESSION 3: Enquiry Management for Indian Admissions (1-2 hours)**

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

### **SESSION 4: Enhanced Admission Workflow for Indian Schools (2 hours)**

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
board_affiliation: ENUM('CBSE', 'CISCE', 'STATE', 'IB', 'CAMBRIDGE', 'AMERICAN', 'FRENCH'),
nep_stage: ENUM('FOUNDATIONAL', 'PREPARATORY', 'MIDDLE', 'SECONDARY'),

// GOVERNMENT IDENTIFICATION NUMBERS
aadhaar_number: VARCHAR(12),
udise_student_id: VARCHAR(17),        // UDISE+ Student ID (11-digit school + 4-6 digit sequence)
udise_school_code: VARCHAR(11),       // UDISE School Code for reference
pen_number: VARCHAR(15),              // Permanent Education Number
saral_id: VARCHAR(20),                // Maharashtra SARAL ID
emis_id: VARCHAR(15),                 // Education Management Information System
cbse_uid: VARCHAR(20),                // CBSE Student UID
cisce_uid: VARCHAR(15),               // ICSE/ISC Student UID
state_uid: VARCHAR(20),               // State board student UID

// BOARD SPECIFIC FIELDS
cbse_school_code: VARCHAR(5),         // 5-digit CBSE school code
cisce_registration: VARCHAR(10),      // CISCE registration number
international_student_id: VARCHAR(20), // IB/Cambridge/American board ID
board_registration_date: DATE,
board_migration_certificate: VARCHAR(255),

// NEP 2020 COMPLIANCE FIELDS
three_language_formula: JSON,         // Languages being studied
vocational_subjects: JSON,            // Vocational courses taken
competency_levels: JSON,              // Subject-wise competency mapping
holistic_development: JSON,           // Co-curricular, life skills, values
digital_literacy_level: ENUM('BASIC', 'INTERMEDIATE', 'ADVANCED'),
portfolio_status: ENUM('ACTIVE', 'INACTIVE', 'COMPLETED'),

// ASSESSMENT FIELDS (NEP 2020)
competency_based_assessment: BOOLEAN,
portfolio_assessment: BOOLEAN,
peer_assessment_participation: BOOLEAN,
self_assessment_completion: BOOLEAN,

// SCHEME SPECIFIC IDS
rte_beneficiary_id: VARCHAR(20),      // RTE quota beneficiary ID
scholarship_id: VARCHAR(20),          // Government scholarship ID
pmshri_id: VARCHAR(15),               // PM SHRI school ID
cwsn_id: VARCHAR(15),                 // Children with Special Needs ID

// COMPLIANCE FLAGS
rte_eligible: BOOLEAN,
government_category_certificate: VARCHAR(255),
udise_verified: BOOLEAN,
aadhaar_verified: BOOLEAN,
board_compliance_verified: BOOLEAN,
nep_compliance_status: ENUM('COMPLIANT', 'PARTIAL', 'NON_COMPLIANT')
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

### **SESSION 5: Testing & Indian Compliance Verification (1 hour)**

#### **API Testing for Indian School Features**

- [ ] Create `tests/indian-admissions-tests.http` - Test NEP-compliant admission flow
- [ ] Create `tests/indian-fee-management-tests.http` - Test RTE fee calculations
- [ ] Create `tests/government-compliance-tests.http` - Test UDISE+, Aadhaar, SARAL, PEN validation
- [ ] Create `tests/udise-integration-tests.http` - Test UDISE+ student ID generation and verification
- [ ] Test age-based class allocation for Indian standards
- [ ] Test government ID format validations (Aadhaar checksum, PEN format, UDISE+ structure)

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

### **End of Evening Session - Comprehensive Indian School Compliance**

#### **Board Affiliation & Auto-Compliance System**

- [ ] School board affiliation system operational (CBSE, ICSE, State, International)
- [ ] Auto-compliance matrix working (applicable laws determined by board selection)
- [ ] Board-specific student validation rules implemented
- [ ] Dynamic government ID requirements based on board affiliation functional
- [ ] Board-specific academic data structures working (CCE, IB CAS, ICSE practicals)

#### **Government ID & Documentation Management**

- [ ] Government ID fields (UDISE+, PEN, Aadhaar, SARAL, CBSE/CISCE UID) validated by board
- [ ] UDISE+ student ID generation and verification working (11-digit school + 4-6 digit sequence)
- [ ] Board-specific compliance verification (Aadhaar checksum, UDISE+ format, PEN validation) functional
- [ ] Document verification workflow for board-specific requirements operational

#### **UDISE+ School Registration & Reporting**

- [ ] UDISE School registration with comprehensive facilities data functional
- [ ] Class-wise enrollment tracking and reporting implemented
- [ ] Teacher qualification and training tracking operational
- [ ] School infrastructure and facilities tracking working
- [ ] UDISE+ data export functionality for government reporting implemented
- [ ] Annual census data generation and validation working

#### **Fee Management & Financial Compliance**

- [ ] Indian fee structures (Trust + School level) can be created and managed
- [ ] RTE quota and category-wise fee calculation working
- [ ] Board-specific fee structures and payment schedules operational
- [ ] Government scheme integration (scholarships, fee waivers) functional

#### **Admission & Academic Management**

- [ ] Multi-tier admission enquiry system (Nursery/Primary/Secondary/Higher) operational
- [ ] 4-stage Indian admission workflow implemented
- [ ] Board-specific admission criteria and age validation working
- [ ] Academic progression tracking based on board requirements functional

#### **NEP 2020 & Board-Specific Compliance**

- [ ] NEP stage classification (foundational/preparatory/middle/secondary) implemented
- [ ] Three-language formula tracking functional
- [ ] Competency-based assessment framework operational
- [ ] Portfolio assessment system working
- [ ] 360-degree assessment (self, peer, teacher, parent) implemented
- [ ] Holistic development tracking (co-curricular, life skills, values) functional
- [ ] Vocational education integration from Class VI operational
- [ ] Digital literacy and computational thinking tracking working

- [ ] Government compliance verification (Aadhaar checksum, UDISE+ format, PEN validation) functional
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

// Aadhaar validation with checksum (Verhoeff algorithm)
const validateAadhaar = (aadhaar) => {
   if (!/^\d{12}$/.test(aadhaar)) return false;

   // Verhoeff checksum validation
   const verhoeff = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
   ];

   let c = 0;
   const myArray = aadhaar.split('').map(Number).reverse();

   for (let i = 0; i < myArray.length; i++) {
      c = verhoeff[c][verhoeff[(i + 1) % 8][myArray[i]]];
   }
   return c === 0;
};

// UDISE+ Student ID validation
const validateUDISEStudentId = (udiseId) => {
   // Format: UDISE School Code (11 digits) + Student Sequence (4-6 digits)
   // School Code: State(2) + District(2) + Block(3) + Cluster(2) + School(2)
   // Total: 15-17 characters (all numeric)
   return /^\d{15,17}$/.test(udiseId);
};

// UDISE School Code validation (11 digits)
const validateUDISESchoolCode = (schoolCode) => {
   // Format: State(2) + District(2) + Block(3) + Cluster(2) + School(2) = 11 digits
   return /^\d{11}$/.test(schoolCode);
};

// Generate UDISE+ Student ID
const generateUDISEStudentId = (schoolCode, studentSequence) => {
   if (!validateUDISESchoolCode(schoolCode)) {
      throw new Error('Invalid UDISE School Code format');
   }

   // Pad student sequence to 4-6 digits
   const paddedSequence = studentSequence.toString().padStart(4, '0');
   return schoolCode + paddedSequence;
};

// PEN (Permanent Education Number) validation
const validatePEN = (pen) => {
   return /^[A-Z0-9]{12,15}$/.test(pen);
};

// SARAL ID validation (Maharashtra)
const validateSaralId = (saralId) => {
   return /^MH\d{13}$/.test(saralId); // Updated format: MH + 13 digits
};

// CBSE UID validation
const validateCBSEUID = (cbseUid) => {
   return /^[A-Z0-9]{15}$/.test(cbseUid); // 15-character alphanumeric
};

// CISCE UID validation (ICSE/ISC)
const validateCISCEUID = (cisceUid) => {
   return /^[A-Z0-9]{15}$/.test(cisceUid);
};

// EMIS ID validation
const validateEMISId = (emisId) => {
   return /^[A-Z]{2}\d{10}$/.test(emisId);
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
               throw new Error('Invalid Aadhaar number format or checksum');
            }
         },
      },
   },
   udise_student_id: {
      type: DataTypes.STRING(17),
      allowNull: true,
      validate: {
         isValidUDISE: function (value) {
            if (value && !validateUDISEStudentId(value)) {
               throw new Error('Invalid UDISE+ Student ID format');
            }
         },
      },
   },
   udise_school_code: {
      type: DataTypes.STRING(11),
      allowNull: true,
      validate: {
         isValidSchoolCode: function (value) {
            if (value && !validateUDISESchoolCode(value)) {
               throw new Error('Invalid UDISE School Code format');
            }
         },
      },
   },
   pen_number: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
         isValidPEN: function (value) {
            if (value && !validatePEN(value)) {
               throw new Error('Invalid PEN format');
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
   cbse_uid: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
         isValidCBSE: function (value) {
            if (value && !validateCBSEUID(value)) {
               throw new Error('Invalid CBSE UID format');
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
