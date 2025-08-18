/**
 * Configurable Wizard Definitions
 * System admin/programmer can modify these to add/update/remove wizard steps
 */

const WizardConfigs = {
  // Trust Setup Wizard Configuration
  trustSetup: {
    id: 'trust_setup',
    name: 'Trust Setup Wizard',
    description: 'Complete setup wizard for new educational trusts',
    version: '1.0.0',
    steps: [
      {
        id: 'trust_info',
        name: 'Trust Information',
        description: 'Basic trust details and contact information',
        order: 1,
        required: true,
        component: 'TrustInfoStep',
        validation: 'trustInfoValidation',
        fields: [
          {
            name: 'trust_name',
            type: 'text',
            label: 'Trust Name',
            placeholder: 'Enter trust name',
            required: true,
            minLength: 3,
            maxLength: 200
          },
          {
            name: 'trust_code',
            type: 'text',
            label: 'Trust Code',
            placeholder: 'Enter unique trust code (letters and numbers only)',
            required: true,
            pattern: '^[A-Z0-9]{3,20}$',
            unique: true
          },
          {
            name: 'subdomain',
            type: 'text',
            label: 'Subdomain',
            placeholder: 'Enter subdomain (lowercase letters and numbers only)',
            required: true,
            pattern: '^[a-z0-9]{3,50}$',
            unique: true
          },
          {
            name: 'contact_email',
            type: 'email',
            label: 'Contact Email',
            placeholder: 'Enter primary contact email',
            required: true,
            unique: true
          },
          {
            name: 'contact_phone',
            type: 'tel',
            label: 'Contact Phone',
            placeholder: 'Enter contact phone number',
            required: false
          },
          {
            name: 'website',
            type: 'url',
            label: 'Website',
            placeholder: 'Enter trust website URL',
            required: false
          }
        ]
      },
      {
        id: 'trust_address',
        name: 'Trust Address',
        description: 'Physical address and location details',
        order: 2,
        required: true,
        component: 'TrustAddressStep',
        validation: 'trustAddressValidation',
        fields: [
          {
            name: 'address',
            type: 'textarea',
            label: 'Address',
            placeholder: 'Enter complete address',
            required: true,
            rows: 3
          },
          {
            name: 'city',
            type: 'text',
            label: 'City',
            placeholder: 'Enter city',
            required: true
          },
          {
            name: 'state',
            type: 'text',
            label: 'State',
            placeholder: 'Enter state',
            required: true
          },
          {
            name: 'postal_code',
            type: 'text',
            label: 'Postal Code',
            placeholder: 'Enter postal code',
            required: true,
            pattern: '^[0-9]{6}$'
          },
          {
            name: 'country',
            type: 'select',
            label: 'Country',
            required: true,
            defaultValue: 'India',
            options: [
              { value: 'India', label: 'India' },
              { value: 'USA', label: 'United States' },
              { value: 'UK', label: 'United Kingdom' }
            ]
          }
        ]
      },
      {
        id: 'admin_user',
        name: 'Administrator Account',
        description: 'Create initial trust administrator account',
        order: 3,
        required: true,
        component: 'AdminUserStep',
        validation: 'adminUserValidation',
        fields: [
          {
            name: 'first_name',
            type: 'text',
            label: 'First Name',
            placeholder: 'Enter first name',
            required: true,
            minLength: 2,
            maxLength: 100
          },
          {
            name: 'last_name',
            type: 'text',
            label: 'Last Name',
            placeholder: 'Enter last name',
            required: true,
            minLength: 2,
            maxLength: 100
          },
          {
            name: 'email',
            type: 'email',
            label: 'Email',
            placeholder: 'Enter administrator email',
            required: true,
            unique: true
          },
          {
            name: 'phone',
            type: 'tel',
            label: 'Phone',
            placeholder: 'Enter phone number',
            required: true
          },
          {
            name: 'password',
            type: 'password',
            label: 'Password',
            placeholder: 'Enter secure password',
            required: true,
            minLength: 8,
            validation: 'strongPassword'
          },
          {
            name: 'confirm_password',
            type: 'password',
            label: 'Confirm Password',
            placeholder: 'Confirm password',
            required: true,
            matchField: 'password'
          }
        ]
      },
      {
        id: 'theme_config',
        name: 'Theme Configuration',
        description: 'Customize trust theme and branding',
        order: 4,
        required: false,
        component: 'ThemeConfigStep',
        validation: 'themeConfigValidation',
        fields: [
          {
            name: 'primary_color',
            type: 'color',
            label: 'Primary Color',
            defaultValue: '#3B82F6',
            required: false
          },
          {
            name: 'secondary_color',
            type: 'color',
            label: 'Secondary Color',
            defaultValue: '#64748B',
            required: false
          },
          {
            name: 'logo_url',
            type: 'file',
            label: 'Trust Logo',
            accept: 'image/*',
            maxSize: '2MB',
            required: false
          },
          {
            name: 'favicon_url',
            type: 'file',
            label: 'Favicon',
            accept: 'image/x-icon,image/png',
            maxSize: '1MB',
            required: false
          }
        ]
      },
      {
        id: 'payment_setup',
        name: 'Payment Configuration',
        description: 'Configure payment gateways and methods',
        order: 5,
        required: false,
        component: 'PaymentSetupStep',
        validation: 'paymentSetupValidation',
        fields: [
          {
            name: 'enable_online_payments',
            type: 'checkbox',
            label: 'Enable Online Payments',
            defaultValue: false,
            required: false
          },
          {
            name: 'enabled_gateways',
            type: 'checkbox-group',
            label: 'Select Payment Gateways',
            condition: 'enable_online_payments === true',
            options: [
              { value: 'RAZORPAY', label: 'Razorpay', icon: 'fab fa-razorpay' },
              { value: 'PAYTM', label: 'Paytm', icon: 'fas fa-mobile-alt' },
              { value: 'PAYU', label: 'PayU', icon: 'fas fa-credit-card' },
              { value: 'CCAVENUE', label: 'CCAvenue', icon: 'fas fa-university' },
              { value: 'INSTAMOJO', label: 'Instamojo', icon: 'fas fa-wallet' }
            ],
            required: false
          },
          {
            name: 'razorpay_config',
            type: 'fieldset',
            label: 'Razorpay Configuration',
            condition: 'enabled_gateways && enabled_gateways.includes("RAZORPAY")',
            fields: [
              {
                name: 'razorpay_key_id',
                type: 'text',
                label: 'Razorpay Key ID',
                placeholder: 'rzp_test_xxxxxxxxxx',
                required: true,
                pattern: '^rzp_(test|live)_[A-Za-z0-9]{10}$'
              },
              {
                name: 'razorpay_key_secret',
                type: 'password',
                label: 'Razorpay Key Secret',
                placeholder: 'Enter Razorpay secret key',
                required: true,
                minLength: 20
              },
              {
                name: 'razorpay_test_mode',
                type: 'checkbox',
                label: 'Test Mode',
                defaultValue: true,
                required: false
              }
            ]
          },
          {
            name: 'paytm_config',
            type: 'fieldset',
            label: 'Paytm Configuration',
            condition: 'enabled_gateways && enabled_gateways.includes("PAYTM")',
            fields: [
              {
                name: 'paytm_merchant_id',
                type: 'text',
                label: 'Merchant ID',
                required: true
              },
              {
                name: 'paytm_merchant_key',
                type: 'password',
                label: 'Merchant Key',
                required: true
              },
              {
                name: 'paytm_test_mode',
                type: 'checkbox',
                label: 'Test Mode',
                defaultValue: true,
                required: false
              }
            ]
          },
          {
            name: 'enabled_payment_methods',
            type: 'checkbox-group',
            label: 'Enable Payment Methods',
            options: [
              { value: 'CASH', label: 'Cash Payment', icon: 'fas fa-money-bill' },
              { value: 'CHEQUE', label: 'Cheque Payment', icon: 'fas fa-money-check' },
              { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: 'fas fa-university' },
              { value: 'UPI', label: 'UPI Payment', icon: 'fas fa-mobile-alt' },
              { value: 'ONLINE', label: 'Online Payment', icon: 'fas fa-globe' },
              { value: 'CARD', label: 'Card Payment', icon: 'fas fa-credit-card' }
            ],
            defaultValue: ['CASH', 'ONLINE'],
            required: true
          },
          {
            name: 'convenience_fee',
            type: 'fieldset',
            label: 'Convenience Fee Configuration',
            fields: [
              {
                name: 'online_fee_percentage',
                type: 'number',
                label: 'Online Payment Fee (%)',
                placeholder: '0.00',
                min: 0,
                max: 10,
                step: 0.01,
                defaultValue: 0,
                required: false
              },
              {
                name: 'online_fee_fixed',
                type: 'number',
                label: 'Fixed Fee (₹)',
                placeholder: '0.00',
                min: 0,
                step: 0.01,
                defaultValue: 0,
                required: false
              }
            ]
          }
        ]
      },
      {
        id: 'communication_setup',
        name: 'Communication Setup',
        description: 'Configure email and SMS providers',
        order: 6,
        required: false,
        component: 'CommunicationSetupStep',
        validation: 'communicationSetupValidation',
        fields: [
          {
            name: 'enable_email_notifications',
            type: 'checkbox',
            label: 'Enable Email Notifications',
            defaultValue: false,
            required: false
          },
          {
            name: 'email_provider',
            type: 'select',
            label: 'Email Provider',
            condition: 'enable_email_notifications === true',
            options: [
              { value: 'SMTP', label: 'SMTP' },
              { value: 'SENDGRID', label: 'SendGrid' },
              { value: 'MAILGUN', label: 'Mailgun' },
              { value: 'GMAIL', label: 'Gmail' }
            ],
            required: true
          },
          {
            name: 'smtp_config',
            type: 'fieldset',
            label: 'SMTP Configuration',
            condition: 'email_provider === "SMTP"',
            fields: [
              {
                name: 'smtp_host',
                type: 'text',
                label: 'SMTP Host',
                required: true
              },
              {
                name: 'smtp_port',
                type: 'number',
                label: 'SMTP Port',
                defaultValue: 587,
                required: true
              },
              {
                name: 'smtp_username',
                type: 'text',
                label: 'Username',
                required: true
              },
              {
                name: 'smtp_password',
                type: 'password',
                label: 'Password',
                required: true
              },
              {
                name: 'smtp_secure',
                type: 'checkbox',
                label: 'Use SSL/TLS',
                defaultValue: true,
                required: false
              }
            ]
          },
          {
            name: 'from_email',
            type: 'email',
            label: 'From Email Address',
            condition: 'enable_email_notifications === true',
            required: true
          },
          {
            name: 'from_name',
            type: 'text',
            label: 'From Name',
            condition: 'enable_email_notifications === true',
            defaultValue: 'School ERP System',
            required: true
          },
          {
            name: 'enable_sms_notifications',
            type: 'checkbox',
            label: 'Enable SMS Notifications',
            defaultValue: false,
            required: false
          },
          {
            name: 'sms_provider',
            type: 'select',
            label: 'SMS Provider',
            condition: 'enable_sms_notifications === true',
            options: [
              { value: 'TWILIO', label: 'Twilio' },
              { value: 'TEXTLOCAL', label: 'TextLocal' },
              { value: 'MSG91', label: 'MSG91' },
              { value: 'FAST2SMS', label: 'Fast2SMS' }
            ],
            required: true
          }
        ]
      },
      {
        id: 'confirmation',
        name: 'Confirmation',
        description: 'Review and confirm trust setup',
        order: 7,
        required: true,
        component: 'ConfirmationStep',
        validation: 'confirmationValidation',
        fields: [
          {
            name: 'terms_accepted',
            type: 'checkbox',
            label: 'I accept the terms and conditions',
            required: true
          },
          {
            name: 'data_processing_consent',
            type: 'checkbox',
            label: 'I consent to data processing as per privacy policy',
            required: true
          }
        ]
      }
    ],
    navigation: {
      allowSkip: false,
      allowBack: true,
      saveProgress: true,
      autoSave: true,
      autoSaveInterval: 30000
    },
    completion: {
      redirectUrl: '/setup/school',
      successMessage: 'Trust setup completed successfully!',
      createDatabase: true,
      sendWelcomeEmail: true
    }
  },

  // School Setup Wizard Configuration
  schoolSetup: {
    id: 'school_setup',
    name: 'School Setup Wizard',
    description: 'Setup individual schools within the trust',
    version: '1.0.0',
    steps: [
      {
        id: 'school_info',
        name: 'School Information',
        description: 'Basic school details and identification',
        order: 1,
        required: true,
        component: 'SchoolInfoStep',
        validation: 'schoolInfoValidation',
        fields: [
          {
            name: 'school_name',
            type: 'text',
            label: 'School Name',
            placeholder: 'Enter school name',
            required: true,
            minLength: 3,
            maxLength: 200
          },
          {
            name: 'school_code',
            type: 'text',
            label: 'School Code',
            placeholder: 'Enter unique school code',
            required: true,
            pattern: '^[A-Z0-9]{3,20}$',
            unique: true
          },
          {
            name: 'affiliation_number',
            type: 'text',
            label: 'Affiliation Number',
            placeholder: 'Enter board affiliation number',
            required: false
          },
          {
            name: 'board',
            type: 'select',
            label: 'Education Board',
            required: true,
            options: [
              { value: 'CBSE', label: 'Central Board of Secondary Education (CBSE)' },
              { value: 'ICSE', label: 'Indian Certificate of Secondary Education (ICSE)' },
              { value: 'STATE', label: 'State Board' },
              { value: 'IB', label: 'International Baccalaureate (IB)' },
              { value: 'IGCSE', label: 'Cambridge IGCSE' },
              { value: 'OTHER', label: 'Other' }
            ]
          }
        ]
      },
      {
        id: 'school_address',
        name: 'School Address',
        description: 'School location and contact details',
        order: 2,
        required: true,
        component: 'SchoolAddressStep',
        validation: 'schoolAddressValidation',
        fields: [
          {
            name: 'address',
            type: 'textarea',
            label: 'School Address',
            placeholder: 'Enter complete school address',
            required: true,
            rows: 3
          },
          {
            name: 'city',
            type: 'text',
            label: 'City',
            placeholder: 'Enter city',
            required: true
          },
          {
            name: 'state',
            type: 'text',
            label: 'State',
            placeholder: 'Enter state',
            required: true
          },
          {
            name: 'postal_code',
            type: 'text',
            label: 'Postal Code',
            placeholder: 'Enter postal code',
            required: true,
            pattern: '^[0-9]{6}$'
          },
          {
            name: 'phone',
            type: 'tel',
            label: 'School Phone',
            placeholder: 'Enter school phone number',
            required: true
          },
          {
            name: 'email',
            type: 'email',
            label: 'School Email',
            placeholder: 'Enter school email',
            required: true
          },
          {
            name: 'website',
            type: 'url',
            label: 'School Website',
            placeholder: 'Enter school website URL',
            required: false
          }
        ]
      },
      {
        id: 'principal_info',
        name: 'Principal Information',
        description: 'School principal details',
        order: 3,
        required: true,
        component: 'PrincipalInfoStep',
        validation: 'principalInfoValidation',
        fields: [
          {
            name: 'principal_name',
            type: 'text',
            label: 'Principal Name',
            placeholder: 'Enter principal full name',
            required: true,
            minLength: 3,
            maxLength: 200
          },
          {
            name: 'principal_email',
            type: 'email',
            label: 'Principal Email',
            placeholder: 'Enter principal email',
            required: true
          },
          {
            name: 'principal_phone',
            type: 'tel',
            label: 'Principal Phone',
            placeholder: 'Enter principal phone number',
            required: true
          }
        ]
      },
      {
        id: 'academic_structure',
        name: 'Academic Structure',
        description: 'Setup classes, sections, and academic year',
        order: 4,
        required: true,
        component: 'AcademicStructureStep',
        validation: 'academicStructureValidation',
        fields: [
          {
            name: 'academic_year',
            type: 'text',
            label: 'Current Academic Year',
            placeholder: 'e.g., 2024-25',
            required: true,
            pattern: '^[0-9]{4}-[0-9]{2}$'
          },
          {
            name: 'academic_start_date',
            type: 'date',
            label: 'Academic Year Start Date',
            required: true
          },
          {
            name: 'academic_end_date',
            type: 'date',
            label: 'Academic Year End Date',
            required: true
          },
          {
            name: 'classes',
            type: 'dynamic_list',
            label: 'Classes',
            description: 'Add classes offered by the school',
            required: true,
            minItems: 1,
            itemSchema: {
              class_name: {
                type: 'text',
                label: 'Class Name',
                placeholder: 'e.g., Class 1, Pre-KG',
                required: true
              },
              class_order: {
                type: 'number',
                label: 'Order',
                placeholder: 'Display order',
                required: true,
                min: 1
              },
              sections: {
                type: 'dynamic_list',
                label: 'Sections',
                required: true,
                minItems: 1,
                itemSchema: {
                  section_name: {
                    type: 'text',
                    label: 'Section Name',
                    placeholder: 'e.g., A, B, C',
                    required: true,
                    maxLength: 10
                  },
                  capacity: {
                    type: 'number',
                    label: 'Capacity',
                    placeholder: 'Maximum students',
                    required: true,
                    min: 1,
                    max: 100,
                    defaultValue: 30
                  }
                }
              }
            }
          }
        ]
      }
    ],
    navigation: {
      allowSkip: false,
      allowBack: true,
      saveProgress: true,
      autoSave: true,
      autoSaveInterval: 30000
    },
    completion: {
      redirectUrl: '/dashboard',
      successMessage: 'School setup completed successfully!',
      createDefaultUsers: true,
      setupDefaultFeeStructure: false
    }
  }
};

module.exports = WizardConfigs;
