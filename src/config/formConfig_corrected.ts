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
            }
          ]
        }
      ]
    }
  ]
};