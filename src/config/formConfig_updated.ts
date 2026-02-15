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