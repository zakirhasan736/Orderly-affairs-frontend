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
                  "title": "Key Contacts",
                  "repeatable": true,
                  "itemLabel": "Contact",
                  "fields": [
                    { "key": "contact_role", "label": "Role", "type": "Dropdown", "options": ["Next of Kin", "Executor/Trustee", "Attorney", "Preferred Funeral Home", "Accountant/CPA", "Real Estate Agent/Property Manager", "Other"] },
                    { "key": "contact_name", "label": "Name", "type": "TextInput" },
                    { "key": "contact_details", "label": "Contact Details", "type": "TextInputWithUpload", "helperText": "Phone, email, address, or upload a business card photo." },
                    { "key": "notes", "label": "Notes", "type": "TextArea" }
                  ]
                }
              ]
            }
          ]
        },
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
                  "title": "Basic Information",
                  "fields": [
                    { "key": "vin", "label": "VIN Number", "type": "TextInputWithUpload", "placeholder": "17-character VIN", "helperText": "Enter the VIN or upload a photo of the VIN plate/registration" },
                    { "key": "year", "label": "Year", "type": "TextInput", "placeholder": "YYYY" },
                    { "key": "make", "label": "Make", "type": "TextInput", "placeholder": "Toyota, Ford, etc." },
                    { "key": "model", "label": "Model", "type": "TextInput", "placeholder": "Camry, F-150, etc." },
                    { "key": "color", "label": "Color", "type": "TextInput", "placeholder": "Blue, Silver, etc." },
                    { "key": "license_plate", "label": "License Plate", "type": "TextInputWithUpload", "placeholder": "License plate number", "helperText": "Enter the license plate or upload a photo of the plate" }
                  ]
                },
                {
                  "title": "Vehicle Status",
                  "fields": [
                    { "key": "vehicle_status", "label": "Vehicle Status", "type": "RadioButtons", "options": ["Owned outright", "Owned with a lien or loan", "Leased", "Other"], "helperText": "Select the current ownership status of this vehicle" },
                    { "key": "owned_outright_details", "label": "Ownership Details", "type": "TextInputWithUpload", "conditionalOn": { "field": "vehicle_status", "value": "Owned outright" }, "helperText": "Upload title, registration, or add notes about ownership" },
                    { "key": "lien_loan_details", "label": "Lien/Loan Details", "type": "TextInputWithUpload", "conditionalOn": { "field": "vehicle_status", "value": "Owned with a lien or loan" }, "helperText": "Upload loan documents, lender info, or add payment details" },
                    { "key": "lease_details", "label": "Lease Details", "type": "TextInputWithUpload", "conditionalOn": { "field": "vehicle_status", "value": "Leased" }, "helperText": "Upload lease agreement or add lease company and payment info" },
                    { "key": "other_status_details", "label": "Other Status Details", "type": "TextInputWithUpload", "conditionalOn": { "field": "vehicle_status", "value": "Other" }, "helperText": "Explain the vehicle status and upload relevant documents" }
                  ]
                },
                {
                  "title": "Location & Keys",
                  "fields": [
                    { "key": "vehicle_location", "label": "Vehicle Location", "type": "TextInputWithUpload", "placeholder": "Where is the vehicle parked?", "helperText": "Enter location details or upload photos of parking area/garage" },
                    { "key": "title_location", "label": "Title Location", "type": "TextInputWithUpload", "placeholder": "Where is the title stored?", "helperText": "Enter storage location or upload photos of title/pink slip" },
                    { "key": "number_of_keys", "label": "Number of Keys", "type": "TextInput", "placeholder": "How many keys exist?" },
                    { "key": "keys_location", "label": "Keys Location", "type": "TextInputWithUpload", "placeholder": "Where are the keys located?", "helperText": "Enter key storage location or upload photos of key storage area" }
                  ]
                }
              ]
            }
          ]
        },
        {
          "id": "3",
          "title": "Main Residence", 
          "subsections": [
            {
              "id": "3A",
              "title": "Home Information & Inventory",
              "groups": [
                {
                  "title": "Property Basics",
                  "fields": [
                    { "key": "property_address", "label": "Property Address", "type": "TextInput", "required": true },
                    { "key": "year_purchased", "label": "Year Purchased", "type": "TextInput" },
                    { "key": "joint_owners", "label": "Joint Owner(s)", "type": "TextInput" }
                  ]
                },
                {
                  "title": "Inventory & Documents",
                  "fields": [
                    { "key": "inventory_record", "label": "Home Inventory", "type": "TextInputWithUpload", "helperText": "Upload photos/video or take pictures directly." },
                    { "key": "inventory_date", "label": "Inventory Date", "type": "DatePicker" },
                    { "key": "blueprints", "label": "Blueprints/Floor Plans", "type": "TextInputWithUpload" },
                    { "key": "breaker_box", "label": "Breaker Box Layout", "type": "TextInputWithUpload" }
                  ]
                }
              ]
            },
            {
              "id": "3B",
              "title": "Mortgage & Property Documents",
              "repeatable": true,
              "itemLabel": "Document",
              "fields": [
                { "key": "doc_type", "label": "Document Type", "type": "Dropdown", "options": ["Property Deed/Title", "Mortgage Statement", "Property Tax Bills", "Insurance", "HOA Documents", "Other"] },
                { "key": "doc_upload", "label": "Upload Document", "type": "TextInputWithUpload" },
                { "key": "notes", "label": "Notes", "type": "TextArea" }
              ]
            }
          ]
        },
        {
          "id": "4",
          "title": "Vacation Properties",
          "subsections": [
            {
              "id": "4A",
              "title": "Vacation Property Information",
              "repeatable": true,
              "itemLabel": "Property",
              "fields": [
                { "key": "property_type", "label": "Property Type", "type": "Dropdown", "options": ["Cabin", "Condo", "House", "Timeshare", "Other"] },
                { "key": "property_address", "label": "Property Address", "type": "TextInput" },
                { "key": "notes", "label": "Notes", "type": "TextArea" }
              ]
            }
          ]
        },
        {
          "id": "5",
          "title": "Insurance Policies",
          "subsections": [
            {
              "id": "5A",
              "title": "Insurance Policy Information",
              "repeatable": true,
              "itemLabel": "Policy",
              "fields": [
                {
                  "key": "policy_type",
                  "label": "Type of Policy",
                  "type": "Dropdown",
                  "options": [
                    "Life",
                    "Homeowner/Renter",
                    "Vehicle", 
                    "Health",
                    "Medical/Dental",
                    "Medicaid Supplements",
                    "Long Term Care",
                    "Disability",
                    "Job Loss",
                    "Umbrella",
                    "Annuity",
                    "Other"
                  ],
                  "required": true
                },
                {
                  "key": "policy_documents_life",
                  "label": "Life Insurance Policy Documents",
                  "type": "TextInputWithUpload",
                  "conditionalOn": { "field": "policy_type", "value": "Life" },
                  "helperText": "Upload your life insurance policy documents, beneficiary information, or take photos of policy cards and statements."
                },
                {
                  "key": "policy_company",
                  "label": "Insurance Company",
                  "type": "TextInput",
                  "helperText": "Name of the insurance company"
                },
                {
                  "key": "policy_number",
                  "label": "Policy Number",
                  "type": "TextInputWithUpload",
                  "helperText": "Enter the policy number or upload a photo of the policy showing the number"
                },
                {
                  "key": "coverage_amount",
                  "label": "Coverage Amount",
                  "type": "TextInput",
                  "helperText": "Coverage amount or benefit value"
                },
                {
                  "key": "premium_amount",
                  "label": "Premium Amount",
                  "type": "TextInput",
                  "helperText": "Monthly, quarterly, or annual premium amount"
                },
                {
                  "key": "notes",
                  "label": "Additional Notes",
                  "type": "TextArea",
                  "helperText": "Any additional information about this policy"
                }
              ]
            }
          ]
        },
        {
          "id": "6",
          "title": "Community Memberships",
          "subsections": [
            {
              "id": "6A",
              "title": "Membership Information",
              "repeatable": true,
              "itemLabel": "Membership",
              "fields": [
                { "key": "organization_name", "label": "Organization/Club Name", "type": "TextInput", "placeholder": "Country Club, Professional Association, etc.", "helperText": "Name of the organization or community group" },
                { "key": "membership_type", "label": "Membership Type", "type": "Dropdown", "options": ["Country Club", "Gym/Fitness", "Professional Association", "Homeowners Association", "Social Club", "Religious Organization", "Volunteer Organization", "Other"], "helperText": "Type of membership or organization" },
                { "key": "membership_number", "label": "Membership Number/ID", "type": "TextInputWithUpload", "placeholder": "Member ID or account number", "helperText": "Your membership ID or upload membership card" },
                { "key": "membership_status", "label": "Membership Status", "type": "RadioButtons", "options": ["Active", "Inactive", "Lifetime", "Annual", "Monthly"], "helperText": "Current status of your membership" },
                { "key": "annual_fees", "label": "Annual Fees/Dues", "type": "TextInput", "placeholder": "$0.00", "helperText": "Annual membership fees or dues amount" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this membership" }
              ]
            }
          ]
        },
        {
          "id": "7",
          "title": "Charitable Donations",
          "subsections": [
            {
              "id": "7A",
              "title": "Charitable Information",
              "repeatable": true,
              "itemLabel": "Charitable Donation",
              "fields": [
                { "key": "organization_name", "label": "Organization/Charity Name", "type": "TextInput", "placeholder": "American Red Cross, United Way, etc.", "helperText": "Name of the charitable organization" },
                { "key": "donation_type", "label": "Type of Donation", "type": "Dropdown", "options": ["One-time", "Monthly", "Annual", "Pledge", "Bequest in Will", "Other"], "helperText": "How you contribute to this organization" },
                { "key": "donation_amount", "label": "Donation Amount", "type": "TextInput", "placeholder": "$50/month, $500/year, etc.", "helperText": "Amount and frequency of donation" },
                { "key": "payment_method", "label": "Payment Method", "type": "RadioButtons", "options": ["Auto Withdrawal", "Credit Card", "Check", "Online", "Cash", "Other"], "helperText": "How the donation is paid" },
                { "key": "tax_deductible", "label": "Tax Deductible", "type": "RadioButtons", "options": ["Yes", "No", "Unknown"], "helperText": "Is this donation tax deductible?" },
                { "key": "contact_information", "label": "Organization Contact", "type": "TextInputWithUpload", "helperText": "Contact information for the charity or organization" },
                { "key": "donation_documents", "label": "Donation Documents", "type": "TextInputWithUpload", "helperText": "Upload donation receipts, pledge agreements, or related documents" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this charitable donation" }
              ]
            }
          ]
        },
        {
          "id": "8",
          "title": "Education & Accomplishments",
          "subsections": [
            {
              "id": "8A",
              "title": "Educational Background",
              "repeatable": true,
              "itemLabel": "Education",
              "fields": [
                { "key": "institution_name", "label": "Institution Name", "type": "TextInput", "placeholder": "Harvard University, Community College, etc.", "helperText": "Name of the educational institution" },
                { "key": "education_level", "label": "Education Level", "type": "Dropdown", "options": ["High School", "Associate Degree", "Bachelor's Degree", "Master's Degree", "Doctoral Degree", "Professional Degree", "Trade/Technical Certificate", "Other"], "helperText": "Level of education completed" },
                { "key": "field_of_study", "label": "Field of Study/Major", "type": "TextInput", "placeholder": "Business Administration, Engineering, etc.", "helperText": "Your major or field of study" },
                { "key": "graduation_year", "label": "Graduation Year", "type": "TextInput", "placeholder": "2010", "helperText": "Year you graduated or completed the program" },
                { "key": "honors_achievements", "label": "Honors & Achievements", "type": "TextArea", "helperText": "Any academic honors, awards, or special achievements" },
                { "key": "education_documents", "label": "Education Documents", "type": "TextInputWithUpload", "helperText": "Upload diplomas, transcripts, or certificates" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this education" }
              ]
            },
            {
              "id": "8B",
              "title": "Professional Certifications",
              "repeatable": true,
              "itemLabel": "Certification",
              "fields": [
                { "key": "certification_name", "label": "Certification Name", "type": "TextInput", "placeholder": "CPA, PMP, etc.", "helperText": "Name of the professional certification" },
                { "key": "issuing_organization", "label": "Issuing Organization", "type": "TextInput", "placeholder": "AICPA, PMI, etc.", "helperText": "Organization that issued the certification" },
                { "key": "certification_date", "label": "Certification Date", "type": "DatePicker", "helperText": "Date you received the certification" },
                { "key": "expiration_date", "label": "Expiration Date", "type": "DatePicker", "helperText": "When the certification expires (if applicable)" },
                { "key": "certification_documents", "label": "Certification Documents", "type": "TextInputWithUpload", "helperText": "Upload certification documents or certificates" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this certification" }
              ]
            },
            {
              "id": "8C", 
              "title": "Awards & Achievements",
              "repeatable": true,
              "itemLabel": "Achievement",
              "fields": [
                { "key": "award_name", "label": "Award/Achievement Name", "type": "TextInput", "placeholder": "Employee of the Year, Community Service Award, etc.", "helperText": "Name of the award or achievement" },
                { "key": "achievement_type", "label": "Type of Achievement", "type": "Dropdown", "options": ["Professional Award", "Community Recognition", "Academic Honor", "Athletic Achievement", "Volunteer Recognition", "Military Honor", "Other"], "helperText": "Category of the achievement" },
                { "key": "awarding_organization", "label": "Awarding Organization", "type": "TextInput", "placeholder": "Company, School, Community Group, etc.", "helperText": "Organization that gave the award" },
                { "key": "award_date", "label": "Award Date", "type": "DatePicker", "helperText": "Date you received the award" },
                { "key": "achievement_description", "label": "Achievement Description", "type": "TextArea", "helperText": "Brief description of what you accomplished" },
                { "key": "award_documents", "label": "Award Documents", "type": "TextInputWithUpload", "helperText": "Upload award certificates, photos, or related documents" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this achievement" }
              ]
            },
            {
              "id": "8D",
              "title": "Publications & Documents",
              "repeatable": true,
              "itemLabel": "Publication/Document",
              "fields": [
                { "key": "title", "label": "Title", "type": "TextInput", "placeholder": "Book title, article name, etc.", "helperText": "Title of the publication or document" },
                { "key": "document_type", "label": "Type of Document", "type": "Dropdown", "options": ["Book", "Article", "Research Paper", "Blog Post", "Newsletter", "Patent", "Thesis/Dissertation", "Report", "Other"], "helperText": "Type of publication or document" },
                { "key": "publication_venue", "label": "Publication Venue", "type": "TextInput", "placeholder": "Journal name, publisher, website, etc.", "helperText": "Where the document was published" },
                { "key": "publication_date", "label": "Publication Date", "type": "DatePicker", "helperText": "Date of publication" },
                { "key": "document_description", "label": "Description", "type": "TextArea", "helperText": "Brief description of the content or subject" },
                { "key": "publication_documents", "label": "Publication Documents", "type": "TextInputWithUpload", "helperText": "Upload copies of the publication or related documents" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this publication" }
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
          "id": "9",
          "title": "Military Service",
          "subsections": [
            {
              "id": "9A",
              "title": "Military Service Records",
              "repeatable": true,
              "itemLabel": "Service Record",
              "fields": [
                { "key": "branch_of_service", "label": "Branch of Service", "type": "Dropdown", "options": ["Army", "Navy", "Air Force", "Marines", "Coast Guard", "Space Force", "National Guard", "Reserves", "Other"], "helperText": "Branch of military service", "required": true },
                { "key": "service_rank", "label": "Final Rank/Grade", "type": "TextInput", "placeholder": "Captain, Sergeant, etc.", "helperText": "Final rank or grade achieved" },
                { "key": "service_number", "label": "Service Number", "type": "TextInputWithUpload", "helperText": "Military service number or upload service record" },
                { "key": "enlistment_date", "label": "Enlistment/Commission Date", "type": "DatePicker", "helperText": "Date of entry into service" },
                { "key": "discharge_date", "label": "Discharge/Retirement Date", "type": "DatePicker", "helperText": "Date of separation from service" },
                { "key": "service_years", "label": "Years of Service", "type": "TextInput", "placeholder": "4 years, 20 years, etc.", "helperText": "Total length of military service" },
                { "key": "discharge_type", "label": "Type of Discharge", "type": "Dropdown", "options": ["Honorable", "General", "Other Than Honorable", "Bad Conduct", "Dishonorable", "Medical", "Retirement", "Other"], "helperText": "Classification of military discharge" },
                { "key": "military_specialty", "label": "Military Occupational Specialty (MOS)", "type": "TextInput", "placeholder": "11B, 68W, etc.", "helperText": "Primary military job or specialty code" },
                { "key": "unit_assignments", "label": "Major Unit Assignments", "type": "TextArea", "helperText": "List significant units, bases, or duty stations" },
                { "key": "deployments", "label": "Deployments/Combat Service", "type": "TextArea", "helperText": "List deployments, combat zones, or overseas assignments" },
                { "key": "awards_decorations", "label": "Awards & Decorations", "type": "TextInputWithUpload", "helperText": "Military awards, medals, ribbons, or upload citation documents" },
                { "key": "security_clearance", "label": "Security Clearance", "type": "TextInput", "placeholder": "Secret, Top Secret, etc.", "helperText": "Highest security clearance held (if applicable)" },
                { "key": "dd214_location", "label": "DD-214 Location", "type": "TextInputWithUpload", "helperText": "Location of DD-214 discharge papers or upload document" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about military service" }
              ]
            },
            {
              "id": "9B",
              "title": "Military Benefits & VA Services",
              "repeatable": true,
              "itemLabel": "Military Benefit",
              "fields": [
                { "key": "benefit_type", "label": "Type of Benefit", "type": "Dropdown", "options": ["VA Disability Compensation", "VA Pension", "VA Healthcare", "GI Bill Education Benefits", "VA Home Loan", "SGLI Life Insurance", "Burial Benefits", "Dependent Benefits", "Other"], "helperText": "Type of military or VA benefit", "required": true },
                { "key": "benefit_status", "label": "Benefit Status", "type": "RadioButtons", "options": ["Active/Receiving", "Approved/Not Using", "Pending Application", "Denied", "Eligible/Not Applied", "Unknown"], "helperText": "Current status of this benefit" },
                { "key": "va_claim_number", "label": "VA Claim Number", "type": "TextInputWithUpload", "helperText": "VA claim number or upload benefit documents" },
                { "key": "disability_rating", "label": "VA Disability Rating", "type": "TextInput", "placeholder": "30%, 100%, etc.", "helperText": "Current VA disability rating percentage" },
                { "key": "monthly_amount", "label": "Monthly Benefit Amount", "type": "TextInput", "placeholder": "$1,200", "helperText": "Monthly payment amount (if applicable)" },
                { "key": "effective_date", "label": "Effective Date", "type": "DatePicker", "helperText": "Date benefits began or were approved" },
                { "key": "dependent_benefits", "label": "Dependent Benefits", "type": "TextInputWithUpload", "helperText": "Benefits available to spouse/children or upload documentation" },
                { "key": "va_medical_center", "label": "VA Medical Center", "type": "TextInput", "placeholder": "Name and location", "helperText": "Primary VA medical facility" },
                { "key": "gi_bill_remaining", "label": "GI Bill Benefits Remaining", "type": "TextInput", "placeholder": "24 months remaining", "helperText": "Unused education benefits" },
                { "key": "benefit_documents", "label": "Benefit Documents", "type": "TextInputWithUpload", "helperText": "Upload benefit letters, award letters, or related documents" },
                { "key": "contact_information", "label": "VA Contact Information", "type": "TextInputWithUpload", "helperText": "VA representative or office contact details" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this benefit" }
              ]
            },
            {
              "id": "9C",
              "title": "Military Documents & Records",
              "repeatable": true,
              "itemLabel": "Military Document",
              "fields": [
                { "key": "document_type", "label": "Document Type", "type": "Dropdown", "options": ["DD-214 (Discharge Papers)", "DD-215 (Correction to DD-214)", "Military ID/CAC Card", "Retiree ID Card", "Service Medical Records", "Personnel Records", "Award Citations", "Training Certificates", "Security Clearance Documents", "Court-Martial Records", "Other"], "helperText": "Type of military document", "required": true },
                { "key": "document_description", "label": "Document Description", "type": "TextInput", "placeholder": "Brief description of document", "helperText": "Describe the specific document" },
                { "key": "document_location", "label": "Document Location", "type": "TextInputWithUpload", "helperText": "Where document is stored or upload the document" },
                { "key": "document_date", "label": "Document Date", "type": "DatePicker", "helperText": "Date the document was issued" },
                { "key": "issuing_authority", "label": "Issuing Authority", "type": "TextInput", "placeholder": "Unit, command, or agency", "helperText": "Military unit or agency that issued the document" },
                { "key": "document_number", "label": "Document Number", "type": "TextInput", "helperText": "Official document number or identifier" },
                { "key": "expiration_date", "label": "Expiration Date", "type": "DatePicker", "helperText": "Document expiration date (if applicable)" },
                { "key": "importance_level", "label": "Importance Level", "type": "RadioButtons", "options": ["Critical", "Important", "Reference Only"], "helperText": "How important is this document for survivors?" },
                { "key": "copies_available", "label": "Copies Available", "type": "TextInput", "placeholder": "Number of copies and locations", "helperText": "How many copies exist and where they are stored" },
                { "key": "replacement_process", "label": "Replacement Process", "type": "TextArea", "helperText": "Instructions on how to obtain replacement if lost" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this document" }
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
              "fields": [
                { "key": "bank_name", "label": "Bank Name", "type": "TextInput", "placeholder": "Chase, Bank of America, etc.", "helperText": "Name of the financial institution" },
                { "key": "account_type", "label": "Account Type", "type": "Dropdown", "options": ["Checking", "Savings", "Money Market", "CD", "Other"], "helperText": "Type of bank account" },
                { "key": "account_number", "label": "Account Number", "type": "TextInputWithUpload", "helperText": "Account number or upload account statement" },
                { "key": "routing_number", "label": "Routing Number", "type": "TextInput", "helperText": "Bank routing number" },
                { "key": "account_balance", "label": "Approximate Balance", "type": "TextInput", "placeholder": "$0.00", "helperText": "Current account balance" },
                { "key": "online_access", "label": "Online Banking Access", "type": "TextInputWithUpload", "helperText": "Username, password, or upload login information" },
                { "key": "branch_location", "label": "Branch Location", "type": "TextInput", "helperText": "Primary branch location" },
                { "key": "contact_person", "label": "Contact Person", "type": "TextInput", "helperText": "Bank representative or account manager" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this account" }
              ]
            },
            {
              "id": "10B",
              "title": "Investment Accounts",
              "repeatable": true,
              "itemLabel": "Investment Account",
              "fields": [
                { "key": "institution_name", "label": "Institution Name", "type": "TextInput", "placeholder": "Fidelity, Charles Schwab, etc.", "helperText": "Name of the investment institution" },
                { "key": "account_type", "label": "Account Type", "type": "Dropdown", "options": ["401(k)", "403(b)", "IRA", "Roth IRA", "Brokerage", "SEP-IRA", "Simple IRA", "Pension", "Other"], "helperText": "Type of investment account" },
                { "key": "account_number", "label": "Account Number", "type": "TextInputWithUpload", "helperText": "Account number or upload statement" },
                { "key": "account_balance", "label": "Approximate Balance", "type": "TextInput", "placeholder": "$0.00", "helperText": "Current account balance" },
                { "key": "beneficiaries", "label": "Beneficiaries", "type": "TextInputWithUpload", "helperText": "Primary and secondary beneficiaries" },
                { "key": "employer_plan", "label": "Employer Plan Details", "type": "TextArea", "helperText": "If employer-sponsored, provide company and plan details" },
                { "key": "online_access", "label": "Online Account Access", "type": "TextInputWithUpload", "helperText": "Username, password, or login information" },
                { "key": "contact_person", "label": "Contact Person", "type": "TextInput", "helperText": "Financial advisor or account representative" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this account" }
              ]
            }
          ]
        },
        {
          "id": "11",
          "title": "Credit Cards & Debts",
          "subsections": [
            {
              "id": "11A",
              "title": "Credit Card Information",
              "repeatable": true,
              "itemLabel": "Credit Card",
              "fields": [
                { "key": "card_name", "label": "Card Name/Type", "type": "TextInput", "placeholder": "Chase Sapphire, Capital One Venture, etc.", "helperText": "Name or type of the credit card" },
                { "key": "card_type", "label": "Card Type", "type": "Dropdown", "options": ["Visa", "Mastercard", "American Express", "Discover", "Store Card", "Other"], "helperText": "Type of credit card" },
                { "key": "card_number", "label": "Card Number (Last 4 Digits)", "type": "TextInputWithUpload", "placeholder": "****-****-****-1234", "helperText": "Last 4 digits of card number or upload card photo" },
                { "key": "credit_limit", "label": "Credit Limit", "type": "TextInput", "placeholder": "$5,000", "helperText": "Maximum credit limit on this card" },
                { "key": "current_balance", "label": "Current Balance", "type": "TextInput", "placeholder": "$1,200", "helperText": "Current outstanding balance" },
                { "key": "minimum_payment", "label": "Minimum Monthly Payment", "type": "TextInput", "placeholder": "$50", "helperText": "Required minimum monthly payment" },
                { "key": "payment_due_date", "label": "Payment Due Date", "type": "TextInput", "placeholder": "15th of each month", "helperText": "When payments are due each month" },
                { "key": "autopay_setup", "label": "Auto-Pay Setup", "type": "RadioButtons", "options": ["Yes", "No"], "helperText": "Is automatic payment set up?" },
                { "key": "autopay_account", "label": "Auto-Pay Account", "type": "TextInputWithUpload", "conditionalOn": { "field": "autopay_setup", "value": "Yes" }, "helperText": "Account used for automatic payments" },
                { "key": "customer_service", "label": "Customer Service", "type": "TextInputWithUpload", "helperText": "Customer service phone number or contact information" },
                { "key": "online_access", "label": "Online Account Access", "type": "TextInputWithUpload", "helperText": "Username, password, or login information" },
                { "key": "rewards_benefits", "label": "Rewards/Benefits", "type": "TextArea", "helperText": "Description of rewards programs or benefits" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this credit card" }
              ]
            },
            {
              "id": "11B", 
              "title": "Debts & Loans",
              "repeatable": true,
              "itemLabel": "Debt/Loan",
              "fields": [
                { "key": "debt_type", "label": "Type of Debt/Loan", "type": "Dropdown", "options": ["Personal Loan", "Student Loan", "Auto Loan", "Mortgage", "Home Equity Loan", "Credit Card Debt", "Medical Debt", "Business Loan", "Other"], "helperText": "Type of debt or loan", "required": true },
                { "key": "creditor_name", "label": "Creditor/Lender Name", "type": "TextInput", "placeholder": "Bank name, company, etc.", "helperText": "Name of the creditor or lending institution" },
                { "key": "account_number", "label": "Account/Loan Number", "type": "TextInputWithUpload", "helperText": "Account or loan number, or upload statement" },
                { "key": "original_amount", "label": "Original Loan Amount", "type": "TextInput", "placeholder": "$25,000", "helperText": "Original amount borrowed" },
                { "key": "current_balance", "label": "Current Balance Owed", "type": "TextInput", "placeholder": "$18,500", "helperText": "Current outstanding balance" },
                { "key": "monthly_payment", "label": "Monthly Payment", "type": "TextInput", "placeholder": "$350", "helperText": "Required monthly payment amount" },
                { "key": "payment_due_date", "label": "Payment Due Date", "type": "TextInput", "placeholder": "1st of each month", "helperText": "When payments are due each month" },
                { "key": "interest_rate", "label": "Interest Rate", "type": "TextInput", "placeholder": "4.5%", "helperText": "Annual interest rate" },
                { "key": "loan_term", "label": "Loan Term", "type": "TextInput", "placeholder": "60 months, 15 years, etc.", "helperText": "Total length of the loan" },
                { "key": "autopay_setup", "label": "Auto-Pay Setup", "type": "RadioButtons", "options": ["Yes", "No"], "helperText": "Is automatic payment set up?" },
                { "key": "autopay_account", "label": "Auto-Pay Account", "type": "TextInputWithUpload", "conditionalOn": { "field": "autopay_setup", "value": "Yes" }, "helperText": "Account used for automatic payments" },
                { "key": "collateral", "label": "Collateral/Security", "type": "TextArea", "helperText": "Any collateral or security backing this debt" },
                { "key": "cosigner_info", "label": "Co-signer Information", "type": "TextInputWithUpload", "helperText": "Information about any co-signers on this debt" },
                { "key": "payoff_date", "label": "Expected Payoff Date", "type": "DatePicker", "helperText": "When this debt is expected to be paid off" },
                { "key": "contact_information", "label": "Creditor Contact Information", "type": "TextInputWithUpload", "helperText": "Phone, address, or other contact details" },
                { "key": "loan_documents", "label": "Loan Documents", "type": "TextInputWithUpload", "helperText": "Upload loan agreements, statements, or related documents" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this debt or loan" }
              ]
            }
          ]
        },
        {
          "id": "12",
          "title": "Health Records",
          "subsections": [
            {
              "id": "12A",
              "title": "Primary Care & Specialists",
              "repeatable": true,
              "itemLabel": "Healthcare Provider",
              "fields": [
                { "key": "provider_type", "label": "Provider Type", "type": "Dropdown", "options": ["Primary Care Physician", "Cardiologist", "Dermatologist", "Endocrinologist", "Gastroenterologist", "Neurologist", "Oncologist", "Orthopedist", "Psychiatrist", "Pulmonologist", "Other Specialist"], "helperText": "Type of healthcare provider" },
                { "key": "doctor_name", "label": "Doctor/Provider Name", "type": "TextInput", "placeholder": "Dr. John Smith", "helperText": "Name of the healthcare provider" },
                { "key": "practice_name", "label": "Practice/Hospital Name", "type": "TextInput", "placeholder": "City Medical Center", "helperText": "Name of the medical practice or hospital" },
                { "key": "contact_information", "label": "Contact Information", "type": "TextInputWithUpload", "helperText": "Phone number, address, or upload business card" },
                { "key": "patient_id", "label": "Patient ID/Account Number", "type": "TextInputWithUpload", "helperText": "Your patient ID or account number with this provider" },
                { "key": "last_visit", "label": "Last Visit Date", "type": "DatePicker", "helperText": "Date of your most recent visit" },
                { "key": "next_appointment", "label": "Next Scheduled Appointment", "type": "DatePicker", "helperText": "Date of your next scheduled appointment" },
                { "key": "conditions_treated", "label": "Conditions Treated", "type": "TextArea", "helperText": "Medical conditions this provider treats for you" },
                { "key": "current_medications", "label": "Medications Prescribed", "type": "TextArea", "helperText": "Current medications prescribed by this provider" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this provider" }
              ]
            },
            {
              "id": "12B",
              "title": "Health Insurance",
              "repeatable": true,
              "itemLabel": "Health Insurance",
              "fields": [
                { "key": "insurance_company", "label": "Insurance Company", "type": "TextInput", "placeholder": "Blue Cross Blue Shield, Aetna, etc.", "helperText": "Name of the health insurance company" },
                { "key": "coverage_type", "label": "Type of Coverage", "type": "Dropdown", "options": ["Individual", "Family", "Employee", "Medicare", "Medicaid", "Other"], "helperText": "Type of health insurance coverage" },
                { "key": "policy_number", "label": "Policy/Member Number", "type": "TextInputWithUpload", "helperText": "Policy or member ID number, or upload insurance card" },
                { "key": "group_number", "label": "Group Number", "type": "TextInput", "helperText": "Group number (if applicable)" },
                { "key": "effective_date", "label": "Coverage Effective Date", "type": "DatePicker", "helperText": "When coverage began" },
                { "key": "renewal_date", "label": "Renewal Date", "type": "DatePicker", "helperText": "When coverage renews" },
                { "key": "monthly_premium", "label": "Monthly Premium", "type": "TextInput", "placeholder": "$350", "helperText": "Monthly premium amount" },
                { "key": "deductible", "label": "Annual Deductible", "type": "TextInput", "placeholder": "$2,500", "helperText": "Annual deductible amount" },
                { "key": "out_of_pocket_max", "label": "Out-of-Pocket Maximum", "type": "TextInput", "placeholder": "$8,000", "helperText": "Annual out-of-pocket maximum" },
                { "key": "covered_dependents", "label": "Covered Dependents", "type": "TextArea", "helperText": "List of family members covered under this policy" },
                { "key": "prescription_coverage", "label": "Prescription Drug Coverage", "type": "TextArea", "helperText": "Details about prescription drug coverage" },
                { "key": "customer_service", "label": "Customer Service", "type": "TextInputWithUpload", "helperText": "Customer service contact information" },
                { "key": "online_access", "label": "Online Account Access", "type": "TextInputWithUpload", "helperText": "Website login information for insurance portal" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this insurance" }
              ]
            }
          ]
        },
        {
          "id": "13",
          "title": "Employment History",
          "subsections": [
            {
              "id": "13A",
              "title": "Current & Previous Employment",
              "repeatable": true,
              "itemLabel": "Employment",
              "fields": [
                { "key": "company_name", "label": "Company/Employer Name", "type": "TextInput", "placeholder": "ABC Corporation", "helperText": "Name of the company or employer" },
                { "key": "job_title", "label": "Job Title/Position", "type": "TextInput", "placeholder": "Senior Manager, Engineer, etc.", "helperText": "Your job title or position" },
                { "key": "employment_status", "label": "Employment Status", "type": "Dropdown", "options": ["Current Employee", "Former Employee", "Retired", "Contract/Freelance", "Self-Employed", "Other"], "helperText": "Current employment status" },
                { "key": "start_date", "label": "Start Date", "type": "DatePicker", "helperText": "When you started working there" },
                { "key": "end_date", "label": "End Date", "type": "DatePicker", "helperText": "When you stopped working there (if applicable)" },
                { "key": "salary_wage", "label": "Salary/Wage", "type": "TextInput", "placeholder": "$75,000/year, $25/hour", "helperText": "Current or final salary/wage" },
                { "key": "benefits", "label": "Benefits", "type": "TextArea", "helperText": "Health insurance, 401k, vacation, etc." },
                { "key": "hr_contact", "label": "HR Contact Information", "type": "TextInputWithUpload", "helperText": "Human resources contact details" },
                { "key": "supervisor_contact", "label": "Supervisor Contact", "type": "TextInputWithUpload", "helperText": "Direct supervisor or manager contact information" },
                { "key": "employee_id", "label": "Employee ID", "type": "TextInput", "helperText": "Your employee identification number" },
                { "key": "work_location", "label": "Work Location", "type": "TextInput", "helperText": "Office address or work location" },
                { "key": "retirement_accounts", "label": "Retirement Accounts (401k, etc.)", "type": "TextInputWithUpload", "helperText": "Details about employer-sponsored retirement accounts" },
                { "key": "employment_documents", "label": "Employment Documents", "type": "TextInputWithUpload", "helperText": "Upload contracts, offer letters, or employment records" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this employment" }
              ]
            }
          ]
        },
        {
          "id": "14",
          "title": "Valuable Items",
          "subsections": [
            {
              "id": "14A",
              "title": "Valuable Item Information",
              "repeatable": true,
              "itemLabel": "Valuable Item",
              "fields": [
                { "key": "item_type", "label": "Type of Item", "type": "Dropdown", "options": ["Jewelry", "Electronics", "Artwork", "Collectibles", "Antiques", "Musical Instruments", "Tools/Equipment", "Furniture", "Vehicles", "Other"], "helperText": "Category of the valuable item" },
                { "key": "item_description", "label": "Item Description", "type": "TextInput", "placeholder": "Gold wedding ring, vintage guitar, etc.", "helperText": "Detailed description of the item" },
                { "key": "estimated_value", "label": "Estimated Value", "type": "TextInput", "placeholder": "$2,500", "helperText": "Current estimated value of the item" },
                { "key": "purchase_date", "label": "Purchase Date", "type": "DatePicker", "helperText": "When the item was purchased" },
                { "key": "purchase_price", "label": "Original Purchase Price", "type": "TextInput", "placeholder": "$1,800", "helperText": "How much you originally paid for the item" },
                { "key": "current_location", "label": "Current Location", "type": "TextInputWithUpload", "helperText": "Where the item is currently stored or located" },
                { "key": "serial_number", "label": "Serial Number/ID", "type": "TextInput", "helperText": "Serial number or other identifying information" },
                { "key": "insurance_coverage", "label": "Insurance Coverage", "type": "RadioButtons", "options": ["Yes", "No", "Unknown"], "helperText": "Is this item covered by insurance?" },
                { "key": "insurance_details", "label": "Insurance Details", "type": "TextInputWithUpload", "conditionalOn": { "field": "insurance_coverage", "value": "Yes" }, "helperText": "Insurance policy information covering this item" },
                { "key": "appraisal_info", "label": "Appraisal Information", "type": "TextInputWithUpload", "helperText": "Professional appraisal details or documents" },
                { "key": "purchase_receipt", "label": "Purchase Receipt/Documentation", "type": "TextInputWithUpload", "helperText": "Upload purchase receipts or proof of ownership" },
                { "key": "photos", "label": "Photos of Item", "type": "TextInputWithUpload", "helperText": "Upload photos of the item for identification" },
                { "key": "sentimental_value", "label": "Sentimental Value/History", "type": "TextArea", "helperText": "Personal significance or family history of this item" },
                { "key": "disposition_wishes", "label": "Disposition Wishes", "type": "TextArea", "helperText": "Who should receive this item or how it should be handled" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this valuable item" }
              ]
            }
          ]
        },
        {
          "id": "15",
          "title": "Legal Documents",
          "subsections": [
            {
              "id": "15A",
              "title": "Legal Document Information",
              "repeatable": true,
              "itemLabel": "Legal Document",
              "fields": [
                { "key": "document_type", "label": "Document Type", "type": "Dropdown", "options": ["Will", "Trust", "Power of Attorney", "Advanced Directive", "Living Will", "Birth Certificate", "Marriage Certificate", "Divorce Decree", "Adoption Papers", "Citizenship Documents", "Passport", "Social Security Card", "Other"], "helperText": "Type of legal document", "required": true },
                { "key": "document_title", "label": "Document Title/Name", "type": "TextInput", "placeholder": "Last Will and Testament, etc.", "helperText": "Official title or name of the document" },
                { "key": "document_location", "label": "Document Location", "type": "TextInputWithUpload", "helperText": "Where the original document is stored or upload a copy" },
                { "key": "document_date", "label": "Document Date", "type": "DatePicker", "helperText": "Date the document was created or signed" },
                { "key": "expiration_date", "label": "Expiration Date", "type": "DatePicker", "helperText": "When the document expires (if applicable)" },
                { "key": "attorney_notary", "label": "Attorney/Notary Information", "type": "TextInputWithUpload", "helperText": "Lawyer or notary who prepared or witnessed the document" },
                { "key": "witnesses", "label": "Witnesses", "type": "TextInputWithUpload", "helperText": "People who witnessed the signing of this document" },
                { "key": "copies_location", "label": "Copies Location", "type": "TextArea", "helperText": "Where copies of this document are stored" },
                { "key": "people_involved", "label": "People Named in Document", "type": "TextArea", "helperText": "Executors, beneficiaries, or other people named in the document" },
                { "key": "document_purpose", "label": "Document Purpose", "type": "TextArea", "helperText": "What this document accomplishes or provides for" },
                { "key": "update_needed", "label": "Updates Needed", "type": "RadioButtons", "options": ["Yes", "No", "Unsure"], "helperText": "Does this document need to be updated?" },
                { "key": "update_notes", "label": "Update Notes", "type": "TextArea", "conditionalOn": { "field": "update_needed", "value": "Yes" }, "helperText": "What updates or changes are needed" },
                { "key": "importance_level", "label": "Importance Level", "type": "RadioButtons", "options": ["Critical", "Important", "Reference"], "helperText": "How important is this document for your affairs?" },
                { "key": "access_instructions", "label": "Access Instructions", "type": "TextArea", "helperText": "Instructions for how others can access this document when needed" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this legal document" }
              ]
            }
          ]
        },
        {
          "id": "16",
          "title": "Passwords & Online Accounts",
          "subsections": [
            {
              "id": "16A",
              "title": "Online Account Information",
              "repeatable": true,
              "itemLabel": "Online Account",
              "fields": [
                { "key": "account_type", "label": "Type of Account", "type": "Dropdown", "options": ["Email", "Social Media", "Banking/Financial", "Shopping", "Streaming/Entertainment", "Cloud Storage", "Work/Professional", "Utilities", "Subscription Service", "Gaming", "Other"], "helperText": "Category of online account", "required": true },
                { "key": "service_name", "label": "Service/Website Name", "type": "TextInput", "placeholder": "Facebook, Gmail, Netflix, etc.", "helperText": "Name of the service or website" },
                { "key": "account_username", "label": "Username/Email", "type": "TextInput", "placeholder": "username or email@example.com", "helperText": "Username or email address for this account" },
                { "key": "account_password", "label": "Password", "type": "TextInputWithUpload", "helperText": "Account password or reference to password manager" },
                { "key": "two_factor_auth", "label": "Two-Factor Authentication", "type": "RadioButtons", "options": ["Yes", "No", "Unknown"], "helperText": "Is two-factor authentication enabled?" },
                { "key": "two_factor_method", "label": "2FA Method", "type": "Dropdown", "options": ["Text Message", "Authenticator App", "Email", "Hardware Key", "Other"], "conditionalOn": { "field": "two_factor_auth", "value": "Yes" }, "helperText": "Method used for two-factor authentication" },
                { "key": "recovery_email", "label": "Recovery Email", "type": "TextInput", "helperText": "Email address used for account recovery" },
                { "key": "recovery_phone", "label": "Recovery Phone", "type": "TextInput", "helperText": "Phone number used for account recovery" },
                { "key": "security_questions", "label": "Security Questions/Answers", "type": "TextInputWithUpload", "helperText": "Security questions and answers for account recovery" },
                { "key": "account_importance", "label": "Account Importance", "type": "RadioButtons", "options": ["Critical", "Important", "Low Priority"], "helperText": "How important is this account?" },
                { "key": "account_status", "label": "Account Status", "type": "Dropdown", "options": ["Active", "Inactive", "Should be Closed", "Memorial Account", "Other"], "helperText": "Current status of this account" },
                { "key": "subscription_details", "label": "Subscription Details", "type": "TextArea", "helperText": "Subscription cost, billing info, renewal dates" },
                { "key": "account_value", "label": "Account Value/Contents", "type": "TextArea", "helperText": "Important data, files, or value in this account" },
                { "key": "access_instructions", "label": "Access Instructions", "type": "TextArea", "helperText": "Special instructions for accessing this account" },
                { "key": "closure_instructions", "label": "Account Closure Instructions", "type": "TextArea", "helperText": "Instructions for closing or memorializing this account" },
                { "key": "account_documents", "label": "Account Documents", "type": "TextInputWithUpload", "helperText": "Upload screenshots, account info, or related documents" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this account" }
              ]
            }
          ]
        },
        {
          "id": "17",
          "title": "Final Wishes & Instructions",
          "subsections": [
            {
              "id": "17A",
              "title": "Funeral & Memorial Preferences",
              "fields": [
                { "key": "funeral_preference", "label": "Funeral Preference", "type": "RadioButtons", "options": ["Traditional Funeral Service", "Memorial Service", "Celebration of Life", "Private Family Service", "No Service", "Other"], "helperText": "Your preference for funeral or memorial services" },
                { "key": "burial_cremation", "label": "Burial or Cremation", "type": "RadioButtons", "options": ["Burial", "Cremation", "Donation to Science", "Other"], "helperText": "Your preference for final disposition of remains" },
                { "key": "funeral_home", "label": "Preferred Funeral Home", "type": "TextInputWithUpload", "helperText": "Name and contact information of preferred funeral home" },
                { "key": "cemetery_location", "label": "Cemetery/Burial Location", "type": "TextInputWithUpload", "helperText": "Preferred cemetery or burial location" },
                { "key": "plot_ownership", "label": "Cemetery Plot Ownership", "type": "TextInputWithUpload", "helperText": "Information about owned burial plots or columbarium spaces" },
                { "key": "cremation_wishes", "label": "Cremation Wishes", "type": "TextArea", "conditionalOn": { "field": "burial_cremation", "value": "Cremation" }, "helperText": "What should be done with cremated remains" },
                { "key": "service_details", "label": "Service Details", "type": "TextArea", "helperText": "Specific wishes for funeral or memorial service" },
                { "key": "music_readings", "label": "Music & Readings", "type": "TextArea", "helperText": "Preferred music, readings, or speakers for service" },
                { "key": "flower_donations", "label": "Flowers or Donations", "type": "TextArea", "helperText": "Preferences for flowers or charitable donations in lieu of flowers" },
                { "key": "obituary_wishes", "label": "Obituary Wishes", "type": "TextArea", "helperText": "How you would like to be remembered in your obituary" },
                { "key": "special_requests", "label": "Special Requests", "type": "TextArea", "helperText": "Any special requests or wishes for your services" },
                { "key": "prepaid_arrangements", "label": "Prepaid Funeral Arrangements", "type": "TextInputWithUpload", "helperText": "Information about any prepaid funeral or burial arrangements" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional final wishes or instructions" }
              ]
            }
          ]
        },
        {
          "id": "18",
          "title": "Emergency Contacts",
          "subsections": [
            {
              "id": "18A",
              "title": "Emergency Contact Information",
              "repeatable": true,
              "itemLabel": "Emergency Contact",
              "fields": [
                { "key": "contact_name", "label": "Contact Name", "type": "TextInput", "placeholder": "John Smith", "helperText": "Full name of the emergency contact", "required": true },
                { "key": "relationship", "label": "Relationship", "type": "Dropdown", "options": ["Spouse", "Child", "Parent", "Sibling", "Other Family", "Friend", "Neighbor", "Attorney", "Doctor", "Other"], "helperText": "Your relationship to this person" },
                { "key": "primary_phone", "label": "Primary Phone", "type": "TextInput", "placeholder": "(555) 123-4567", "helperText": "Primary phone number" },
                { "key": "secondary_phone", "label": "Secondary Phone", "type": "TextInput", "placeholder": "(555) 987-6543", "helperText": "Secondary or work phone number" },
                { "key": "email_address", "label": "Email Address", "type": "TextInput", "placeholder": "email@example.com", "helperText": "Email address for this contact" },
                { "key": "home_address", "label": "Home Address", "type": "TextArea", "helperText": "Physical home address" },
                { "key": "work_address", "label": "Work Address", "type": "TextArea", "helperText": "Work address (if relevant)" },
                { "key": "priority_level", "label": "Priority Level", "type": "RadioButtons", "options": ["Primary", "Secondary", "Tertiary"], "helperText": "Priority order for contacting this person" },
                { "key": "when_to_contact", "label": "When to Contact", "type": "Dropdown", "options": ["Any Emergency", "Medical Emergency Only", "Legal Matters", "Financial Matters", "After Death Only", "Other"], "helperText": "Under what circumstances should this person be contacted" },
                { "key": "authority_level", "label": "Authority Level", "type": "Dropdown", "options": ["Decision Maker", "Information Only", "Legal Authority", "Medical Authority", "Financial Authority", "Other"], "helperText": "What authority this person has in emergencies" },
                { "key": "access_permissions", "label": "Access Permissions", "type": "TextArea", "helperText": "What information or access this person should have" },
                { "key": "special_instructions", "label": "Special Instructions", "type": "TextArea", "helperText": "Special instructions for contacting or working with this person" },
                { "key": "backup_contact", "label": "Backup Contact for This Person", "type": "TextInputWithUpload", "helperText": "How to reach this person if primary contact methods fail" },
                { "key": "contact_documents", "label": "Contact Documents", "type": "TextInputWithUpload", "helperText": "Upload business cards, photos, or contact information" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this emergency contact" }
              ]
            }
          ]
        }
      ]
    }
  ]
};