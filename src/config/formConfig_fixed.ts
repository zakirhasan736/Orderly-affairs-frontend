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
                { "key": "custom_membership_type", "label": "Custom Membership Type", "type": "TextInput", "conditionalOn": { "field": "membership_type", "value": "Other" }, "helperText": "Specify the custom membership type" },
                { "key": "membership_number", "label": "Membership Number/ID", "type": "TextInputWithUpload", "placeholder": "Member ID or account number", "helperText": "Your membership ID or upload membership card" },
                { "key": "membership_status", "label": "Membership Status", "type": "RadioButtons", "options": ["Active", "Inactive", "Lifetime", "Annual", "Monthly"], "helperText": "Current status of your membership" },
                { "key": "role_involvement", "label": "Role/Involvement", "type": "TextInput", "placeholder": "Board member, volunteer, participant, etc.", "helperText": "Your role or level of involvement in this organization" },
                { "key": "annual_fees", "label": "Annual Fees/Dues", "type": "TextInput", "placeholder": "$0.00", "helperText": "Annual membership fees or dues amount" },
                { "key": "contact_information", "label": "Organization Contact Information", "type": "TextInputWithUpload", "helperText": "Contact details for the organization or upload contact card" },
                { "key": "membership_documents", "label": "Membership Documents", "type": "TextInputWithUpload", "helperText": "Upload membership cards, certificates, or related documents" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this membership" }
              ]
            },
            {
              "id": "6B",
              "title": "Physical Memberships & Subscriptions",
              "repeatable": true,
              "itemLabel": "Physical Membership",
              "fields": [
                { "key": "company_service_name", "label": "Company/Service Name", "type": "TextInput", "placeholder": "Amazon Prime, Costco, etc.", "helperText": "Name of the company or service" },
                { "key": "subscription_category", "label": "Subscription Category", "type": "Dropdown", "options": ["Streaming Service", "Shopping Membership", "Software/App", "News/Magazine", "Fitness/Health", "Professional Service", "Other"], "helperText": "Category of subscription or membership" },
                { "key": "account_email", "label": "Account Email", "type": "TextInput", "placeholder": "email@example.com", "helperText": "Email address associated with the account" },
                { "key": "subscription_cost", "label": "Subscription Cost", "type": "TextInput", "placeholder": "$9.99/month", "helperText": "Cost and billing frequency" },
                { "key": "billing_method", "label": "Billing Method", "type": "RadioButtons", "options": ["Credit Card", "Bank Account", "PayPal", "Gift Card", "Other"], "helperText": "How the subscription is paid" },
                { "key": "renewal_date", "label": "Next Renewal Date", "type": "DatePicker", "helperText": "When the subscription renews next" },
                { "key": "cancellation_instructions", "label": "Cancellation Instructions", "type": "TextInputWithUpload", "helperText": "How to cancel this subscription or upload cancellation info" },
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
                { "key": "issuing_authority", "label": "Issuing Authority", "type": "TextInput", "placeholder": "Branch, command, or organization", "helperText": "Who issued this document" },
                { "key": "expiration_date", "label": "Expiration Date", "type": "DatePicker", "helperText": "When the document expires (if applicable)" },
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
              "itemLabel": "Bank Account",
              "fields": [
                { "key": "bank_name", "label": "Bank Name", "type": "TextInput", "placeholder": "Chase, Bank of America, etc.", "helperText": "Name of the financial institution" },
                { "key": "account_type", "label": "Account Type", "type": "Dropdown", "options": ["Checking", "Savings", "Money Market", "Certificate of Deposit (CD)", "Business Checking", "Business Savings", "Other"], "helperText": "Type of bank account" },
                { "key": "account_number", "label": "Account Number", "type": "TextInputWithUpload", "helperText": "Account number or upload account statement showing number" },
                { "key": "routing_number", "label": "Routing Number", "type": "TextInput", "placeholder": "9-digit routing number", "helperText": "Bank's routing number" },
                { "key": "account_purpose", "label": "Account Purpose", "type": "TextInput", "placeholder": "Emergency fund, bill paying, etc.", "helperText": "What this account is used for" },
                { "key": "online_username", "label": "Online Banking Username", "type": "TextInput", "placeholder": "Username for online banking", "helperText": "Username used to log into online banking" },
                { "key": "online_password", "label": "Online Banking Password", "type": "TextInputWithUpload", "helperText": "Password for online banking or upload secure note" },
                { "key": "security_code", "label": "Security Code/Word", "type": "TextInputWithUpload", "helperText": "Security code, PIN, or secret word for account access" },
                { "key": "account_authority", "label": "Account Management Authority", "type": "TextArea", "helperText": "Who has the legal authority to manage this account on your behalf if you're unable? Make sure this person's name is recorded accurately." },
                { "key": "beneficiaries", "label": "Beneficiary of this account", "type": "TextInputWithUpload", "helperText": "Listed beneficiaries or upload beneficiary documents. Who will receive the funds upon your passing? This is often called the \"payable on death\" beneficiary. Designating a beneficiary can help avoid probate for this account." },
                { "key": "automatic_payments", "label": "Automatic Payments/Deposits", "type": "TextInputWithUpload", "helperText": "List automatic payments or deposits from this account" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this account" }
              ]
            }
          ]
        },
        {
          "id": "11",
          "title": "Passwords & Online Accounts",
          "subsections": [
            {
              "id": "11A",
              "title": "Digital Account Information",
              "repeatable": true,
              "itemLabel": "Online Account",
              "fields": [
                { "key": "account_type", "label": "Account Type", "type": "Dropdown", "options": ["Social Media", "Email", "Banking/Financial", "Shopping", "Entertainment/Streaming", "Professional", "Cloud Storage", "Password Manager", "Other"], "helperText": "Category of online account" },
                { "key": "service_name", "label": "Service/Platform Name", "type": "TextInput", "placeholder": "Facebook, Gmail, Netflix, etc.", "helperText": "Name of the service or platform" },
                { "key": "username_email", "label": "Username/Email", "type": "TextInput", "placeholder": "Username or email used to log in", "helperText": "Login credentials for the account" },
                { "key": "password_info", "label": "Password Information", "type": "TextInputWithUpload", "helperText": "Password or location where password is stored (password manager, etc.)" },
                { "key": "two_factor_auth", "label": "Two-Factor Authentication", "type": "TextInputWithUpload", "helperText": "Information about 2FA setup (phone number, authenticator app, backup codes)" },
                { "key": "recovery_info", "label": "Account Recovery Information", "type": "TextInputWithUpload", "helperText": "Security questions, recovery email, or other account recovery methods" },
                { "key": "account_value", "label": "Account Value/Importance", "type": "TextInput", "placeholder": "Financial value or importance level", "helperText": "Approximate value or importance of this account" },
                { "key": "closure_instructions", "label": "Account Closure Instructions", "type": "TextInputWithUpload", "helperText": "Instructions for closing or memorializing this account" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this account" }
              ]
            }
          ]
        },
        {
          "id": "12",
          "title": "Investment Accounts",
          "subsections": [
            {
              "id": "12A",
              "title": "Investment Account Information",
              "repeatable": true,
              "itemLabel": "Investment Account",
              "fields": [
                { "key": "institution_name", "label": "Institution Name", "type": "TextInput", "placeholder": "Fidelity, Charles Schwab, etc.", "helperText": "Name of the investment firm or institution" },
                { "key": "account_type", "label": "Account Type", "type": "Dropdown", "options": ["401(k)", "403(b)", "Traditional IRA", "Roth IRA", "SEP-IRA", "Brokerage Account", "Mutual Fund", "529 Education Plan", "HSA", "Pension", "Other"], "helperText": "Type of investment account" },
                { "key": "account_number", "label": "Account Number", "type": "TextInputWithUpload", "helperText": "Account number or upload statement showing account details" },
                { "key": "approximate_value", "label": "Approximate Current Value", "type": "TextInput", "placeholder": "$25,000", "helperText": "Estimated current value of the account" },
                { "key": "beneficiaries", "label": "Account Beneficiaries", "type": "TextInputWithUpload", "helperText": "Primary and contingent beneficiaries or upload beneficiary forms" },
                { "key": "advisor_contact", "label": "Financial Advisor Contact", "type": "TextInputWithUpload", "helperText": "Contact information for financial advisor or account manager" },
                { "key": "login_information", "label": "Online Account Access", "type": "TextInputWithUpload", "helperText": "Username, password, or login instructions for online access" },
                { "key": "employer_plan", "label": "Employer Plan Details", "type": "TextInputWithUpload", "helperText": "If employer-sponsored, include employer contact and plan details" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this investment account" }
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
          "id": "13",
          "title": "Credit Cards & Debt",
          "subsections": [
            {
              "id": "13A",
              "title": "Credit Card Information",
              "repeatable": true,
              "itemLabel": "Credit Card",
              "fields": [
                { "key": "card_name", "label": "Card Name/Bank", "type": "TextInput", "placeholder": "Chase Sapphire, Discover It, etc.", "helperText": "Name of the credit card and issuing bank" },
                { "key": "card_type", "label": "Card Type", "type": "Dropdown", "options": ["Visa", "Mastercard", "American Express", "Discover", "Store Card", "Other"], "helperText": "Type of credit card" },
                { "key": "card_number", "label": "Card Number (Last 4 Digits)", "type": "TextInput", "placeholder": "XXXX", "helperText": "Last 4 digits of the card number for identification" },
                { "key": "credit_limit", "label": "Credit Limit", "type": "TextInput", "placeholder": "$5,000", "helperText": "Maximum credit limit on the card" },
                { "key": "current_balance", "label": "Approximate Current Balance", "type": "TextInput", "placeholder": "$1,200", "helperText": "Current outstanding balance (approximate)" },
                { "key": "autopay_setup", "label": "Auto-Pay Setup", "type": "TextInputWithUpload", "helperText": "Information about automatic payments or upload autopay details" },
                { "key": "rewards_points", "label": "Rewards/Points Balance", "type": "TextInput", "placeholder": "25,000 points", "helperText": "Current rewards points or cash back balance" },
                { "key": "annual_fee", "label": "Annual Fee", "type": "TextInput", "placeholder": "$95", "helperText": "Annual fee for the card (if any)" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this credit card" }
              ]
            },
            {
              "id": "13B",
              "title": "Other Debts & Loans",
              "repeatable": true,
              "itemLabel": "Debt/Loan",
              "fields": [
                { "key": "debt_type", "label": "Type of Debt/Loan", "type": "Dropdown", "options": ["Personal Loan", "Student Loan", "Mortgage", "Home Equity Loan", "Auto Loan", "Medical Debt", "Business Loan", "Other"], "helperText": "Category of debt or loan" },
                { "key": "creditor_name", "label": "Creditor/Lender Name", "type": "TextInput", "placeholder": "Wells Fargo, Sallie Mae, etc.", "helperText": "Name of the lending institution or creditor" },
                { "key": "account_number", "label": "Account/Loan Number", "type": "TextInputWithUpload", "helperText": "Account number or upload loan documents" },
                { "key": "original_amount", "label": "Original Loan Amount", "type": "TextInput", "placeholder": "$25,000", "helperText": "Original amount borrowed" },
                { "key": "current_balance", "label": "Current Balance Owed", "type": "TextInput", "placeholder": "$18,500", "helperText": "Current outstanding balance" },
                { "key": "monthly_payment", "label": "Monthly Payment", "type": "TextInput", "placeholder": "$350", "helperText": "Regular monthly payment amount" },
                { "key": "interest_rate", "label": "Interest Rate", "type": "TextInput", "placeholder": "6.5%", "helperText": "Current interest rate" },
                { "key": "payment_due_date", "label": "Payment Due Date", "type": "TextInput", "placeholder": "15th of each month", "helperText": "When payments are due" },
                { "key": "autopay_setup", "label": "Auto-Pay Information", "type": "TextInputWithUpload", "helperText": "Automatic payment setup details" },
                { "key": "cosigner_info", "label": "Co-signer Information", "type": "TextInputWithUpload", "helperText": "Information about any co-signers on the loan" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this debt" }
              ]
            }
          ]
        },
        {
          "id": "14",
          "title": "Health Records",
          "subsections": [
            {
              "id": "14A",
              "title": "Medical Information",
              "groups": [
                {
                  "title": "Primary Healthcare Providers",
                  "fields": [
                    { "key": "primary_care_physician", "label": "Primary Care Physician", "type": "TextInputWithUpload", "helperText": "Name and contact information for your primary doctor" },
                    { "key": "preferred_hospital", "label": "Preferred Hospital", "type": "TextInput", "helperText": "Your preferred hospital for emergency care" },
                    { "key": "emergency_contact", "label": "Medical Emergency Contact", "type": "TextInputWithUpload", "helperText": "Person to contact in medical emergencies" }
                  ]
                },
                {
                  "title": "Medical History",
                  "fields": [
                    { "key": "chronic_conditions", "label": "Chronic Conditions", "type": "TextArea", "helperText": "List any ongoing medical conditions (diabetes, heart disease, etc.)" },
                    { "key": "allergies", "label": "Allergies", "type": "TextArea", "helperText": "List all known allergies (medications, foods, environmental)" },
                    { "key": "current_medications", "label": "Current Medications", "type": "TextInputWithUpload", "helperText": "List current medications or upload medication list" },
                    { "key": "medical_devices", "label": "Medical Devices/Implants", "type": "TextArea", "helperText": "Pacemaker, joint replacements, hearing aids, etc." }
                  ]
                },
                {
                  "title": "Healthcare Directives",
                  "fields": [
                    { "key": "advance_directive", "label": "Advance Directive", "type": "TextInputWithUpload", "helperText": "Upload advance directive document or note location" },
                    { "key": "healthcare_proxy", "label": "Healthcare Proxy/Power of Attorney", "type": "TextInputWithUpload", "helperText": "Person authorized to make healthcare decisions" },
                    { "key": "living_will", "label": "Living Will", "type": "TextInputWithUpload", "helperText": "Upload living will or note location" },
                    { "key": "organ_donation", "label": "Organ Donation Preferences", "type": "TextArea", "helperText": "Your wishes regarding organ donation" }
                  ]
                }
              ]
            },
            {
              "id": "14B",
              "title": "Health Insurance Information",
              "repeatable": true,
              "itemLabel": "Health Insurance",
              "fields": [
                { "key": "insurance_company", "label": "Insurance Company", "type": "TextInput", "placeholder": "Blue Cross Blue Shield, Aetna, etc.", "helperText": "Name of the health insurance provider" },
                { "key": "coverage_type", "label": "Type of Coverage", "type": "Dropdown", "options": ["Individual", "Family", "Group/Employer", "Medicare", "Medicaid", "COBRA", "Other"], "helperText": "Type of health insurance coverage" },
                { "key": "policy_number", "label": "Policy/Member ID Number", "type": "TextInputWithUpload", "helperText": "Policy or member ID number or upload insurance card" },
                { "key": "group_number", "label": "Group Number", "type": "TextInput", "helperText": "Group number (if applicable)" },
                { "key": "effective_date", "label": "Coverage Effective Date", "type": "DatePicker", "helperText": "When coverage began" },
                { "key": "coverage_details", "label": "Coverage Details", "type": "TextInputWithUpload", "helperText": "Deductible, co-pays, coverage limits, or upload summary of benefits" },
                { "key": "employer_contact", "label": "Employer/Plan Administrator Contact", "type": "TextInputWithUpload", "helperText": "Contact information for HR or benefits administrator" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this insurance" }
              ]
            }
          ]
        },
        {
          "id": "15",
          "title": "Employment History",
          "subsections": [
            {
              "id": "15A",
              "title": "Current Employment",
              "groups": [
                {
                  "title": "Current Job Information",
                  "fields": [
                    { "key": "employer_name", "label": "Employer Name", "type": "TextInput", "placeholder": "Company or organization name", "helperText": "Current employer" },
                    { "key": "job_title", "label": "Job Title/Position", "type": "TextInput", "placeholder": "Manager, Engineer, etc.", "helperText": "Your current job title" },
                    { "key": "employment_start_date", "label": "Employment Start Date", "type": "DatePicker", "helperText": "When you started this job" },
                    { "key": "work_location", "label": "Work Location", "type": "TextInput", "placeholder": "Office address or remote", "helperText": "Where you work" },
                    { "key": "supervisor_contact", "label": "Supervisor Contact", "type": "TextInputWithUpload", "helperText": "Your direct supervisor's contact information" },
                    { "key": "hr_contact", "label": "HR/Benefits Contact", "type": "TextInputWithUpload", "helperText": "Human resources or benefits department contact" }
                  ]
                },
                {
                  "title": "Benefits & Compensation",
                  "fields": [
                    { "key": "salary_wage", "label": "Salary/Wage Information", "type": "TextInput", "placeholder": "$65,000/year or $25/hour", "helperText": "Your current compensation" },
                    { "key": "benefits_overview", "label": "Benefits Overview", "type": "TextInputWithUpload", "helperText": "Health insurance, retirement plans, PTO, etc." },
                    { "key": "retirement_plan", "label": "Retirement Plan Details", "type": "TextInputWithUpload", "helperText": "401k, pension, or other retirement benefits" },
                    { "key": "life_insurance", "label": "Employer Life Insurance", "type": "TextInputWithUpload", "helperText": "Life insurance provided by employer" },
                    { "key": "pto_balance", "label": "PTO/Vacation Balance", "type": "TextInput", "placeholder": "120 hours available", "helperText": "Current paid time off balance" }
                  ]
                }
              ]
            },
            {
              "id": "15B",
              "title": "Previous Employment",
              "repeatable": true,
              "itemLabel": "Previous Job",
              "fields": [
                { "key": "employer_name", "label": "Employer Name", "type": "TextInput", "placeholder": "Previous company or organization", "helperText": "Name of previous employer" },
                { "key": "job_title", "label": "Job Title/Position", "type": "TextInput", "placeholder": "Position held", "helperText": "Your job title at this employer" },
                { "key": "employment_dates", "label": "Employment Dates", "type": "TextInput", "placeholder": "Jan 2018 - Dec 2020", "helperText": "Start and end dates of employment" },
                { "key": "reason_for_leaving", "label": "Reason for Leaving", "type": "TextInput", "placeholder": "Career advancement, relocation, etc.", "helperText": "Why you left this position" },
                { "key": "final_salary", "label": "Final Salary", "type": "TextInput", "placeholder": "$55,000", "helperText": "Final salary at this position" },
                { "key": "benefits_received", "label": "Benefits Received", "type": "TextArea", "helperText": "Retirement contributions, unused PTO payout, etc." },
                { "key": "contact_information", "label": "HR/Reference Contact", "type": "TextInputWithUpload", "helperText": "Contact for employment verification or references" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this employment" }
              ]
            }
          ]
        },
        {
          "id": "16",
          "title": "Valuable Items",
          "subsections": [
            {
              "id": "16A",
              "title": "Valuable Item Inventory",
              "repeatable": true,
              "itemLabel": "Valuable Item",
              "fields": [
                { "key": "item_type", "label": "Type of Item", "type": "Dropdown", "options": ["Jewelry", "Artwork", "Collectibles", "Electronics", "Furniture", "Antiques", "Musical Instruments", "Sports Equipment", "Tools", "Other"], "helperText": "Category of valuable item" },
                { "key": "item_description", "label": "Item Description", "type": "TextArea", "placeholder": "Detailed description of the item", "helperText": "Describe the item in detail (brand, model, condition, etc.)" },
                { "key": "estimated_value", "label": "Estimated Value", "type": "TextInput", "placeholder": "$2,500", "helperText": "Current estimated value of the item" },
                { "key": "purchase_date", "label": "Purchase Date", "type": "DatePicker", "helperText": "When the item was purchased (if known)" },
                { "key": "purchase_price", "label": "Original Purchase Price", "type": "TextInput", "placeholder": "$2,000", "helperText": "What you paid for the item" },
                { "key": "appraisal_info", "label": "Appraisal Information", "type": "TextInputWithUpload", "helperText": "Professional appraisal details or upload appraisal document" },
                { "key": "insurance_coverage", "label": "Insurance Coverage", "type": "TextInputWithUpload", "helperText": "Insurance policy covering this item" },
                { "key": "location", "label": "Item Location", "type": "TextInput", "placeholder": "Safe, bedroom dresser, etc.", "helperText": "Where the item is currently stored" },
                { "key": "ownership_documents", "label": "Ownership Documents", "type": "TextInputWithUpload", "helperText": "Receipt, certificate of authenticity, warranty, etc." },
                { "key": "photos", "label": "Photos of Item", "type": "TextInputWithUpload", "helperText": "Upload photos of the item for identification" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this item" }
              ]
            }
          ]
        },
        {
          "id": "17",
          "title": "Legal Documents",
          "subsections": [
            {
              "id": "17A",
              "title": "Legal Document Inventory",
              "repeatable": true,
              "itemLabel": "Legal Document",
              "fields": [
                { "key": "document_type", "label": "Document Type", "type": "Dropdown", "options": ["Will", "Trust Agreement", "Power of Attorney", "Healthcare Directive", "Birth Certificate", "Marriage Certificate", "Divorce Decree", "Passport", "Social Security Card", "Property Deed", "Contract", "Court Order", "Other"], "helperText": "Type of legal document" },
                { "key": "document_title", "label": "Document Title/Name", "type": "TextInput", "placeholder": "Last Will and Testament, etc.", "helperText": "Specific title or name of the document" },
                { "key": "document_date", "label": "Document Date", "type": "DatePicker", "helperText": "Date the document was created or executed" },
                { "key": "document_location", "label": "Document Location", "type": "TextInputWithUpload", "helperText": "Where the original document is stored or upload digital copy" },
                { "key": "attorney_contact", "label": "Attorney/Legal Contact", "type": "TextInputWithUpload", "helperText": "Lawyer or legal professional who prepared the document" },
                { "key": "expiration_date", "label": "Expiration Date", "type": "DatePicker", "helperText": "When the document expires (if applicable)" },
                { "key": "copies_location", "label": "Copies Location", "type": "TextInput", "placeholder": "Bank safe deposit box, attorney office, etc.", "helperText": "Where copies of the document are kept" },
                { "key": "related_parties", "label": "Related Parties", "type": "TextArea", "helperText": "Other people involved or mentioned in the document" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this document" }
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
          "id": "18",
          "title": "Estate Planning",
          "subsections": [
            {
              "id": "18A",
              "title": "Estate Planning Overview",
              "groups": [
                {
                  "title": "Estate Planning Status",
                  "fields": [
                    { "key": "estate_planning_complete", "label": "Estate Planning Completion Status", "type": "RadioButtons", "options": ["Complete", "In Progress", "Not Started", "Needs Review"], "helperText": "Current status of your estate planning" },
                    { "key": "last_review_date", "label": "Last Review Date", "type": "DatePicker", "helperText": "When you last reviewed your estate plan" },
                    { "key": "next_review_date", "label": "Next Planned Review", "type": "DatePicker", "helperText": "When you plan to review your estate plan next" }
                  ]
                },
                {
                  "title": "Key Estate Planning Contacts",
                  "fields": [
                    { "key": "estate_attorney", "label": "Estate Planning Attorney", "type": "TextInputWithUpload", "helperText": "Contact information for your estate planning lawyer" },
                    { "key": "executor", "label": "Executor/Personal Representative", "type": "TextInputWithUpload", "helperText": "Person named to execute your will" },
                    { "key": "trustee", "label": "Trustee", "type": "TextInputWithUpload", "helperText": "Person or institution managing any trusts" },
                    { "key": "guardian", "label": "Guardian for Minor Children", "type": "TextInputWithUpload", "helperText": "Named guardian for any minor children" },
                    { "key": "financial_power_of_attorney", "label": "Financial Power of Attorney", "type": "TextInputWithUpload", "helperText": "Person authorized to handle financial matters" },
                    { "key": "healthcare_power_of_attorney", "label": "Healthcare Power of Attorney", "type": "TextInputWithUpload", "helperText": "Person authorized to make healthcare decisions" }
                  ]
                },
                {
                  "title": "Asset Distribution Wishes",
                  "fields": [
                    { "key": "primary_beneficiaries", "label": "Primary Beneficiaries", "type": "TextArea", "helperText": "Main people or organizations you want to inherit your assets" },
                    { "key": "contingent_beneficiaries", "label": "Contingent Beneficiaries", "type": "TextArea", "helperText": "Backup beneficiaries if primary beneficiaries cannot inherit" },
                    { "key": "specific_bequests", "label": "Specific Bequests", "type": "TextArea", "helperText": "Specific items or amounts you want to leave to particular people" },
                    { "key": "charitable_giving", "label": "Charitable Giving Intentions", "type": "TextArea", "helperText": "Any charitable organizations you want to support through your estate" }
                  ]
                },
                {
                  "title": "Final Wishes",
                  "fields": [
                    { "key": "funeral_preferences", "label": "Funeral/Memorial Preferences", "type": "TextArea", "helperText": "Your wishes for funeral or memorial services" },
                    { "key": "burial_cremation", "label": "Burial or Cremation Preferences", "type": "RadioButtons", "options": ["Burial", "Cremation", "Donation to Science", "Other", "No Preference"], "helperText": "Your preference for handling of remains" },
                    { "key": "cemetery_plot", "label": "Cemetery Plot Information", "type": "TextInputWithUpload", "helperText": "Information about any cemetery plots owned" },
                    { "key": "funeral_home", "label": "Preferred Funeral Home", "type": "TextInputWithUpload", "helperText": "Funeral home you prefer to use" },
                    { "key": "obituary_instructions", "label": "Obituary Instructions", "type": "TextArea", "helperText": "Any specific wishes for your obituary" }
                  ]
                }
              ]
            }
          ]
        },
        {
          "id": "19",
          "title": "Emergency Contacts",
          "subsections": [
            {
              "id": "19A",
              "title": "Emergency Contact Information",
              "repeatable": true,
              "itemLabel": "Emergency Contact",
              "fields": [
                { "key": "contact_name", "label": "Contact Name", "type": "TextInput", "placeholder": "Full name of emergency contact", "helperText": "Name of the emergency contact person" },
                { "key": "relationship", "label": "Relationship to You", "type": "Dropdown", "options": ["Spouse", "Parent", "Sibling", "Child", "Other Family", "Friend", "Neighbor", "Attorney", "Doctor", "Other"], "helperText": "How this person is related to you" },
                { "key": "priority_level", "label": "Priority Level", "type": "RadioButtons", "options": ["Primary", "Secondary", "Tertiary"], "helperText": "Order in which this person should be contacted" },
                { "key": "phone_numbers", "label": "Phone Numbers", "type": "TextArea", "placeholder": "Home, mobile, work numbers", "helperText": "All available phone numbers for this contact" },
                { "key": "email", "label": "Email Address", "type": "TextInput", "placeholder": "contact@email.com", "helperText": "Email address for this contact" },
                { "key": "address", "label": "Address", "type": "TextArea", "placeholder": "Full home address", "helperText": "Home address for this contact" },
                { "key": "best_time_to_contact", "label": "Best Time to Contact", "type": "TextInput", "placeholder": "9am-5pm, evenings, etc.", "helperText": "When is the best time to reach this person" },
                { "key": "special_instructions", "label": "Special Instructions", "type": "TextArea", "helperText": "Any special instructions for contacting this person" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any additional information about this contact" }
              ]
            }
          ]
        },
        {
          "id": "20",
          "title": "Digital Assets",
          "subsections": [
            {
              "id": "20A",
              "title": "Digital Asset Inventory",
              "groups": [
                {
                  "title": "Digital Asset Overview",
                  "fields": [
                    { "key": "digital_executor", "label": "Digital Executor", "type": "TextInputWithUpload", "helperText": "Person responsible for managing your digital assets after death" },
                    { "key": "password_manager", "label": "Password Manager Information", "type": "TextInputWithUpload", "helperText": "Details about password manager and master password location" },
                    { "key": "digital_asset_instructions", "label": "General Digital Asset Instructions", "type": "TextArea", "helperText": "General instructions for handling your digital assets" }
                  ]
                },
                {
                  "title": "Online Accounts Summary",
                  "fields": [
                    { "key": "social_media_accounts", "label": "Social Media Accounts", "type": "TextArea", "helperText": "List of social media accounts (Facebook, Twitter, Instagram, etc.)" },
                    { "key": "email_accounts", "label": "Email Accounts", "type": "TextArea", "helperText": "List of email accounts and providers" },
                    { "key": "financial_accounts", "label": "Online Financial Accounts", "type": "TextArea", "helperText": "Banking, investment, and financial accounts accessible online" },
                    { "key": "subscription_services", "label": "Subscription Services", "type": "TextArea", "helperText": "Netflix, Spotify, software subscriptions, etc." },
                    { "key": "cloud_storage", "label": "Cloud Storage Accounts", "type": "TextArea", "helperText": "Google Drive, Dropbox, iCloud, etc." },
                    { "key": "digital_purchases", "label": "Digital Purchases & Libraries", "type": "TextArea", "helperText": "iTunes, Kindle books, Steam games, etc." }
                  ]
                },
                {
                  "title": "Digital Asset Wishes",
                  "fields": [
                    { "key": "account_closure_wishes", "label": "Account Closure Wishes", "type": "TextArea", "helperText": "Which accounts should be closed vs. memorialized" },
                    { "key": "digital_content_distribution", "label": "Digital Content Distribution", "type": "TextArea", "helperText": "Who should receive access to photos, documents, etc." },
                    { "key": "business_digital_assets", "label": "Business Digital Assets", "type": "TextArea", "helperText": "Business websites, domains, social media accounts" }
                  ]
                }
              ]
            }
          ]
        },
        {
          "id": "21",
          "title": "Final Instructions",
          "subsections": [
            {
              "id": "21A",
              "title": "Final Instructions & Messages",
              "groups": [
                {
                  "title": "Important Information Summary",
                  "fields": [
                    { "key": "document_locations", "label": "Important Document Locations", "type": "TextArea", "helperText": "Summary of where key documents are stored" },
                    { "key": "safe_deposit_box", "label": "Safe Deposit Box Information", "type": "TextInputWithUpload", "helperText": "Location, box number, and key location for safe deposit box" },
                    { "key": "home_safe_combination", "label": "Home Safe Information", "type": "TextInputWithUpload", "helperText": "Combination or key location for home safe" },
                    { "key": "hidden_valuables", "label": "Hidden Valuables", "type": "TextInputWithUpload", "helperText": "Location of any valuables hidden in the home" }
                  ]
                },
                {
                  "title": "Immediate Action Items",
                  "fields": [
                    { "key": "immediate_actions", "label": "Immediate Actions Required", "type": "TextArea", "helperText": "Things that need to be done immediately after your passing" },
                    { "key": "time_sensitive_items", "label": "Time-Sensitive Items", "type": "TextArea", "helperText": "Items that have deadlines or time requirements" },
                    { "key": "notification_list", "label": "Who to Notify", "type": "TextArea", "helperText": "List of people and organizations that need to be notified" }
                  ]
                },
                {
                  "title": "Personal Messages",
                  "fields": [
                    { "key": "personal_messages", "label": "Personal Messages", "type": "TextArea", "helperText": "Personal messages to family members or friends" },
                    { "key": "life_story", "label": "Life Story Summary", "type": "TextArea", "helperText": "Brief summary of your life for obituary or memorial purposes" },
                    { "key": "values_legacy", "label": "Values & Legacy", "type": "TextArea", "helperText": "Values, beliefs, or legacy you want to leave behind" }
                  ]
                },
                {
                  "title": "Special Instructions",
                  "fields": [
                    { "key": "pet_care", "label": "Pet Care Instructions", "type": "TextInputWithUpload", "helperText": "Care instructions for pets and designated caretakers" },
                    { "key": "business_instructions", "label": "Business Continuation Instructions", "type": "TextArea", "helperText": "Instructions for business operations or closure" },
                    { "key": "special_requests", "label": "Special Requests", "type": "TextArea", "helperText": "Any other special requests or instructions" }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};