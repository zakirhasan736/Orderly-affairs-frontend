export const formConfig = {
  "appName": "Orderly Affairs", 
  "version": "1.0",
  "chunks": [
    {
      "chunkId": "chunk-1", 
      "sections": [
        {
          "id": "1",
          "title": "START HERE! Instructions",
          "subsections": [
            {
              "id": "1A",
              "title": "Instructions - Owner",
              "type": "info",
              "fields": [
                { "key": "ack_read_owner_instructions", "label": "I have read the owner instructions", "type": "RadioButtons", "options": ["Yes"] }
              ]
            },
            {
              "id": "1B",
              "title": "Vital Information & Key Contacts",
              "groups": [
                {
                  "title": "Personal Details",
                  "fields": [
                    { "key": "full_legal_name", "label": "Full Legal Name", "type": "TextInput", "required": true },
                    { "key": "other_names", "label": "Other Names (maiden, nickname)", "type": "TextInput" },
                    { "key": "date_of_birth", "label": "Date of Birth", "type": "DatePicker" },
                    { "key": "ssn", "label": "Social Security Number", "type": "TextInputWithUpload", "helperText": "Type last 4 or upload a secure copy/photo of the card." }
                  ]
                },
                {
                  "title": "Phone & Device Access",
                  "fields": [
                    { "key": "phone_number", "label": "Phone Number", "type": "TextInput" },
                    { "key": "device_pin", "label": "Phone/Device PIN or Password", "type": "TextInputWithUpload" },
                    { "key": "voicemail_pin", "label": "Voicemail PIN", "type": "TextInputWithUpload" },
                    { "key": "computer_password", "label": "Computer/Laptop Password", "type": "TextInputWithUpload" }
                  ]
                },
                {
                  "title": "Email Accounts",
                  "repeatable": true,
                  "itemLabel": "Email Account",
                  "fields": [
                    { "key": "email_address", "label": "Email Address", "type": "TextInput" },
                    { "key": "email_password", "label": "Password / Manager Note", "type": "TextInputWithUpload" }
                  ]
                },
                {
                  "title": "Physical Address",
                  "fields": [
                    { "key": "address", "label": "Address", "type": "TextArea" }
                  ]
                },
                {
                  "title": "Important Contacts",
                  "repeatable": true,
                  "itemLabel": "Contact",
                  "fields": [
                    { "key": "contact_name", "label": "Name", "type": "TextInput" },
                    { "key": "contact_relationship", "label": "Relationship", "type": "TextInput" },
                    { "key": "contact_phone", "label": "Phone", "type": "TextInput" },
                    { "key": "contact_email", "label": "Email", "type": "TextInput" },
                    { "key": "contact_role", "label": "Role/Notes", "type": "TextArea" }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "chunkId": "chunk-2",
      "sections": [
        {
          "id": "2",
          "title": "Vehicles",
          "subsections": [
            {
              "id": "2A",
              "title": "Vehicle Information",
              "repeatable": true,
              "itemLabel": "Vehicle",
              "groups": [
                {
                  "title": "Basic Vehicle Information",
                  "fields": [
                    { "key": "year", "label": "Year", "type": "TextInput", "placeholder": "2020" },
                    { "key": "make", "label": "Make", "type": "TextInput", "placeholder": "Toyota" },
                    { "key": "model", "label": "Model", "type": "TextInput", "placeholder": "Camry" },
                    { "key": "color", "label": "Color", "type": "TextInput", "placeholder": "Blue" },
                    { "key": "vin", "label": "VIN", "type": "TextInputWithUpload", "helperText": "Vehicle Identification Number or upload registration" },
                    { "key": "license_plate", "label": "License Plate", "type": "TextInput" },
                    { "key": "registration_expires", "label": "Registration Expires", "type": "DatePicker" }
                  ]
                },
                {
                  "title": "Vehicle Ownership",
                  "fields": [
                    { "key": "ownership_status", "label": "Ownership Status", "type": "Dropdown", "options": ["Owned", "Leased", "Financed"] },
                    { "key": "title_holder", "label": "Title Holder", "type": "TextInput", "helperText": "Name on the title" },
                    { "key": "title_location", "label": "Title Location", "type": "TextInput", "helperText": "Where is the title stored?" }
                  ]
                },
                {
                  "title": "Loan/Lease Information",
                  "conditionalOn": "ownership_status",
                  "conditionalValue": ["Leased", "Financed"],
                  "fields": [
                    { "key": "lender_name", "label": "Lender/Lease Company", "type": "TextInput" },
                    { "key": "loan_account_number", "label": "Loan/Lease Account Number", "type": "TextInputWithUpload" },
                    { "key": "monthly_payment", "label": "Monthly Payment", "type": "TextInput", "placeholder": "$350" },
                    { "key": "balance_owed", "label": "Balance Owed", "type": "TextInput", "placeholder": "$15,000" },
                    { "key": "loan_maturity_date", "label": "Loan Maturity/Lease End Date", "type": "DatePicker" }
                  ]
                },
                {
                  "title": "Insurance Information",
                  "fields": [
                    { "key": "insurance_company", "label": "Insurance Company", "type": "TextInput" },
                    { "key": "policy_number", "label": "Policy Number", "type": "TextInputWithUpload" },
                    { "key": "insurance_agent", "label": "Insurance Agent", "type": "TextInput" },
                    { "key": "agent_contact", "label": "Agent Contact Info", "type": "TextArea" }
                  ]
                },
                {
                  "title": "Additional Information",
                  "fields": [
                    { "key": "current_mileage", "label": "Current Mileage", "type": "TextInput", "placeholder": "50,000" },
                    { "key": "service_records_location", "label": "Service Records Location", "type": "TextInput" },
                    { "key": "spare_keys_location", "label": "Spare Keys Location", "type": "TextInput" },
                    { "key": "notes", "label": "Additional Notes", "type": "TextArea" }
                  ]
                }
              ]
            }
          ]
        },
        {
          "id": "3",
          "title": "Important Documents",
          "subsections": [
            {
              "id": "3A",
              "title": "Document Storage Information",
              "fields": [
                { "key": "safe_deposit_box_location", "label": "Safe Deposit Box Location", "type": "TextInput", "helperText": "Bank name and branch" },
                { "key": "safe_deposit_box_number", "label": "Box Number", "type": "TextInput" },
                { "key": "safe_deposit_box_key_location", "label": "Key Location", "type": "TextInput" },
                { "key": "home_safe_location", "label": "Home Safe Location", "type": "TextInput" },
                { "key": "home_safe_combination", "label": "Safe Combination", "type": "TextInputWithUpload" },
                { "key": "filing_system_description", "label": "Filing System Description", "type": "TextArea", "helperText": "Describe how you organize important documents" }
              ]
            },
            {
              "id": "3B",
              "title": "Document Inventory",
              "repeatable": true,
              "itemLabel": "Document",
              "fields": [
                { "key": "doc_type", "label": "Document Type", "type": "Dropdown", "options": ["Birth Certificate", "Marriage Certificate", "Divorce Papers", "Passport", "Military Records", "Social Security Card", "Tax Returns", "Property Deeds", "Vehicle Titles", "Insurance Policies", "Medical Records", "Other"] },
                { "key": "custom_doc_type", "label": "Specify Document Type", "type": "TextInput", "placeholder": "Enter custom document type", "helperText": "Please specify the type of document", "conditionalOn": "doc_type", "conditionalValue": "Other" },
                { "key": "doc_description", "label": "Description", "type": "TextInput", "placeholder": "Birth certificate for John Doe" },
                { "key": "doc_location", "label": "Storage Location", "type": "TextInput", "placeholder": "Safe deposit box, file cabinet drawer 2, etc." },
                { "key": "doc_notes", "label": "Additional Notes", "type": "TextArea" }
              ]
            }
          ]
        },
        {
          "id": "4",
          "title": "Real Estate",
          "subsections": [
            {
              "id": "4A",
              "title": "Property Information",
              "repeatable": true,
              "itemLabel": "Property",
              "groups": [
                {
                  "title": "Property Details",
                  "fields": [
                    { "key": "property_type", "label": "Property Type", "type": "Dropdown", "options": ["Primary Residence", "Secondary Home", "Rental Property", "Vacant Land", "Commercial Property", "Other"] },
                    { "key": "property_address", "label": "Property Address", "type": "TextArea" },
                    { "key": "purchase_date", "label": "Purchase Date", "type": "DatePicker" },
                    { "key": "purchase_price", "label": "Purchase Price", "type": "TextInput", "placeholder": "$350,000" },
                    { "key": "current_value", "label": "Current Estimated Value", "type": "TextInput", "placeholder": "$425,000" }
                  ]
                },
                {
                  "title": "Ownership Information",
                  "fields": [
                    { "key": "deed_holder", "label": "Name on Deed", "type": "TextInput" },
                    { "key": "ownership_type", "label": "Ownership Type", "type": "Dropdown", "options": ["Sole Ownership", "Joint Tenancy", "Tenancy in Common", "Community Property", "Trust", "Other"] },
                    { "key": "deed_location", "label": "Deed Location", "type": "TextInput", "helperText": "Where is the deed stored?" }
                  ]
                },
                {
                  "title": "Mortgage Information",
                  "fields": [
                    { "key": "has_mortgage", "label": "Property has a mortgage", "type": "Checkbox" },
                    { "key": "mortgage_company", "label": "Mortgage Company", "type": "TextInput", "conditionalOn": "has_mortgage" },
                    { "key": "mortgage_account_number", "label": "Account Number", "type": "TextInputWithUpload", "conditionalOn": "has_mortgage" },
                    { "key": "outstanding_balance", "label": "Outstanding Balance", "type": "TextInput", "placeholder": "$275,000", "conditionalOn": "has_mortgage" },
                    { "key": "monthly_payment", "label": "Monthly Payment", "type": "TextInput", "placeholder": "$1,850", "conditionalOn": "has_mortgage" },
                    { "key": "mortgage_maturity_date", "label": "Mortgage Maturity Date", "type": "DatePicker", "conditionalOn": "has_mortgage" }
                  ]
                },
                {
                  "title": "Additional Information",
                  "fields": [
                    { "key": "property_taxes", "label": "Annual Property Taxes", "type": "TextInput", "placeholder": "$4,200" },
                    { "key": "homeowners_insurance", "label": "Homeowners Insurance Company", "type": "TextInput" },
                    { "key": "insurance_policy_number", "label": "Insurance Policy Number", "type": "TextInputWithUpload" },
                    { "key": "property_management", "label": "Property Management Company", "type": "TextInput", "helperText": "If applicable" },
                    { "key": "rental_income", "label": "Monthly Rental Income", "type": "TextInput", "placeholder": "$2,200", "helperText": "If rental property" },
                    { "key": "notes", "label": "Additional Notes", "type": "TextArea" }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "chunkId": "chunk-3",
      "sections": [
        {
          "id": "5",
          "title": "Insurance Policies",
          "subsections": [
            {
              "id": "5A",
              "title": "Insurance Policy Information",
              "repeatable": true,
              "itemLabel": "Policy",
              "groups": [
                {
                  "title": "Policy Details",
                  "fields": [
                    { "key": "policy_type", "label": "Policy Type", "type": "Dropdown", "options": ["Life Insurance", "Health Insurance", "Auto Insurance", "Homeowners Insurance", "Disability Insurance", "Umbrella Policy", "Other"], "required": true },
                    { "key": "custom_policy_type", "label": "Specify Policy Type", "type": "TextInput", "placeholder": "Enter custom policy type", "helperText": "Please specify the type of insurance policy", "conditionalOn": "policy_type", "conditionalValue": "Other" },
                    { "key": "policy_company", "label": "Insurance Company", "type": "TextInput", "placeholder": "State Farm, Allstate, etc." },
                    { "key": "policy_number", "label": "Policy Number", "type": "TextInputWithUpload", "helperText": "Policy number or upload policy documents" },
                    { "key": "policy_holder", "label": "Policy Holder", "type": "TextInput", "helperText": "Name of the insured person" }
                  ]
                },
                {
                  "title": "Coverage Information",
                  "fields": [
                    { "key": "coverage_amount", "label": "Coverage Amount", "type": "TextInput", "placeholder": "$500,000" },
                    { "key": "premium_amount", "label": "Premium Amount", "type": "TextInput", "placeholder": "$150/month" },
                    { "key": "premium_frequency", "label": "Premium Payment Frequency", "type": "Dropdown", "options": ["Monthly", "Quarterly", "Semi-annually", "Annually"] },
                    { "key": "policy_start_date", "label": "Policy Start Date", "type": "DatePicker" },
                    { "key": "policy_renewal_date", "label": "Policy Renewal Date", "type": "DatePicker" }
                  ]
                },
                {
                  "title": "Beneficiary Information",
                  "fields": [
                    { "key": "primary_beneficiary", "label": "Primary Beneficiary", "type": "TextInput" },
                    { "key": "primary_beneficiary_relationship", "label": "Relationship", "type": "TextInput" },
                    { "key": "primary_beneficiary_contact", "label": "Beneficiary Contact Info", "type": "TextArea" },
                    { "key": "contingent_beneficiary", "label": "Contingent Beneficiary", "type": "TextInput" },
                    { "key": "contingent_beneficiary_relationship", "label": "Relationship", "type": "TextInput" },
                    { "key": "contingent_beneficiary_contact", "label": "Contingent Beneficiary Contact Info", "type": "TextArea" }
                  ]
                },
                {
                  "title": "Agent/Company Contact",
                  "fields": [
                    { "key": "agent_name", "label": "Agent Name", "type": "TextInput" },
                    { "key": "agent_phone", "label": "Agent Phone", "type": "TextInput" },
                    { "key": "agent_email", "label": "Agent Email", "type": "TextInput" },
                    { "key": "company_customer_service", "label": "Company Customer Service", "type": "TextInput" },
                    { "key": "policy_location", "label": "Policy Document Location", "type": "TextInput", "helperText": "Where are the physical policy documents stored?" }
                  ]
                },
                {
                  "title": "Additional Information",
                  "fields": [
                    { "key": "automatic_payment", "label": "Automatic Payment", "type": "RadioButtons", "options": ["Yes", "No"], "helperText": "Is this policy on automatic payment?" },
                    { "key": "payment_method", "label": "Payment Method", "type": "TextInput", "placeholder": "Bank account, credit card, etc.", "conditionalOn": "automatic_payment", "conditionalValue": "Yes" },
                    { "key": "notes", "label": "Additional Notes", "type": "TextArea" }
                  ]
                }
              ]
            }
          ]
        },
        {
          "id": "6",
          "title": "Community & Memberships",
          "subsections": [
            {
              "id": "6A",
              "title": "Community Memberships",
              "repeatable": true,
              "itemLabel": "Membership",
              "fields": [
                { "key": "organization_name", "label": "Organization Name", "type": "TextInput", "placeholder": "Church, club, professional association, etc.", "helperText": "Name of the organization or group", "required": true },
                { "key": "membership_type", "label": "Membership Type", "type": "Dropdown", "options": ["Religious Organization", "Professional Association", "Volunteer Organization", "Social Club", "Sports Club", "Hobby Group", "Alumni Association", "Other"], "helperText": "Type of organization or membership" },
                { "key": "custom_membership_type", "label": "Specify Membership Type", "type": "TextInput", "placeholder": "Enter custom membership type", "helperText": "Please specify the type of membership", "conditionalOn": "membership_type", "conditionalValue": "Other" },
                { "key": "role_involvement", "label": "Role/Involvement", "type": "TextInput", "placeholder": "Member, Board Member, Volunteer, etc.", "helperText": "Your role or level of involvement" },
                { "key": "membership_number", "label": "Membership Number", "type": "TextInput", "helperText": "Membership ID or number (if applicable)" },
                { "key": "contact_person", "label": "Key Contact Person", "type": "TextInput", "helperText": "Pastor, president, coordinator, etc." },
                { "key": "contact_information", "label": "Contact Information", "type": "TextArea", "placeholder": "Phone, email, address", "helperText": "How to reach the organization or contact person" },
                { "key": "membership_dues", "label": "Membership Dues", "type": "TextInput", "placeholder": "$50/year", "helperText": "Cost of membership (if applicable)" },
                { "key": "online_accounts", "label": "Online Accounts/Profiles", "type": "TextArea", "helperText": "Any online accounts, websites, or member portals associated with this organization" },
                { "key": "significance", "label": "Personal Significance", "type": "TextArea", "helperText": "What this organization means to you and why it's important" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this membership" }
              ]
            },
            {
              "id": "6B",
              "title": "Physical Memberships & Subscriptions",
              "repeatable": true,
              "itemLabel": "Physical Membership",
              "fields": [
                { "key": "company_service_name", "label": "Company/Service Name", "type": "TextInput", "placeholder": "Gym, magazine, streaming service, etc.", "helperText": "Name of the company or service", "required": true },
                { "key": "subscription_category", "label": "Category", "type": "Dropdown", "options": ["Fitness/Gym", "Magazine/Newspaper", "Streaming Service", "Software/App", "Delivery Service", "Membership Club", "Other"], "helperText": "Type of subscription or membership" },
                { "key": "custom_subscription_category", "label": "Specify Category", "type": "TextInput", "placeholder": "Enter custom category", "helperText": "Please specify the category", "conditionalOn": "subscription_category", "conditionalValue": "Other" },
                { "key": "subscription_cost", "label": "Cost", "type": "TextInput", "placeholder": "$9.99/month", "helperText": "Monthly or annual cost" },
                { "key": "billing_frequency", "label": "Billing Frequency", "type": "Dropdown", "options": ["Monthly", "Quarterly", "Semi-annually", "Annually"], "helperText": "How often you're billed" },
                { "key": "payment_method", "label": "Payment Method", "type": "TextInput", "placeholder": "Credit card, bank account, etc.", "helperText": "How you pay for this subscription" },
                { "key": "membership_id", "label": "Membership/Account ID", "type": "TextInputWithUpload", "helperText": "Your member number or account ID" },
                { "key": "login_credentials", "label": "Login Credentials", "type": "TextInputWithUpload", "helperText": "Username and password for online access" },
                { "key": "auto_renewal", "label": "Auto-Renewal", "type": "RadioButtons", "options": ["Yes", "No"], "helperText": "Does this subscription automatically renew?" },
                { "key": "renewal_date", "label": "Next Renewal Date", "type": "DatePicker", "helperText": "When does this subscription renew or expire?" },
                { "key": "cancellation_info", "label": "Cancellation Information", "type": "TextArea", "helperText": "How to cancel this subscription (phone number, website, etc.)" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this subscription" }
              ]
            }
          ]
        },
        {
          "id": "7",
          "title": "Charitable Giving",
          "subsections": [
            {
              "id": "7A",
              "title": "Charitable Donations",
              "repeatable": true,
              "itemLabel": "Charitable Donation",
              "fields": [
                { "key": "organization_name", "label": "Organization Name", "type": "TextInput", "placeholder": "Red Cross, local church, etc.", "helperText": "Name of the charitable organization", "required": true },
                { "key": "donation_type", "label": "Type of Donation", "type": "Dropdown", "options": ["One-time", "Monthly", "Annual", "Planned/Legacy", "In-Kind"], "helperText": "Frequency or type of your donation" },
                { "key": "donation_amount", "label": "Donation Amount", "type": "TextInput", "placeholder": "$100/month or $1,200/year", "helperText": "Amount you donate" },
                { "key": "payment_method", "label": "Payment Method", "type": "TextInput", "placeholder": "Auto-debit, check, credit card, etc.", "helperText": "How you make the donation" },
                { "key": "donation_start_date", "label": "Started Donating", "type": "DatePicker", "helperText": "When did you start donating to this organization?" },
                { "key": "tax_deductible", "label": "Tax Deductible", "type": "RadioButtons", "options": ["Yes", "No", "Unknown"], "helperText": "Is this donation tax deductible?" },
                { "key": "contact_information", "label": "Organization Contact", "type": "TextArea", "placeholder": "Phone, email, address", "helperText": "How to reach the organization" },
                { "key": "legacy_plans", "label": "Legacy/Estate Plans", "type": "TextArea", "helperText": "Have you included this organization in your will or estate plans?" },
                { "key": "automatic_withdrawal", "label": "Automatic Withdrawal", "type": "RadioButtons", "options": ["Yes", "No"], "helperText": "Is this donation automatically withdrawn from your account?" },
                { "key": "account_used", "label": "Account/Card Used", "type": "TextInput", "helperText": "Which bank account or credit card is used for this donation?", "conditionalOn": "automatic_withdrawal", "conditionalValue": "Yes" },
                { "key": "donor_number", "label": "Donor Number/ID", "type": "TextInput", "helperText": "Your donor identification number (if applicable)" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this charitable giving" }
              ]
            }
          ]
        },
        {
          "id": "8",
          "title": "Education & Achievements",
          "subsections": [
            {
              "id": "8A",
              "title": "Education History",
              "repeatable": true,
              "itemLabel": "Education",
              "fields": [
                { "key": "institution_name", "label": "Institution Name", "type": "TextInput", "placeholder": "University of California, Berkeley", "helperText": "Name of the school or institution", "required": true },
                { "key": "education_level", "label": "Education Level", "type": "Dropdown", "options": ["High School", "Associate Degree", "Bachelor's Degree", "Master's Degree", "Doctoral Degree", "Professional Degree", "Certificate/Diploma", "Other"], "helperText": "Type of education or degree" },
                { "key": "custom_education_level", "label": "Specify Education Level", "type": "TextInput", "placeholder": "Enter custom education level", "helperText": "Please specify the education level", "conditionalOn": "education_level", "conditionalValue": "Other" },
                { "key": "field_of_study", "label": "Field of Study/Major", "type": "TextInput", "placeholder": "Computer Science, Business Administration, etc.", "helperText": "Your area of study or major" },
                { "key": "graduation_year", "label": "Graduation Year", "type": "TextInput", "placeholder": "2010", "helperText": "Year you graduated or completed the program" },
                { "key": "degree_earned", "label": "Degree/Certificate Earned", "type": "TextInput", "placeholder": "Bachelor of Science, MBA, etc.", "helperText": "Specific degree or certificate received" },
                { "key": "honors_awards", "label": "Honors/Awards", "type": "TextArea", "helperText": "Any academic honors, awards, or distinctions received" },
                { "key": "gpa", "label": "GPA", "type": "TextInput", "placeholder": "3.75", "helperText": "Grade point average (if applicable)" },
                { "key": "extracurricular", "label": "Extracurricular Activities", "type": "TextArea", "helperText": "Clubs, sports, organizations, or other activities" },
                { "key": "thesis_projects", "label": "Thesis/Major Projects", "type": "TextArea", "helperText": "Title and description of thesis, capstone project, or major research" },
                { "key": "alumni_status", "label": "Alumni Involvement", "type": "TextArea", "helperText": "Any ongoing involvement with the institution as an alumnus" },
                { "key": "transcripts_location", "label": "Transcript Location", "type": "TextInput", "helperText": "Where official transcripts or diplomas are stored" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this education" }
              ]
            },
            {
              "id": "8B",
              "title": "Professional Certifications",
              "repeatable": true,
              "itemLabel": "Certification",
              "fields": [
                { "key": "certification_name", "label": "Certification Name", "type": "TextInput", "placeholder": "CPA, PMP, CISSP, etc.", "helperText": "Name of the certification", "required": true },
                { "key": "issuing_organization", "label": "Issuing Organization", "type": "TextInput", "placeholder": "AICPA, PMI, ISC2, etc.", "helperText": "Organization that issued the certification" },
                { "key": "certification_number", "label": "Certification Number", "type": "TextInputWithUpload", "helperText": "Certification ID number or upload certificate" },
                { "key": "issue_date", "label": "Issue Date", "type": "DatePicker", "helperText": "When was the certification issued?" },
                { "key": "expiration_date", "label": "Expiration Date", "type": "DatePicker", "helperText": "When does the certification expire?" },
                { "key": "renewal_requirements", "label": "Renewal Requirements", "type": "TextArea", "helperText": "What's required to maintain or renew this certification?" },
                { "key": "continuing_education", "label": "Continuing Education Credits", "type": "TextInput", "placeholder": "40 hours/year", "helperText": "Required continuing education or credits" },
                { "key": "career_impact", "label": "Career Impact", "type": "TextArea", "helperText": "How this certification has impacted your career" },
                { "key": "certificate_location", "label": "Certificate Location", "type": "TextInput", "helperText": "Where the physical certificate is stored" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this certification" }
              ]
            },
            {
              "id": "8C",
              "title": "Awards & Achievements",
              "repeatable": true,
              "itemLabel": "Achievement",
              "fields": [
                { "key": "award_name", "label": "Award/Achievement Name", "type": "TextInput", "placeholder": "Employee of the Year, community service award, etc.", "helperText": "Name of the award or achievement", "required": true },
                { "key": "achievement_type", "label": "Type of Achievement", "type": "Dropdown", "options": ["Professional Award", "Academic Award", "Community Service", "Athletic Achievement", "Artistic Achievement", "Volunteer Recognition", "Leadership Award", "Other"], "helperText": "Category of achievement" },
                { "key": "custom_achievement_type", "label": "Specify Achievement Type", "type": "TextInput", "placeholder": "Enter custom achievement type", "helperText": "Please specify the type of achievement", "conditionalOn": "achievement_type", "conditionalValue": "Other" },
                { "key": "awarding_organization", "label": "Awarding Organization", "type": "TextInput", "placeholder": "Company, school, community group, etc.", "helperText": "Who gave you this award?" },
                { "key": "date_received", "label": "Date Received", "type": "DatePicker", "helperText": "When did you receive this award?" },
                { "key": "achievement_description", "label": "Description", "type": "TextArea", "helperText": "What was this award for? What did you accomplish?" },
                { "key": "significance", "label": "Personal Significance", "type": "TextArea", "helperText": "Why is this achievement meaningful to you?" },
                { "key": "recognition_type", "label": "Type of Recognition", "type": "TextInput", "placeholder": "Trophy, certificate, monetary award, etc.", "helperText": "What form did the recognition take?" },
                { "key": "award_location", "label": "Award Location", "type": "TextInput", "helperText": "Where the physical award or certificate is stored" },
                { "key": "media_coverage", "label": "Media Coverage", "type": "TextArea", "helperText": "Any newspaper articles, websites, or media coverage of this achievement" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this achievement" }
              ]
            },
            {
              "id": "8D",
              "title": "Publications & Documents",
              "repeatable": true,
              "itemLabel": "Publication/Document",
              "fields": [
                { "key": "title", "label": "Title", "type": "TextInput", "placeholder": "Title of publication, document, or work", "helperText": "Title of your published work or document", "required": true },
                { "key": "document_type", "label": "Type", "type": "Dropdown", "options": ["Academic Paper", "Book", "Article", "Blog Post", "White Paper", "Report", "Presentation", "Patent", "Creative Work", "Other"], "helperText": "Type of publication or document" },
                { "key": "custom_document_type", "label": "Specify Document Type", "type": "TextInput", "placeholder": "Enter custom document type", "helperText": "Please specify the type of document", "conditionalOn": "document_type", "conditionalValue": "Other" },
                { "key": "publication_venue", "label": "Publication Venue", "type": "TextInput", "placeholder": "Journal name, publisher, website, etc.", "helperText": "Where was this published?" },
                { "key": "publication_date", "label": "Publication Date", "type": "DatePicker", "helperText": "When was this published?" },
                { "key": "coauthors", "label": "Co-authors/Collaborators", "type": "TextArea", "helperText": "Other people who worked on this with you" },
                { "key": "abstract_summary", "label": "Abstract/Summary", "type": "TextArea", "helperText": "Brief description of the content or main ideas" },
                { "key": "impact_recognition", "label": "Impact/Recognition", "type": "TextArea", "helperText": "Citations, awards, recognition, or impact this work has had" },
                { "key": "access_location", "label": "Access/Location", "type": "TextInput", "helperText": "URL, DOI, or where copies can be found" },
                { "key": "document_storage", "label": "Document Storage", "type": "TextInput", "helperText": "Where physical or digital copies are stored" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this publication" }
              ]
            }
          ]
        }
      ]
    },
    {
      "chunkId": "chunk-4",
      "sections": [
        {
          "id": "9",
          "title": "Military Service",
          "subsections": [
            {
              "id": "9A",
              "title": "Military Service Information",
              "repeatable": true,
              "itemLabel": "Military Service",
              "fields": [
                { "key": "branch_of_service", "label": "Branch of Service", "type": "Dropdown", "options": ["Army", "Navy", "Air Force", "Marines", "Coast Guard", "Space Force", "National Guard", "Reserves"], "helperText": "Which branch of the military did you serve in?", "required": true },
                { "key": "service_dates", "label": "Service Dates", "type": "TextInput", "placeholder": "1990-1995", "helperText": "Years of service (start and end dates)" },
                { "key": "service_years", "label": "Total Years of Service", "type": "TextInput", "placeholder": "5 years", "helperText": "Total length of military service" },
                { "key": "entry_rank", "label": "Entry Rank", "type": "TextInput", "placeholder": "Private, Seaman Recruit, etc.", "helperText": "Rank when you entered service" },
                { "key": "highest_rank", "label": "Highest Rank Achieved", "type": "TextInput", "placeholder": "Sergeant, Petty Officer, etc.", "helperText": "Highest rank you achieved during service" },
                { "key": "service_rank", "label": "Final Service Rank", "type": "TextInput", "placeholder": "Final rank at discharge", "helperText": "Rank at time of discharge or separation" },
                { "key": "military_occupation", "label": "Military Occupation/Specialty", "type": "TextInput", "placeholder": "Infantry, Medic, Pilot, etc.", "helperText": "Your job or specialty in the military" },
                { "key": "mos_code", "label": "MOS/Rating/AFSC Code", "type": "TextInput", "placeholder": "11B, HM, 2A7X1, etc.", "helperText": "Military Occupational Specialty code (if known)" },
                { "key": "duty_stations", "label": "Duty Stations", "type": "TextArea", "helperText": "List of bases or locations where you were stationed" },
                { "key": "deployments", "label": "Deployments", "type": "TextArea", "helperText": "Combat deployments or overseas assignments" },
                { "key": "discharge_type", "label": "Type of Discharge", "type": "Dropdown", "options": ["Honorable", "General Under Honorable Conditions", "Other Than Honorable", "Bad Conduct", "Dishonorable", "Medical", "Other"], "helperText": "Type of discharge received" },
                { "key": "decorations_awards", "label": "Decorations & Awards", "type": "TextArea", "helperText": "Military medals, ribbons, and awards received" },
                { "key": "combat_service", "label": "Combat Service", "type": "RadioButtons", "options": ["Yes", "No"], "helperText": "Did you serve in combat?" },
                { "key": "combat_details", "label": "Combat Service Details", "type": "TextArea", "helperText": "Details about combat service, if applicable", "conditionalOn": "combat_service", "conditionalValue": "Yes" },
                { "key": "service_connected_disability", "label": "Service-Connected Disability", "type": "RadioButtons", "options": ["Yes", "No"], "helperText": "Do you have a service-connected disability rating?" },
                { "key": "disability_rating", "label": "Disability Rating", "type": "TextInput", "placeholder": "30%, 100%, etc.", "helperText": "VA disability rating percentage", "conditionalOn": "service_connected_disability", "conditionalValue": "Yes" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about your military service" }
              ]
            },
            {
              "id": "9B",
              "title": "Military Benefits",
              "repeatable": true,
              "itemLabel": "Military Benefit",
              "fields": [
                { "key": "benefit_type", "label": "Benefit Type", "type": "Dropdown", "options": ["VA Disability Compensation", "VA Pension", "GI Bill Education Benefits", "VA Healthcare", "VA Home Loan", "SGLI/Life Insurance", "Military Retirement Pay", "Survivor Benefits", "Burial Benefits", "Other"], "helperText": "Type of military or VA benefit", "required": true },
                { "key": "custom_benefit_type", "label": "Specify Benefit Type", "type": "TextInput", "placeholder": "Enter custom benefit type", "helperText": "Please specify the type of benefit", "conditionalOn": "benefit_type", "conditionalValue": "Other" },
                { "key": "benefit_status", "label": "Benefit Status", "type": "Dropdown", "options": ["Currently Receiving", "Eligible But Not Receiving", "Applied - Pending", "Denied", "Unknown"], "helperText": "Current status of this benefit" },
                { "key": "monthly_amount", "label": "Monthly Amount", "type": "TextInput", "placeholder": "$1,200", "helperText": "Monthly benefit amount (if applicable)" },
                { "key": "claim_number", "label": "Claim/Case Number", "type": "TextInputWithUpload", "helperText": "VA claim number or case ID" },
                { "key": "effective_date", "label": "Effective Date", "type": "DatePicker", "helperText": "When did this benefit start or when is it effective?" },
                { "key": "percentage_rating", "label": "Percentage Rating", "type": "TextInput", "placeholder": "50%", "helperText": "Disability rating percentage (if applicable)" },
                { "key": "beneficiary_info", "label": "Beneficiary Information", "type": "TextArea", "helperText": "Who would receive survivor benefits (if applicable)" },
                { "key": "payment_method", "label": "Payment Method", "type": "TextInput", "placeholder": "Direct deposit to Bank of America checking", "helperText": "How benefits are received" },
                { "key": "contact_info", "label": "VA Contact Information", "type": "TextArea", "helperText": "Relevant VA office or contact information" },
                { "key": "required_actions", "label": "Required Actions", "type": "TextArea", "helperText": "Any regular actions required (annual exams, renewals, etc.)" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this benefit" }
              ]
            },
            {
              "id": "9C",
              "title": "Military Documents",
              "instructions": "Important: It's essential to file your DD-214 (separation papers) and other critical military records properly. Here's how to ensure your military documents are secure and accessible:\\n\\n**Filing DD-214 and Military Records:**\\n• Keep your original DD-214 in a safe, fireproof location (safe deposit box or home safe)\\n• Make several certified copies for daily use (never use your original for routine purposes)\\n• Register your DD-214 with your county clerk's office - this creates an official backup you can always access\\n• Store a digital copy in a secure cloud service or password manager\\n• Give copies to your spouse, executor, or trusted family members\\n\\n**VA Form 40-1330 (Optional):**\\nIf you wish to claim a standard government headstone or marker for your future burial, you can file VA Form 40-1330. This form allows veterans, their families, or representatives to request a government-furnished headstone, marker, or medallion for an eligible veteran's grave. You can find this form at: https://www.va.gov/find-forms/about-form-40-1330/\\n\\n**Why This Matters:**\\nProper filing ensures your next of kin can easily access these documents for VA benefits, burial arrangements, and other important veteran services.",
              "repeatable": true,
              "itemLabel": "Military Document",
              "fields": [
                { "key": "document_type", "label": "Document Type", "type": "Dropdown", "options": ["DD-214 (Separation Papers)", "DD-215 (Correction to DD-214)", "Military ID Card", "Retirement Orders", "Medical Records", "Service Medical Record (SMR)", "VA Rating Decision", "VA Award Letter", "Military Personnel File", "Unit Records", "Training Certificates", "Security Clearance Documentation", "Other"], "helperText": "Type of military document", "required": true },
                { "key": "custom_document_type", "label": "Specify Document Type", "type": "TextInput", "placeholder": "Enter custom document type", "helperText": "Please specify the type of document", "conditionalOn": "document_type", "conditionalValue": "Other" },
                { "key": "document_description", "label": "Document Description", "type": "TextArea", "placeholder": "Brief description of the document", "helperText": "Describe what this document contains or its purpose" },
                { "key": "document_date", "label": "Document Date", "type": "DatePicker", "helperText": "Date the document was issued or created" },
                { "key": "issuing_authority", "label": "Issuing Authority", "type": "TextInput", "placeholder": "VA, Military Personnel Office, etc.", "helperText": "Who issued this document?" },
                { "key": "original_location", "label": "Original Document Location", "type": "TextInput", "placeholder": "Safe deposit box, home safe, etc.", "helperText": "Where is the original document stored?" },
                { "key": "copies_location", "label": "Copies Location", "type": "TextInput", "placeholder": "Filing cabinet, county clerk, etc.", "helperText": "Where are copies of this document stored?" },
                { "key": "filed_with_county", "label": "Filed with County Clerk", "type": "RadioButtons", "options": ["Yes", "No"], "helperText": "Have you filed this document with your county clerk for official backup?" },
                { "key": "county_filed", "label": "County Where Filed", "type": "TextInput", "placeholder": "County and state", "helperText": "Which county clerk's office has a copy?", "conditionalOn": "filed_with_county", "conditionalValue": "Yes" },
                { "key": "digital_copy_location", "label": "Digital Copy Location", "type": "TextInputWithUpload", "helperText": "Where digital copies are stored (cloud, password manager, etc.) or upload here" },
                { "key": "access_instructions", "label": "Access Instructions", "type": "TextArea", "helperText": "Instructions for accessing this document (combinations, passwords, contact info)" },
                { "key": "replacement_process", "label": "Replacement Process", "type": "TextArea", "helperText": "How to obtain a replacement if this document is lost" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this document" }
              ]
            }
          ]
        },
        {
          "id": "10",
          "title": "Bank Accounts",
          "subsections": [
            {
              "id": "10A",
              "title": "Bank Account Information",
              "repeatable": true,
              "itemLabel": "Account",
              "groups": [
                {
                  "title": "Basic Account Information",
                  "fields": [
                    { "key": "bank_name", "label": "Bank Name", "type": "TextInput", "placeholder": "Chase, Bank of America, etc.", "helperText": "Name of the financial institution" },
                    { "key": "account_type", "label": "Account Type", "type": "Dropdown", "options": ["Checking", "Savings", "Money Market", "CD", "Other"], "helperText": "Type of bank account" },
                    { "key": "has_other_individuals", "label": "This account has other individuals on it (including co-signers)", "type": "Checkbox", "helperText": "Check this box if there are other people authorized on this account" },
                    { "key": "account_number", "label": "Account Number", "type": "TextInputWithUpload", "helperText": "Account number or upload account statement" },
                    { "key": "routing_number", "label": "Routing Number", "type": "TextInput", "helperText": "Bank routing number" }
                  ]
                },
                {
                  "title": "Account Holders & Co-Signers",
                  "conditionalOn": "has_other_individuals",
                  "fields": [
                    { "key": "individual_name", "label": "Name", "type": "TextInput", "placeholder": "Full name of the individual", "helperText": "Name of the person authorized on this account" },
                    { "key": "relationship", "label": "Relationship", "type": "TextInput", "placeholder": "Spouse, Child, Business Partner, etc.", "helperText": "Relationship to you" },
                    { "key": "contact_information", "label": "Contact Information", "type": "TextArea", "placeholder": "Phone number, email, address", "helperText": "How to reach this person" },
                    { "key": "signature_authority", "label": "Signature Authority", "type": "RadioButtons", "options": ["Full Access", "Limited Access", "View Only"], "helperText": "Level of access this person has on the account" },
                    { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this person's role on the account" }
                  ]
                },
                {
                  "title": "Online Banking Credentials",
                  "fields": [
                    { "key": "online_banking_username", "label": "Username", "type": "TextInputWithUpload", "placeholder": "Username for online banking", "helperText": "Username for online banking access" },
                    { "key": "online_banking_password", "label": "Password", "type": "TextInputWithUpload", "placeholder": "Password for online banking", "helperText": "Password for online banking or password manager note" }
                  ]
                },
                {
                  "title": "Contact Information",
                  "fields": [
                    { "key": "branch_location", "label": "Branch Location", "type": "TextInput", "helperText": "Primary branch location" },
                    { "key": "contact_person", "label": "Contact Person", "type": "TextInput", "helperText": "Bank representative or account manager" },
                    { "key": "checks_location", "label": "Location of Checks/Checkbook", "type": "TextInput", "helperText": "Where checkbooks or checks are stored" },
                    { "key": "card_location", "label": "Location of Debit or Credit Card", "type": "TextInput", "helperText": "Where debit/credit cards for this account are stored" },
                    { "key": "pin_number", "label": "PIN Number (if applicable)", "type": "TextInputWithUpload", "helperText": "PIN for debit card or account access" }
                  ]
                },
                {
                  "title": "Beneficiary of this account",
                  "instructions": "Who will receive the funds upon your passing? This is often called the \"payable on death\" beneficiary. Designating a beneficiary can help avoid probate for this account.",
                  "fields": [
                    { "key": "beneficiary_name", "label": "Beneficiary Name", "type": "TextInput", "helperText": "Full name of the account beneficiary" },
                    { "key": "beneficiary_relationship", "label": "Relationship", "type": "TextInput", "helperText": "Relationship to you (spouse, child, etc.)" },
                    { "key": "beneficiary_contact", "label": "Beneficiary Contact Information", "type": "TextArea", "helperText": "Phone number, address, or other contact details" }
                  ]
                },
                {
                  "title": "How to Assign a Payable on Death (POD) Beneficiary",
                  "instructions": "Follow these step-by-step instructions to properly set up POD beneficiaries with your bank.",
                  "fields": [
                    { 
                      "key": "pod_instructions_modal", 
                      "label": "View POD Assignment Instructions", 
                      "type": "InstructionsModal", 
                      "helperText": "Click to view detailed step-by-step instructions for setting up POD beneficiaries with your bank"
                    }
                  ]
                },
                {
                  "title": "Financial Power of Attorney",
                  "instructions": "Who has the legal authority to manage this account on your behalf if you're unable? Make sure this person's name is recorded accurately and upload a copy of the power of attorney here.",
                  "fields": [
                    { "key": "power_of_attorney_name", "label": "Power of Attorney Name", "type": "TextInput", "helperText": "Full name of the person with power of attorney" },
                    { "key": "power_of_attorney_relationship", "label": "Relationship", "type": "TextInput", "helperText": "Relationship to you" },
                    { "key": "power_of_attorney_contact", "label": "Contact Information", "type": "TextArea", "helperText": "Phone number, address, or other contact details" },
                    { "key": "power_of_attorney_document", "label": "Power of Attorney Document", "type": "TextInputWithUpload", "helperText": "Upload a copy of the power of attorney document" }
                  ]
                },
                {
                  "title": "Additional Information",
                  "fields": [
                    { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this account" }
                  ]
                }
              ]
            },
            {
              "id": "10B",
              "title": "Cryptocurrency Accounts",
              "instructions": "Cryptocurrency wallets and accounts require special attention to ensure your assets remain accessible and protected. Please follow these steps carefully:\\n• Record all wallet addresses, private keys, and seed phrases securely. Never store them in plain text or unencrypted digital files that can be easily accessed.\\n• You may use a password manager, or you can place your private keys and seed phrases here where it is encrypted This helps ensure they are stored securely but remain accessible to your trusted contacts when needed.\\n• Include instructions on how to access any hardware wallets, exchanges, or custodial services you use.\\n• Provide clear guidance on who should have access and under what circumstances.\\n• Regularly update this section as your holdings or security practices change.",
              "repeatable": true,
              "itemLabel": "Cryptocurrency Account",
              "fields": [
                { "key": "account_type", "label": "Account Type", "type": "Dropdown", "options": ["Exchange Account", "Hardware Wallet", "Software Wallet", "Web Wallet", "Paper Wallet", "Custodial Service", "DeFi Protocol", "Other"], "helperText": "Type of cryptocurrency account or wallet", "required": true },
                { "key": "custom_account_type", "label": "Specify Account Type", "type": "TextInput", "placeholder": "Enter custom account type", "helperText": "Please specify the type of cryptocurrency account", "conditionalOn": "account_type", "conditionalValue": "Other" },
                { "key": "service_name", "label": "Service/Wallet Name", "type": "TextInput", "placeholder": "Coinbase, MetaMask, Ledger, etc.", "helperText": "Name of the exchange, wallet, or service" },
                { "key": "cryptocurrencies", "label": "Cryptocurrencies Held", "type": "TextArea", "placeholder": "Bitcoin, Ethereum, etc.", "helperText": "List of cryptocurrencies held in this account/wallet" },
                { "key": "wallet_address", "label": "Wallet Address(es)", "type": "TextInputWithUpload", "helperText": "Public wallet addresses or upload QR codes" },
                { "key": "private_keys", "label": "Private Keys", "type": "TextInputWithUpload", "helperText": "Private keys (store securely) or upload encrypted backup" },
                { "key": "seed_phrase", "label": "Seed Phrase/Recovery Words", "type": "TextInputWithUpload", "helperText": "12-24 word recovery phrase (store very securely)" },
                { "key": "username", "label": "Username/Email", "type": "TextInputWithUpload", "placeholder": "Username or email for login", "helperText": "Username or email address for account access" },
                { "key": "password", "label": "Password", "type": "TextInputWithUpload", "placeholder": "Password for account", "helperText": "Password for account access or password manager note" },
                { "key": "two_factor_auth", "label": "Two-Factor Authentication", "type": "TextInputWithUpload", "helperText": "2FA method, backup codes, or authenticator app details" },
                { "key": "hardware_wallet_info", "label": "Hardware Wallet Information", "type": "TextInputWithUpload", "helperText": "Device model, PIN, location of device and recovery materials" },
                { "key": "access_instructions", "label": "Access Instructions", "type": "TextArea", "helperText": "Step-by-step instructions for accessing this account/wallet" },
                { "key": "trusted_contacts", "label": "Trusted Contacts for Access", "type": "TextArea", "helperText": "Who should have access and under what circumstances" },
                { "key": "estimated_value", "label": "Estimated Value", "type": "TextInput", "placeholder": "$10,000", "helperText": "Approximate current value of holdings" },
                { "key": "backup_locations", "label": "Backup Locations", "type": "TextInputWithUpload", "helperText": "Where backups of keys/phrases are stored" },
                { "key": "security_notes", "label": "Security Notes", "type": "TextArea", "helperText": "Important security considerations and warnings" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this cryptocurrency account" }
              ]
            },
            {
              "id": "10C",
              "title": "Digital Payment Apps",
              "instructions": "Managing your digital payment apps that are tied to your bank account is essential to ensure your next of kin can handle your accounts smoothly. These apps may include payment platforms like Venmo, PayPal, Zelle, CashApp, or any other services you use to send or receive money.\\nTo help your next of kin, gather all relevant login information and details about each app, including linked bank accounts, usernames, passwords, and any important notes about how you use them.\\nNote apps that offer automatic payments or deposits, as well as those with funds that may belong to others.",
              "repeatable": true,
              "itemLabel": "Payment App",
              "fields": [
                { "key": "app_name", "label": "App Name", "type": "TextInput", "placeholder": "Venmo, PayPal, Zelle, CashApp, etc.", "helperText": "Name of the digital payment app or service", "required": true },
                { "key": "app_category", "label": "App Category", "type": "Dropdown", "options": ["Peer-to-Peer Payment", "Mobile Banking", "Digital Wallet", "Business Payment", "International Transfer", "Bill Payment", "Other"], "helperText": "Type of payment service" },
                { "key": "username_email", "label": "Username/Email", "type": "TextInputWithUpload", "placeholder": "username or email@example.com", "helperText": "Login username or email address for the app" },
                { "key": "password", "label": "Password", "type": "TextInputWithUpload", "helperText": "Password for app access or password manager note" },
                { "key": "phone_number", "label": "Phone Number", "type": "TextInput", "placeholder": "Phone number linked to account", "helperText": "Phone number associated with the payment app" },
                { "key": "linked_bank_accounts", "label": "Linked Bank Accounts", "type": "TextArea", "helperText": "List of bank accounts, credit cards, or debit cards linked to this app" },
                { "key": "current_balance", "label": "Current Balance", "type": "TextInput", "placeholder": "$150.00", "helperText": "Current balance in the app (if applicable)" },
                { "key": "automatic_payments", "label": "Automatic Payments", "type": "TextArea", "helperText": "List any recurring payments, subscriptions, or automatic transfers set up through this app" },
                { "key": "pending_transactions", "label": "Pending Transactions", "type": "TextArea", "helperText": "Any pending payments, requests, or transactions that need attention" },
                { "key": "funds_belonging_to_others", "label": "Funds Belonging to Others", "type": "TextArea", "helperText": "Any money in the account that belongs to other people (group payments, business funds, etc.)" },
                { "key": "two_factor_auth", "label": "Two-Factor Authentication", "type": "TextInputWithUpload", "helperText": "2FA method, backup codes, or authenticator app details" },
                { "key": "security_settings", "label": "Security Settings", "type": "TextArea", "helperText": "PIN, biometric settings, or other security features enabled" },
                { "key": "account_closure_instructions", "label": "Account Closure Instructions", "type": "TextArea", "helperText": "How to close or transfer the account, including any required documentation" },
                { "key": "customer_service", "label": "Customer Service Contact", "type": "TextInput", "placeholder": "1-800-123-4567", "helperText": "Customer service phone number for the payment app" },
                { "key": "business_vs_personal", "label": "Business vs Personal", "type": "RadioButtons", "options": ["Personal", "Business", "Both"], "helperText": "Is this account used for personal or business purposes?" },
                { "key": "tax_reporting", "label": "Tax Reporting", "type": "TextArea", "helperText": "Any tax reporting requirements or 1099 forms associated with this account" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this payment app account" }
              ]
            }
          ]
        }
      ]
    }
  ]
};