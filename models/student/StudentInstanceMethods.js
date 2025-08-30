/**
 * Student Instance Methods
 * Instance methods for Student model objects
 * File size: ~200 lines (within industry standards)
 */

const StudentInstanceMethods = {
   /**
    * Get student's full name from associated User
    */
   getFullName: function () {
      return this.user?.name || 'Unknown Student';
   },

   /**
    * Get student's age based on date of birth
    */
   getAge: function () {
      if (!this.date_of_birth) {
         return null;
      }

      const today = new Date();
      const birthDate = new Date(this.date_of_birth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
         age--;
      }

      return age;
   },

   /**
    * Check if student is currently active
    */
   isActive: function () {
      return this.student_status === 'ACTIVE';
   },

   /**
    * Check if student admission is approved
    */
   isAdmissionApproved: function () {
      return ['APPROVED', 'ENROLLED'].includes(this.admission_status);
   },

   /**
    * Get primary contact information
    */
   getPrimaryContact: function () {
      // Priority: Father -> Mother -> Guardian -> Emergency Contact
      if (this.father_phone || this.father_email) {
         return {
            name: this.father_name,
            phone: this.father_phone,
            email: this.father_email,
            relation: 'Father',
         };
      }

      if (this.mother_phone || this.mother_email) {
         return {
            name: this.mother_name,
            phone: this.mother_phone,
            email: this.mother_email,
            relation: 'Mother',
         };
      }

      if (this.guardian_phone || this.guardian_email) {
         return {
            name: this.guardian_name,
            phone: this.guardian_phone,
            email: this.guardian_email,
            relation: this.guardian_relation || 'Guardian',
         };
      }

      if (this.emergency_contact_phone) {
         return {
            name: this.emergency_contact_name,
            phone: this.emergency_contact_phone,
            email: null,
            relation: this.emergency_contact_relation || 'Emergency Contact',
         };
      }

      return null;
   },

   /**
    * Get all contact information
    */
   getAllContacts: function () {
      const contacts = [];

      if (this.father_name && (this.father_phone || this.father_email)) {
         contacts.push({
            name: this.father_name,
            phone: this.father_phone,
            email: this.father_email,
            relation: 'Father',
            occupation: this.father_occupation,
            income: this.father_annual_income,
         });
      }

      if (this.mother_name && (this.mother_phone || this.mother_email)) {
         contacts.push({
            name: this.mother_name,
            phone: this.mother_phone,
            email: this.mother_email,
            relation: 'Mother',
            occupation: this.mother_occupation,
            income: this.mother_annual_income,
         });
      }

      if (this.guardian_name && (this.guardian_phone || this.guardian_email)) {
         contacts.push({
            name: this.guardian_name,
            phone: this.guardian_phone,
            email: this.guardian_email,
            relation: this.guardian_relation || 'Guardian',
            occupation: this.guardian_occupation,
         });
      }

      if (this.emergency_contact_name && this.emergency_contact_phone) {
         contacts.push({
            name: this.emergency_contact_name,
            phone: this.emergency_contact_phone,
            email: null,
            relation: this.emergency_contact_relation || 'Emergency Contact',
         });
      }

      return contacts;
   },

   /**
    * Check if student has special medical needs
    */
   hasSpecialMedicalNeeds: function () {
      return !!(this.medical_conditions || this.allergies || this.medications);
   },

   /**
    * Get medical summary
    */
   getMedicalSummary: function () {
      if (!this.hasSpecialMedicalNeeds()) {
         return null;
      }

      return {
         conditions: this.medical_conditions,
         allergies: this.allergies,
         medications: this.medications,
         doctorName: this.doctor_name,
         doctorPhone: this.doctor_phone,
      };
   },

   /**
    * Check if student requires transport
    */
   requiresTransport: function () {
      return this.transport_required === true;
   },

   /**
    * Get transport details
    */
   getTransportDetails: function () {
      if (!this.requiresTransport()) {
         return null;
      }

      return {
         route: this.transport_route,
         pickupPoint: this.pickup_point,
         dropPoint: this.drop_point,
      };
   },

   /**
    * Check if student is in hostel
    */
   isHostelStudent: function () {
      return this.hostel_required === true;
   },

   /**
    * Get hostel details
    */
   getHostelDetails: function () {
      if (!this.isHostelStudent()) {
         return null;
      }

      return {
         block: this.hostel_block,
         roomNumber: this.hostel_room_number,
      };
   },

   /**
    * Check if student has scholarship
    */
   hasScholarship: function () {
      return this.scholarship && this.scholarship > 0;
   },

   /**
    * Get scholarship details
    */
   getScholarshipDetails: function () {
      if (!this.hasScholarship()) {
         return null;
      }

      return {
         percentage: this.scholarship,
         reason: this.scholarship_reason,
      };
   },

   /**
    * Get complete address string
    */
   getFormattedAddress: function () {
      const parts = [this.address, this.city, this.state, this.postal_code].filter((part) => part && part.trim());
      return parts.length > 0 ? parts.join(', ') : null;
   },

   /**
    * Check if student can be promoted (academic year logic)
    */
   canBePromoted: function () {
      return this.student_status === 'ACTIVE' && this.class_id;
   },

   /**
    * Check if student can be transferred
    */
   canBeTransferred: function () {
      return ['ACTIVE', 'INACTIVE'].includes(this.student_status);
   },

   /**
    * Generate display name for student
    */
   getDisplayName: function () {
      const name = this.getFullName();
      const admissionNumber = this.admission_number;
      return `${name} (${admissionNumber})`;
   },

   /**
    * Get academic session info
    */
   getAcademicSession: function () {
      return {
         academicYear: this.academic_year,
         classId: this.class_id,
         sectionId: this.section_id,
         rollNumber: this.roll_number,
         stream: this.stream,
         subjects: this.subjects || [],
      };
   },
};

module.exports = StudentInstanceMethods;
