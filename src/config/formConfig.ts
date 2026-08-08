import type { FormConfig } from '@/types/formTypes';
export const formConfig: FormConfig = {
  appName: 'Orderly Affairs',
  version: '1.0',
  chunks: [
    {
      id: 'chunk1',
      title: 'Personal Information',
      sections: [
        {
          id: '1',
          title: 'Vital Information & Key Contacts',
          subsections: [
            {
              id: '1A',
              title: 'Vital Information',
              fields: [
                {
                  key: 'vital_info_instructions',
                  label: 'Essential Information Overview',
                  type: 'Instructions',
                  content:
                    "This page contains the most essential information your next of kin may need when managing your estate or gaining access to your accounts. If you're not comfortable placing all this information in one place, that's okay. You can note where each piece can be found instead—just make sure your loved one knows how to locate it. Feel free to store this information in your encrypted USB drive.",
                },

                {
                  key: 'personal_details_header',
                  label: 'Personal Details',
                  type: 'Instructions',
                  content: '',
                },
                {
                  key: 'full_legal_name',
                  label: 'Full Legal Name (First, Middle, Last)',
                  type: 'TextInput',
                  helperText:
                    'Your complete legal name as it appears on official documents',
                },
                {
                  key: 'other_names',
                  label: 'Any Other Names (Maiden, Nickname, etc.)',
                  type: 'TextInput',
                  helperText:
                    'Maiden name, nicknames, or other names you may be known by',
                },
                {
                  key: 'date_of_birth',
                  label: 'Date of Birth',
                  type: 'DatePicker',
                  helperText: 'Your date of birth',
                },
                {
                  key: 'social_security_number',
                  label:
                    'Social Security Number (last 4 digits or location of your full SSN)',
                  type: 'TextInput',
                  inputType: 'password',
                  helperText:
                    'Last 4 digits of SSN or location where full SSN can be found',
                },

                {
                  key: 'drivers_license_header',
                  label: "Driver's License / State ID",
                  type: 'Instructions',
                  content: '',
                },
                {
                  key: 'drivers_license_number',
                  label: "Driver's License Number (DL #)",
                  type: 'TextInput',
                  helperText: 'License or state ID number as printed on the card',
                },
                {
                  key: 'drivers_license_dd_number',
                  label: 'DD / Audit Number',
                  type: 'TextInput',
                  helperText:
                    'Document discriminator / audit number (often labeled DD on Texas licenses)',
                },
                {
                  key: 'drivers_license_class',
                  label: 'License Class',
                  type: 'TextInput',
                  helperText: 'e.g. Class C, A, B, or M',
                },
                {
                  key: 'drivers_license_issue_date',
                  label: 'Issue Date',
                  type: 'DatePicker',
                  helperText: 'Date the license was issued (ISS)',
                },
                {
                  key: 'drivers_license_expiration_date',
                  label: 'Expiration Date',
                  type: 'DatePicker',
                  helperText: 'Date the license expires (EXP)',
                },

                {
                  key: 'phone_device_header',
                  label: 'Phone & Device Access',
                  type: 'Instructions',
                  content: '',
                },
                {
                  key: 'phone_number',
                  label: 'Phone Number',
                  type: 'TextInput',
                  helperText: 'Your primary phone number',
                },
                {
                  key: 'phone_password',
                  label: 'Phone Password or PIN',
                  type: 'TextInput',
                  helperText: 'Password or PIN to unlock your phone',
                },
                {
                  key: 'voicemail_pin',
                  label: 'Voicemail PIN (if different)',
                  type: 'TextInput',
                  helperText:
                    'PIN to access voicemail if different from phone PIN',
                },
                {
                  key: 'computer_password',
                  label: 'Computer or Laptop Password',
                  type: 'TextInput',
                  helperText: 'Password to access your computer or laptop',
                },

                {
                  key: 'email_accounts_header',
                  label: 'Email Accounts',
                  type: 'Instructions',
                  content: '',
                },
                {
                  key: 'primary_email_username',
                  label: 'Primary Email Username/Address',
                  type: 'TextInput',
                  helperText: 'Your main email address',
                },
                {
                  key: 'primary_email_password',
                  label: 'Primary Email Password',
                  type: 'TextInput',
                  helperText: 'Password for your main email account',
                },
                {
                  key: 'secondary_email_username',
                  label: 'Secondary Email Username/Address',
                  type: 'TextInput',
                  helperText: 'Secondary email address (if applicable)',
                },
                {
                  key: 'secondary_email_password',
                  label: 'Secondary Email Password',
                  type: 'TextInput',
                  helperText:
                    'Password for secondary email account (if applicable)',
                },

                {
                  key: 'secure_locations_header',
                  label: 'Secure Locations',
                  type: 'Instructions',
                  content: '',
                },
                {
                  key: 'safe_code',
                  label: 'Code to Safe (if applicable)',
                  type: 'TextInput',
                  helperText: 'Combination or code for your safe',
                },
                {
                  key: 'safe_location',
                  label: 'Location of Safe or Lockbox',
                  type: 'TextInput',
                  helperText: 'Where your safe or lockbox is located',
                },
                {
                  key: 'safe_keys',
                  label: 'Where to Find the Key(s)',
                  type: 'TextInput',
                  helperText: 'Location of keys for safe or lockbox',
                },

                {
                  key: 'digital_ids_header',
                  label: 'Digital IDs & Accounts',
                  type: 'Instructions',
                  content: '',
                },
                {
                  key: 'google_id_username',
                  label: 'Google ID Username/Email',
                  type: 'TextInput',
                  helperText: 'Your Google account email address',
                },
                {
                  key: 'google_id_password',
                  label: 'Google ID Password',
                  type: 'TextInput',
                  helperText: 'Password for your Google account',
                },
                {
                  key: 'apple_id_username',
                  label: 'Apple ID Username/Email',
                  type: 'TextInput',
                  helperText: 'Your Apple ID email address',
                },
                {
                  key: 'apple_id_password',
                  label: 'Apple ID Password',
                  type: 'TextInput',
                  helperText: 'Password for your Apple ID account',
                },

                {
                  key: 'security_questions_header',
                  label: 'Security Questions & PINs',
                  type: 'Instructions',
                  content:
                    'If you use common answers to security questions (e.g., "mother\'s maiden name" or "first car"), you can list them here or write: "See Password Manager" or "Ask [Name]."',
                },
                {
                  key: 'security_question_answers',
                  label: 'Common Security Question Answers',
                  type: 'TextArea',
                  helperText:
                    'Your standard answers to common security questions',
                },
                {
                  key: 'frequent_pins',
                  label: 'Frequently Used PINs (ATM, voicemail, garage)',
                  type: 'TextArea',
                  helperText: "List of commonly used PINs and what they're for",
                },
              ],
            },
            {
              id: '1B',
              title: 'Key Contacts',
              fields: [],
              groups: [
                {
                  id: 'next_of_kin',
                  title: 'Next of Kin',
                  isRepeatable: true,
                  itemLabel: 'Next of Kin',
                  description:
                    'Your next of kin are typically your closest living relatives who should be contacted first.',
                  fields: [
                    {
                      key: 'contact_name',
                      label: 'Full Name',
                      type: 'TextInput',
                      helperText: 'Full legal name of your next of kin',
                      required: true,
                    },
                    {
                      key: 'relationship',
                      label: 'Relationship',
                      type: 'TextInput',
                      helperText: 'e.g., Spouse, Child, Parent, Sibling',
                      required: true,
                    },
                    {
                      key: 'phone_number',
                      label: 'Phone Number',
                      type: 'TextInput',
                      helperText: 'Primary phone number for this person',
                      required: true,
                    },
                    {
                      key: 'email_address',
                      label: 'Email Address',
                      type: 'TextInput',
                      helperText: 'Email address for this person',
                    },
                    {
                      key: 'mailing_address',
                      label: 'Mailing Address',
                      type: 'TextArea',
                      helperText: 'Complete mailing address for this person',
                      required: true,
                    },
                    {
                      key: 'alternate_contact',
                      label: 'Alternate Contact Method',
                      type: 'TextInput',
                      helperText:
                        'Secondary phone, work number, or other contact method',
                    },
                    {
                      key: 'priority_level',
                      label: 'Contact Priority',
                      type: 'RadioGroup',
                      options: [
                        'Primary - Contact First',
                        'Secondary - Contact if Primary Unavailable',
                        'Emergency Only',
                      ],
                      helperText: 'When should this person be contacted?',
                    },
                    {
                      key: 'special_instructions',
                      label: 'Special Instructions',
                      type: 'TextArea',
                      helperText:
                        'Any specific instructions about contacting this person or their role',
                    },
                  ],
                },
                {
                  id: 'executor_trustee',
                  title: 'Executor or Trustee',
                  isRepeatable: true,
                  itemLabel: 'Executor/Trustee',
                  description:
                    'These are the people legally responsible for managing your estate and carrying out your wishes.',
                  fields: [
                    {
                      key: 'contact_name',
                      label: 'Full Name',
                      type: 'TextInput',
                      helperText: 'Full legal name of your executor or trustee',
                      required: true,
                    },
                    {
                      key: 'role_title',
                      label: 'Role',
                      type: 'RadioGroup',
                      options: [
                        'Executor',
                        'Trustee',
                        'Co-Executor',
                        'Co-Trustee',
                        'Alternate Executor',
                        'Alternate Trustee',
                      ],
                      helperText: 'What is their official role?',
                      required: true,
                    },
                    {
                      key: 'relationship',
                      label: 'Relationship',
                      type: 'TextInput',
                      helperText:
                        'e.g., Family Member, Attorney, Friend, Professional Fiduciary',
                    },
                    {
                      key: 'phone_number',
                      label: 'Phone Number',
                      type: 'TextInput',
                      helperText: 'Primary phone number for this person',
                      required: true,
                    },
                    {
                      key: 'email_address',
                      label: 'Email Address',
                      type: 'TextInput',
                      helperText: 'Email address for this person',
                    },
                    {
                      key: 'company_organization',
                      label: 'Company/Organization',
                      type: 'TextInput',
                      helperText:
                        'Law firm, bank, or organization they represent',
                    },
                    {
                      key: 'mailing_address',
                      label: 'Mailing Address',
                      type: 'TextArea',
                      helperText: 'Complete mailing address for this person',
                      required: true,
                    },
                    {
                      key: 'services_provided',
                      label: 'Services/Responsibilities',
                      type: 'TextArea',
                      helperText:
                        'What services they provide or their specific responsibilities',
                    },
                    {
                      key: 'special_instructions',
                      label: 'Special Instructions',
                      type: 'TextArea',
                      helperText:
                        'Any specific instructions about working with this person',
                    },
                    {
                      key: 'contact_documents',
                      label: 'Related Documents',
                      type: 'TextInputWithUpload',
                      helperText:
                        'Upload appointment letters, business cards, or other relevant documents',
                    },
                  ],
                },
                {
                  id: 'additional_contacts',
                  title: 'Additional Important Contacts',
                  isRepeatable: true,
                  itemLabel: 'Contact',
                  description:
                    'Add other important people your next of kin should know about or contact (attorneys, CPAs, funeral directors, financial advisors, etc.).',
                  fields: [
                    {
                      key: 'contact_name',
                      label: 'Name',
                      type: 'TextInput',
                      helperText: 'Full name of the contact person',
                      required: true,
                    },
                    {
                      key: 'role_title',
                      label: 'Role/Title',
                      type: 'TextInput',
                      helperText:
                        'e.g., Attorney, CPA, Funeral Director, Financial Advisor',
                      required: true,
                    },
                    {
                      key: 'relationship',
                      label: 'Relationship',
                      type: 'TextInput',
                      helperText:
                        'How this person relates to you (professional, family, friend, etc.)',
                    },
                    {
                      key: 'phone_number',
                      label: 'Phone Number',
                      type: 'TextInput',
                      helperText: 'Primary phone number for this contact',
                    },
                    {
                      key: 'email_address',
                      label: 'Email Address',
                      type: 'TextInput',
                      helperText: 'Email address for this contact',
                    },
                    {
                      key: 'company_organization',
                      label: 'Company/Organization',
                      type: 'TextInput',
                      helperText:
                        'Name of their company, firm, or organization',
                    },
                    {
                      key: 'mailing_address',
                      label: 'Mailing Address',
                      type: 'TextArea',
                      helperText: 'Complete mailing address for this contact',
                    },
                    {
                      key: 'priority_level',
                      label: 'Priority Level',
                      type: 'RadioGroup',
                      options: [
                        'High - Must Contact Immediately',
                        'Medium - Contact Within a Week',
                        'Low - Contact When Convenient',
                        'Notify Only - For Information',
                      ],
                      helperText:
                        'How urgently should your next of kin contact this person?',
                    },
                    {
                      key: 'services_provided',
                      label: 'Services Provided',
                      type: 'TextArea',
                      helperText:
                        "What services they provide or why they're important to contact",
                    },
                    {
                      key: 'special_instructions',
                      label: 'Special Instructions',
                      type: 'TextArea',
                      helperText:
                        'Any specific instructions about contacting this person or using their services',
                    },
                    {
                      key: 'contact_documents',
                      label: 'Related Documents or Business Cards',
                      type: 'TextInputWithUpload',
                      helperText:
                        'Upload business cards, contracts, or other relevant documents for this contact',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: '2',
          title: 'Access Management',
          subsections: [
            {
              id: '2A',
              title: 'Kit Access Control',
              fields: [
                {
                  key: 'access_control_header',
                  label:
                    'Instructions for Owners: Assigning Next of Kin & Access to Your Kit',
                  type: 'Instructions',
                  content:
                    'As the Owner of this Kit, you must designate at least one person who will be able to access your kit when needed. You can assign one Primary Next of Kin (responsible for the full kit), and/or multiple additional trusted people who may access all or only certain portions of the Kit.\\n\\n**Step 1: Designate Who Will Manage the Kit**\\nAs the Owner of this Kit, you must assign:\\n• At least one Primary Next of Kin (responsible for the full kit), and/or\\n• Multiple additional trusted people who may access all or only certain portions of the Kit.\\n\\n**Step 2: Adding Multiple People**\\nUse the \\"+ Add Person\\" button below to register another person (name, relationship, email, phone). For each person added, you will be prompted to select which sections of the Kit they can access:\\n• Entire Kit (Full Access), or\\n• Specific sections only (e.g., Insurance Policies, Vehicles, Legal Documents).\\n\\nEach person will have:\\n• Separate login credentials (their own registered email/phone).\\n• A unique Master Access Password (either created by you or system-generated).\\n• A separate Password Card (printable/exportable PDF for storage).\\n\\n**Step 3: Create Master Access Passwords**\\nFor every person assigned:\\n• The system will generate a Password Card.\\n• You must print or export each card individually.\\n• Store each card in a secure location (recommended: your Fireproof Document Bag) and inform each person where their card is stored.\\n\\n**⚠️ Important:**\\n• Do not give anyone their password directly.\\n• Only share the location of their Password Card.\\n• You must designate at least one person to access your kit.\\n\\n**Step 4: How People Log In**\\nEach assigned person will:\\n1. Go to the Next of Kin Login page.\\n2. Enter their registered email or phone number.\\n3. Enter their unique Master Access Password (from their Password Card).\\n4. Access the specific sections of the Kit that you allowed them to see.\\n\\n**Step 5: Owner Notifications & Revocation**\\nEvery time someone logs in:\\n• You will receive a notification (phone/email).\\n• Notification includes the person\'s name, access type (Full Kit or Sectional), and timestamp.\\n• A Revoke Access button will be included so you can immediately end their session if:\\n  - Access was accidental, or\\n  - A rogue login attempt occurred.\\n\\nYou may also:\\n• Revoke or reset access for any individual from your Owner Dashboard.\\n• Use \\"Revoke All\\" to instantly lock down the Kit from everyone.',
                },
                {
                  key: 'access_management_data',
                  label: 'Access Management',
                  type: 'AccessManagement',
                  helperText:
                    'Manage who can access your Orderly Affairs Vault and what sections they can view',
                },
              ],
            },
          ],
        },
        {
          id: '3',
          title: 'Letters to Next of Kin',
          description:
            'Create an important introductory letter for your designated next of kin that explains how to access and use your Orderly Affairs Vault.',
          subsections: [
            {
              id: '3A',
              title: 'Letter to Next of Kin',
              fields: [
                {
                  key: 'letter_instructions',
                  label: 'Letter to Next of Kin Instructions',
                  type: 'Instructions',
                  content:
                    'This section creates an important introductory letter for your designated next of kin. The letter explains how to access and use your Orderly Affairs Vault. Information automatically populates from your Access Management section to create a personalized letter with login credentials and access details. This letter serves as the first point of contact for your next of kin when they need to manage your affairs.',
                },
                {
                  key: 'next_of_kin_letter_data',
                  label: 'Letter to Next of Kin',
                  type: 'NextOfKinLetter',
                  helperText:
                    'Create and customize the introductory letter for your next of kin with auto-populated access information',
                },
              ],
            },
          ],
        },
        {
          id: '4',
          title: 'Personal Messages',
          description:
            'Create heartfelt messages for your loved ones - letters, video messages, and audio recordings that can be delivered when needed. These personal messages provide comfort and guidance to those you care about most.',
          subsections: [
            {
              id: '4A',
              title: 'Personal Messages',
              fields: [
                {
                  key: 'letters_instructions',
                  label: 'Messages to loved ones and friends Instructions',
                  type: 'Instructions',
                  content:
                    'This section allows you to create personal messages for your loved ones that can be delivered at specific times or upon your passing. You can write heartfelt letters, record video messages, or create audio recordings. Each message can be customized with delivery triggers - either on a specific date (like an anniversary or birthday) or upon your death. These messages provide comfort, guidance, and your final words to those who matter most to you.\\n\\nTypes of Messages You Can Create:\\n• Written Letters: Traditional heartfelt letters with rich text formatting\\n• Video Messages: Personal video recordings with your voice and presence\\n• Audio Messages: Voice recordings for a more intimate, personal touch\\n\\nDelivery Options:\\n• Upon Death: Messages delivered when you pass away\\n• Specific Dates: Messages delivered on special occasions, anniversaries, birthdays\\n\\nThis feature helps ensure your loved ones receive your guidance, love, and final words exactly when they need them most.',
                },
                {
                  key: 'letters_data',
                  label: 'Letters and Messages',
                  type: 'LettersToNextOfKin',
                  helperText:
                    'Create and manage personal letters, video messages, and audio recordings for your loved ones',
                },
              ],
            },
          ],
        },
        {
          id: '5',
          title: 'Vehicles',
          subsections: [
            {
              id: '5A',
              title: 'Current Vehicles',
              repeatable: true,
              itemLabel: 'Vehicle',
              fields: [
                {
                  key: 'year',
                  label: 'Year',
                  type: 'TextInput',
                  helperText: 'Vehicle year',
                },
                {
                  key: 'make',
                  label: 'Make',
                  type: 'TextInput',
                  helperText: 'Vehicle manufacturer',
                },
                {
                  key: 'model',
                  label: 'Model',
                  type: 'TextInput',
                  helperText: 'Vehicle model',
                },
                {
                  key: 'color',
                  label: 'Color',
                  type: 'TextInput',
                  helperText: 'Vehicle color',
                },
                {
                  key: 'vin',
                  label: 'VIN',
                  type: 'TextInput',
                  helperText: 'Vehicle identification number',
                },
                {
                  key: 'license_plate',
                  label: 'License Plate',
                  type: 'TextInput',
                  helperText: 'Current license plate number',
                },
                {
                  key: 'registration_expiry',
                  label: 'Registration Expiry',
                  type: 'DatePicker',
                  helperText: 'When does registration expire?',
                },
                {
                  key: 'insurance_company',
                  label: 'Insurance Company',
                  type: 'TextInput',
                  helperText: 'Current insurance provider',
                },
                {
                  key: 'insurance_policy',
                  label: 'Insurance Policy Number',
                  type: 'TextInput',
                  helperText: 'Insurance policy number',
                },
                {
                  key: 'financing',
                  label: 'Financing Information',
                  type: 'TextArea',
                  helperText:
                    'Loan details, payment information, or if owned outright',
                },
                {
                  key: 'maintenance_records',
                  label: 'Maintenance Records',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Service records, receipts, or maintenance schedule',
                },
                {
                  key: 'parking_location',
                  label: 'Usual Parking Location',
                  type: 'TextInput',
                  helperText: 'Where the vehicle is typically parked',
                },
                {
                  key: 'spare_keys',
                  label: 'Spare Key Locations',
                  type: 'TextInput',
                  helperText: 'Where spare keys are located',
                },
                {
                  key: 'notes',
                  label: 'Additional Notes',
                  type: 'TextArea',
                  helperText:
                    'Any other important information about this vehicle',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'chunk2',
      title: 'Property & Insurance',
      sections: [
        {
          id: '6',
          title: 'Main Residence',
          subsections: [
            {
              id: '6A',
              title: 'Home Information & Inventory',
              fields: [
                {
                  key: 'inventory_instructions',
                  label: 'Home Inventory Instructions',
                  type: 'Instructions',
                  content:
                    'Document anything of value in your home, either on paper or even on video. Share details about sentimental, historical, or monetary items you want noted. This record is helpful for individuals who will inherit specific items and aids in processing insurance claims.',
                },
                {
                  key: 'home_address',
                  label: 'Home Address',
                  type: 'TextArea',
                  helperText: 'Full address of your primary residence',
                  required: true,
                },
                {
                  key: 'residence_type',
                  label: 'Type of Residence',
                  type: 'Dropdown',
                  options: [
                    'Single Family Home',
                    'Townhouse',
                    'Condominium',
                    'Apartment',
                    'Mobile Home',
                    'Other',
                  ],
                  helperText: 'Type of your primary residence',
                },
                {
                  key: 'custom_residence_type',
                  label: 'Specify Residence Type',
                  type: 'TextInput',
                  placeholder: 'Enter custom residence type',
                  helperText: 'Please specify the type of residence',
                  conditionalOn: 'residence_type',
                  conditionalValue: 'Other',
                },
                {
                  key: 'ownership_status',
                  label: 'Ownership Status',
                  type: 'RadioButtons',
                  options: ['Own', 'Rent', 'Other'],
                  helperText: 'Do you own or rent your primary residence?',
                },
                {
                  key: 'ownership_type',
                  label: 'Ownership Type',
                  type: 'Dropdown',
                  options: [
                    'Sole Ownership',
                    'Joint Tenancy',
                    'Tenants in Common',
                    'Community Property',
                    'Life Estate',
                    'Trust Ownership',
                    'Other',
                  ],
                  helperText: 'How the home is owned',
                  conditionalOn: 'ownership_status',
                  conditionalValue: 'Own',
                },
                {
                  key: 'custom_ownership_type',
                  label: 'Specify Ownership Type',
                  type: 'TextInput',
                  placeholder: 'Enter custom ownership type',
                  helperText: 'Please specify the type of ownership',
                  conditionalOn: 'ownership_type',
                  conditionalValue: 'Other',
                },
                {
                  key: 'year_purchased_leased',
                  label: 'Year Purchased or Leased',
                  type: 'TextInput',
                  helperText:
                    'Year you acquired or began leasing this property',
                },
                {
                  key: 'joint_owners',
                  label: 'Joint Owner(s)',
                  type: 'TextArea',
                  helperText:
                    'Names and relationships of any co-owners or joint tenants',
                },
                {
                  key: 'county',
                  label: 'County',
                  type: 'TextInput',
                  helperText: 'County where the property is located',
                },

                {
                  key: 'mortgage_financial_documents_label',
                  label: 'Mortgage & Financial Documents',
                  type: 'Instructions',
                  content:
                    'Important financial documents and statements for property ownership and financing',
                },
                {
                  key: 'mortgage_lienholder_landlord',
                  label: 'Mortgage Lienholder or Landlord',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Primary lender or landlord contact information and business card if available',
                },
                {
                  key: 'payment_methods',
                  label: 'Payment Methods Used',
                  type: 'TextArea',
                  helperText:
                    'How payments are made (check, online, autopay, etc.) and include online access details if available',
                },

                {
                  key: 'property_ownership_docs_label',
                  label: 'Property Ownership Documents',
                  type: 'Instructions',
                  content:
                    'Essential legal documents that establish and verify property ownership',
                },
                {
                  key: 'property_deeds_titles',
                  label: 'Property Deeds & Titles',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload deeds and titles or note their location (Recommendation: Place in Protected Documents bag)',
                },

                {
                  key: 'current_financing_docs_label',
                  label: 'Current Financing Documents',
                  type: 'Instructions',
                  content:
                    'Current mortgage statements, loans, and ongoing financial obligations for the property',
                },
                {
                  key: 'mortgage_lease_statement',
                  label: 'Current Mortgage Statement or Lease Agreement',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload current mortgage statement or lease agreement copy',
                },
                {
                  key: 'second_mortgage_heloc',
                  label: 'Second Mortgages or HELOCs',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Statements for any second mortgages or Home Equity Lines of Credit',
                },
                {
                  key: 'property_tax_bills',
                  label: 'Property Tax Bills or Statements',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload current property tax bills and payment records',
                },

                {
                  key: 'historical_special_docs_label',
                  label: 'Historical & Special Documents',
                  type: 'Instructions',
                  content:
                    'Past transactions, paid-off debts, and special financing arrangements',
                },
                {
                  key: 'closing_refinancing_docs',
                  label: 'Closing or Refinancing Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload closing/refinancing documents or notes on where they can be found',
                },
                {
                  key: 'paid_off_documentation',
                  label: 'Paid-Off Liens/Mortgages',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Documentation confirming any liens, notes, or mortgages have been paid off',
                },
                {
                  key: 'reverse_mortgage_info',
                  label: 'Reverse Mortgage Information',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Information and documents about any reverse mortgages',
                },

                {
                  key: 'professional_contacts_label',
                  label: 'Professional Contacts',
                  type: 'Instructions',
                  content:
                    'Real estate professionals and service providers related to your property',
                },
                {
                  key: 'realtor_landlord_contact',
                  label: 'Real Estate Agent or Landlord Contact',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Contact details and business cards for real estate agent or landlord',
                },

                {
                  key: 'occupancy_info_label',
                  label: 'Current Occupancy Information',
                  type: 'Instructions',
                  content:
                    'Details about who currently lives in the home and any pets',
                },
                {
                  key: 'residents',
                  label: 'Residents',
                  type: 'TextArea',
                  helperText:
                    'Names of all people currently living in the home',
                },
                {
                  key: 'pets',
                  label: 'Pets',
                  type: 'TextArea',
                  helperText:
                    'Details about pets, including names, types, and any special care instructions',
                },

                {
                  key: 'year_built',
                  label: 'Year Built',
                  type: 'TextInput',
                  helperText: 'Year the home was constructed',
                },
                {
                  key: 'square_footage',
                  label: 'Square Footage',
                  type: 'TextInput',
                  helperText: 'Approximate square footage of the home',
                },
                {
                  key: 'lot_size',
                  label: 'Lot Size',
                  type: 'TextInput',
                  helperText: 'Size of the property lot',
                },
                {
                  key: 'bedrooms',
                  label: 'Number of Bedrooms',
                  type: 'TextInput',
                  helperText: 'Total number of bedrooms',
                },
                {
                  key: 'bathrooms',
                  label: 'Number of Bathrooms',
                  type: 'TextInput',
                  helperText: 'Total number of bathrooms',
                },
                {
                  key: 'home_features',
                  label: 'Important Home Features',
                  type: 'TextArea',
                  helperText:
                    'Pool, septic system, well, solar panels, generator, basement, attic, garage, or other special features',
                },
                {
                  key: 'major_appliances',
                  label: 'Major Appliances',
                  type: 'TextArea',
                  helperText:
                    'HVAC system, water heater, washer/dryer, refrigerator, and other major appliances with model numbers and warranty info',
                },
                {
                  key: 'home_inventory',
                  label: 'Home Inventory',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload photos, video, or written inventory of valuable items and furnishings. Include sentimental, historical, or monetary items with details about their significance, value, and intended inheritors. This documentation is crucial for insurance claims and inheritance purposes.',
                },
                {
                  key: 'inventory_date_location',
                  label: 'Home Inventory Completion',
                  type: 'TextArea',
                  helperText:
                    'I produced a home inventory on _____ (Month/Day/Year) and it is located _____. Include the date you completed your inventory and where it can be found.',
                },
                {
                  key: 'other_documents_header',
                  label: 'Other Important Home Documents & Information',
                  type: 'Instructions',
                  content:
                    'Please include or note where to find these important items to help manage your home:',
                },
                {
                  key: 'new_homes_label',
                  label: 'New Homes',
                  type: 'Instructions',
                  content:
                    'If you have a new home, provide contractor, builder, warranty information, and important manuals or guides:',
                },
                {
                  key: 'builder_info',
                  label: 'Builder/Contractor Information',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Contact information for builder, contractor, or development company',
                },
                {
                  key: 'home_warranty',
                  label: 'Home Warranty Information',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Warranty documents, coverage details, and contact information',
                },
                {
                  key: 'appliance_manuals',
                  label: 'Appliance Manuals & Warranties',
                  type: 'TextInputWithUpload',
                  helperText:
                    'User manuals, warranty information for major appliances and systems',
                },
                {
                  key: 'emergency_shutoffs_label',
                  label: 'Emergency Information',
                  type: 'Instructions',
                  content:
                    'Critical information for emergencies and utility management:',
                },
                {
                  key: 'utility_shutoffs',
                  label: 'Utility Shut-off Locations',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Location of water, gas, and electrical shut-offs with photos or diagrams',
                },
                {
                  key: 'circuit_breaker',
                  label: 'Circuit Breaker Panel',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Photo of breaker panel with circuits labeled, or upload existing diagram',
                },
                {
                  key: 'home_systems_notes',
                  label: 'Home Systems Notes',
                  type: 'TextArea',
                  helperText:
                    'Important notes about HVAC, plumbing, electrical, or other home systems',
                },
                {
                  key: 'security_system',
                  label: 'Security System Information',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Security system details, codes, monitoring company information',
                },
                {
                  key: 'smart_home_devices',
                  label: 'Smart Home & Connected Devices',
                  type: 'TextArea',
                  helperText:
                    'List of smart home devices, apps, and login information for connected systems',
                },
              ],
            },
          ],
        },
        {
          id: '7',
          title: 'Insurance Policies',
          subsections: [
            {
              id: '7A',
              title: 'Insurance Policies',
              repeatable: true,
              itemLabel: 'Policy',
              fields: [
                {
                  key: 'policy_type',
                  label: 'Type of Policy',
                  type: 'Dropdown',
                  options: [
                    'Life',
                    'Homeowner/Renter',
                    'Vehicle',
                    'Health',
                    'Medical/Dental',
                    'Medicaid Supplements',
                    'Long Term Care',
                    'Disability',
                    'Job Loss',
                    'Umbrella',
                    'Annuity',
                    'Bank/Loan',
                    'Mortgage',
                    'Credit',
                    'Other',
                  ],
                  required: true,
                },
                {
                  key: 'policy_type_other',
                  label: 'Please specify other policy type',
                  type: 'TextInput',
                  helperText:
                    'Please describe the specific type of insurance policy',
                  conditionalDisplay: { field: 'policy_type', value: 'Other' },
                },
                {
                  key: 'policy_documents_life',
                  label: 'Life Insurance Policy Documents',
                  type: 'TextInputWithUpload',
                  conditionalDisplay: { field: 'policy_type', value: 'Life' },
                  helperText:
                    'Upload your life insurance policy documents, beneficiary information, or take photos of policy cards and statements.',
                },
                {
                  key: 'policy_company',
                  label: 'Insurance Company',
                  type: 'TextInput',
                  helperText: 'Name of the insurance company',
                },
                {
                  key: 'member_name',
                  label: 'Member / Insured Name',
                  type: 'TextInput',
                  helperText: 'Name printed on the insurance card',
                  conditionalDisplay: {
                    field: 'policy_type',
                    value: ['Health', 'Medical/Dental', 'Medicaid Supplements'],
                  },
                },
                {
                  key: 'covered_relationship',
                  label: 'Who this card covers',
                  type: 'Dropdown',
                  options: ['Me (primary)', 'Spouse/Partner', 'Dependent', 'Other'],
                  helperText: 'Which family member this health card belongs to',
                  conditionalDisplay: {
                    field: 'policy_type',
                    value: ['Health', 'Medical/Dental', 'Medicaid Supplements'],
                  },
                },
                {
                  key: 'member_id',
                  label: 'Member ID',
                  type: 'TextInput',
                  helperText: 'Member ID from the health insurance card',
                  conditionalDisplay: {
                    field: 'policy_type',
                    value: ['Health', 'Medical/Dental', 'Medicaid Supplements'],
                  },
                },
                {
                  key: 'group_number',
                  label: 'Group Number',
                  type: 'TextInput',
                  helperText: 'Group number from the insurance card',
                  conditionalDisplay: {
                    field: 'policy_type',
                    value: ['Health', 'Medical/Dental', 'Medicaid Supplements'],
                  },
                },
                {
                  key: 'plan_name',
                  label: 'Plan Name',
                  type: 'TextInput',
                  helperText: 'Plan product name (e.g. Choice Plus)',
                  conditionalDisplay: {
                    field: 'policy_type',
                    value: ['Health', 'Medical/Dental', 'Medicaid Supplements'],
                  },
                },
                {
                  key: 'policy_number',
                  label: 'Policy Number',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Enter the policy number or upload a photo of the policy showing the number',
                },
                {
                  key: 'rx_bin',
                  label: 'RxBIN',
                  type: 'TextInput',
                  helperText: 'Pharmacy BIN from the card',
                  conditionalDisplay: {
                    field: 'policy_type',
                    value: ['Health', 'Medical/Dental', 'Medicaid Supplements'],
                  },
                },
                {
                  key: 'rx_pcn',
                  label: 'RxPCN',
                  type: 'TextInput',
                  helperText: 'Pharmacy PCN from the card',
                  conditionalDisplay: {
                    field: 'policy_type',
                    value: ['Health', 'Medical/Dental', 'Medicaid Supplements'],
                  },
                },
                {
                  key: 'rx_grp',
                  label: 'RxGRP',
                  type: 'TextInput',
                  helperText: 'Pharmacy group from the card',
                  conditionalDisplay: {
                    field: 'policy_type',
                    value: ['Health', 'Medical/Dental', 'Medicaid Supplements'],
                  },
                },
                {
                  key: 'payer_id',
                  label: 'Payer ID',
                  type: 'TextInput',
                  helperText: 'Payer ID when printed on the card',
                  conditionalDisplay: {
                    field: 'policy_type',
                    value: ['Health', 'Medical/Dental', 'Medicaid Supplements'],
                  },
                },
                {
                  key: 'pharmacy_benefit_manager',
                  label: 'Pharmacy Benefit Manager',
                  type: 'TextInput',
                  helperText: 'e.g. Optum Rx',
                  conditionalDisplay: {
                    field: 'policy_type',
                    value: ['Health', 'Medical/Dental', 'Medicaid Supplements'],
                  },
                },
                {
                  key: 'benefit_summary',
                  label: 'Deductibles, OOP & Coinsurance',
                  type: 'TextArea',
                  helperText:
                    'In-network / out-of-network deductibles, out-of-pocket max, and coinsurance from the card',
                  conditionalDisplay: {
                    field: 'policy_type',
                    value: ['Health', 'Medical/Dental', 'Medicaid Supplements'],
                  },
                },
                {
                  key: 'policy_expiry',
                  label: 'Policy Expiry Date',
                  type: 'DatePicker',
                  helperText:
                    'Policy end date, valid through, or the last date of the policy period',
                },
                {
                  key: 'coverage_amount',
                  label: 'Coverage Amount',
                  type: 'TextInput',
                  helperText: 'Coverage amount or benefit value',
                },
                {
                  key: 'beneficiaries',
                  label: 'Beneficiaries',
                  type: 'TextArea',
                  helperText: 'List of beneficiaries and their percentages',
                },
                {
                  key: 'policy_contact',
                  label: 'Policy Contact Information',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Agent contact info, customer service numbers, or upload business cards',
                },
                {
                  key: 'premium_info',
                  label: 'Premium Information',
                  type: 'TextArea',
                  helperText:
                    'Premium amount, payment schedule, and payment method',
                },
                {
                  key: 'policy_documents',
                  label: 'Policy Documents',
                  type: 'TextInputWithUpload',
                  helperText: 'Upload policy documents, statements, or cards',
                },
                {
                  key: 'notes',
                  label: 'Additional Notes',
                  type: 'TextArea',
                  helperText:
                    'Any other important information about this policy',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'chunk3',
      title: 'Community & Charitable Giving',
      sections: [
        {
          id: '8',
          title: 'Groups & Community Memberships',
          subsections: [
            {
              id: '8A',
              title: 'Group Memberships',
              repeatable: true,
              itemLabel: 'Group/Organization',
              fields: [
                {
                  key: 'organization_name',
                  label: 'Organization Name',
                  type: 'TextInput',
                  helperText: 'Name of the group, club, or organization',
                },
                {
                  key: 'organization_type',
                  label: 'Type of Organization',
                  type: 'Dropdown',
                  options: [
                    'Religious/Church',
                    'Professional Association',
                    'Social Club',
                    'Volunteer Organization',
                    'Hobby Group',
                    'Sports/Recreation',
                    'Educational',
                    'Political',
                    'Other',
                  ],
                  helperText: 'Category that best describes this organization',
                },
                {
                  key: 'organization_type_other',
                  label: 'Please specify other organization type',
                  type: 'TextInput',
                  helperText:
                    'Please describe the specific type of organization',
                  conditionalDisplay: {
                    field: 'organization_type',
                    value: 'Other',
                  },
                },
                {
                  key: 'membership_details',
                  label: 'Membership Details',
                  type: 'TextArea',
                  helperText:
                    'Your role, membership number, or special responsibilities',
                },
                {
                  key: 'renewal_date',
                  label: 'Membership Renewal Date',
                  type: 'DatePicker',
                  helperText:
                    'When dues or membership renew — reminder emails at 10, 5, 1 days and on the day',
                },
                {
                  key: 'contact_info',
                  label: 'Contact Information',
                  type: 'TextInputWithUpload',
                  helperText: 'Phone, email, address, or upload contact cards',
                },
                {
                  key: 'importance',
                  label: 'Importance to Me',
                  type: 'TextArea',
                  helperText:
                    'Why this group is meaningful to you and any special memories',
                },
                {
                  key: 'notify_instructions',
                  label: 'Notification Instructions',
                  type: 'TextArea',
                  helperText:
                    'Should this organization be notified of your passing? Any special requests?',
                },
                {
                  key: 'documents',
                  label: 'Related Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Membership cards, certificates, or important documents',
                },
              ],
            },
          ],
        },
        {
          id: '9',
          title: 'Charitable Giving',
          subsections: [
            {
              id: '9A',
              title: 'Charitable Contributions',
              repeatable: true,
              itemLabel: 'Charity/Cause',
              fields: [
                {
                  key: 'charity_name',
                  label: 'Charity/Organization Name',
                  type: 'TextInput',
                  helperText: 'Name of the charitable organization',
                },
                {
                  key: 'cause_type',
                  label: 'Type of Cause',
                  type: 'Dropdown',
                  options: [
                    'Religious',
                    'Educational',
                    'Medical/Health',
                    'Environmental',
                    'Animal Welfare',
                    'Community Services',
                    'Arts & Culture',
                    'International Aid',
                    'Veterans',
                    'Other',
                  ],
                  helperText: 'Category of charitable cause',
                },
                {
                  key: 'cause_type_other',
                  label: 'Please specify other cause type',
                  type: 'TextInput',
                  helperText:
                    'Please describe the specific type of charitable cause',
                  conditionalDisplay: { field: 'cause_type', value: 'Other' },
                },
                {
                  key: 'contribution_type',
                  label: 'Type of Contribution',
                  type: 'RadioButtons',
                  options: [
                    'Regular Ongoing Donations',
                    'Annual Contribution',
                    'Occasional Giving',
                    'Planned in Will/Trust',
                    'Other',
                  ],
                  helperText: 'How you contribute to this organization',
                },
                {
                  key: 'contribution_type_other',
                  label: 'Please specify other contribution type',
                  type: 'TextInput',
                  helperText:
                    'Please describe the specific type of contribution',
                  conditionalDisplay: {
                    field: 'contribution_type',
                    value: 'Other',
                  },
                },
                {
                  key: 'contribution_amount',
                  label: 'Contribution Amount',
                  type: 'TextInput',
                  helperText:
                    'Amount and frequency (e.g., $50/month, $500/year)',
                },
                {
                  key: 'payment_method',
                  label: 'Payment Method',
                  type: 'TextArea',
                  helperText:
                    'How payments are made (automatic withdrawal, check, online, etc.)',
                },
                {
                  key: 'account_info',
                  label: 'Account/Donor Information',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Donor ID, account numbers, or login information for online giving',
                },
                {
                  key: 'contact_details',
                  label: 'Charity Contact Information',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Phone, email, address, or upload contact information',
                },
                {
                  key: 'special_instructions',
                  label: 'Special Instructions',
                  type: 'TextArea',
                  helperText:
                    'Instructions for continuing, modifying, or discontinuing donations',
                },
                {
                  key: 'will_trust_provision',
                  label: 'Will/Trust Provision',
                  type: 'TextArea',
                  helperText:
                    'If included in will or trust, note the provision details',
                },
                {
                  key: 'tax_documents',
                  label: 'Tax Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload donation receipts or tax-related documents',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'chunk4',
      title: 'Personal History & Service',
      sections: [
        {
          id: '10',
          title: 'Education & Accomplishments',
          subsections: [
            {
              id: '10A',
              title: 'Educational Background',
              repeatable: true,
              itemLabel: 'Education',
              fields: [
                {
                  key: 'institution_name',
                  label: 'Institution Name',
                  type: 'TextInput',
                  helperText: 'Name of school, college, or university',
                },
                {
                  key: 'degree_type',
                  label: 'Degree/Certification Type',
                  type: 'Dropdown',
                  options: [
                    'High School Diploma',
                    'Associate Degree',
                    "Bachelor's Degree",
                    "Master's Degree",
                    'Doctoral Degree',
                    'Professional Certification',
                    'Trade Certification',
                    'Other',
                  ],
                  helperText: 'Type of degree or certification earned',
                },
                {
                  key: 'degree_type_other',
                  label: 'Please specify other degree/certification type',
                  type: 'TextInput',
                  helperText:
                    'Please describe the specific type of degree or certification',
                  conditionalDisplay: { field: 'degree_type', value: 'Other' },
                },
                {
                  key: 'field_of_study',
                  label: 'Field of Study',
                  type: 'TextInput',
                  helperText: 'Major, concentration, or area of study',
                },
                {
                  key: 'graduation_year',
                  label: 'Graduation Year',
                  type: 'TextInput',
                  helperText: 'Year graduated or completed',
                },
                {
                  key: 'honors_awards',
                  label: 'Honors & Awards',
                  type: 'TextArea',
                  helperText:
                    'Academic honors, awards, or special recognitions',
                },
                {
                  key: 'documents',
                  label: 'Educational Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload diplomas, certificates, transcripts, or note their location',
                },
              ],
            },
          ],
        },
        {
          id: '11',
          title: 'Military Service',
          subsections: [
            {
              id: '11A',
              title: 'Military Service Record',
              repeatable: true,
              itemLabel: 'Service Period',
              fields: [
                {
                  key: 'branch_of_service',
                  label: 'Branch of Service',
                  type: 'Dropdown',
                  options: [
                    'Army',
                    'Navy',
                    'Air Force',
                    'Marines',
                    'Coast Guard',
                    'Space Force',
                    'National Guard',
                    'Reserves',
                    'Other',
                  ],
                  helperText: 'Which branch of the military you served in',
                },
                {
                  key: 'branch_of_service_other',
                  label: 'Please specify other branch of service',
                  type: 'TextInput',
                  helperText: 'Please describe the specific branch or service',
                  conditionalDisplay: {
                    field: 'branch_of_service',
                    value: 'Other',
                  },
                },
                {
                  key: 'service_dates',
                  label: 'Service Dates',
                  type: 'TextInput',
                  helperText:
                    'Start and end dates of service (e.g., 1985-1989)',
                },
                {
                  key: 'rank_achieved',
                  label: 'Highest Rank Achieved',
                  type: 'TextInput',
                  helperText: 'Final rank or pay grade attained',
                },
                {
                  key: 'military_occupational_specialty',
                  label: 'Military Occupational Specialty (MOS)',
                  type: 'TextInput',
                  helperText: 'Your job or specialty code in the military',
                },
                {
                  key: 'deployments',
                  label: 'Deployments/Stations',
                  type: 'TextArea',
                  helperText: 'Locations where you were stationed or deployed',
                },
                {
                  key: 'combat_service',
                  label: 'Combat Service',
                  type: 'RadioButtons',
                  options: ['Yes', 'No'],
                  helperText: 'Did you serve in a combat zone?',
                },
                {
                  key: 'awards_decorations',
                  label: 'Awards & Decorations',
                  type: 'TextArea',
                  helperText:
                    'Military awards, medals, ribbons, or commendations received',
                },
                {
                  key: 'discharge_type',
                  label: 'Type of Discharge',
                  type: 'Dropdown',
                  options: [
                    'Honorable',
                    'General (Under Honorable Conditions)',
                    'Other Than Honorable',
                    'Bad Conduct',
                    'Dishonorable',
                    'Medical',
                  ],
                  helperText: 'Type of military discharge received',
                },
                {
                  key: 'va_benefits',
                  label: 'VA Benefits Information',
                  type: 'TextArea',
                  helperText:
                    'Current VA benefits, disability ratings, or services you receive',
                },
                {
                  key: 'military_documents',
                  label: 'Military Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload DD-214, service records, discharge papers, or note their location (Recommendation: Place in Protected Documents bag)',
                },
                {
                  key: 'burial_preferences',
                  label: 'Military Burial Preferences',
                  type: 'TextArea',
                  helperText:
                    'Preferences for military funeral honors or burial in national cemetery',
                },
                {
                  key: 'veteran_contacts',
                  label: 'Veteran Organization Contacts',
                  type: 'TextInputWithUpload',
                  helperText:
                    'VFW, American Legion, or other veteran organization memberships and contacts',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'chunk5',
      title: 'Financial Information',
      sections: [
        {
          id: '12',
          title: 'Banking & Financial Accounts',
          subsections: [
            {
              id: '12A',
              title: 'Bank Accounts',
              repeatable: true,
              itemLabel: 'Bank Account',
              fields: [
                {
                  key: 'bank_name',
                  label: 'Bank Name',
                  type: 'TextInput',
                  helperText: 'Name of the financial institution',
                  required: true,
                },
                {
                  key: 'account_type',
                  label: 'Account Type',
                  type: 'Dropdown',
                  options: [
                    'Checking',
                    'Savings',
                    'Money Market',
                    'Certificate of Deposit (CD)',
                    'Business Checking',
                    'Business Savings',
                    'Other',
                  ],
                  helperText: 'Type of bank account',
                },
                {
                  key: 'account_type_other',
                  label: 'Please specify other account type',
                  type: 'TextInput',
                  helperText:
                    'Please describe the specific type of bank account',
                  conditionalDisplay: { field: 'account_type', value: 'Other' },
                },
                {
                  key: 'account_number',
                  label: 'Account Number',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Account number or upload a photo of bank statement showing account details',
                },
                {
                  key: 'routing_number',
                  label: 'Routing Number',
                  type: 'TextInput',
                  helperText: 'Bank routing number for transfers',
                },
                {
                  key: 'account_purpose',
                  label: 'Account Purpose',
                  type: 'TextArea',
                  helperText:
                    'What this account is used for (household expenses, emergency fund, business, etc.)',
                },
                {
                  key: 'joint_account_holders',
                  label: 'Joint Account Holders',
                  type: 'TextArea',
                  helperText: 'Names of other people on this account',
                },
                {
                  key: 'beneficiaries',
                  label: 'Beneficiaries',
                  type: 'TextArea',
                  helperText: 'Named beneficiaries for this account',
                },
                {
                  key: 'bank_contact',
                  label: 'Bank Contact Information',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Branch location, phone number, or upload business cards',
                },
                {
                  key: 'online_banking',
                  label: 'Online Banking Username',
                  type: 'TextInput',
                  helperText: 'Username for online banking access',
                },
                {
                  key: 'online_banking_password',
                  label: 'Online Banking Password',
                  type: 'TextInput',
                  helperText: 'Password for online banking',
                },
                {
                  key: 'cd_maturity_date',
                  label: 'CD / Account Maturity Date',
                  type: 'DatePicker',
                  helperText:
                    'Maturity date for CDs or other term accounts — used for expiry reminders',
                },
                {
                  key: 'last_statement_date',
                  label: 'Last Statement Date',
                  type: 'DatePicker',
                  helperText: 'Date of the most recent bank statement, if known',
                },
                {
                  key: 'automatic_payments',
                  label: 'Automatic Payments',
                  type: 'TextArea',
                  helperText:
                    'List of bills or transfers automatically paid from this account',
                },
                {
                  key: 'debit_cards',
                  label: 'Debit/ATM Cards',
                  type: 'TextInputWithUpload',
                  helperText: 'Information about cards linked to this account',
                },
                {
                  key: 'safe_deposit_box',
                  label: 'Safe Deposit Box',
                  type: 'TextArea',
                  helperText:
                    'If you have a safe deposit box at this bank, include box number and key location',
                },
                {
                  key: 'account_documents',
                  label: 'Account Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload recent statements, signature cards, or account opening documents',
                },
              ],
            },
            {
              id: '12B',
              title: 'Digital Payment Services',
              repeatable: true,
              itemLabel: 'Digital Payment Account',
              fields: [
                {
                  key: 'service_name',
                  label: 'Service Name',
                  type: 'Dropdown',
                  options: [
                    'PayPal',
                    'Venmo',
                    'Cash App',
                    'Zelle',
                    'Apple Pay',
                    'Google Pay',
                    'Samsung Pay',
                    'Stripe',
                    'Square',
                    'Other',
                  ],
                  helperText: 'Name of the digital payment service',
                },
                {
                  key: 'service_name_other',
                  label: 'Please specify other service name',
                  type: 'TextInput',
                  helperText:
                    'Please describe the specific digital payment service',
                  conditionalDisplay: { field: 'service_name', value: 'Other' },
                },
                {
                  key: 'account_email_phone',
                  label: 'Account Email/Phone',
                  type: 'TextInput',
                  helperText:
                    'Email address or phone number associated with the account',
                },
                {
                  key: 'username',
                  label: 'Username',
                  type: 'TextInput',
                  helperText: 'Username or handle for the service',
                },
                {
                  key: 'password',
                  label: 'Password',
                  type: 'TextInput',
                  helperText: 'Password for the account',
                },
                {
                  key: 'linked_accounts',
                  label: 'Linked Bank Accounts/Cards',
                  type: 'TextArea',
                  helperText:
                    'Bank accounts or credit cards linked to this service',
                },
                {
                  key: 'account_balance',
                  label: 'Typical Account Balance',
                  type: 'TextInput',
                  helperText: 'Approximate balance usually maintained',
                },
                {
                  key: 'business_personal',
                  label: 'Account Type',
                  type: 'RadioButtons',
                  options: ['Personal', 'Business'],
                  helperText: 'Is this a personal or business account?',
                },
                {
                  key: 'regular_transactions',
                  label: 'Regular Transactions',
                  type: 'TextArea',
                  helperText:
                    'Regular payments or transfers made through this service',
                },
                {
                  key: 'security_info',
                  label: 'Security Information',
                  type: 'TextArea',
                  helperText:
                    'Two-factor authentication setup, security questions, or backup codes',
                },
                {
                  key: 'subscription_renewal_date',
                  label: 'Subscription / Plan Renewal Date',
                  type: 'DatePicker',
                  helperText:
                    'Next billing or plan renewal date for this payment service, if any',
                },
                {
                  key: 'service_documents',
                  label: 'Service Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload account statements, transaction records, or screenshots',
                },
              ],
            },
          ],
        },
        {
          id: '13',
          title: 'Passwords & Online Accounts',
          subsections: [
            {
              id: '13A',
              title: 'Online Accounts',
              repeatable: true,
              itemLabel: 'Online Account',
              fields: [
                {
                  key: 'account_type',
                  label: 'Account Type',
                  type: 'Dropdown',
                  placeholder: 'Select what kind of online account this is',
                  options: [
                    'Social Media',
                    'Email',
                    'Banking',
                    'Investment',
                    'Shopping',
                    'Streaming',
                    'Cloud Storage',
                    'Work/Professional',
                    'Government',
                    'Utilities',
                    'Other',
                  ],
                  optionLabels: {
                    'Social Media':
                      'Social Media — Facebook, Instagram, LinkedIn, X…',
                    Email: 'Email — Gmail, Outlook, Yahoo, iCloud…',
                    Banking: 'Banking — Online banking login portals',
                    Investment: 'Investment — Brokerage or trading sites',
                    Shopping: 'Shopping — Amazon, eBay, retail stores…',
                    Streaming: 'Streaming — Netflix, Spotify, YouTube…',
                    'Cloud Storage':
                      'Cloud Storage — Google Drive, Dropbox, iCloud…',
                    'Work/Professional':
                      'Work / Professional — Employer or business portals',
                    Government: 'Government — IRS, DMV, benefits portals…',
                    Utilities:
                      'Utilities — Electric, gas, internet provider…',
                    Other: 'Other — Describe the type in the field below',
                  },
                  helperText:
                    'Start here: choose the category that best matches this login. Select Other if none fit — a text field will appear so you can describe it.',
                },
                {
                  key: 'account_type_other',
                  label: 'Specify account type',
                  type: 'TextInput',
                  placeholder:
                    'e.g., Gaming (Steam), Password manager (1Password), News subscription',
                  helperText:
                    'Required when you choose Other — helps your family understand what this account is for.',
                  conditionalDisplay: { field: 'account_type', value: 'Other' },
                },
                {
                  key: 'service_name',
                  label: 'Service/Website Name',
                  type: 'TextInput',
                  helperText:
                    'Name of the website or service (e.g., Facebook, Amazon, Netflix)',
                },
                {
                  key: 'account_username',
                  label: 'Username',
                  type: 'TextInput',
                  helperText: 'Username or login ID for this account',
                },
                {
                  key: 'account_password',
                  label: 'Password',
                  type: 'TextInput',
                  helperText: 'Password for this account',
                },
                {
                  key: 'email_associated',
                  label: 'Associated Email',
                  type: 'TextInput',
                  helperText: 'Email address used for this account',
                },
                {
                  key: 'phone_associated',
                  label: 'Associated Phone',
                  type: 'TextInput',
                  helperText: 'Phone number linked to this account',
                },
                {
                  key: 'recovery_info',
                  label: 'Recovery Information',
                  type: 'TextArea',
                  helperText:
                    'Security questions, backup emails, or recovery phone numbers',
                },
                {
                  key: 'two_factor_auth',
                  label: 'Two-Factor Authentication',
                  type: 'TextArea',
                  helperText:
                    'Details about 2FA setup, authenticator apps, or backup codes',
                },
                {
                  key: 'account_value',
                  label: 'Account Value/Importance',
                  type: 'TextArea',
                  helperText:
                    'Financial value, personal importance, or business significance',
                },
                {
                  key: 'subscription_renewal_date',
                  label: 'Subscription Renewal Date',
                  type: 'DatePicker',
                  helperText:
                    'When this subscription or paid plan renews next (streaming, SaaS, memberships)',
                },
                {
                  key: 'account_expiry_date',
                  label: 'Account / Access Expiry Date',
                  type: 'DatePicker',
                  helperText:
                    'When access, trial, or the account itself expires (if different from renewal)',
                },
                {
                  key: 'closure_instructions',
                  label: 'Account Closure Instructions',
                  type: 'TextArea',
                  helperText:
                    'Instructions for closing, memorializing, or transferring this account',
                },
                {
                  key: 'account_documents',
                  label: 'Account Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload account statements, screenshots, or important account information',
                },
              ],
            },
          ],
        },
        {
          id: '14',
          title: 'Investments & Retirement',
          subsections: [
            {
              id: '14A',
              title: 'Investment Accounts',
              repeatable: true,
              itemLabel: 'Investment Account',
              fields: [
                {
                  key: 'account_type',
                  label: 'Account Type',
                  type: 'Dropdown',
                  options: [
                    '401(k)',
                    '403(b)',
                    'IRA - Traditional',
                    'IRA - Roth',
                    'SEP-IRA',
                    'Pension',
                    'Brokerage Account',
                    'Mutual Fund',
                    'Bonds',
                    'Stocks',
                    'Annuity',
                    'Other',
                  ],
                  helperText: 'Type of investment or retirement account',
                },
                {
                  key: 'account_type_other',
                  label: 'Please specify other account type',
                  type: 'TextInput',
                  helperText:
                    'Please describe the specific type of investment or retirement account',
                  conditionalDisplay: { field: 'account_type', value: 'Other' },
                },
                {
                  key: 'financial_institution',
                  label: 'Financial Institution',
                  type: 'TextInput',
                  helperText:
                    'Company managing this account (e.g., Fidelity, Vanguard, etc.)',
                },
                {
                  key: 'account_number',
                  label: 'Account Number',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Account number or upload statement showing account details',
                },
                {
                  key: 'account_value',
                  label: 'Approximate Account Value',
                  type: 'TextInput',
                  helperText: 'Current approximate value of the account',
                },
                {
                  key: 'beneficiaries',
                  label: 'Beneficiaries',
                  type: 'TextArea',
                  helperText: 'Named beneficiaries and their percentages',
                },
                {
                  key: 'advisor_contact',
                  label: 'Financial Advisor Contact',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Contact information for financial advisor or account manager',
                },
                {
                  key: 'employer_connection',
                  label: 'Employer Connection',
                  type: 'TextArea',
                  helperText:
                    'If employer-sponsored, include company name and HR contact',
                },
                {
                  key: 'login_credentials',
                  label: 'Online Account Access',
                  type: 'TextArea',
                  helperText: 'Username and password for online account access',
                },
                {
                  key: 'distribution_instructions',
                  label: 'Distribution Instructions',
                  type: 'TextArea',
                  helperText:
                    'Your wishes for distributions, Required Minimum Distributions (RMDs), etc.',
                },
                {
                  key: 'account_documents',
                  label: 'Account Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload recent statements, beneficiary forms, or plan documents',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'chunk6',
      title: 'Health & Healthcare',
      sections: [
        {
          id: '15',
          title: 'Health Information',
          subsections: [
            {
              id: '15A',
              title: 'Health Insurance & Medical Information',
              fields: [
                {
                  key: 'health_overview_instructions',
                  label: 'Health Information Overview',
                  type: 'Instructions',
                  content:
                    'This section helps document your health information, medical providers, and insurance details so your next of kin can manage your healthcare needs and make informed decisions. Keep insurance information up to date and ensure your healthcare directives are properly documented and accessible.',
                },

                {
                  key: 'primary_health_insurance',
                  label: 'Primary Health Insurance',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Primary health insurance company, policy number, group number, and upload insurance cards',
                },
                {
                  key: 'secondary_health_insurance',
                  label: 'Secondary Health Insurance',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Secondary or supplemental insurance information and cards',
                },
                {
                  key: 'medicare_medicaid',
                  label: 'Medicare/Medicaid Information',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Medicare or Medicaid numbers, cards, and supplement insurance information',
                },

                {
                  key: 'medical_conditions_header',
                  label: 'Current Medical Conditions',
                  type: 'Instructions',
                  content:
                    'Document your current health conditions and medical history',
                },
                {
                  key: 'current_conditions',
                  label: 'Current Medical Conditions',
                  type: 'TextArea',
                  helperText:
                    'List current medical conditions, chronic illnesses, or ongoing health issues',
                },
                {
                  key: 'allergies',
                  label: 'Allergies',
                  type: 'TextArea',
                  helperText:
                    'Drug allergies, food allergies, environmental allergies, and reactions',
                },
                {
                  key: 'current_medications',
                  label: 'Current Medications',
                  type: 'TextInputWithUpload',
                  helperText:
                    'List current medications, dosages, and upload photos of medication bottles or prescription lists',
                },
                {
                  key: 'medical_devices',
                  label: 'Medical Devices/Equipment',
                  type: 'TextArea',
                  helperText:
                    'Pacemakers, hearing aids, CPAP machines, insulin pumps, or other medical devices',
                },

                {
                  key: 'emergency_contacts_header',
                  label: 'Emergency Medical Contacts',
                  type: 'Instructions',
                  content: 'Important contacts for medical emergencies',
                },
                {
                  key: 'emergency_contact_1',
                  label: 'Emergency Contact 1',
                  type: 'TextInput',
                  helperText:
                    'Name and phone number of primary emergency contact',
                },
                {
                  key: 'emergency_contact_2',
                  label: 'Emergency Contact 2',
                  type: 'TextInput',
                  helperText:
                    'Name and phone number of secondary emergency contact',
                },
                {
                  key: 'medical_power_of_attorney',
                  label: 'Medical Power of Attorney',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Person designated to make medical decisions and upload power of attorney documents',
                },
              ],
            },
            {
              id: '15B',
              title: 'Healthcare Providers',
              repeatable: true,
              itemLabel: 'Healthcare Provider',
              fields: [
                {
                  key: 'provider_name',
                  label: 'Provider/Practice Name',
                  type: 'TextInput',
                  helperText: 'Name of doctor, clinic, or healthcare facility',
                },
                {
                  key: 'specialty',
                  label: 'Specialty',
                  type: 'Dropdown',
                  options: [
                    'Primary Care Physician',
                    'Cardiologist',
                    'Dermatologist',
                    'Dentist',
                    'Optometrist/Ophthalmologist',
                    'Neurologist',
                    'Orthopedist',
                    'Gynecologist',
                    'Urologist',
                    'Psychiatrist/Psychologist',
                    'Pharmacy',
                    'Physical Therapy',
                    'Chiropractor',
                    'Other Specialist',
                  ],
                  helperText: 'Type of healthcare provider or specialty',
                },
                {
                  key: 'doctor_name',
                  label: 'Doctor/Provider Name',
                  type: 'TextInput',
                  helperText:
                    'Name of the specific doctor or healthcare provider',
                },
                {
                  key: 'contact_info',
                  label: 'Contact Information',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Phone number, address, and upload business cards or contact information',
                },
                {
                  key: 'patient_id',
                  label: 'Patient ID/Account Number',
                  type: 'TextInput',
                  helperText:
                    'Your patient ID or account number with this provider',
                },
                {
                  key: 'frequency',
                  label: 'Visit Frequency',
                  type: 'TextInput',
                  helperText:
                    'How often you see this provider (e.g., annually, every 6 months)',
                },
                {
                  key: 'last_visit',
                  label: 'Last Visit Date',
                  type: 'DatePicker',
                  helperText: 'Date of your most recent visit',
                },
                {
                  key: 'conditions_treated',
                  label: 'Conditions Treated',
                  type: 'TextArea',
                  helperText:
                    'What conditions or issues this provider treats for you',
                },
                {
                  key: 'insurance_accepted',
                  label: 'Insurance Information',
                  type: 'TextArea',
                  helperText:
                    'Which of your insurance plans this provider accepts',
                },
                {
                  key: 'portal_access',
                  label: 'Patient Portal Access',
                  type: 'TextArea',
                  helperText: 'Username and password for online patient portal',
                },
                {
                  key: 'important_notes',
                  label: 'Important Notes',
                  type: 'TextArea',
                  helperText:
                    'Special instructions, preferences, or important medical history with this provider',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'chunk7',
      title: 'Debts & Credit',
      sections: [
        {
          id: '16',
          title: 'Credit Cards & Debt',
          subsections: [
            {
              id: '16A',
              title: 'Credit Cards',
              repeatable: true,
              itemLabel: 'Credit Card',
              fields: [
                {
                  key: 'card_name',
                  label: 'Card Name/Bank',
                  type: 'TextInput',
                  helperText: 'Name of the credit card or issuing bank',
                },
                {
                  key: 'card_type',
                  label: 'Card Type',
                  type: 'Dropdown',
                  options: [
                    'Visa',
                    'MasterCard',
                    'American Express',
                    'Discover',
                    'Store Card',
                    'Business Card',
                    'Other',
                  ],
                  helperText: 'Type of credit card',
                },
                {
                  key: 'card_type_other',
                  label: 'Please specify other card type',
                  type: 'TextInput',
                  helperText:
                    'Please describe the specific type of credit card',
                  conditionalDisplay: { field: 'card_type', value: 'Other' },
                },
                {
                  key: 'card_number',
                  label: 'Card Number (last 4 digits)',
                  type: 'TextInput',
                  helperText:
                    'Last 4 digits of the card number for identification',
                },
                {
                  key: 'account_number',
                  label: 'Full Account Number',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Full account number or upload photo of card/statement (store securely)',
                },
                {
                  key: 'credit_limit',
                  label: 'Credit Limit',
                  type: 'TextInput',
                  helperText: 'Maximum credit limit on this card',
                },
                {
                  key: 'current_balance',
                  label: 'Approximate Current Balance',
                  type: 'TextInput',
                  helperText: 'Current balance owed on this card',
                },
                {
                  key: 'monthly_payment',
                  label: 'Monthly Payment',
                  type: 'TextInput',
                  helperText: 'Typical monthly payment amount',
                },
                {
                  key: 'autopay_setup',
                  label: 'Autopay Information',
                  type: 'TextArea',
                  helperText:
                    'If autopay is set up, which bank account and for what amount',
                },
                {
                  key: 'card_benefits',
                  label: 'Card Benefits',
                  type: 'TextArea',
                  helperText:
                    'Rewards programs, cash back, travel benefits, or other card perks',
                },
                {
                  key: 'customer_service',
                  label: 'Customer Service Contact',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Phone number for customer service or upload contact information',
                },
                {
                  key: 'online_account',
                  label: 'Online Account Access',
                  type: 'TextArea',
                  helperText:
                    'Username and password for online account management',
                },
                {
                  key: 'authorized_users',
                  label: 'Authorized Users',
                  type: 'TextArea',
                  helperText: 'Names of any authorized users on this account',
                },
                {
                  key: 'card_documents',
                  label: 'Card Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload recent statements, terms and conditions, or card agreements',
                },
              ],
            },
            {
              id: '16B',
              title: 'Other Debts',
              repeatable: true,
              itemLabel: 'Debt',
              fields: [
                {
                  key: 'debt_type',
                  label: 'Type of Debt',
                  type: 'Dropdown',
                  options: [
                    'Personal Loan',
                    'Student Loan',
                    'Auto Loan',
                    'Home Equity Loan',
                    'Line of Credit',
                    'Medical Debt',
                    'Tax Debt',
                    'Business Loan',
                    'Other',
                  ],
                  helperText: 'Category of this debt',
                },
                {
                  key: 'debt_type_other',
                  label: 'Please specify other debt type',
                  type: 'TextInput',
                  helperText: 'Please describe the specific type of debt',
                  conditionalDisplay: { field: 'debt_type', value: 'Other' },
                },
                {
                  key: 'creditor_name',
                  label: 'Creditor/Lender Name',
                  type: 'TextInput',
                  helperText:
                    'Name of the company or institution you owe money to',
                },
                {
                  key: 'account_number',
                  label: 'Account Number',
                  type: 'TextInputWithUpload',
                  helperText: 'Account or loan number for this debt',
                },
                {
                  key: 'current_balance',
                  label: 'Current Balance Owed',
                  type: 'TextInput',
                  helperText: 'Amount currently owed on this debt',
                },
                {
                  key: 'monthly_payment',
                  label: 'Monthly Payment Amount',
                  type: 'TextInput',
                  helperText: 'Required monthly payment amount',
                },
                {
                  key: 'payment_due_date',
                  label: 'Payment Due Date',
                  type: 'TextInput',
                  helperText: 'Day of the month payment is due',
                },
                {
                  key: 'interest_rate',
                  label: 'Interest Rate',
                  type: 'TextInput',
                  helperText: 'Interest rate on this debt',
                },
                {
                  key: 'payment_method',
                  label: 'Payment Method',
                  type: 'TextArea',
                  helperText:
                    'How payments are made (autopay, check, online, etc.)',
                },
                {
                  key: 'cosigners',
                  label: 'Co-signers or Joint Borrowers',
                  type: 'TextArea',
                  helperText:
                    'Names of any co-signers or joint borrowers on this debt',
                },
                {
                  key: 'collateral',
                  label: 'Collateral',
                  type: 'TextArea',
                  helperText:
                    'Any property securing this debt (car, house, etc.)',
                },
                {
                  key: 'creditor_contact',
                  label: 'Creditor Contact Information',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Phone, address, or upload contact information for the lender',
                },
                {
                  key: 'debt_documents',
                  label: 'Debt Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload loan agreements, recent statements, or payment records',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'chunk8',
      title: 'Personal Relationships',
      sections: [
        {
          id: '17',
          title: 'Family & Treasured Connections',
          subsections: [
            {
              id: '17A',
              title: 'Ancestry & Family Tree',
              fields: [
                {
                  key: 'family_tree_overview',
                  label: 'Family Tree Overview',
                  type: 'TextArea',
                  helperText:
                    'Brief overview of your family lineage, including parents, grandparents, and any known ancestry',
                },
                {
                  key: 'genealogy_research',
                  label: 'Genealogy Research',
                  type: 'TextArea',
                  helperText:
                    "Any genealogy research you've done, interesting family history discoveries, or family stories passed down",
                },
                {
                  key: 'ancestral_origins',
                  label: 'Ancestral Origins',
                  type: 'TextArea',
                  helperText:
                    'Countries or regions where your family originated, immigration stories, or cultural heritage information',
                },
                {
                  key: 'family_stories',
                  label: 'Family Stories & Traditions',
                  type: 'TextArea',
                  helperText:
                    'Important family stories, traditions, or oral history that should be preserved',
                },
                {
                  key: 'genealogy_contacts',
                  label: 'Genealogy Contacts',
                  type: 'TextArea',
                  helperText:
                    "Contact information for relatives who have family history knowledge or genealogy researchers you've worked with",
                },
                {
                  key: 'documents_section',
                  label: 'Family Documents & Research',
                  type: 'Instructions',
                  content:
                    'Upload any family tree documents, genealogy research, DNA test results, or historical family records.',
                },
                {
                  key: 'family_records',
                  label: 'Family Records',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload family tree documents, birth certificates, marriage records, or other genealogy documents',
                },
                {
                  key: 'dna_testing',
                  label: 'DNA Testing Results',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Results from ancestry DNA testing or genetic genealogy services',
                },
              ],
            },
            {
              id: '17B',
              title: 'Family Members',
              repeatable: true,
              itemLabel: 'Family Member',
              fields: [
                {
                  key: 'person_name',
                  label: 'Name',
                  type: 'TextInput',
                  helperText: 'Full name of family member',
                },
                {
                  key: 'relationship',
                  label: 'Relationship',
                  type: 'Dropdown',
                  options: [
                    'Spouse/Partner',
                    'Child',
                    'Parent',
                    'Sibling',
                    'Grandparent',
                    'Grandchild',
                    'In-Law',
                    'Niece/Nephew',
                    'Aunt/Uncle',
                    'Cousin',
                    'Other Family',
                  ],
                  helperText: 'How this person is related to you',
                },
                {
                  key: 'contact_info',
                  label: 'Contact Information',
                  type: 'TextArea',
                  helperText:
                    'Phone numbers, email addresses, and current address',
                },
                {
                  key: 'birthdate',
                  label: 'Birth Date',
                  type: 'DatePicker',
                  helperText: 'Their date of birth',
                },
                {
                  key: 'importance',
                  label: 'Relationship Importance',
                  type: 'TextArea',
                  helperText:
                    'Why this person is important to you, special memories, or what you want your family to know about this relationship',
                },
                {
                  key: 'notify_instructions',
                  label: 'Notification Instructions',
                  type: 'RadioButtons',
                  options: [
                    'Notify Immediately',
                    'Notify Within a Week',
                    'Notify When Convenient',
                    'Do Not Notify',
                  ],
                  helperText: 'How urgently should this person be contacted?',
                },
                {
                  key: 'special_considerations',
                  label: 'Special Considerations',
                  type: 'TextArea',
                  helperText:
                    'Any special circumstances, health issues, or considerations when contacting this person',
                },
                {
                  key: 'photos_mementos',
                  label: 'Photos or Mementos',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload photos or documents related to this person or note where special items for them are located',
                },
              ],
            },
            {
              id: '17C',
              title: 'Dependents',
              repeatable: true,
              itemLabel: 'Dependent',
              fields: [
                {
                  key: 'dependent_name',
                  label: 'Name',
                  type: 'TextInput',
                  helperText: 'Full name of the person who depends on you',
                },
                {
                  key: 'relationship',
                  label: 'Relationship',
                  type: 'Dropdown',
                  options: [
                    'Child',
                    'Stepchild',
                    'Adopted Child',
                    'Parent',
                    'Stepparent',
                    'Grandparent',
                    'Grandchild',
                    'Spouse/Partner',
                    'Sibling',
                    'Other Family Member',
                    'Non-Family Dependent',
                  ],
                  helperText: 'Your relationship to this dependent',
                },
                {
                  key: 'birthdate',
                  label: 'Birth Date',
                  type: 'DatePicker',
                  helperText: 'Their date of birth',
                },
                {
                  key: 'dependency_type',
                  label: 'Type of Dependency',
                  type: 'Dropdown',
                  options: [
                    'Financial Support',
                    'Physical Care',
                    'Medical Care',
                    'Legal Guardianship',
                    'Emotional Support',
                    'Multiple Types',
                  ],
                  helperText: 'Primary way this person depends on you',
                },
                {
                  key: 'support_details',
                  label: 'Support Details',
                  type: 'TextArea',
                  helperText:
                    'Specific details about the support you provide (amount, frequency, type of care, etc.)',
                },
                {
                  key: 'backup_caregivers',
                  label: 'Backup Caregivers',
                  type: 'TextArea',
                  helperText:
                    'Names and contact information of people who could provide care in your absence',
                },
                {
                  key: 'special_needs',
                  label: 'Special Needs or Conditions',
                  type: 'TextArea',
                  helperText:
                    'Any medical conditions, disabilities, or special requirements that need ongoing attention',
                },
                {
                  key: 'future_care_plans',
                  label: 'Future Care Plans',
                  type: 'TextArea',
                  helperText:
                    'Your wishes for their care if you become unable to provide support',
                },
                {
                  key: 'dependency_documents',
                  label: 'Dependency Documentation',
                  type: 'Instructions',
                  content:
                    'Upload any legal documents related to this dependency relationship.',
                },
                {
                  key: 'legal_documents',
                  label: 'Legal Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload guardianship papers, custody agreements, or other legal documents related to this dependency',
                },
                {
                  key: 'financial_accounts',
                  label: 'Related Financial Accounts',
                  type: 'TextArea',
                  helperText:
                    'Any bank accounts, trusts, or financial arrangements set up for this dependent',
                },
              ],
            },
            {
              id: '17D',
              title: 'Close Friends',
              repeatable: true,
              itemLabel: 'Friend',
              fields: [
                {
                  key: 'friend_name',
                  label: 'Name',
                  type: 'TextInput',
                  helperText: 'Full name of your friend',
                },
                {
                  key: 'friendship_type',
                  label: 'Type of Friendship',
                  type: 'Dropdown',
                  options: [
                    'Best Friend',
                    'Close Friend',
                    'Work Friend',
                    'Childhood Friend',
                    'School Friend',
                    'Neighbor',
                    'Activity Partner',
                    'Other',
                  ],
                  helperText: 'How you would describe this friendship',
                },
                {
                  key: 'friendship_type_other',
                  label: 'Please specify other friendship type',
                  type: 'TextInput',
                  helperText: 'Please describe the specific type of friendship',
                  conditionalDisplay: {
                    field: 'friendship_type',
                    value: 'Other',
                  },
                },
                {
                  key: 'contact_info',
                  label: 'Contact Information',
                  type: 'TextArea',
                  helperText:
                    'Phone numbers, email addresses, and current address',
                },
                {
                  key: 'how_we_met',
                  label: 'How We Met',
                  type: 'TextArea',
                  helperText: 'How and when you became friends',
                },
                {
                  key: 'friendship_significance',
                  label: 'Friendship Significance',
                  type: 'TextArea',
                  helperText:
                    'What this friendship means to you, shared experiences, or why this person is special',
                },
                {
                  key: 'notify_instructions',
                  label: 'Notification Instructions',
                  type: 'RadioButtons',
                  options: [
                    'Notify Immediately',
                    'Notify Within a Week',
                    'Notify When Convenient',
                    'Do Not Notify',
                  ],
                  helperText: 'How urgently should this person be contacted?',
                },
                {
                  key: 'shared_memories',
                  label: 'Shared Memories',
                  type: 'TextArea',
                  helperText:
                    'Special memories, inside jokes, or stories you want preserved',
                },
                {
                  key: 'photos_mementos',
                  label: 'Photos or Mementos',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload photos or documents related to this friendship',
                },
              ],
            },
            {
              id: '17E',
              title: 'Important Relationships',
              repeatable: true,
              itemLabel: 'Important Person',
              fields: [
                {
                  key: 'person_name',
                  label: 'Name',
                  type: 'TextInput',
                  helperText: 'Full name of this important person',
                },
                {
                  key: 'relationship_type',
                  label: 'Relationship Type',
                  type: 'Dropdown',
                  options: [
                    'Mentor',
                    'Student/Mentee',
                    'Caregiver',
                    'Former Partner',
                    'Godparent/Godchild',
                    'Family Friend',
                    'Neighbor',
                    'Professional Contact',
                    'Spiritual Guide',
                    'Other',
                  ],
                  helperText: 'How you would describe this relationship',
                },
                {
                  key: 'relationship_type_other',
                  label: 'Please specify other relationship type',
                  type: 'TextInput',
                  helperText:
                    'Please describe the specific type of relationship',
                  conditionalDisplay: {
                    field: 'relationship_type',
                    value: 'Other',
                  },
                },
                {
                  key: 'contact_info',
                  label: 'Contact Information',
                  type: 'TextArea',
                  helperText:
                    'Phone numbers, email addresses, and current address',
                },
                {
                  key: 'relationship_significance',
                  label: 'Relationship Significance',
                  type: 'TextArea',
                  helperText:
                    'Why this person is important to you and what your family should know about this relationship',
                },
                {
                  key: 'notify_instructions',
                  label: 'Notification Instructions',
                  type: 'RadioButtons',
                  options: [
                    'Notify Immediately',
                    'Notify Within a Week',
                    'Notify When Convenient',
                    'Do Not Notify',
                  ],
                  helperText: 'How urgently should this person be contacted?',
                },
                {
                  key: 'special_notes',
                  label: 'Special Notes',
                  type: 'TextArea',
                  helperText:
                    'Any special information, messages, or considerations regarding this person',
                },
                {
                  key: 'relationship_documents',
                  label: 'Related Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload photos, letters, or documents related to this relationship',
                },
              ],
            },
            {
              id: '17F',
              title: 'Memorabilia & Sentimental Items',
              repeatable: true,
              itemLabel: 'Sentimental Item',
              fields: [
                {
                  key: 'item_name',
                  label: 'Item Name/Description',
                  type: 'TextInput',
                  helperText:
                    'Name or brief description of the sentimental item',
                },
                {
                  key: 'item_type',
                  label: 'Type of Item',
                  type: 'Dropdown',
                  options: [
                    'Family Heirloom',
                    'Photo Album',
                    'Jewelry',
                    'Artwork',
                    'Books/Documents',
                    'Clothing/Textiles',
                    'Furniture',
                    'Religious/Spiritual Items',
                    'Military Memorabilia',
                    'Childhood Keepsakes',
                    'Letters/Correspondence',
                    'Other',
                  ],
                  helperText: 'Category that best describes this item',
                },
                {
                  key: 'item_type_other',
                  label: 'Please specify other item type',
                  type: 'TextInput',
                  helperText:
                    'Please describe the specific type of sentimental item',
                  conditionalDisplay: { field: 'item_type', value: 'Other' },
                },
                {
                  key: 'sentimental_value',
                  label: 'Sentimental Value & Story',
                  type: 'TextArea',
                  helperText:
                    'Why this item is special to you, its history, and what it means to your family',
                },
                {
                  key: 'current_location',
                  label: 'Current Location',
                  type: 'TextInput',
                  helperText:
                    'Where this item is currently stored or displayed',
                },
                {
                  key: 'intended_recipient',
                  label: 'Intended Recipient',
                  type: 'TextInput',
                  helperText:
                    'Who you would like to inherit or receive this item',
                },
                {
                  key: 'care_instructions',
                  label: 'Care Instructions',
                  type: 'TextArea',
                  helperText:
                    'Any special care, handling, or storage instructions for this item',
                },
                {
                  key: 'estimated_value',
                  label: 'Estimated Value',
                  type: 'TextInput',
                  helperText:
                    'Approximate monetary value if known (for insurance purposes)',
                },
                {
                  key: 'item_documentation',
                  label: 'Item Documentation',
                  type: 'Instructions',
                  content:
                    'Upload photos and any documentation related to this sentimental item.',
                },
                {
                  key: 'documentation',
                  label: 'Photos or Documentation',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload photos of the item or any documentation about its history or value',
                },
              ],
            },
            {
              id: '17G',
              title: 'Pet Care & Records',
              repeatable: true,
              itemLabel: 'Pet',
              fields: [
                {
                  key: 'pet_name',
                  label: 'Pet Name',
                  type: 'TextInput',
                  helperText: "Your pet's name",
                },
                {
                  key: 'pet_type',
                  label: 'Type of Pet',
                  type: 'Dropdown',
                  options: [
                    'Dog',
                    'Cat',
                    'Bird',
                    'Fish',
                    'Rabbit',
                    'Hamster/Guinea Pig',
                    'Reptile',
                    'Horse',
                    'Farm Animal',
                    'Exotic Pet',
                    'Other',
                  ],
                  helperText: 'What type of animal your pet is',
                },
                {
                  key: 'pet_type_other',
                  label: 'Please specify other pet type',
                  type: 'TextInput',
                  helperText: 'Please describe the specific type of pet',
                  conditionalDisplay: { field: 'pet_type', value: 'Other' },
                },
                {
                  key: 'breed_age',
                  label: 'Breed & Age',
                  type: 'TextInput',
                  helperText: "Pet's breed and approximate age or birth date",
                },
                {
                  key: 'veterinarian',
                  label: 'Veterinarian',
                  type: 'TextArea',
                  helperText:
                    "Name, address, and phone number of your pet's veterinarian",
                },
                {
                  key: 'medical_history',
                  label: 'Medical History',
                  type: 'TextArea',
                  helperText:
                    'Any ongoing medical conditions, medications, or special health needs',
                },
                {
                  key: 'feeding_care',
                  label: 'Feeding & Care Instructions',
                  type: 'TextArea',
                  helperText:
                    'Daily care routine, feeding schedule, favorite foods, exercise needs, and behavioral notes',
                },
                {
                  key: 'emergency_contact',
                  label: 'Emergency Pet Contact',
                  type: 'TextArea',
                  helperText:
                    'Contact information for someone who could care for your pet in an emergency',
                },
                {
                  key: 'long_term_care',
                  label: 'Long-term Care Plans',
                  type: 'TextArea',
                  helperText:
                    "Your wishes for your pet's care if you become unable to care for them",
                },
                {
                  key: 'pet_supplies',
                  label: 'Pet Supplies & Equipment',
                  type: 'TextArea',
                  helperText:
                    'Location of pet supplies, equipment, and any special items your pet needs',
                },
                {
                  key: 'registration_microchip',
                  label: 'Registration & Microchip',
                  type: 'TextArea',
                  helperText:
                    'Registration numbers, microchip information, or license details',
                },
                {
                  key: 'pet_documentation',
                  label: 'Pet Records & Documentation',
                  type: 'Instructions',
                  content:
                    'Upload veterinary records, vaccination certificates, and photos of your pet.',
                },
                {
                  key: 'veterinary_records',
                  label: 'Veterinary Records',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload vaccination records, medical records, or photos of your pet',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'chunk9',
      title: 'Employment & Income',
      sections: [
        {
          id: '18',
          title: 'Employment & Business',
          subsections: [
            {
              id: '18A',
              title: 'Current Employment',
              fields: [
                {
                  key: 'employment_status',
                  label: 'Employment Status',
                  type: 'RadioButtons',
                  options: [
                    'Employed Full-Time',
                    'Employed Part-Time',
                    'Self-Employed',
                    'Business Owner',
                    'Retired',
                    'Unemployed',
                    'Disabled',
                    'Other',
                  ],
                  helperText: 'Your current employment situation',
                },
                {
                  key: 'employer_name',
                  label: 'Employer/Company Name',
                  type: 'TextInput',
                  helperText: 'Name of your current employer or company',
                  conditionalDisplay: {
                    field: 'employment_status',
                    value: ['Employed Full-Time', 'Employed Part-Time'],
                  },
                },
                {
                  key: 'job_title',
                  label: 'Job Title/Position',
                  type: 'TextInput',
                  helperText: 'Your current job title or position',
                },
                {
                  key: 'work_address',
                  label: 'Work Address',
                  type: 'TextArea',
                  helperText: 'Address of your workplace',
                },
                {
                  key: 'work_phone',
                  label: 'Work Phone Number',
                  type: 'TextInput',
                  helperText: 'Main phone number for your workplace',
                },
                {
                  key: 'supervisor_hr',
                  label: 'Supervisor/HR Contact',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Contact information for your supervisor or HR department',
                },
                {
                  key: 'employee_id',
                  label: 'Employee ID',
                  type: 'TextInput',
                  helperText: 'Your employee identification number',
                },
                {
                  key: 'start_date',
                  label: 'Start Date',
                  type: 'DatePicker',
                  helperText: 'When you started this job',
                },
                {
                  key: 'salary_wage',
                  label: 'Salary/Wage Information',
                  type: 'TextArea',
                  helperText: 'Annual salary or hourly wage information',
                },
                {
                  key: 'benefits',
                  label: 'Employment Benefits',
                  type: 'TextArea',
                  helperText:
                    'Health insurance, retirement plans, life insurance, or other benefits through work',
                },
                {
                  key: 'vacation_sick_time',
                  label: 'Vacation/Sick Time',
                  type: 'TextArea',
                  helperText:
                    'Accrued vacation time, sick leave, or PTO balances',
                },
                {
                  key: 'work_equipment',
                  label: 'Company Equipment',
                  type: 'TextArea',
                  helperText:
                    'Company-owned equipment you have (laptop, phone, car, tools, etc.)',
                },
                {
                  key: 'employment_documents',
                  label: 'Employment Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload employee handbook, benefits information, or contracts',
                },
              ],
            },
            {
              id: '18B',
              title: 'Business Ownership',
              repeatable: true,
              itemLabel: 'Business',
              fields: [
                {
                  key: 'business_name',
                  label: 'Business Name',
                  type: 'TextInput',
                  helperText: 'Legal name of your business',
                },
                {
                  key: 'business_type',
                  label: 'Business Type',
                  type: 'Dropdown',
                  options: [
                    'Sole Proprietorship',
                    'Partnership',
                    'LLC',
                    'Corporation',
                    'S-Corporation',
                    'Non-Profit',
                    'Other',
                  ],
                  helperText: 'Legal structure of your business',
                },
                {
                  key: 'business_type_other',
                  label: 'Please specify other business type',
                  type: 'TextInput',
                  helperText:
                    'Please describe the specific type of business structure',
                  conditionalDisplay: {
                    field: 'business_type',
                    value: 'Other',
                  },
                },
                {
                  key: 'business_address',
                  label: 'Business Address',
                  type: 'TextArea',
                  helperText: 'Physical address of your business',
                },
                {
                  key: 'business_phone',
                  label: 'Business Phone',
                  type: 'TextInput',
                  helperText: 'Main business phone number',
                },
                {
                  key: 'tax_id',
                  label: 'Tax ID/EIN',
                  type: 'TextInput',
                  helperText: 'Business tax identification number',
                },
                {
                  key: 'business_description',
                  label: 'Business Description',
                  type: 'TextArea',
                  helperText:
                    'What your business does and main services/products',
                },
                {
                  key: 'ownership_percentage',
                  label: 'Ownership Percentage',
                  type: 'TextInput',
                  helperText: 'Your percentage of ownership in this business',
                },
                {
                  key: 'business_partners',
                  label: 'Business Partners',
                  type: 'TextArea',
                  helperText:
                    'Names and contact information of business partners or co-owners',
                },
                {
                  key: 'key_employees',
                  label: 'Key Employees',
                  type: 'TextArea',
                  helperText:
                    'Important employees and their contact information',
                },
                {
                  key: 'succession_plan',
                  label: 'Business Succession Plan',
                  type: 'TextArea',
                  helperText:
                    'Plans for business continuation or sale upon your death or incapacity',
                },
                {
                  key: 'business_attorney',
                  label: 'Business Attorney/Advisor',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Contact information for business attorney, accountant, or advisor',
                },
                {
                  key: 'business_accounts',
                  label: 'Business Financial Accounts',
                  type: 'TextArea',
                  helperText:
                    'Business bank accounts, credit cards, or financial accounts',
                },
                {
                  key: 'business_documents',
                  label: 'Business Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload business formation documents, partnerships agreements, or important contracts',
                },
              ],
            },
            {
              id: '18C',
              title: 'Past Employment',
              repeatable: true,
              itemLabel: 'Previous Job',
              fields: [
                {
                  key: 'employer_name',
                  label: 'Employer Name',
                  type: 'TextInput',
                  helperText: 'Company or organization name',
                },
                {
                  key: 'job_title',
                  label: 'Job Title/Position',
                  type: 'TextInput',
                  helperText: 'Your position or title at this employer',
                },
                {
                  key: 'employment_dates',
                  label: 'Employment Dates',
                  type: 'TextInput',
                  helperText: 'Start and end dates (e.g., Jan 2010 - Dec 2015)',
                },
                {
                  key: 'job_description',
                  label: 'Job Description',
                  type: 'TextArea',
                  helperText:
                    'Brief description of your role and responsibilities',
                },
                {
                  key: 'employer_address',
                  label: 'Employer Address',
                  type: 'TextArea',
                  helperText: 'Company address and contact information',
                },
                {
                  key: 'supervisor_contact',
                  label: 'Supervisor/HR Contact',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Contact information for former supervisor or HR department',
                },
                {
                  key: 'reason_for_leaving',
                  label: 'Reason for Leaving',
                  type: 'TextArea',
                  helperText: 'Why you left this position',
                },
                {
                  key: 'achievements',
                  label: 'Key Achievements',
                  type: 'TextArea',
                  helperText:
                    'Notable accomplishments or contributions in this role',
                },
                {
                  key: 'employment_documents',
                  label: 'Employment Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload employment letters, performance reviews, or other relevant documents',
                },
              ],
            },
            {
              id: '18D',
              title: 'Income Sources',
              repeatable: true,
              itemLabel: 'Income Source',
              fields: [
                {
                  key: 'income_type',
                  label: 'Type of Income',
                  type: 'Dropdown',
                  options: [
                    'Salary/Wages',
                    'Social Security',
                    'Pension',
                    'Retirement Account Distributions',
                    'Investment Income',
                    'Rental Income',
                    'Business Income',
                    'Freelance/Contract Work',
                    'Disability Benefits',
                    'Alimony',
                    'Other',
                  ],
                  helperText: 'Category of this income source',
                },
                {
                  key: 'income_type_other',
                  label: 'Please specify other income type',
                  type: 'TextInput',
                  helperText: 'Please describe the specific type of income',
                  conditionalDisplay: { field: 'income_type', value: 'Other' },
                },
                {
                  key: 'income_source',
                  label: 'Income Source',
                  type: 'TextInput',
                  helperText:
                    'Where this income comes from (employer, government, investment company, etc.)',
                },
                {
                  key: 'income_amount',
                  label: 'Income Amount',
                  type: 'TextInput',
                  helperText:
                    'Amount and frequency (e.g., $3,000/month, $50,000/year)',
                },
                {
                  key: 'payment_method',
                  label: 'Payment Method',
                  type: 'TextArea',
                  helperText:
                    'How you receive this income (direct deposit, check, etc.)',
                },
                {
                  key: 'tax_withholding',
                  label: 'Tax Withholding',
                  type: 'TextArea',
                  helperText:
                    'Information about taxes withheld from this income',
                },
                {
                  key: 'income_contact',
                  label: 'Contact Information',
                  type: 'TextInputWithUpload',
                  helperText: 'Contact information for this income source',
                },
                {
                  key: 'income_documents',
                  label: 'Income Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload pay stubs, 1099s, benefit statements, or other income documentation',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'chunk10',
      title: 'Assets & Valuables',
      sections: [
        {
          id: '19',
          title: 'Assets & Valuables',
          subsections: [
            {
              id: '19A',
              title: 'Valuable Items',
              repeatable: true,
              itemLabel: 'Asset/Valuable',
              fields: [
                {
                  key: 'item_type',
                  label: 'Type of Item',
                  type: 'Dropdown',
                  options: [
                    'Jewelry',
                    'Artwork',
                    'Collectibles',
                    'Antiques',
                    'Precious Metals',
                    'Coins/Currency',
                    'Electronics',
                    'Musical Instruments',
                    'Sports Memorabilia',
                    'Books/Documents',
                    'Furniture',
                    'Tools/Equipment',
                    'Other',
                  ],
                  helperText: 'Category of valuable item',
                },
                {
                  key: 'item_type_other',
                  label: 'Please specify other item type',
                  type: 'TextInput',
                  helperText:
                    'Please describe the specific type of valuable item',
                  conditionalDisplay: { field: 'item_type', value: 'Other' },
                },
                {
                  key: 'item_description',
                  label: 'Item Description',
                  type: 'TextArea',
                  helperText:
                    'Detailed description of the item including brand, model, characteristics',
                },
                {
                  key: 'estimated_value',
                  label: 'Estimated Value',
                  type: 'TextInput',
                  helperText: 'Approximate current value of the item',
                },
                {
                  key: 'purchase_info',
                  label: 'Purchase Information',
                  type: 'TextArea',
                  helperText: 'When and where purchased, original cost',
                },
                {
                  key: 'current_location',
                  label: 'Current Location',
                  type: 'TextArea',
                  helperText:
                    'Where this item is currently stored or displayed',
                },
                {
                  key: 'insurance_info',
                  label: 'Insurance Information',
                  type: 'TextArea',
                  helperText:
                    'Whether item is insured, policy details, or coverage amount',
                },
                {
                  key: 'appraisal_info',
                  label: 'Appraisal Information',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Professional appraisals, certificates of authenticity, or valuation documents',
                },
                {
                  key: 'intended_recipient',
                  label: 'Intended Recipient',
                  type: 'TextArea',
                  helperText: 'Who you want to inherit this item',
                },
                {
                  key: 'care_instructions',
                  label: 'Care Instructions',
                  type: 'TextArea',
                  helperText:
                    'Special care, maintenance, or storage requirements',
                },
                {
                  key: 'item_history',
                  label: 'Item History/Significance',
                  type: 'TextArea',
                  helperText:
                    'Family history, sentimental value, or why this item is important',
                },
                {
                  key: 'item_documents',
                  label: 'Item Documentation',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload photos, receipts, certificates, or other documentation',
                },
              ],
            },
            {
              id: '19B',
              title: 'Real Estate Properties',
              repeatable: true,
              itemLabel: 'Property',
              fields: [
                {
                  key: 'property_type',
                  label: 'Property Type',
                  type: 'Dropdown',
                  options: [
                    'Residential Rental',
                    'Commercial Property',
                    'Vacant Land',
                    'Investment Property',
                    'Vacation Home',
                    'Mobile Home',
                    'Condo/Townhouse',
                    'Farm/Agricultural',
                    'Other',
                  ],
                  helperText: 'Type of real estate property',
                },
                {
                  key: 'property_type_other',
                  label: 'Please specify other property type',
                  type: 'TextInput',
                  helperText:
                    'Please describe the specific type of real estate property',
                  conditionalDisplay: {
                    field: 'property_type',
                    value: 'Other',
                  },
                },
                {
                  key: 'property_address',
                  label: 'Property Address',
                  type: 'TextArea',
                  helperText: 'Complete address of the property',
                },
                {
                  key: 'property_description',
                  label: 'Property Description',
                  type: 'TextArea',
                  helperText:
                    'Description of the property, size, features, etc.',
                },
                {
                  key: 'ownership_details',
                  label: 'Ownership Details',
                  type: 'TextArea',
                  helperText:
                    'How property is owned (sole, joint, trust, etc.) and ownership percentages',
                },
                {
                  key: 'purchase_info',
                  label: 'Purchase Information',
                  type: 'TextArea',
                  helperText: 'When purchased, purchase price, and from whom',
                },
                {
                  key: 'current_value',
                  label: 'Current Estimated Value',
                  type: 'TextInput',
                  helperText: 'Current estimated market value',
                },
                {
                  key: 'mortgage_info',
                  label: 'Mortgage Information',
                  type: 'TextArea',
                  helperText:
                    'Outstanding mortgage balance, lender, payment details',
                },
                {
                  key: 'rental_info',
                  label: 'Rental Information',
                  type: 'TextArea',
                  helperText:
                    'If rental property, tenant information, lease details, rental income',
                },
                {
                  key: 'property_manager',
                  label: 'Property Manager',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Contact information for property manager or management company',
                },
                {
                  key: 'property_taxes',
                  label: 'Property Tax Information',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Annual property taxes, payment method, and upload tax bills',
                },
                {
                  key: 'insurance_info',
                  label: 'Property Insurance',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Insurance company, policy number, coverage details',
                },
                {
                  key: 'intended_disposition',
                  label: 'Intended Disposition',
                  type: 'TextArea',
                  helperText:
                    'Your wishes for this property (sell, keep in family, specific heir, etc.)',
                },
                {
                  key: 'property_documents',
                  label: 'Property Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload deeds, surveys, appraisals, or other property documents',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'chunk11',
      title: 'Legal Documents',
      sections: [
        {
          id: '20',
          title: 'Legal Documents & Records',
          subsections: [
            {
              id: '20A',
              title: 'Personal Legal Documents',
              fields: [
                {
                  key: 'legal_documents_instructions',
                  label: 'Legal Documents Overview',
                  type: 'Instructions',
                  content:
                    "To help your executors and trustees efficiently settle your estate, it's essential to keep organized records of your legal documents. This section is dedicated to storing copies of essential paperwork related to your personal and financial affairs. Consider storing the originals in your fireproof document bag.",
                },

                {
                  key: 'identification_documents_header',
                  label: 'Identification Documents',
                  type: 'Instructions',
                  content:
                    'Essential identification documents for estate settlement and official processes',
                },
                {
                  key: 'birth_certificate',
                  label: 'Birth Certificate',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload copy of birth certificate or note location of original',
                },
                {
                  key: 'social_security_card',
                  label: 'Social Security Card',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload copy of Social Security card or note location',
                },
                {
                  key: 'passport',
                  label: 'Passport',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload copy of current passport or note location',
                },
                {
                  key: 'drivers_license',
                  label: "Driver's License",
                  type: 'TextInputWithUpload',
                  helperText:
                    "Upload copy of current driver's license or state ID",
                },
                {
                  key: 'marriage_certificate',
                  label: 'Marriage Certificate',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload copy of marriage certificate(s) or note location',
                },
                {
                  key: 'divorce_decree',
                  label: 'Divorce Decree',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload copies of divorce decrees or legal separation documents',
                },
                {
                  key: 'name_change_documents',
                  label: 'Name Change Documents',
                  type: 'TextInputWithUpload',
                  helperText: 'Legal documents for any name changes',
                },

                {
                  key: 'citizenship_documents_header',
                  label: 'Citizenship & Immigration Documents',
                  type: 'Instructions',
                  content:
                    'Documents proving citizenship or immigration status',
                },
                {
                  key: 'naturalization_certificate',
                  label: 'Naturalization Certificate',
                  type: 'TextInputWithUpload',
                  helperText: 'Certificate of naturalization or citizenship',
                },
                {
                  key: 'immigration_documents',
                  label: 'Immigration Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Green card, visa, or other immigration documents',
                },

                {
                  key: 'family_documents_header',
                  label: 'Family Documents',
                  type: 'Instructions',
                  content:
                    'Documents related to children and family relationships',
                },
                {
                  key: 'children_birth_certificates',
                  label: "Children's Birth Certificates",
                  type: 'TextInputWithUpload',
                  helperText: 'Birth certificates for all children',
                },
                {
                  key: 'adoption_documents',
                  label: 'Adoption Documents',
                  type: 'TextInputWithUpload',
                  helperText: 'Adoption papers or legal guardianship documents',
                },
                {
                  key: 'custody_agreements',
                  label: 'Custody Agreements',
                  type: 'TextInputWithUpload',
                  helperText: 'Child custody or visitation agreements',
                },
              ],
            },
            {
              id: '20B',
              title: 'Tax Documents',
              fields: [
                {
                  key: 'tax_documents_instructions',
                  label: 'Tax Documents Overview',
                  type: 'Instructions',
                  content:
                    'When managing an estate or trust, executors or trustees are required to file annual tax returns until the estate is fully settled. Keeping tax documents well-organized will make this process much smoother and less stressful for your loved ones.',
                },

                {
                  key: 'current_tax_year',
                  label: 'Current Tax Year Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload current year tax returns, W-2s, 1099s, and supporting documents',
                },
                {
                  key: 'previous_tax_years',
                  label: 'Previous Tax Years',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload tax returns for previous 3-7 years (recommended for audit protection)',
                },
                {
                  key: 'tax_preparer_info',
                  label: 'Tax Preparer Information',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Contact information for your tax preparer or CPA',
                },
                {
                  key: 'tax_software',
                  label: 'Tax Software Information',
                  type: 'TextArea',
                  helperText:
                    'If you use tax software, include login information and where files are stored',
                },
                {
                  key: 'business_tax_documents',
                  label: 'Business Tax Documents',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Business tax returns, partnership returns, or corporate tax documents',
                },
                {
                  key: 'estimated_tax_payments',
                  label: 'Estimated Tax Payments',
                  type: 'TextArea',
                  helperText:
                    'Information about quarterly estimated tax payments',
                },
                {
                  key: 'tax_debt_issues',
                  label: 'Tax Debt or Issues',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Any outstanding tax debt, payment plans, or IRS correspondence',
                },
              ],
            },
            {
              id: '20C',
              title: 'Other Important Documents',
              repeatable: true,
              itemLabel: 'Document',
              fields: [
                {
                  key: 'document_type',
                  label: 'Document Type',
                  type: 'Dropdown',
                  options: [
                    'Contract',
                    'Lease Agreement',
                    'Loan Document',
                    'Insurance Policy',
                    'Professional License',
                    'Academic Diploma',
                    'Award/Certificate',
                    'Legal Settlement',
                    'Court Order',
                    'Power of Attorney',
                    'Other',
                  ],
                  helperText: 'Type of legal or important document',
                },
                {
                  key: 'document_description',
                  label: 'Document Description',
                  type: 'TextArea',
                  helperText:
                    "Brief description of what this document is and why it's important",
                },
                {
                  key: 'parties_involved',
                  label: 'Parties Involved',
                  type: 'TextArea',
                  helperText:
                    'Names of other parties, companies, or institutions involved',
                },
                {
                  key: 'important_dates',
                  label: 'Important Dates',
                  type: 'TextArea',
                  helperText:
                    'Effective dates, expiration dates, or other important deadlines',
                },
                {
                  key: 'document_location',
                  label: 'Document Location',
                  type: 'TextArea',
                  helperText: 'Where the original document is stored',
                },
                {
                  key: 'renewal_requirements',
                  label: 'Renewal Requirements',
                  type: 'TextArea',
                  helperText:
                    'If this document requires renewal, maintenance, or ongoing action',
                },
                {
                  key: 'contact_information',
                  label: 'Related Contact Information',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Contact information for lawyers, institutions, or other parties related to this document',
                },
                {
                  key: 'document_upload',
                  label: 'Document Copy',
                  type: 'TextInputWithUpload',
                  helperText: 'Upload a copy of this document',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'chunk12',
      title: 'Estate Planning',
      sections: [
        {
          id: '21',
          title: 'Estate Planning & Final Wishes',
          subsections: [
            {
              id: '21A',
              title: 'Estate Planning Documents',
              fields: [
                {
                  key: 'estate_planning_instructions',
                  label: 'Estate Planning Overview',
                  type: 'Instructions',
                  content:
                    'Document your estate planning documents and end-of-life wishes to ensure your loved ones can honor your intentions and manage your affairs properly. This section helps organize critical legal documents including wills, trusts, powers of attorney, and healthcare directives, along with your personal wishes for ceremonies and final arrangements.',
                },

                {
                  key: 'will_testament_header',
                  label: 'Will & Testament',
                  type: 'Instructions',
                  content:
                    'Your will is the foundational document for estate planning',
                },
                {
                  key: 'will_location',
                  label: 'Will Location',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Where your original will is stored and upload a copy if desired',
                },
                {
                  key: 'will_date',
                  label: 'Will Date',
                  type: 'DatePicker',
                  helperText: 'Date your current will was signed',
                },
                {
                  key: 'executor_info',
                  label: 'Executor Information',
                  type: 'TextArea',
                  helperText:
                    'Name and contact information of your executor(s)',
                },
                {
                  key: 'alternate_executor',
                  label: 'Alternate Executor',
                  type: 'TextArea',
                  helperText:
                    'Name and contact information of alternate executor',
                },
                {
                  key: 'will_attorney',
                  label: 'Estate Attorney',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Contact information for the attorney who prepared your will',
                },

                {
                  key: 'trust_documents_header',
                  label: 'Trust Documents',
                  type: 'Instructions',
                  content:
                    'If you have established any trusts as part of your estate plan',
                },
                {
                  key: 'trust_info',
                  label: 'Trust Information',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload trust documents or note their location, include trust names and types',
                },
                {
                  key: 'trustee_info',
                  label: 'Trustee Information',
                  type: 'TextArea',
                  helperText:
                    'Names and contact information of current trustees',
                },
                {
                  key: 'successor_trustee',
                  label: 'Successor Trustee',
                  type: 'TextArea',
                  helperText:
                    'Names and contact information of successor trustees',
                },
                {
                  key: 'trust_attorney',
                  label: 'Trust Attorney',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Contact information for attorney who prepared trust documents',
                },

                {
                  key: 'power_of_attorney_header',
                  label: 'Powers of Attorney',
                  type: 'Instructions',
                  content: 'Documents that allow others to act on your behalf',
                },
                {
                  key: 'financial_poa',
                  label: 'Financial Power of Attorney',
                  type: 'TextInputWithUpload',
                  helperText:
                    "Upload financial POA or note location, include agent's contact information",
                },
                {
                  key: 'medical_poa',
                  label: 'Medical Power of Attorney',
                  type: 'TextInputWithUpload',
                  helperText:
                    "Upload medical POA or note location, include agent's contact information",
                },

                {
                  key: 'healthcare_directives_header',
                  label: 'Healthcare Directives',
                  type: 'Instructions',
                  content: 'Documents expressing your healthcare wishes',
                },
                {
                  key: 'living_will',
                  label: 'Living Will/Advance Directive',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload living will or advance directive documents',
                },
                {
                  key: 'dnr_orders',
                  label: 'DNR Orders',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Do Not Resuscitate orders or similar medical directives',
                },
                {
                  key: 'organ_donation',
                  label: 'Organ Donation Instructions',
                  type: 'TextArea',
                  helperText: 'Your wishes regarding organ and tissue donation',
                },

                {
                  key: 'beneficiary_info_header',
                  label: 'Beneficiary Information',
                  type: 'Instructions',
                  content:
                    'Summary of your major beneficiaries and inheritance instructions',
                },
                {
                  key: 'primary_beneficiaries',
                  label: 'Primary Beneficiaries',
                  type: 'TextArea',
                  helperText:
                    'Names and contact information of your primary beneficiaries',
                },
                {
                  key: 'contingent_beneficiaries',
                  label: 'Contingent Beneficiaries',
                  type: 'TextArea',
                  helperText:
                    'Names and contact information of contingent/alternate beneficiaries',
                },
                {
                  key: 'special_bequests',
                  label: 'Special Bequests',
                  type: 'TextArea',
                  helperText:
                    'Specific items or amounts left to particular people',
                },
                {
                  key: 'charitable_bequests',
                  label: 'Charitable Bequests',
                  type: 'TextArea',
                  helperText:
                    'Donations or bequests to charitable organizations',
                },
              ],
            },
            {
              id: '21B',
              title: 'Final Arrangements & Wishes',
              fields: [
                {
                  key: 'final_arrangements_instructions',
                  label: 'Final Arrangements Overview',
                  type: 'Instructions',
                  content:
                    'Having this information organized will provide peace of mind and clear guidance for your family during difficult times. These are your personal wishes and preferences for your final arrangements.',
                },

                {
                  key: 'funeral_preferences_header',
                  label: 'Funeral/Memorial Preferences',
                  type: 'Instructions',
                  content: 'Your preferences for funeral or memorial services',
                },
                {
                  key: 'funeral_type',
                  label: 'Type of Service',
                  type: 'RadioButtons',
                  options: [
                    'Traditional Funeral',
                    'Memorial Service',
                    'Celebration of Life',
                    'No Service',
                    'Other',
                  ],
                  helperText: 'Your preference for the type of service',
                },
                {
                  key: 'funeral_type_other',
                  label: 'Please specify other type of service',
                  type: 'TextArea',
                  helperText:
                    'Please describe the specific type of service you prefer',
                  conditionalDisplay: { field: 'funeral_type', value: 'Other' },
                },
                {
                  key: 'service_location',
                  label: 'Service Location',
                  type: 'TextArea',
                  helperText:
                    "Where you'd like the service held (church, funeral home, specific location)",
                },
                {
                  key: 'funeral_home',
                  label: 'Preferred Funeral Home',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Contact information for preferred funeral home or mortuary',
                },
                {
                  key: 'clergy_officiant',
                  label: 'Clergy/Officiant',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Contact information for preferred clergy or person to officiate',
                },
                {
                  key: 'service_preferences',
                  label: 'Service Preferences',
                  type: 'TextArea',
                  helperText:
                    'Specific requests for music, readings, flowers, or other service elements',
                },

                {
                  key: 'disposition_preferences_header',
                  label: 'Body Disposition Preferences',
                  type: 'Instructions',
                  content: 'Your wishes for the disposition of your body',
                },
                {
                  key: 'disposition_type',
                  label: 'Disposition Preference',
                  type: 'RadioButtons',
                  options: [
                    'Burial',
                    'Cremation',
                    'Donation to Science',
                    'Other',
                  ],
                  helperText: 'Your preference for body disposition',
                },
                {
                  key: 'disposition_type_other',
                  label: 'Please specify other disposition preference',
                  type: 'TextArea',
                  helperText:
                    'Please describe your specific body disposition preference',
                  conditionalDisplay: {
                    field: 'disposition_type',
                    value: 'Other',
                  },
                },
                {
                  key: 'burial_location',
                  label: 'Burial Location',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Specific cemetery, plot information, or upload cemetery deeds',
                  conditionalDisplay: {
                    field: 'disposition_type',
                    value: 'Burial',
                  },
                },
                {
                  key: 'cremation_preferences',
                  label: 'Cremation Preferences',
                  type: 'TextArea',
                  helperText:
                    'Wishes for ashes (burial, scattering, kept by family, etc.)',
                  conditionalDisplay: {
                    field: 'disposition_type',
                    value: 'Cremation',
                  },
                },
                {
                  key: 'body_donation_info',
                  label: 'Body Donation Information',
                  type: 'TextInputWithUpload',
                  helperText: 'Information about donation arrangements',
                  conditionalDisplay: {
                    field: 'disposition_type',
                    value: 'Donation to Science',
                  },
                },

                {
                  key: 'memorial_preferences_header',
                  label: 'Memorial Preferences',
                  type: 'Instructions',
                  content: 'Your preferences for memorials and remembrances',
                },
                {
                  key: 'headstone_marker',
                  label: 'Headstone/Marker Preferences',
                  type: 'TextArea',
                  helperText:
                    'Preferences for headstone, marker, or memorial inscription',
                },
                {
                  key: 'memorial_donations',
                  label: 'Memorial Donations',
                  type: 'TextArea',
                  helperText:
                    'Charities where memorial donations should be directed',
                },
                {
                  key: 'special_requests',
                  label: 'Special Requests',
                  type: 'TextArea',
                  helperText:
                    'Any other special requests or wishes for your final arrangements',
                },

                {
                  key: 'obituary_information_header',
                  label: 'Obituary Information',
                  type: 'Instructions',
                  content: 'Information to help write your obituary',
                },
                {
                  key: 'obituary_details',
                  label: 'Obituary Details',
                  type: 'TextArea',
                  helperText:
                    "Key information you'd like included in your obituary (achievements, family, interests)",
                },
                {
                  key: 'photo_for_obituary',
                  label: 'Photo for Obituary',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload preferred photo for obituary or note location',
                },

                {
                  key: 'prepaid_arrangements_header',
                  label: 'Prepaid Arrangements',
                  type: 'Instructions',
                  content:
                    'Information about any prepaid funeral or burial arrangements',
                },
                {
                  key: 'prepaid_funeral',
                  label: 'Prepaid Funeral Arrangements',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Information about prepaid funeral arrangements and upload contracts',
                },
                {
                  key: 'cemetery_plot',
                  label: 'Cemetery Plot Ownership',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Information about owned cemetery plots and upload deeds',
                },
                {
                  key: 'funeral_insurance',
                  label: 'Funeral Insurance',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Information about funeral or burial insurance policies',
                },
              ],
            },
            {
              id: '21C',
              title: 'Guardianship Arrangements',
              fields: [
                {
                  key: 'guardianship_instructions',
                  label: 'Guardianship Overview',
                  type: 'Instructions',
                  content:
                    "If you have minor children, it's essential to designate guardians who will care for them if something happens to you and your spouse/partner. This section helps organize your guardianship preferences and instructions for the care of your children.",
                },

                {
                  key: 'minor_children_header',
                  label: 'Minor Children Information',
                  type: 'Instructions',
                  content:
                    'Information about your minor children who would need guardianship',
                },
                {
                  key: 'minor_children_info',
                  label: 'Minor Children Details',
                  type: 'TextArea',
                  helperText:
                    'Names, birthdates, and current ages of your minor children',
                },

                {
                  key: 'primary_guardian_header',
                  label: 'Primary Guardian',
                  type: 'Instructions',
                  content:
                    'Your first choice for guardian of your minor children',
                },
                {
                  key: 'primary_guardian_name',
                  label: 'Primary Guardian Name',
                  type: 'TextInput',
                  helperText: 'Full legal name of your chosen primary guardian',
                },
                {
                  key: 'primary_guardian_relationship',
                  label: 'Relationship to Children',
                  type: 'TextInput',
                  helperText:
                    'How this person is related to you or your children',
                },
                {
                  key: 'primary_guardian_contact',
                  label: 'Primary Guardian Contact',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Complete contact information for primary guardian',
                },
                {
                  key: 'primary_guardian_consent',
                  label: 'Guardian Consent Status',
                  type: 'RadioButtons',
                  options: [
                    'Agreed to serve',
                    'Needs to be asked',
                    'Verbal agreement only',
                    'Written agreement',
                  ],
                  helperText:
                    'Has this person formally agreed to serve as guardian?',
                },

                {
                  key: 'alternate_guardian_header',
                  label: 'Alternate Guardian',
                  type: 'Instructions',
                  content:
                    'Your second choice if the primary guardian cannot serve',
                },
                {
                  key: 'alternate_guardian_name',
                  label: 'Alternate Guardian Name',
                  type: 'TextInput',
                  helperText:
                    'Full legal name of your alternate guardian choice',
                },
                {
                  key: 'alternate_guardian_relationship',
                  label: 'Relationship to Children',
                  type: 'TextInput',
                  helperText:
                    'How this person is related to you or your children',
                },
                {
                  key: 'alternate_guardian_contact',
                  label: 'Alternate Guardian Contact',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Complete contact information for alternate guardian',
                },
                {
                  key: 'alternate_guardian_consent',
                  label: 'Guardian Consent Status',
                  type: 'RadioButtons',
                  options: [
                    'Agreed to serve',
                    'Needs to be asked',
                    'Verbal agreement only',
                    'Written agreement',
                  ],
                  helperText:
                    'Has this person formally agreed to serve as alternate guardian?',
                },

                {
                  key: 'guardian_instructions_header',
                  label: 'Instructions for Guardians',
                  type: 'Instructions',
                  content:
                    "Important information and preferences for your children's care",
                },
                {
                  key: 'parenting_philosophy',
                  label: 'Parenting Philosophy & Values',
                  type: 'TextArea',
                  helperText:
                    'Your core values and approach to raising your children that you want guardians to follow',
                },
                {
                  key: 'education_preferences',
                  label: 'Education Preferences',
                  type: 'TextArea',
                  helperText:
                    'Schools, educational philosophy, special programs, or educational goals for each child',
                },
                {
                  key: 'religious_preferences',
                  label: 'Religious/Spiritual Guidance',
                  type: 'TextArea',
                  helperText:
                    'Religious or spiritual upbringing preferences for your children',
                },
                {
                  key: 'healthcare_instructions',
                  label: 'Healthcare Instructions',
                  type: 'TextArea',
                  helperText:
                    'Medical history, regular doctors, medications, allergies, and healthcare preferences',
                },
                {
                  key: 'special_needs',
                  label: 'Special Needs or Considerations',
                  type: 'TextArea',
                  helperText:
                    'Any special needs, learning differences, behavioral considerations, or therapy requirements',
                },
                {
                  key: 'extracurricular_activities',
                  label: 'Activities & Interests',
                  type: 'TextArea',
                  helperText:
                    'Sports, hobbies, music, and other activities each child enjoys or participates in',
                },
                {
                  key: 'relationship_maintenance',
                  label: 'Family Relationships',
                  type: 'TextArea',
                  helperText:
                    'Important family relationships to maintain, grandparents, extended family, close friends',
                },

                {
                  key: 'financial_provisions_header',
                  label: 'Financial Provisions',
                  type: 'Instructions',
                  content: "Financial arrangements for your children's care",
                },
                {
                  key: 'trust_arrangements',
                  label: 'Trust Arrangements',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Information about trusts established for children, upload trust documents',
                },
                {
                  key: 'life_insurance',
                  label: 'Life Insurance Beneficiaries',
                  type: 'TextArea',
                  helperText:
                    'Life insurance policies naming children as beneficiaries and guardian instructions',
                },
                {
                  key: 'education_funding',
                  label: 'Education Funding',
                  type: 'TextArea',
                  helperText:
                    'College savings accounts, education funds, or specific education funding instructions',
                },
                {
                  key: 'guardian_compensation',
                  label: 'Guardian Compensation',
                  type: 'TextArea',
                  helperText:
                    'Any provisions for compensating guardians for their care of your children',
                },

                {
                  key: 'legal_documents_header',
                  label: 'Legal Documentation',
                  type: 'Instructions',
                  content: 'Legal documents related to guardianship',
                },
                {
                  key: 'guardianship_will',
                  label: 'Will with Guardian Designation',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Upload current will that names guardians or note location',
                },
                {
                  key: 'guardian_letters',
                  label: 'Letters to Guardians',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Personal letters or detailed instructions for guardians',
                },
                {
                  key: 'custody_agreements',
                  label: 'Custody Agreements',
                  type: 'TextInputWithUpload',
                  helperText:
                    'If applicable, existing custody agreements that may affect guardianship',
                },
                {
                  key: 'guardianship_attorney',
                  label: 'Family Law Attorney',
                  type: 'TextInputWithUpload',
                  helperText:
                    'Attorney who prepared guardianship documents or can assist with guardianship matters',
                },

                {
                  key: 'excluded_guardians_header',
                  label: 'Exclusions',
                  type: 'Instructions',
                  content: 'People you do NOT want to serve as guardians',
                },
                {
                  key: 'excluded_persons',
                  label: 'Persons to Exclude',
                  type: 'TextArea',
                  helperText:
                    'Names of people you specifically do NOT want as guardians and reasons why',
                },

                {
                  key: 'emergency_contacts_header',
                  label: 'Emergency Contacts',
                  type: 'Instructions',
                  content: 'Additional important contacts for your children',
                },
                {
                  key: 'temporary_caregivers',
                  label: 'Temporary Caregivers',
                  type: 'TextArea',
                  helperText:
                    'People authorized for short-term care (babysitters, relatives, family friends)',
                },
                {
                  key: 'school_contacts',
                  label: 'School Emergency Contacts',
                  type: 'TextArea',
                  helperText:
                    'People authorized to pick up children from school or make school decisions',
                },
                {
                  key: 'medical_contacts',
                  label: 'Medical Authorization',
                  type: 'TextArea',
                  helperText:
                    'People authorized to make emergency medical decisions if parents unavailable',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
