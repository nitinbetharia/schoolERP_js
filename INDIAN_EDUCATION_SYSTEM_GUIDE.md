# Indian School System & NEP Implementation Guide

## � **BOARD AFFILIATION & COMPLIANCE MATRIX**

### **Automated Compliance System Based on School Type**

#### **Board Affiliation Types & Applicable Laws**

```javascript
// Comprehensive Board Affiliation System
const BOARD_COMPLIANCE_MATRIX = {
   CBSE: {
      mandatory_requirements: [
         'NEP_2020_COMPLIANCE',
         'CBSE_BYLAWS',
         'CBSE_AFFILIATION_REQUIREMENTS',
         'CBSE_CURRICULUM_STANDARDS',
         'CBSE_EXAMINATION_SYSTEM',
         'UDISE_PLUS_REPORTING',
         'RTE_ACT_2009',
         'POCSO_COMPLIANCE',
         'CHILD_PROTECTION_POLICY',
      ],
      student_ids_required: ['CBSE_UID', 'AADHAAR', 'UDISE_STUDENT_ID'],
      examination_system: 'CBSE_BOARD_EXAMS',
      curriculum: 'NCERT_BASED',
      assessment: 'CCE_CONTINUOUS_COMPREHENSIVE',
      reporting: ['CBSE_PORTAL', 'UDISE_PLUS', 'DIKSHA_INTEGRATION'],
   },

   ICSE: {
      mandatory_requirements: [
         'NEP_2020_COMPLIANCE',
         'CISCE_COUNCIL_RULES',
         'ICSE_CURRICULUM_STANDARDS',
         'CISCE_EXAMINATION_SYSTEM',
         'UDISE_PLUS_REPORTING',
         'RTE_ACT_2009',
         'POCSO_COMPLIANCE',
         'CHILD_PROTECTION_POLICY',
      ],
      student_ids_required: ['CISCE_UID', 'AADHAAR', 'UDISE_STUDENT_ID'],
      examination_system: 'ICSE_ISC_EXAMS',
      curriculum: 'CISCE_SYLLABUS',
      assessment: 'INTERNAL_EXTERNAL_ASSESSMENT',
      reporting: ['CISCE_PORTAL', 'UDISE_PLUS'],
   },

   STATE_BOARD: {
      mandatory_requirements: [
         'NEP_2020_COMPLIANCE',
         'STATE_EDUCATION_ACT',
         'STATE_CURRICULUM_FRAMEWORK',
         'STATE_EXAMINATION_RULES',
         'UDISE_PLUS_REPORTING',
         'RTE_ACT_2009',
         'STATE_MEDIUM_POLICY',
         'POCSO_COMPLIANCE',
      ],
      student_ids_required: ['STATE_UID', 'AADHAAR', 'UDISE_STUDENT_ID', 'SARAL_ID'],
      examination_system: 'STATE_BOARD_EXAMS',
      curriculum: 'STATE_CURRICULUM',
      assessment: 'STATE_ASSESSMENT_PATTERN',
      reporting: ['STATE_PORTAL', 'UDISE_PLUS', 'SARAL_SYSTEM'],
   },

   IB_INTERNATIONAL: {
      mandatory_requirements: [
         'IB_AUTHORIZATION_REQUIREMENTS',
         'IB_PROGRAMME_STANDARDS',
         'INTERNATIONAL_CHILD_PROTECTION',
         'UDISE_PLUS_REPORTING',
         'FOREIGN_EDUCATION_PROVIDER_REGULATIONS',
         'RTE_COMPLIANCE_IF_INDIAN_STUDENTS',
      ],
      student_ids_required: ['IB_STUDENT_ID', 'PASSPORT_NUMBER', 'AADHAAR_IF_INDIAN'],
      examination_system: 'IB_ASSESSMENT_SYSTEM',
      curriculum: 'IB_CURRICULUM_FRAMEWORK',
      assessment: 'IB_INTERNAL_EXTERNAL_ASSESSMENT',
      reporting: ['IB_INFORMATION_SYSTEM', 'UDISE_PLUS_IF_REQUIRED'],
   },

   CAMBRIDGE_INTERNATIONAL: {
      mandatory_requirements: [
         'CAMBRIDGE_CENTRE_REQUIREMENTS',
         'CAMBRIDGE_QUALITY_STANDARDS',
         'INTERNATIONAL_CHILD_PROTECTION',
         'UDISE_PLUS_REPORTING',
         'FOREIGN_EDUCATION_PROVIDER_REGULATIONS',
      ],
      student_ids_required: ['CAMBRIDGE_ID', 'PASSPORT_NUMBER', 'AADHAAR_IF_INDIAN'],
      examination_system: 'CAMBRIDGE_INTERNATIONAL_EXAMS',
      curriculum: 'CAMBRIDGE_CURRICULUM',
      assessment: 'CAMBRIDGE_ASSESSMENT_SYSTEM',
      reporting: ['CAMBRIDGE_INTERNATIONAL_SYSTEM', 'UDISE_PLUS_IF_REQUIRED'],
   },

   WALDORF_STEINER: {
      mandatory_requirements: [
         'WALDORF_PEDAGOGY_STANDARDS',
         'ALTERNATIVE_EDUCATION_COMPLIANCE',
         'CHILD_DEVELOPMENT_FOCUS',
         'UDISE_PLUS_REPORTING',
         'RTE_ACT_2009',
      ],
      student_ids_required: ['AADHAAR', 'UDISE_STUDENT_ID'],
      examination_system: 'ALTERNATIVE_ASSESSMENT',
      curriculum: 'WALDORF_CURRICULUM',
      assessment: 'HOLISTIC_DEVELOPMENT_ASSESSMENT',
      reporting: ['UDISE_PLUS', 'ALTERNATIVE_EDUCATION_PORTAL'],
   },

   MONTESSORI: {
      mandatory_requirements: [
         'MONTESSORI_METHOD_STANDARDS',
         'EARLY_CHILDHOOD_REGULATIONS',
         'CHILD_CENTRIC_EDUCATION_COMPLIANCE',
         'UDISE_PLUS_REPORTING',
         'RTE_ACT_2009',
      ],
      student_ids_required: ['AADHAAR', 'UDISE_STUDENT_ID'],
      examination_system: 'CONTINUOUS_OBSERVATION',
      curriculum: 'MONTESSORI_CURRICULUM',
      assessment: 'SELF_PACED_ASSESSMENT',
      reporting: ['UDISE_PLUS', 'EARLY_CHILDHOOD_PORTAL'],
   },
};
```

---

## �🇮🇳 **INDIAN EDUCATION SYSTEM STRUCTURE**

### **NEP 2020 Compliant School Structure**

#### **1. FOUNDATIONAL STAGE (Ages 3-8)**

- **Pre-Primary**: Nursery, LKG, UKG (Ages 3-6)
- **Primary**: Classes I, II (Ages 6-8)
- **Focus**: Play-based, activity-based learning
- **Admission Points**: Nursery (main entry), LKG (limited), Class I (government mandate)

#### **2. PREPARATORY STAGE (Ages 8-11)**

- **Classes**: III, IV, V (Ages 8-11)
- **Focus**: Discovery-based learning, light textbooks
- **Medium**: Mother tongue/regional language preferred
- **Admission Points**: Class III (mid-cycle), Class VI (secondary entry)

#### **3. MIDDLE STAGE (Ages 11-14)**

- **Classes**: VI, VII, VIII (Ages 11-14)
- **Focus**: Subject teachers, experimental learning
- **Language**: Three-language formula
- **Admission Points**: Class VI (major entry), Class IX (secondary entry)

#### **4. SECONDARY STAGE (Ages 14-18)**

- **Classes**: IX, X (Lower Secondary), XI, XII (Higher Secondary)
- **Focus**: Critical thinking, board exams (X, XII)
- **Streams**: Science, Commerce, Arts, Vocational
- **Admission Points**: Class IX (major entry), Class XI (stream selection)

---

## 🎓 **NEP 2020 IMPLEMENTATION REQUIREMENTS**

### **Key NEP 2020 Principles for School ERP**

#### **1. Holistic Development Tracking**

- **Academic Performance**: Subject-wise competency mapping
- **Co-curricular Activities**: Arts, sports, creativity tracking
- **Life Skills Assessment**: Critical thinking, problem-solving
- **Values Education**: Ethics, citizenship, environmental awareness
- **Health & Wellness**: Physical fitness, mental health monitoring

#### **2. Multilingual Education Support**

- **Three-Language Formula**: Hindi, English, Regional/Modern Indian Language
- **Mother Tongue Preference**: Early years education in home language
- **Language Proficiency Levels**: Basic, Intermediate, Advanced tracking
- **Foreign Language Options**: Classes VI onwards
- **Classical Language**: Sanskrit, others as optional subjects

#### **3. Assessment & Evaluation (NEP Compliant)**

- **Competency-Based Assessment**: Knowledge, skills, values, attitudes
- **360-Degree Assessment**: Self, peer, teacher, parent evaluation
- **Portfolio Approach**: Student work collection and progress tracking
- **Reduced Board Exam Stress**: Semester system, multiple attempts
- **Coding & Computational Thinking**: Mandatory from Class VI

#### **4. Vocational Education Integration**

- **Skill-Based Learning**: From Class VI onwards
- **Industry Partnerships**: Internships, mentorship programs
- **Local Craft Integration**: Regional skills and knowledge
- **Career Counseling**: Professional guidance system
- **Entrepreneurship Education**: Innovation and startup mindset

#### **5. Technology Integration (Digital India Initiative)**

- **Digital Literacy**: ICT skills for all students
- **Online Learning Platforms**: Blended learning support
- **AI & Data Science**: Introduction from secondary level
- **Digital Portfolio**: Student achievement documentation
- **Virtual Labs**: Science and mathematics experiments

#### **NEP 2020 Data Model Requirements**

```javascript
nep_compliance: {
  // ACADEMIC STRUCTURE
  nep_stage: DataTypes.ENUM('FOUNDATIONAL', 'PREPARATORY', 'MIDDLE', 'SECONDARY'),
  academic_year_structure: DataTypes.ENUM('5+3+3+4', 'TRADITIONAL'),

  // ASSESSMENT SYSTEM
  competency_based_assessment: DataTypes.BOOLEAN,
  portfolio_assessment: DataTypes.BOOLEAN,
  peer_assessment: DataTypes.BOOLEAN,
  self_assessment: DataTypes.BOOLEAN,

  // MULTILINGUAL EDUCATION
  home_language: DataTypes.STRING(50),
  three_language_formula: DataTypes.JSON,        // Languages being studied
  language_proficiency_levels: DataTypes.JSON,  // Proficiency in each language

  // SKILL DEVELOPMENT
  vocational_subjects: DataTypes.JSON,           // Vocational courses taken
  coding_proficiency: DataTypes.ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
  entrepreneurship_activities: DataTypes.JSON,

  // HOLISTIC DEVELOPMENT
  co_curricular_participation: DataTypes.JSON,  // Arts, sports, clubs
  life_skills_assessment: DataTypes.JSON,       // Critical thinking, etc.
  values_education_completion: DataTypes.BOOLEAN,

  // TECHNOLOGY INTEGRATION
  digital_literacy_level: DataTypes.ENUM('BASIC', 'INTERMEDIATE', 'ADVANCED'),
  online_learning_hours: DataTypes.INTEGER,
  digital_portfolio_status: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'COMPLETED')
}
```

---

## 📚 **ADMISSION CLASSIFICATION SYSTEM**

### **Primary Admission Categories**

#### **1. FRESH ADMISSIONS (New Students)**

- **Nursery/Pre-Primary**: Main admission cycle (April-June)
- **Class I**: Mandatory government admission cycle
- **Class VI**: Secondary school entry point
- **Class IX**: High school entry point
- **Class XI**: Stream-wise admission with marks criteria

#### **2. READMISSIONS (Continuing Students)**

- **Annual Readmission**: Existing students continuing to next class
- **Transfer Readmission**: Students from other schools
- **Detention/Repeat**: Students repeating same class (as per RTE guidelines)

#### **3. MID-TERM ADMISSIONS**

- **Transfer Cases**: Due to family relocation
- **Emergency Admissions**: Special circumstances
- **NRI/International**: Mid-year entries from abroad

### **Age Criteria & Government Compliance**

#### **RTE Act 2009 Compliance**

```javascript
const ageCalculation = {
   nursery: { minAge: 3, maxAge: 4, cutoffDate: '2024-03-31' },
   lkg: { minAge: 4, maxAge: 5, cutoffDate: '2024-03-31' },
   ukg: { minAge: 5, maxAge: 6, cutoffDate: '2024-03-31' },
   classI: { minAge: 6, maxAge: 7, cutoffDate: '2024-03-31' }, // RTE mandated
   classVI: { minAge: 11, maxAge: 12, cutoffDate: '2024-03-31' },
   classIX: { minAge: 14, maxAge: 15, cutoffDate: '2024-03-31' },
   classXI: { minAge: 16, maxAge: 17, cutoffDate: '2024-03-31' },
};
```

---

## 🏫 **INDIAN SCHOOL TRUST STRUCTURE**

### **Multi-School Trust Management**

```
Educational Trust/Society
├── Pre-Primary School (Nursery - UKG)
├── Primary School (I - V)
├── Secondary School (VI - X)
├── Higher Secondary School (XI - XII)
└── Integrated School (Nursery - XII)
```

### **Maharashtra State Specific Requirements**

- **SARAL ID**: Mandatory for all students
- **Aadhaar Integration**: Required for scholarships and government schemes
- **Regional Language**: Marathi mandatory as per state policy
- **RTE Quota**: 25% seats for economically weaker sections

---

## 📚 **BOARD AFFILIATION REQUIREMENTS**

### **CBSE (Central Board of Secondary Education)**

#### **CBSE Specific Requirements**

- **Registration**: School Code (5-digit), Principal Registration, Teacher Registration
- **Student ID**: CBSE UID (15-character alphanumeric)
- **Academic Structure**: Classes IX-XII (Secondary & Sr. Secondary)
- **Examinations**: Board exams for Classes X and XII
- **Curriculum**: NCERT-based with NEP 2020 integration
- **Languages**: Three-language formula mandatory
- **Assessment**: Continuous and Comprehensive Evaluation (CCE)
- **Documentation**: Transfer Certificates, Character Certificates, Migration Certificates
- **Online Systems**: Parinam Manjusha, Academic Repository, DigiLocker integration

---

## 🏫 **COMPREHENSIVE SCHOOL PROFILE MODEL**

### **Dynamic Compliance System Based on Board Affiliation**

```javascript
// models/SchoolProfile.js - Comprehensive School Profile with Auto-Compliance
const SchoolProfile = sequelize.define('SchoolProfile', {
   // BASIC SCHOOL INFORMATION
   school_name: DataTypes.STRING(200),
   udise_code: DataTypes.STRING(11),

   // BOARD AFFILIATION (Determines all applicable requirements)
   primary_board: {
      type: DataTypes.ENUM(
         'CBSE',
         'ICSE',
         'STATE_BOARD',
         'IB_INTERNATIONAL',
         'CAMBRIDGE_INTERNATIONAL',
         'WALDORF_STEINER',
         'MONTESSORI',
         'KENDRIYA_VIDYALAYA',
         'NAVODAYA_VIDYALAYA',
         'ARMY_PUBLIC_SCHOOL'
      ),
      allowNull: false,
   },

   // SCHOOL CATEGORIZATION
   school_type: DataTypes.ENUM('GOVERNMENT', 'GOVERNMENT_AIDED', 'PRIVATE_UNAIDED', 'INTERNATIONAL'),
   management_type: DataTypes.ENUM('GOVERNMENT', 'PRIVATE', 'AIDED', 'TRUST', 'SOCIETY', 'COMPANY'),
   recognition_status: DataTypes.ENUM('RECOGNIZED', 'UNRECOGNIZED', 'PROVISIONAL'),

   // CLASS RANGE OFFERED
   classes_offered: DataTypes.STRING(20), // e.g., "Nursery-XII", "VI-XII", "IX-XII"

   // BOARD SPECIFIC CODES/IDs
   cbse_school_code: DataTypes.STRING(5),
   cisce_registration: DataTypes.STRING(10),
   state_board_code: DataTypes.STRING(15),
   ib_school_code: DataTypes.STRING(10),
   cambridge_centre_number: DataTypes.STRING(8),

   // AUTO-GENERATED COMPLIANCE REQUIREMENTS (Based on Board)
   applicable_laws: {
      type: DataTypes.JSON, // Auto-populated based on board affiliation
      defaultValue: [],
   },

   required_student_ids: {
      type: DataTypes.JSON, // Auto-populated based on board affiliation
      defaultValue: [],
   },

   mandatory_reporting: {
      type: DataTypes.JSON, // Auto-populated based on board affiliation
      defaultValue: [],
   },

   examination_system: DataTypes.STRING(50), // Auto-populated
   curriculum_framework: DataTypes.STRING(50), // Auto-populated
   assessment_pattern: DataTypes.STRING(50), // Auto-populated
});

// METHOD: Auto-populate compliance requirements based on board
SchoolProfile.prototype.setComplianceRequirements = function () {
   const compliance = BOARD_COMPLIANCE_MATRIX[this.primary_board];

   if (compliance) {
      this.applicable_laws = compliance.mandatory_requirements;
      this.required_student_ids = compliance.student_ids_required;
      this.mandatory_reporting = compliance.reporting;
      this.examination_system = compliance.examination_system;
      this.curriculum_framework = compliance.curriculum;
      this.assessment_pattern = compliance.assessment;
   }

   // Add common Indian requirements if Indian board
   if (['CBSE', 'ICSE', 'STATE_BOARD'].includes(this.primary_board)) {
      this.applicable_laws.push('RTE_ACT_2009', 'POCSO_ACT', 'CHILD_LABOUR_PROHIBITION');
      this.required_student_ids.push('AADHAAR', 'UDISE_STUDENT_ID');
      this.mandatory_reporting.push('UDISE_PLUS');
   }
};

// HOOK: Auto-set compliance on save
SchoolProfile.addHook('beforeSave', (school) => {
   school.setComplianceRequirements();
});
```

### **Board-Specific Compliance Models**

#### **CBSE Compliance Data**

```javascript
const CBSECompliance = sequelize.define('CBSECompliance', {
   school_id: DataTypes.UUID,
   cbse_affiliation_number: DataTypes.STRING(5),
   affiliation_status: DataTypes.ENUM('PROVISIONAL', 'REGULAR', 'UPGRADATION'),
   affiliation_validity: DataTypes.DATE,
   recognition_classes: DataTypes.STRING(20),
   three_language_compliance: DataTypes.BOOLEAN,
   cce_implementation: DataTypes.BOOLEAN,
   student_teacher_ratio: DataTypes.DECIMAL(5, 2),
   infrastructure_compliance: DataTypes.BOOLEAN,
   safety_certificate: DataTypes.BOOLEAN,
   fire_safety_certificate: DataTypes.BOOLEAN,
   building_safety_certificate: DataTypes.BOOLEAN,
   last_inspection_date: DataTypes.DATE,
   next_inspection_due: DataTypes.DATE,
});
```

#### **ICSE/CISCE Compliance Data**

```javascript
const CISCECompliance = sequelize.define('CISCECompliance', {
   school_id: DataTypes.UUID,
   cisce_registration_number: DataTypes.STRING(10),
   icse_recognition: DataTypes.BOOLEAN,
   isc_recognition: DataTypes.BOOLEAN,
   curriculum_compliance: DataTypes.BOOLEAN,
   practical_facilities: DataTypes.BOOLEAN,
   library_requirements: DataTypes.BOOLEAN,
   teacher_qualification_compliance: DataTypes.BOOLEAN,
   internal_assessment_system: DataTypes.BOOLEAN,
   project_work_system: DataTypes.BOOLEAN,
});
```

#### **State Board Compliance Data**

```javascript
const StateBoardCompliance = sequelize.define('StateBoardCompliance', {
   school_id: DataTypes.UUID,
   state_board_registration: DataTypes.STRING(15),
   state_recognition_number: DataTypes.STRING(20),
   rte_compliance: DataTypes.BOOLEAN,
   reservation_policy_implementation: DataTypes.BOOLEAN,
   mid_day_meal_scheme: DataTypes.BOOLEAN,
   free_uniform_books: DataTypes.BOOLEAN,
   local_language_instruction: DataTypes.BOOLEAN,
   minority_status: DataTypes.BOOLEAN,
   tribal_area_benefits: DataTypes.BOOLEAN,
});
```

#### **International Board Compliance Data**

```javascript
const InternationalBoardCompliance = sequelize.define('InternationalBoardCompliance', {
   school_id: DataTypes.UUID,
   international_accreditation: DataTypes.STRING(50),
   foreign_education_provider_status: DataTypes.BOOLEAN,
   international_curriculum_license: DataTypes.STRING(20),
   qualified_international_teachers: DataTypes.INTEGER,
   english_proficiency_requirements: DataTypes.BOOLEAN,
   cultural_exchange_programs: DataTypes.BOOLEAN,
   international_assessment_system: DataTypes.BOOLEAN,
   overseas_university_partnerships: DataTypes.INTEGER,
});
```

---

cisce_uid: DataTypes.STRING(15), // Student CISCE UID
icse_affiliation: DataTypes.BOOLEAN, // ICSE Classes VI-X
isc_affiliation: DataTypes.BOOLEAN, // ISC Classes XI-XII
practical_facilities: DataTypes.JSON, // Lab, equipment details
project_tracking: DataTypes.BOOLEAN,
internal_assessment_system: DataTypes.BOOLEAN
}

````

### **STATE BOARDS**

#### **State Board Specific Requirements**
- **Maharashtra State Board**: SSC (Class X), HSC (Classes XI-XII)
- **Regional Language**: Mandatory local language
- **Vocational Streams**: Technical, agricultural, commercial
- **State UID**: State-specific student identifier
- **Local Compliance**: District education office registration

### **INTERNATIONAL BOARDS**

#### **IB (International Baccalaureate)**
- **Authorization**: IB World School authorization number
- **Programs**: PYP (Primary), MYP (Middle), DP (Diploma)
- **Assessment**: Internal assessment + external moderation
- **Languages**: Multilingual program structure
- **International Mindedness**: Global citizenship focus
- **CAS Requirements**: Creativity, Activity, Service tracking

#### **Cambridge International**
- **Registration**: Cambridge School Number
- **Programs**: Cambridge Primary, Lower Secondary, IGCSE, AS/A Levels
- **Assessment**: Cambridge examinations, coursework
- **Languages**: English medium with ESL support
- **International Curriculum**: Global perspective integration

#### **Other International Systems**
- **American Curriculum**: AP courses, SAT preparation
- **French Curriculum**: CNED, French Baccalaureate
- **German Curriculum**: Deutsche Schule certification
- **IB Continuum**: Full IB program implementation

#### **International Compliance Data**
```javascript
international_compliance: {
  board_type: DataTypes.ENUM('IB', 'CAMBRIDGE', 'AMERICAN', 'FRENCH', 'GERMAN', 'OTHER'),
  authorization_number: DataTypes.STRING(20),
  authorization_validity: DataTypes.DATE,
  program_levels: DataTypes.JSON,              // PYP, MYP, DP etc.
  assessment_system: DataTypes.STRING(50),
  language_policy: DataTypes.TEXT,
  accreditation_bodies: DataTypes.JSON,        // Additional accreditations
  international_transfers: DataTypes.BOOLEAN,  // Supports international transfers
  global_curriculum: DataTypes.BOOLEAN
}
````

---

## 🏛️ **GOVERNMENT IDENTIFICATION SYSTEMS**

### **NATIONAL LEVEL SYSTEMS**

#### **1. UDISE+ (Unified District Information System for Education Plus)**

- **Purpose**: National database for all schools and students
- **Student ID Format**: 11-digit UDISE School Code + Student Sequence Number
- **School Code Structure**: State(2) + District(2) + Block(3) + Cluster(2) + School(2) = 11 digits
- **Student ID Structure**: UDISE School Code (11) + Student Sequence (4-6 digits)
- **Example**: 27010100101001 (Maharashtra school code + student sequence)
- **Total Length**: 15-17 characters
- **Mandatory For**: All government, aided, and unaided schools
- **Data Collection**: Annual school census, student enrollment, learning outcomes
- **API Integration**: Available through DoE UDISE+ portal and Samagra Shiksha
- **Academic Year Integration**: Student IDs linked to academic year and class progression

#### **2. PEN (Permanent Education Number)**

- **Purpose**: Unique lifelong education identifier for each student
- **Format**: 12-15 digit alphanumeric code
- **Coverage**: Pre-primary to higher education
- **Benefits**: Track educational journey across states and institutions
- **Implementation Status**: Being rolled out nationally

#### **3. Aadhaar Integration**

- **Purpose**: Primary identity proof for all citizens
- **Format**: 12-digit unique identification number
- **School Usage**: Mandatory for government schemes, scholarships, midday meals
- **Validation**: Real-time verification through UIDAI API
- **Privacy**: Masked display, secure storage required

### **STATE LEVEL SYSTEMS**

#### **4. SARAL ID (Maharashtra)**

- **Full Form**: Student Academic Records and Learning ID
- **Purpose**: Maharashtra state student tracking system
- **Coverage**: All schools (government, aided, private)
- **Integration**: Links with UDISE+ data
- **Features**: Academic progression tracking, scholarship management

#### **5. EMIS (Education Management Information System)**

- **Purpose**: State-wise education data management
- **Coverage**: Varies by state (Gujarat EMIS, Karnataka SATS, etc.)
- **Function**: School performance, student achievement tracking
- **Data Points**: Attendance, learning outcomes, infrastructure

### **BOARD SPECIFIC SYSTEMS**

#### **6. CBSE Student UID**

- **Purpose**: Central Board students identification
- **Format**: Unique 15-digit code
- **Usage**: Board examinations, result processing, migration
- **Coverage**: Classes IX-XII

#### **7. CISCE UID (ICSE/ISC)**

- **Purpose**: Council for Indian School Certificate Examinations
- **Coverage**: ICSE (Class X), ISC (Class XII)
- **Features**: Student registration, examination management

### **SCHEME SPECIFIC IDS**

#### **8. PM SHRI School ID**

- **Purpose**: Pradhan Mantri Schools for Rising India identification
- **Coverage**: Selected exemplar schools
- **Benefits**: Special funding, resource allocation

#### **9. RTE Beneficiary ID**

- **Purpose**: Right to Education Act beneficiary tracking
- **Coverage**: 25% quota students in private schools
- **Features**: Fee reimbursement, monitoring compliance

#### **10. CWSN ID (Children with Special Needs)**

- **Purpose**: Inclusive education support tracking
- **Coverage**: Students with disabilities
- **Benefits**: Special provisions, assistive devices, scholarships

---

## 📋 **UDISE+ COMPLIANCE DATA MODEL**

### **UDISE School Model (Required for Government Reporting)**

```javascript
// models/UDISESchool.js - Comprehensive government mandated school data
const UDISESchool = sequelize.define('UDISESchool', {
   udise_code: {
      type: DataTypes.STRING(11),
      primaryKey: true,
      validate: { len: [11, 11], isNumeric: true },
   },

   // BASIC SCHOOL IDENTIFICATION
   school_name: DataTypes.STRING(200),
   school_name_local: DataTypes.STRING(200), // Regional language name
   school_category: DataTypes.ENUM(
      'PRIMARY_ONLY',
      'PRIMARY_WITH_UPPER_PRIMARY',
      'PRIMARY_WITH_UPPER_PRIMARY_SEC',
      'PRIMARY_WITH_UPPER_PRIMARY_HSEC',
      'UPPER_PRIMARY_ONLY',
      'UPPER_PRIMARY_WITH_SEC',
      'UPPER_PRIMARY_WITH_HSEC',
      'SECONDARY_ONLY',
      'SECONDARY_WITH_HSEC',
      'HIGHER_SECONDARY_ONLY'
   ),

   // SCHOOL MANAGEMENT & TYPE
   school_management: DataTypes.ENUM('GOVERNMENT', 'LOCAL_BODY', 'GOVERNMENT_AIDED', 'PRIVATE_UNAIDED', 'OTHERS'),
   school_management_details: DataTypes.ENUM(
      'DEPARTMENT_OF_EDUCATION',
      'TRIBAL_WELFARE',
      'SOCIAL_WELFARE',
      'MUNICIPALITY',
      'PRIVATE_AIDED',
      'PRIVATE_UNAIDED'
   ),
   school_type: DataTypes.ENUM('BOYS_ONLY', 'GIRLS_ONLY', 'CO_EDUCATIONAL'),

   // DETAILED LOCATION DATA (UDISE+ Mandatory)
   state_code: DataTypes.STRING(2),
   district_code: DataTypes.STRING(2),
   block_code: DataTypes.STRING(3),
   cluster_code: DataTypes.STRING(2),
   village_code: DataTypes.STRING(6),
   pincode: DataTypes.STRING(6),
   assembly_constituency: DataTypes.STRING(3),
   parliament_constituency: DataTypes.STRING(2),

   // ADDRESS DETAILS
   address_line1: DataTypes.STRING(200),
   address_line2: DataTypes.STRING(200),
   landmark: DataTypes.STRING(100),
   habitation_name: DataTypes.STRING(100),

   // ESTABLISHMENT & RECOGNITION
   year_of_establishment: DataTypes.INTEGER,
   year_of_primary_recognition: DataTypes.INTEGER,
   year_of_upper_primary_recognition: DataTypes.INTEGER,
   year_of_secondary_recognition: DataTypes.INTEGER,
   year_of_hsec_recognition: DataTypes.INTEGER,
   recognition_status: DataTypes.ENUM('RECOGNIZED', 'PARTIALLY_RECOGNIZED', 'UNRECOGNIZED'),

   // BOARD AFFILIATION & CURRICULUM
   board_affiliation: DataTypes.ENUM('CBSE', 'ICSE', 'IB', 'NIOS', 'STATE_BOARD', 'OTHERS'),
   affiliation_number: DataTypes.STRING(20),
   curriculum_type: DataTypes.ENUM('STATE', 'CBSE', 'ICSE', 'IB', 'NIOS', 'OTHERS'),

   // SCHOOL FACILITIES (UDISE+ Infrastructure Data)
   building_status: DataTypes.ENUM('GOVERNMENT', 'RENTED', 'RENT_FREE', 'OTHERS'),
   building_condition: DataTypes.ENUM('GOOD', 'MINOR_REPAIR', 'MAJOR_REPAIR'),
   total_classrooms: DataTypes.INTEGER,
   classrooms_in_good_condition: DataTypes.INTEGER,

   // BASIC FACILITIES
   electricity_available: DataTypes.BOOLEAN,
   drinking_water_available: DataTypes.BOOLEAN,
   playground_available: DataTypes.BOOLEAN,
   library_available: DataTypes.BOOLEAN,
   computer_lab_available: DataTypes.BOOLEAN,
   internet_facility: DataTypes.BOOLEAN,

   // TOILET FACILITIES
   boys_toilet_available: DataTypes.BOOLEAN,
   girls_toilet_available: DataTypes.BOOLEAN,
   cwsn_toilet_available: DataTypes.BOOLEAN, // Children with Special Needs

   // KITCHEN & NUTRITION
   kitchen_garden: DataTypes.BOOLEAN,
   mid_day_meal_facility: DataTypes.BOOLEAN,
   cooking_facility: DataTypes.BOOLEAN,

   // SAFETY & SECURITY
   boundary_wall: DataTypes.BOOLEAN,
   ramps_available: DataTypes.BOOLEAN, // For disabled access
   hand_rails: DataTypes.BOOLEAN,

   // DIGITAL INFRASTRUCTURE
   ict_lab_available: DataTypes.BOOLEAN,
   number_of_computers: DataTypes.INTEGER,
   computers_for_teaching: DataTypes.INTEGER,
   computers_for_non_teaching: DataTypes.INTEGER,

   // DISTANCE & CONNECTIVITY
   distance_from_brc: DataTypes.DECIMAL(5, 2), // Block Resource Centre
   distance_from_crc: DataTypes.DECIMAL(5, 2), // Cluster Resource Centre
   approach_road: DataTypes.ENUM('ALL_WEATHER', 'FAIR_WEATHER', 'FOOT_PATH', 'OTHERS'),

   // SHIFTS & WORKING HOURS
   school_shifts: DataTypes.ENUM('MORNING', 'AFTERNOON', 'BOTH'),
   pre_primary_sections: DataTypes.INTEGER,
   working_hours_per_day: DataTypes.DECIMAL(3, 1),
   working_days_per_week: DataTypes.INTEGER,

   // SPECIAL PROVISIONS
   residential_school: DataTypes.BOOLEAN,
   residential_type: DataTypes.ENUM('BOYS', 'GIRLS', 'BOTH', 'NA'),
   hostel_facility: DataTypes.BOOLEAN,

   // MINORITY STATUS
   minority_status: DataTypes.ENUM('MUSLIM', 'CHRISTIAN', 'SIKH', 'BUDDHIST', 'PARSI', 'JAIN', 'OTHERS', 'NO'),

   // MEDIUM OF INSTRUCTION
   medium_of_instruction_1: DataTypes.STRING(50),
   medium_of_instruction_2: DataTypes.STRING(50),
   medium_of_instruction_3: DataTypes.STRING(50),

   // UDISE+ COMPLIANCE & REPORTING
   academic_year: DataTypes.STRING(9), // Format: 2024-2025
   last_udise_submission: DataTypes.DATE,
   udise_status: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION', 'CLOSED'),
   data_capture_format: DataTypes.ENUM('ONLINE', 'OFFLINE'),
   mobile_number: DataTypes.STRING(10),
   email_id: DataTypes.STRING(100),
   website: DataTypes.STRING(200),

   // SCHOOL HEAD INFORMATION
   head_master_name: DataTypes.STRING(100),
   head_master_mobile: DataTypes.STRING(10),
   head_master_email: DataTypes.STRING(100),
   head_master_gender: DataTypes.ENUM('MALE', 'FEMALE', 'TRANSGENDER'),

   // SPECIAL CATEGORIES
   model_school: DataTypes.BOOLEAN,
   integrated_scheme: DataTypes.BOOLEAN,
   shift_school: DataTypes.BOOLEAN,
   residential_school_type: DataTypes.ENUM('ASHRAM', 'NON_ASHRAM', 'NA'),

   // CREATED/UPDATED TRACKING
   created_at: DataTypes.DATE,
   updated_at: DataTypes.DATE,
   last_verified_by: DataTypes.UUID,
});
```

### **UDISE Class-wise Infrastructure Model**

```javascript
// models/UDISEClassInfrastructure.js - Class-wise data required for UDISE+
const UDISEClassInfrastructure = sequelize.define('UDISEClassInfrastructure', {
   udise_school_code: {
      type: DataTypes.STRING(11),
      references: { model: 'UDISESchool', key: 'udise_code' },
   },
   academic_year: DataTypes.STRING(9),
   class_name: DataTypes.ENUM('PRE_PRIMARY', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'),

   // ENROLLMENT DATA
   total_enrollment: DataTypes.INTEGER,
   boys_enrollment: DataTypes.INTEGER,
   girls_enrollment: DataTypes.INTEGER,

   // CATEGORY-WISE ENROLLMENT
   sc_boys: DataTypes.INTEGER,
   sc_girls: DataTypes.INTEGER,
   st_boys: DataTypes.INTEGER,
   st_girls: DataTypes.INTEGER,
   obc_boys: DataTypes.INTEGER,
   obc_girls: DataTypes.INTEGER,

   // SPECIAL CATEGORIES
   muslim_boys: DataTypes.INTEGER,
   muslim_girls: DataTypes.INTEGER,
   cwsn_boys: DataTypes.INTEGER,
   cwsn_girls: DataTypes.INTEGER,

   // MEDIUM OF INSTRUCTION
   hindi_medium: DataTypes.INTEGER,
   english_medium: DataTypes.INTEGER,
   regional_medium: DataTypes.INTEGER,
   other_medium: DataTypes.INTEGER,
});
```

### **UDISE Teacher Information Model**

```javascript
// models/UDISETeacher.js - Teacher data for UDISE+ compliance
const UDISETeacher = sequelize.define('UDISETeacher', {
   udise_school_code: {
      type: DataTypes.STRING(11),
      references: { model: 'UDISESchool', key: 'udise_code' },
   },

   // TEACHER IDENTIFICATION
   teacher_code: DataTypes.STRING(20),
   teacher_name: DataTypes.STRING(100),
   gender: DataTypes.ENUM('MALE', 'FEMALE', 'TRANSGENDER'),
   date_of_birth: DataTypes.DATEONLY,
   social_category: DataTypes.ENUM('GENERAL', 'SC', 'ST', 'OBC'),

   // PROFESSIONAL DETAILS
   appointment_type: DataTypes.ENUM('REGULAR', 'CONTRACT', 'PART_TIME', 'GUEST'),
   teaching_role: DataTypes.ENUM('HEAD_TEACHER', 'ASSISTANT_TEACHER', 'PRT', 'TGT', 'PGT'),
   subjects_taught: DataTypes.STRING(200),
   classes_taught: DataTypes.STRING(50),

   // QUALIFICATION
   professional_qualification: DataTypes.STRING(100),
   academic_qualification: DataTypes.STRING(100),

   // SERVICE DETAILS
   date_of_joining_service: DataTypes.DATEONLY,
   date_of_joining_school: DataTypes.DATEONLY,
   in_position: DataTypes.BOOLEAN,

   // TRAINING DATA
   received_training: DataTypes.BOOLEAN,
   training_type: DataTypes.STRING(200),
   training_days_current_year: DataTypes.INTEGER,
});
```

### **UDISE Student Data Requirements**

```javascript
// Additional fields required for UDISE+ compliance in Student model
const UDISEStudentData = {
   // ENROLLMENT DATA
   admission_date: DataTypes.DATEONLY,
   academic_year: DataTypes.STRING(9),
   class_at_admission: DataTypes.STRING(5),
   current_class: DataTypes.STRING(5),

   // DEMOGRAPHIC DATA (UDISE+ Required)
   social_category: DataTypes.ENUM('GENERAL', 'SC', 'ST', 'OBC'),
   religion: DataTypes.ENUM('HINDU', 'MUSLIM', 'CHRISTIAN', 'SIKH', 'BUDDHIST', 'JAIN', 'OTHERS'),
   mother_tongue: DataTypes.STRING(50),
   is_cwsn: DataTypes.BOOLEAN, // Children with Special Needs
   disability_type: DataTypes.ENUM('VISUAL', 'HEARING', 'SPEECH', 'LOCOMOTOR', 'INTELLECTUAL', 'MULTIPLE'),

   // ATTENDANCE DATA (UDISE+ Reporting)
   total_working_days: DataTypes.INTEGER,
   days_present: DataTypes.INTEGER,
   attendance_percentage: DataTypes.DECIMAL(5, 2),

   // LEARNING OUTCOMES (NEP 2020 & UDISE+)
   competency_level: DataTypes.ENUM('BELOW_BASIC', 'BASIC', 'PROFICIENT', 'ADVANCED'),
   grade_status: DataTypes.ENUM('PROMOTED', 'DETAINED', 'PASS', 'FAIL', 'COMPARTMENT'),

   // GOVERNMENT SCHEMES
   midday_meal_recipient: DataTypes.BOOLEAN,
   textbook_recipient: DataTypes.BOOLEAN,
   uniform_recipient: DataTypes.BOOLEAN,
   scholarship_recipient: DataTypes.BOOLEAN,
   transport_facility: DataTypes.BOOLEAN,

   // UDISE+ TRACKING
   udise_verification_status: DataTypes.ENUM('VERIFIED', 'PENDING', 'REJECTED'),
   last_udise_update: DataTypes.DATE,
};
```

---

## 📋 **ENHANCED STUDENT MODEL WITH BOARD-SPECIFIC VALIDATION**

### **Dynamic Student Model Based on School's Board Affiliation**

```javascript
// models/Student.js - Board-aware student model
const Student = sequelize.define('Student', {
   // BASIC STUDENT INFORMATION
   student_id: DataTypes.UUID,
   first_name: DataTypes.STRING(50),
   last_name: DataTypes.STRING(50),
   date_of_birth: DataTypes.DATEONLY,

   // BOARD-SPECIFIC VALIDATION (Auto-determined by school's board)
   school_board: {
      type: DataTypes.ENUM(
         'CBSE',
         'ICSE',
         'STATE_BOARD',
         'IB_INTERNATIONAL',
         'CAMBRIDGE_INTERNATIONAL',
         'WALDORF_STEINER',
         'MONTESSORI'
      ),
      allowNull: false,
   },

   // DYNAMIC GOVERNMENT IDs (Required based on board)
   government_ids: {
      type: DataTypes.JSON,
      defaultValue: {},
      // Structure varies by board:
      // CBSE/ICSE/STATE: {aadhaar, udise_student_id, cbse_uid/cisce_uid, saral_id}
      // INTERNATIONAL: {passport, visa_status, aadhaar_if_indian, international_id}
   },

   // BOARD-SPECIFIC ACADEMIC FIELDS
   academic_data: {
      type: DataTypes.JSON,
      defaultValue: {},
      // Structure varies by board:
      // CBSE: {cce_grades, co_scholastic_areas, three_language_subjects}
      // ICSE: {internal_assessment, practical_marks, project_work}
      // IB: {cas_hours, extended_essay, theory_of_knowledge}
      // STATE: {local_language_proficiency, state_specific_subjects}
   },

   // ASSESSMENT PATTERN (Based on board)
   assessment_pattern: DataTypes.STRING(50), // Auto-populated from school board

   // EXAMINATION SYSTEM (Based on board)
   examination_system: DataTypes.STRING(50), // Auto-populated from school board

   // COMPLIANCE FLAGS (Auto-validated based on board requirements)
   compliance_status: {
      type: DataTypes.JSON,
      defaultValue: {
         ids_verified: false,
         board_requirements_met: false,
         government_compliance: false,
         age_verification: false,
      },
   },
});

// METHOD: Auto-populate board-specific requirements
Student.prototype.setBoardRequirements = async function () {
   const school = await SchoolProfile.findByPk(this.school_id);
   const boardCompliance = BOARD_COMPLIANCE_MATRIX[school.primary_board];

   this.school_board = school.primary_board;
   this.assessment_pattern = boardCompliance.assessment;
   this.examination_system = boardCompliance.examination_system;

   // Initialize required government IDs based on board
   const requiredIds = {};
   boardCompliance.student_ids_required.forEach((idType) => {
      requiredIds[idType.toLowerCase()] = null;
   });
   this.government_ids = requiredIds;
};

// VALIDATION: Board-specific validation
Student.addHook('beforeValidate', async (student) => {
   await student.setBoardRequirements();

   // Validate required IDs based on board
   const school = await SchoolProfile.findByPk(student.school_id);
   const requiredIds = BOARD_COMPLIANCE_MATRIX[school.primary_board].student_ids_required;

   requiredIds.forEach((idType) => {
      if (!student.government_ids[idType.toLowerCase()]) {
         throw new Error(`${idType} is required for ${school.primary_board} students`);
      }
   });
});
```

### **Board-Specific Student Data Models**

#### **CBSE Student Specific Data**

```javascript
const CBSEStudentData = sequelize.define('CBSEStudentData', {
   student_id: DataTypes.UUID,
   cbse_student_uid: DataTypes.STRING(15),
   cce_grade_system: DataTypes.BOOLEAN,
   three_language_subjects: DataTypes.JSON,
   co_scholastic_areas: DataTypes.JSON, // Sports, Arts, Values
   continuous_assessment: DataTypes.JSON,
   board_exam_eligibility: DataTypes.BOOLEAN,
   migration_certificate: DataTypes.STRING(20),
   transfer_certificate: DataTypes.STRING(20),
});
```

#### **ICSE Student Specific Data**

```javascript
const ICSEStudentData = sequelize.define('ICSEStudentData', {
   student_id: DataTypes.UUID,
   cisce_student_uid: DataTypes.STRING(15),
   internal_assessment_marks: DataTypes.JSON,
   practical_examination_marks: DataTypes.JSON,
   project_work_marks: DataTypes.JSON,
   board_examination_subjects: DataTypes.JSON,
   language_combinations: DataTypes.JSON,
   icse_registration_number: DataTypes.STRING(15),
   isc_registration_number: DataTypes.STRING(15),
});
```

#### **International Student Specific Data**

```javascript
const InternationalStudentData = sequelize.define('InternationalStudentData', {
   student_id: DataTypes.UUID,
   passport_number: DataTypes.STRING(20),
   visa_status: DataTypes.ENUM('STUDENT_VISA', 'DEPENDENT_VISA', 'INDIAN_CITIZEN', 'OCI', 'PIO'),
   nationality: DataTypes.STRING(50),
   home_country_curriculum: DataTypes.STRING(50),
   english_proficiency_level: DataTypes.ENUM('NATIVE', 'ADVANCED', 'INTERMEDIATE', 'BEGINNER'),
   previous_international_schools: DataTypes.JSON,
   university_counseling_status: DataTypes.BOOLEAN,
   international_exam_registrations: DataTypes.JSON, // SAT, AP, IB exams
});
```

#### **State Board Student Specific Data**

```javascript
const StateBoardStudentData = sequelize.define('StateBoardStudentData', {
   student_id: DataTypes.UUID,
   state_board_roll_number: DataTypes.STRING(15),
   local_language_proficiency: DataTypes.ENUM('EXCELLENT', 'GOOD', 'FAIR', 'NEEDS_IMPROVEMENT'),
   regional_cultural_activities: DataTypes.JSON,
   state_scholarship_eligible: DataTypes.BOOLEAN,
   rural_urban_classification: DataTypes.ENUM('RURAL', 'URBAN', 'SEMI_URBAN'),
   mother_tongue: DataTypes.STRING(50),
   caste_certificate_number: DataTypes.STRING(20),
   income_certificate_number: DataTypes.STRING(20),
});
```

### **Validation Rules by Board Type**

```javascript
// Board-specific validation rules
const BOARD_VALIDATION_RULES = {
   CBSE: {
      required_ids: ['aadhaar_number', 'udise_student_id', 'cbse_uid'],
      age_criteria: { nursery: { min: 3, max: 4 }, class_1: { min: 5, max: 7 } },
      language_requirements: ['hindi', 'english', 'third_language'],
      assessment_type: 'CCE',
   },

   ICSE: {
      required_ids: ['aadhaar_number', 'udise_student_id', 'cisce_uid'],
      age_criteria: { nursery: { min: 3, max: 4 }, class_1: { min: 5, max: 7 } },
      language_requirements: ['english', 'second_language'],
      assessment_type: 'INTERNAL_EXTERNAL',
   },

   IB_INTERNATIONAL: {
      required_ids: ['passport_number', 'visa_status'],
      age_criteria: { pyp1: { min: 3, max: 4 }, pyp2: { min: 4, max: 5 } },
      language_requirements: ['english', 'mother_tongue', 'additional_language'],
      assessment_type: 'HOLISTIC',
   },

   STATE_BOARD: {
      required_ids: ['aadhaar_number', 'udise_student_id', 'state_uid', 'saral_id'],
      age_criteria: { nursery: { min: 3, max: 4 }, class_1: { min: 5, max: 7 } },
      language_requirements: ['regional_language', 'hindi', 'english'],
      assessment_type: 'STATE_PATTERN',
   },
};
```

---

#### **Indian Education Specific Fields**

```javascript
// Add to Student model
education_details: {
  admission_type: DataTypes.ENUM('FRESH', 'READMISSION', 'TRANSFER', 'MID_TERM'),
  admission_category: DataTypes.ENUM('GENERAL', 'SC', 'ST', 'OBC', 'EWS', 'NT-A', 'NT-B', 'NT-C', 'NT-D', 'SBC', 'VJNT'),
  quota_type: DataTypes.ENUM('GENERAL', 'RTE', 'MANAGEMENT', 'NRI', 'SPORTS', 'STAFF_WARD'),
  medium_of_instruction: DataTypes.ENUM('ENGLISH', 'HINDI', 'MARATHI', 'REGIONAL'),
  first_language: DataTypes.STRING(50),
  second_language: DataTypes.STRING(50),
  third_language: DataTypes.STRING(50),
  stream: DataTypes.ENUM('SCIENCE', 'COMMERCE', 'ARTS', 'VOCATIONAL'), // For Classes XI-XII
  board_affiliation: DataTypes.ENUM('CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE')
}
```

#### **NEP 2020 Compliance Fields**

```javascript
// Add to Student model
nep_compliance: {
  foundational_stage_completion: DataTypes.BOOLEAN,
  preparatory_stage_completion: DataTypes.BOOLEAN,
  mother_tongue_education: DataTypes.BOOLEAN,
  holistic_report_card: DataTypes.JSON,        // NEP progress card
  skill_based_assessment: DataTypes.JSON,      // Practical skills
  vocational_exposure: DataTypes.TEXT,         // Vocational education
  art_education_integration: DataTypes.TEXT,   // Art integrated learning
  sports_physical_education: DataTypes.TEXT    // Physical education
}
```

---

## 🎯 **ADMISSION WORKFLOW FOR INDIAN SCHOOLS**

### **Stage 1: ENQUIRY & LEAD GENERATION**

```javascript
const enquiryCategories = {
   source: ['WALK_IN', 'WEBSITE', 'REFERENCE', 'ADVERTISEMENT', 'SOCIAL_MEDIA'],
   admission_seeking_for: ['NURSERY', 'LKG', 'UKG', 'CLASS_I', 'CLASS_VI', 'CLASS_IX', 'CLASS_XI'],
   enquiry_type: ['FRESH_ADMISSION', 'TRANSFER', 'READMISSION'],
   priority_level: ['HIGH', 'MEDIUM', 'LOW'],
   follow_up_status: ['PENDING', 'IN_PROGRESS', 'CONVERTED', 'DROPPED'],
};
```

### **Stage 2: APPLICATION & DOCUMENTATION**

```javascript
const requiredDocuments = {
   mandatory: [
      'BIRTH_CERTIFICATE',
      'AADHAAR_CARD',
      'PREVIOUS_SCHOOL_TC', // Transfer Certificate
      'PREVIOUS_SCHOOL_REPORT', // Progress Report
      'PARENT_AADHAAR',
      'ADDRESS_PROOF',
      'INCOME_CERTIFICATE', // For fee concessions
   ],
   conditional: [
      'CASTE_CERTIFICATE', // For reservation categories
      'EWS_CERTIFICATE', // For RTE quota
      'MEDICAL_CERTIFICATE', // For special needs
      'SARAL_ID_DOCUMENT', // Maharashtra specific
      'MIGRATION_CERTIFICATE', // For other state students
   ],
};
```

### **Stage 3: ASSESSMENT & COUNSELING**

```javascript
const assessmentCriteria = {
   nursery_to_ukg: {
      type: 'INTERACTION_BASED',
      duration: '15-20 minutes',
      focus: ['SOCIAL_SKILLS', 'BASIC_COMMUNICATION', 'MOTOR_SKILLS'],
   },
   class_i_to_v: {
      type: 'BASIC_ASSESSMENT',
      duration: '30 minutes',
      focus: ['READING', 'WRITING', 'BASIC_MATH', 'GENERAL_AWARENESS'],
   },
   class_vi_to_viii: {
      type: 'WRITTEN_TEST',
      duration: '1 hour',
      subjects: ['MATHEMATICS', 'ENGLISH', 'SCIENCE', 'REGIONAL_LANGUAGE'],
   },
   class_ix_to_x: {
      type: 'ENTRANCE_EXAM',
      duration: '2 hours',
      subjects: ['MATH', 'SCIENCE', 'ENGLISH', 'SOCIAL_STUDIES'],
   },
   class_xi: {
      type: 'MERIT_BASED',
      criteria: 'CLASS_X_MARKS',
      minimum_percentage: { science: 75, commerce: 60, arts: 50 },
   },
};
```

### **Stage 4: CONFIRMATION & ENROLLMENT**

```javascript
const confirmationRequirements = {
   fee_payment: {
      admission_fee: 'MANDATORY',
      security_deposit: 'REFUNDABLE',
      first_term_fee: 'ADVANCE',
   },
   document_verification: {
      original_verification: 'MANDATORY',
      saral_id_registration: 'MAHARASHTRA_MANDATORY',
      aadhaar_verification: 'GOVERNMENT_MANDATORY',
   },
   final_enrollment: {
      student_id_generation: 'AUTO',
      class_section_allocation: 'BASED_ON_AVAILABILITY',
      uniform_measurement: 'OPTIONAL',
      transport_registration: 'OPTIONAL',
   },
};
```

---

## 💰 **INDIAN FEE STRUCTURE SYSTEM**

### **Multi-Tier Fee Structure**

```javascript
const indianFeeStructure = {
   trust_level_fees: {
      admission_fee: 'ONE_TIME',
      development_fee: 'ANNUAL',
      infrastructure_fee: 'ANNUAL',
      security_deposit: 'REFUNDABLE',
   },
   school_level_fees: {
      tuition_fee: 'MONTHLY/QUARTERLY/ANNUAL',
      examination_fee: 'TERM_WISE',
      laboratory_fee: 'ANNUAL',
      library_fee: 'ANNUAL',
      sports_fee: 'ANNUAL',
      activity_fee: 'ANNUAL',
   },
   optional_fees: {
      transport_fee: 'ROUTE_WISE_MONTHLY',
      hostel_fee: 'MONTHLY',
      meal_fee: 'MONTHLY',
      uniform_fee: 'AS_REQUIRED',
   },
};
```

### **Government Scheme Integration**

```javascript
const governmentSchemes = {
   rte_benefits: {
      fee_reimbursement: '100%',
      uniform_allowance: 'ANNUAL',
      textbook_allowance: 'ANNUAL',
      applicable_classes: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'],
   },
   scholarship_schemes: {
      pre_matric: 'SC/ST/OBC/MINORITY',
      post_matric: 'SC/ST/OBC/MINORITY',
      merit_scholarship: 'TOP_PERFORMERS',
      girl_child_scholarship: 'GENDER_BASED',
   },
   state_specific: {
      maharashtra: {
         rajarshi_shahu_scholarship: 'OBC',
         dr_babasaheb_ambedkar_scholarship: 'SC',
         tribal_scholarship: 'ST',
      },
   },
};
```

---

## 📊 **DATABASE SCHEMA FOR INDIAN SCHOOLS**

### **Enhanced Models Required**

#### **AdmissionEnquiry Model**

```javascript
const AdmissionEnquiry = sequelize.define('AdmissionEnquiry', {
   enquiry_number: DataTypes.STRING,
   source: DataTypes.ENUM(['WALK_IN', 'WEBSITE', 'REFERENCE', 'ADVERTISEMENT']),
   admission_for_class: DataTypes.STRING,
   admission_type: DataTypes.ENUM(['FRESH', 'TRANSFER', 'READMISSION']),
   student_name: DataTypes.STRING,
   parent_name: DataTypes.STRING,
   contact_number: DataTypes.STRING,
   follow_up_date: DataTypes.DATE,
   status: DataTypes.ENUM(['PENDING', 'IN_PROGRESS', 'CONVERTED', 'DROPPED']),
});
```

#### **GovernmentCompliance Model**

```javascript
const GovernmentCompliance = sequelize.define('GovernmentCompliance', {
   student_id: DataTypes.INTEGER,
   aadhaar_number: DataTypes.STRING(12),
   saral_id: DataTypes.STRING(20),
   cbse_uid: DataTypes.STRING(15),
   rte_beneficiary: DataTypes.BOOLEAN,
   scholarship_details: DataTypes.JSON,
   verification_status: DataTypes.ENUM(['PENDING', 'VERIFIED', 'REJECTED']),
});
```

#### **IndianFeeStructure Model**

```javascript
const IndianFeeStructure = sequelize.define('IndianFeeStructure', {
   class_id: DataTypes.INTEGER,
   category: DataTypes.ENUM(['GENERAL', 'SC', 'ST', 'OBC', 'EWS']),
   quota_type: DataTypes.ENUM(['GENERAL', 'RTE', 'MANAGEMENT']),
   trust_fees: DataTypes.JSON,
   school_fees: DataTypes.JSON,
   government_reimbursement: DataTypes.JSON,
   applicable_schemes: DataTypes.JSON,
});
```

---

## 🚀 **IMPLEMENTATION PRIORITY FOR EVENING SESSION**

### **Phase 1: Indian School Structure Setup**

1. **Update Class Model** - Add NEP stage classification
2. **Enhance Student Model** - Add Indian-specific fields
3. **Create Government Compliance Model** - Aadhaar, SARAL, CBSE integration

### **Phase 2: Admission Workflow Enhancement**

1. **Create Enquiry Management System** - Lead capture and tracking
2. **Implement Age-based Admission Rules** - RTE compliance
3. **Add Document Verification Workflow** - Indian document requirements

### **Phase 3: Fee Management for Indian Schools**

1. **Multi-tier Fee Structure** - Trust + School level fees
2. **Government Scheme Integration** - RTE, scholarship calculations
3. **Category-based Fee Calculations** - Caste-based concessions

### **Phase 4: NEP 2020 Compliance**

1. **Holistic Assessment System** - Beyond traditional marks
2. **Skill-based Learning Tracking** - Practical assessments
3. **Mother Tongue Education Support** - Regional language integration

---

**This structure ensures complete compliance with Indian education system requirements while maintaining our existing tech stack and architecture patterns.**
