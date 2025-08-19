const { DataTypes } = require('sequelize');

/**
 * Student Documents Model
 * Manages all documents related to students
 */
const defineStudentDocument = (sequelize) => {
   const StudentDocument = sequelize.define(
      'StudentDocument',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         student_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'students',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
         },
         document_type: {
            type: DataTypes.ENUM(
               'BIRTH_CERTIFICATE',
               'TRANSFER_CERTIFICATE',
               'MARK_SHEET',
               'CASTE_CERTIFICATE',
               'INCOME_CERTIFICATE',
               'AADHAAR_CARD',
               'PHOTO',
               'MEDICAL_CERTIFICATE',
               'DOMICILE_CERTIFICATE',
               'MIGRATION_CERTIFICATE',
               'CHARACTER_CERTIFICATE',
               'SPORTS_CERTIFICATE',
               'OTHER'
            ),
            allowNull: false,
         },
         document_name: {
            type: DataTypes.STRING(200),
            allowNull: false,
            comment: 'Original filename or document title',
         },
         file_path: {
            type: DataTypes.STRING(500),
            allowNull: false,
            comment: 'Server path or cloud URL of the document',
         },
         file_size: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'File size in bytes',
         },
         mime_type: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'MIME type of the file',
         },
         document_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date mentioned on the document (issue date)',
         },
         issued_by: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: 'Authority/organization that issued this document',
         },
         document_number: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Official number on the document',
         },
         verification_status: {
            type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'),
            defaultValue: 'PENDING',
         },
         verified_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User ID who verified this document',
         },
         verified_at: {
            type: DataTypes.DATE,
            allowNull: true,
         },
         verification_remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
         },
         expiry_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Document expiry date (if applicable)',
         },
         is_mandatory: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Whether this document is mandatory for admission',
         },
         is_original_submitted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether original document was physically submitted',
         },
         visibility: {
            type: DataTypes.ENUM('PUBLIC', 'PRIVATE', 'INTERNAL'),
            defaultValue: 'INTERNAL',
            comment: 'Who can access this document',
         },
         description: {
            type: DataTypes.TEXT,
            allowNull: true,
         },
         metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Additional document-specific metadata',
         },
         created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
         },
         updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
         },
         created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
         updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
      },
      {
         tableName: 'student_documents',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               name: 'student_document_student_idx',
               fields: ['student_id'],
            },
            {
               name: 'student_document_type_idx',
               fields: ['document_type'],
            },
            {
               name: 'student_document_status_idx',
               fields: ['verification_status'],
            },
            {
               name: 'student_document_mandatory_idx',
               fields: ['is_mandatory'],
            },
            {
               name: 'student_document_expiry_idx',
               fields: ['expiry_date'],
            },
         ],
      }
   );

   return StudentDocument;
};

module.exports = { defineStudentDocument };
