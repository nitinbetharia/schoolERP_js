/**
 * Configurable Workflow Definitions
 * Per-tenant workflows that can be customized by trust administrators
 */

const WorkflowConfigs = {
  // Student Admission Workflow
  studentAdmission: {
    id: 'student_admission',
    name: 'Student Admission Workflow',
    description: 'Configurable workflow for student admission process',
    version: '1.0.0',
    configurable: true,
    tenantSpecific: true,
    
    // Default workflow configuration (can be overridden per tenant)
    defaultConfig: {
      steps: [
        {
          id: 'application_submission',
          name: 'Application Submission',
          description: 'Parent/Guardian submits admission application',
          order: 1,
          type: 'form_submission',
          required: true,
          assignedRole: 'PARENT',
          status: 'PENDING',
          autoAdvance: true,
          fields: [
            'student_basic_info',
            'parent_details',
            'previous_school_info',
            'document_upload'
          ],
          notifications: {
            onEntry: ['applicant_email'],
            onCompletion: ['admin_email', 'admission_team']
          },
          validation: 'applicationSubmissionValidation',
          timeout: null
        },
        {
          id: 'document_verification',
          name: 'Document Verification',
          description: 'Admin verifies submitted documents',
          order: 2,
          type: 'review_task',
          required: true,
          assignedRole: 'SCHOOL_ADMIN',
          status: 'PENDING',
          autoAdvance: false,
          fields: [
            'birth_certificate_verified',
            'previous_school_tc_verified',
            'address_proof_verified',
            'photo_verified',
            'verification_notes'
          ],
          actions: ['approve', 'reject', 'request_clarification'],
          notifications: {
            onEntry: ['admin_email'],
            onCompletion: ['applicant_email']
          },
          validation: 'documentVerificationValidation',
          timeout: 172800000 // 48 hours
        },
        {
          id: 'eligibility_check',
          name: 'Eligibility Assessment',
          description: 'Check if student meets admission criteria',
          order: 3,
          type: 'automated_check',
          required: true,
          assignedRole: 'SYSTEM',
          status: 'PENDING',
          autoAdvance: true,
          conditions: [
            {
              field: 'age',
              operator: 'gte',
              value: 'class_min_age',
              message: 'Student age must meet minimum requirement'
            },
            {
              field: 'age',
              operator: 'lte',
              value: 'class_max_age',
              message: 'Student age must not exceed maximum limit'
            },
            {
              field: 'class_capacity',
              operator: 'available',
              message: 'No seats available in the selected class'
            }
          ],
          notifications: {
            onFailure: ['applicant_email', 'admin_email']
          },
          timeout: null
        },
        {
          id: 'interview_scheduling',
          name: 'Interview Scheduling',
          description: 'Schedule admission interview if required',
          order: 4,
          type: 'conditional_task',
          required: false,
          assignedRole: 'SCHOOL_ADMIN',
          status: 'PENDING',
          autoAdvance: false,
          condition: {
            field: 'interview_required',
            operator: 'equals',
            value: true
          },
          fields: [
            'interview_date',
            'interview_time',
            'interview_type',
            'interviewer_assigned',
            'interview_instructions'
          ],
          notifications: {
            onCompletion: ['applicant_email', 'interviewer_email']
          },
          validation: 'interviewSchedulingValidation',
          timeout: 259200000 // 72 hours
        },
        {
          id: 'interview_conduct',
          name: 'Interview Conduct',
          description: 'Conduct admission interview and evaluation',
          order: 5,
          type: 'evaluation_task',
          required: false,
          assignedRole: 'TEACHER',
          status: 'PENDING',
          autoAdvance: false,
          condition: {
            previousStep: 'interview_scheduling',
            field: 'interview_scheduled',
            operator: 'equals',
            value: true
          },
          fields: [
            'interview_score',
            'communication_skills',
            'academic_readiness',
            'behavioral_assessment',
            'interview_notes',
            'recommendation'
          ],
          actions: ['recommend', 'not_recommend', 'conditional_recommend'],
          notifications: {
            onCompletion: ['admin_email', 'principal_email']
          },
          validation: 'interviewConductValidation',
          timeout: null
        },
        {
          id: 'admission_decision',
          name: 'Admission Decision',
          description: 'Final decision on admission application',
          order: 6,
          type: 'decision_task',
          required: true,
          assignedRole: 'SCHOOL_ADMIN',
          status: 'PENDING',
          autoAdvance: false,
          fields: [
            'decision',
            'decision_reason',
            'conditional_requirements',
            'waitlist_position',
            'decision_notes'
          ],
          actions: ['approve', 'reject', 'waitlist'],
          notifications: {
            onCompletion: ['applicant_email', 'parent_sms']
          },
          validation: 'admissionDecisionValidation',
          timeout: 432000000 // 120 hours (5 days)
        },
        {
          id: 'fee_payment',
          name: 'Fee Payment',
          description: 'Payment of admission and initial fees',
          order: 7,
          type: 'payment_task',
          required: true,
          assignedRole: 'PARENT',
          status: 'PENDING',
          autoAdvance: true,
          condition: {
            previousStep: 'admission_decision',
            field: 'decision',
            operator: 'equals',
            value: 'approve'
          },
          fields: [
            'admission_fee_amount',
            'payment_mode',
            'payment_reference',
            'payment_date'
          ],
          notifications: {
            onCompletion: ['parent_email', 'accountant_email'],
            onReminder: ['parent_email', 'parent_sms']
          },
          validation: 'feePaymentValidation',
          timeout: 604800000, // 7 days
          reminders: [
            { time: 259200000, type: 'email' }, // 3 days
            { time: 86400000, type: 'sms' }     // 1 day
          ]
        },
        {
          id: 'enrollment_completion',
          name: 'Enrollment Completion',
          description: 'Complete student enrollment process',
          order: 8,
          type: 'completion_task',
          required: true,
          assignedRole: 'SCHOOL_ADMIN',
          status: 'PENDING',
          autoAdvance: true,
          condition: {
            previousStep: 'fee_payment',
            field: 'payment_status',
            operator: 'equals',
            value: 'completed'
          },
          fields: [
            'admission_number_generated',
            'roll_number_assigned',
            'student_id_created',
            'parent_account_created',
            'class_section_assigned'
          ],
          notifications: {
            onCompletion: ['parent_email', 'class_teacher_email', 'principal_email']
          },
          timeout: null
        }
      ],
      
      // Workflow settings
      settings: {
        allowParallelSteps: false,
        allowSkipSteps: false,
        allowBackwardNavigation: true,
        autoSaveProgress: true,
        notificationPreferences: {
          email: true,
          sms: true,
          inApp: true
        },
        escalationRules: [
          {
            condition: 'step_timeout',
            action: 'notify_supervisor',
            delay: 86400000 // 24 hours
          },
          {
            condition: 'workflow_stalled',
            action: 'auto_escalate',
            delay: 172800000 // 48 hours
          }
        ]
      }
    },
    
    // Tenant-specific configurations
    tenantConfigs: {
      // Example: Different workflow for specific trust
      'DEMO': {
        steps: [
          // Can override or add specific steps for DEMO trust
          {
            id: 'entrance_test',
            name: 'Entrance Test',
            description: 'Mandatory entrance test for admission',
            order: 3.5, // Insert between eligibility_check and interview_scheduling
            type: 'test_task',
            required: true,
            assignedRole: 'TEACHER',
            fields: [
              'test_date',
              'test_score',
              'test_result',
              'test_notes'
            ],
            passingCriteria: {
              field: 'test_score',
              operator: 'gte',
              value: 60
            }
          }
        ],
        settings: {
          // Override default settings for this trust
          allowSkipSteps: true,
          customApprovalFlow: true
        }
      }
    }
  },

  // Fee Collection Workflow
  feeCollection: {
    id: 'fee_collection',
    name: 'Fee Collection Workflow',
    description: 'Automated fee collection and reminder workflow',
    version: '1.0.0',
    configurable: true,
    tenantSpecific: true,
    
    defaultConfig: {
      steps: [
        {
          id: 'fee_assignment',
          name: 'Fee Assignment',
          description: 'Assign fees to students based on fee structure',
          order: 1,
          type: 'automated_task',
          assignedRole: 'SYSTEM',
          autoAdvance: true,
          schedule: 'monthly'
        },
        {
          id: 'payment_reminder_1',
          name: 'First Payment Reminder',
          description: 'Send first payment reminder before due date',
          order: 2,
          type: 'notification_task',
          assignedRole: 'SYSTEM',
          autoAdvance: true,
          trigger: {
            type: 'days_before_due',
            value: 7
          },
          notifications: ['parent_email', 'parent_sms']
        },
        {
          id: 'payment_reminder_2',
          name: 'Final Payment Reminder',
          description: 'Send final reminder on due date',
          order: 3,
          type: 'notification_task',
          assignedRole: 'SYSTEM',
          autoAdvance: true,
          trigger: {
            type: 'on_due_date'
          },
          notifications: ['parent_email', 'parent_sms', 'urgent_call']
        },
        {
          id: 'overdue_notice',
          name: 'Overdue Notice',
          description: 'Send overdue notice after due date',
          order: 4,
          type: 'notification_task',
          assignedRole: 'SYSTEM',
          autoAdvance: true,
          trigger: {
            type: 'days_after_due',
            value: 3
          },
          notifications: ['parent_email', 'parent_sms', 'admin_notification']
        },
        {
          id: 'defaulter_action',
          name: 'Defaulter Action',
          description: 'Take action for persistent defaulters',
          order: 5,
          type: 'manual_task',
          assignedRole: 'ACCOUNTANT',
          autoAdvance: false,
          trigger: {
            type: 'days_after_due',
            value: 30
          },
          actions: ['final_notice', 'library_suspension', 'exam_bar', 'meeting_schedule']
        }
      ],
      
      settings: {
        gracePeriod: 7, // days
        lateFeePercentage: 2,
        maxLateFeeAmount: 500,
        defaulterThreshold: 30, // days
        autoSuspendServices: ['library', 'transport'],
        customReminderText: true
      }
    }
  },

  // Leave Application Workflow
  leaveApplication: {
    id: 'leave_application',
    name: 'Leave Application Workflow',
    description: 'Student leave application and approval workflow',
    version: '1.0.0',
    configurable: true,
    tenantSpecific: true,
    
    defaultConfig: {
      steps: [
        {
          id: 'application_submission',
          name: 'Leave Application',
          description: 'Parent submits leave application',
          order: 1,
          type: 'form_submission',
          assignedRole: 'PARENT',
          autoAdvance: true,
          fields: [
            'leave_type',
            'from_date',
            'to_date',
            'reason',
            'medical_certificate'
          ]
        },
        {
          id: 'class_teacher_approval',
          name: 'Class Teacher Approval',
          description: 'Class teacher reviews and approves leave',
          order: 2,
          type: 'approval_task',
          assignedRole: 'TEACHER',
          autoAdvance: false,
          condition: {
            field: 'leave_days',
            operator: 'lte',
            value: 3
          },
          actions: ['approve', 'reject', 'request_more_info']
        },
        {
          id: 'admin_approval',
          name: 'Admin Approval',
          description: 'School admin approval for extended leave',
          order: 3,
          type: 'approval_task',
          assignedRole: 'SCHOOL_ADMIN',
          autoAdvance: false,
          condition: {
            field: 'leave_days',
            operator: 'gt',
            value: 3
          },
          actions: ['approve', 'reject', 'conditional_approve']
        }
      ],
      
      settings: {
        maxLeavePerMonth: 5,
        maxContinuousLeave: 15,
        requireMedicalCertificate: 3, // days
        advanceApplicationDays: 1
      }
    }
  },

  // Transfer Request Workflow
  transferRequest: {
    id: 'transfer_request',
    name: 'Student Transfer Workflow',
    description: 'Inter-school transfer request workflow',
    version: '1.0.0',
    configurable: true,
    tenantSpecific: true,
    
    defaultConfig: {
      steps: [
        {
          id: 'transfer_request',
          name: 'Transfer Request',
          description: 'Parent requests student transfer',
          order: 1,
          type: 'form_submission',
          assignedRole: 'PARENT',
          autoAdvance: true,
          fields: [
            'from_school',
            'to_school',
            'reason',
            'preferred_date',
            'supporting_documents'
          ]
        },
        {
          id: 'current_school_approval',
          name: 'Current School Approval',
          description: 'Current school admin approves transfer',
          order: 2,
          type: 'approval_task',
          assignedRole: 'SCHOOL_ADMIN',
          autoAdvance: false,
          fields: [
            'clearance_status',
            'pending_fees',
            'library_clearance',
            'discipline_record'
          ]
        },
        {
          id: 'target_school_approval',
          name: 'Target School Approval',
          description: 'Target school confirms seat availability',
          order: 3,
          type: 'approval_task',
          assignedRole: 'SCHOOL_ADMIN',
          autoAdvance: false,
          fields: [
            'seat_availability',
            'admission_criteria_met',
            'acceptance_status'
          ]
        },
        {
          id: 'trust_admin_approval',
          name: 'Trust Admin Final Approval',
          description: 'Trust admin gives final approval',
          order: 4,
          type: 'approval_task',
          assignedRole: 'TRUST_ADMIN',
          autoAdvance: false,
          condition: {
            field: 'inter_trust_transfer',
            operator: 'equals',
            value: false
          }
        },
        {
          id: 'transfer_completion',
          name: 'Transfer Completion',
          description: 'Complete the transfer process',
          order: 5,
          type: 'completion_task',
          assignedRole: 'SYSTEM',
          autoAdvance: true,
          fields: [
            'transfer_certificate_generated',
            'records_transferred',
            'new_admission_number',
            'parent_notification_sent'
          ]
        }
      ],
      
      settings: {
        allowInterTrustTransfer: true,
        requireTrustAdminApproval: true,
        transferProcessingDays: 7,
        documentRetentionPeriod: 365
      }
    }
  }
};

module.exports = WorkflowConfigs;