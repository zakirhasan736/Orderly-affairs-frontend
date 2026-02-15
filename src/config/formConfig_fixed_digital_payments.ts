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
        }
      ]
    }
  ]
};