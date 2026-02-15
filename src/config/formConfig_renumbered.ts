export const formConfig = {
  "appName": "Orderly Affairs",
  "version": "1.0",
  "chunks": [
    {
      "id": "chunk1",
      "title": "Personal Information",
      "sections": [
        {
          "id": "0",
          "title": "Instructions",
          "fields": [
            { "key": "honored_youre_here", "label": "We're honored you're here", "type": "Instructions", "content": "Thank you for your support of our small business. Whether you're planning ahead or navigating life after a loss, this kit offers you clarity, and support during overwhelming times. It provides an easy framework to gather, organize, and communicate important details to you and your loved ones.\\n\\nThis isn't just about paperwork; it's about peace of mind and making things easier for those who may open this kit with a heavy heart. Each section guides you through life areas—financial, legal, personal, or practical—with simple instructions. Some parts are straightforward, such as listing vehicles, while others, like estate plans, require more careful consideration. The kit uses color-coded tabs: green for manageable sections, yellow for those needing more time, and red for sections with documents that may take longer to gather." },
            
            { "key": "go_at_your_pace", "label": "Go at your own pace. There's no correct order, no perfect way", "type": "Instructions", "content": "You can write neatly or scribble notes. Add sticky tabs, folders, or printouts, including extra letters or passwords. Make this kit reflect your life, story, and preferences. As you fill it out, consider those who might hold it—spouse, daughter, son-in-law, or friend. They may not know where everything is or your wishes, but\\n\\nyour care and clarity will guide them. This kit is a gift—not just for the future but for now—offering control, comfort, and preparedness." },
            
            { "key": "things_to_keep_in_mind", "label": "A Few Things to Keep in Mind:", "type": "Instructions", "content": "• This isn't about getting everything perfect. It's about making sure your life is understandable and accessible.\\n\\n• Life changes. So should your kit. Come back to it from time to time—when you move, get a new pet, sell a car, or update your will.\\n\\n• Keep it in one place. Let someone you trust know where to find it.\\n\\n• And most importantly, remember this is not a legal document. Please consult with an attorney when drafting your will, designating beneficiaries, or making binding decisions." },
            
            { "key": "whats_included", "label": "What's Included in Your Orderly Affairs Kit", "type": "Instructions", "content": "1 Fireproof Document Protector Bag: Use this for passports, birth certificates, or anything you keep in a safe. Your next of kin can also use it to safely store critical documents during estate handling. Instructions included.\\n\\n1 Fireproof Key Bag + 10 Key Tags: We guide you through labeling and storing your home and personal keys. For your next of kin, we provide instructions to keep everything secure and accounted for." },
            
            { "key": "fireproof_key_bag", "label": "Fireproof Key Bag", "type": "Instructions", "content": "This part of your Orderly Affairs Kit might seem minor, but it can make a big difference.\\n\\nKeys are easy to overlook, yet when the time comes, unlabeled or missing keys can cause confusion, stress, and wasted time for your loved ones. This fireproof key bag is here to prevent that." },
            
            { "key": "copyright_legal_notice", "label": "Copyright & Legal Notice", "type": "Instructions", "content": "The Orderly Affairs Kit was created with great care and compassion to help people bring peace, clarity, and dignity to one of life's most difficult transitions. Every page, prompt, and phrase were written with intention—offering guidance not just for paperwork, but for love, legacy, and letting go. Orderly Affairs is not affiliated with any other product or company, and all material herein is protected by copyright. This Kit is offered as a personal organizational tool and does not constitute legal, financial, or medical advice. For those matters, we encourage you to consult trusted professionals.\\n\\nWe welcome you to use this guide for your planning or to support a loved one. Please do not redistribute, copy, or resell any portion without written permission.\\n\\nBecause this work was created from a place of service, we ask that it be treated with the same respect and integrity upon which it was built." }
          ]
        },
        {
          "id": "1",
          "title": "Vital Information & Key Contacts",
          "subsections": [
            {
              "id": "1A",
              "title": "Vital Information",
              "fields": [
                { "key": "vital_info_instructions", "label": "Essential Information Overview", "type": "Instructions", "content": "This page contains the most essential information your next of kin may need when managing your estate or gaining access to your accounts. If you're not comfortable placing all this information in one place, that's okay. You can note where each piece can be found instead—just make sure your loved one knows how to locate it. Feel free to store this information in your encrypted USB drive." },
                
                { "key": "personal_details_header", "label": "Personal Details", "type": "Instructions", "content": "" },
                { "key": "full_legal_name", "label": "Full Legal Name (First, Middle, Last)", "type": "TextInput", "helperText": "Your complete legal name as it appears on official documents" },
                { "key": "other_names", "label": "Any Other Names (Maiden, Nickname, etc.)", "type": "TextInput", "helperText": "Maiden name, nicknames, or other names you may be known by" },
                { "key": "date_of_birth", "label": "Date of Birth", "type": "DatePicker", "helperText": "Your date of birth" },
                { "key": "social_security_number", "label": "Social Security Number (last 4 digits or location of your full SSN)", "type": "TextInput", "helperText": "Last 4 digits of SSN or location where full SSN can be found" },
                
                { "key": "phone_device_header", "label": "Phone & Device Access", "type": "Instructions", "content": "" },
                { "key": "phone_number", "label": "Phone Number", "type": "TextInput", "helperText": "Your primary phone number" },
                { "key": "phone_password", "label": "Phone Password or PIN", "type": "TextInput", "helperText": "Password or PIN to unlock your phone" },
                { "key": "voicemail_pin", "label": "Voicemail PIN (if different)", "type": "TextInput", "helperText": "PIN to access voicemail if different from phone PIN" },
                { "key": "computer_password", "label": "Computer or Laptop Password", "type": "TextInput", "helperText": "Password to access your computer or laptop" },
                
                { "key": "email_accounts_header", "label": "Email Accounts", "type": "Instructions", "content": "" },
                { "key": "primary_email_username", "label": "Primary Email Username/Address", "type": "TextInput", "helperText": "Your main email address" },
                { "key": "primary_email_password", "label": "Primary Email Password", "type": "TextInput", "helperText": "Password for your main email account" },
                { "key": "secondary_email_username", "label": "Secondary Email Username/Address", "type": "TextInput", "helperText": "Secondary email address (if applicable)" },
                { "key": "secondary_email_password", "label": "Secondary Email Password", "type": "TextInput", "helperText": "Password for secondary email account (if applicable)" },
                
                { "key": "secure_locations_header", "label": "Secure Locations", "type": "Instructions", "content": "" },
                { "key": "safe_code", "label": "Code to Safe (if applicable)", "type": "TextInput", "helperText": "Combination or code for your safe" },
                { "key": "safe_location", "label": "Location of Safe or Lockbox", "type": "TextInput", "helperText": "Where your safe or lockbox is located" },
                { "key": "safe_keys", "label": "Where to Find the Key(s)", "type": "TextInput", "helperText": "Location of keys for safe or lockbox" },
                
                { "key": "digital_ids_header", "label": "Digital IDs & Accounts", "type": "Instructions", "content": "" },
                { "key": "google_id_username", "label": "Google ID Username/Email", "type": "TextInput", "helperText": "Your Google account email address" },
                { "key": "google_id_password", "label": "Google ID Password", "type": "TextInput", "helperText": "Password for your Google account" },
                { "key": "apple_id_username", "label": "Apple ID Username/Email", "type": "TextInput", "helperText": "Your Apple ID email address" },
                { "key": "apple_id_password", "label": "Apple ID Password", "type": "TextInput", "helperText": "Password for your Apple ID account" },
                
                { "key": "security_questions_header", "label": "Security Questions & PINs", "type": "Instructions", "content": "If you use common answers to security questions (e.g., \"mother's maiden name\" or \"first car\"), you can list them here or write: \"See Password Manager\" or \"Ask [Name].\"" },
                { "key": "security_question_answers", "label": "Common Security Question Answers", "type": "TextArea", "helperText": "Your standard answers to common security questions" },
                { "key": "frequent_pins", "label": "Frequently Used PINs (ATM, voicemail, garage)", "type": "TextArea", "helperText": "List of commonly used PINs and what they're for" }
              ]
            },
            {
              "id": "1B",
              "title": "Emergency Information",
              "fields": [
                { "key": "emergency_contacts_header", "label": "Emergency Contacts", "type": "Instructions", "content": "List people who should be contacted in case of emergency." },
                { "key": "emergency_contact_1", "label": "Emergency Contact 1", "type": "TextArea", "helperText": "Name, relationship, phone number, and address" },
                { "key": "emergency_contact_2", "label": "Emergency Contact 2", "type": "TextArea", "helperText": "Name, relationship, phone number, and address" },
                { "key": "emergency_contact_3", "label": "Emergency Contact 3", "type": "TextArea", "helperText": "Name, relationship, phone number, and address" },
                
                { "key": "medical_emergency_header", "label": "Medical Emergency Information", "type": "Instructions", "content": "Important medical information for emergency responders." },
                { "key": "medical_conditions", "label": "Medical Conditions/Allergies", "type": "TextArea", "helperText": "List any medical conditions, allergies, or medications that emergency responders should know about" },
                { "key": "preferred_hospital", "label": "Preferred Hospital", "type": "TextInput", "helperText": "Name and address of your preferred hospital" },
                { "key": "primary_physician", "label": "Primary Physician", "type": "TextArea", "helperText": "Name, specialty, phone number, and address of your primary doctor" },
                { "key": "emergency_instructions", "label": "Special Emergency Instructions", "type": "TextArea", "helperText": "Any special instructions for emergency situations" }
              ]
            },
            {
              "id": "1C",
              "title": "Key Contacts",
              "fields": [
                { "key": "next_of_kin_header", "label": "Next of Kin", "type": "Instructions", "content": "Your next of kin are typically your closest living relatives who should be contacted first." },
                { "key": "next_of_kin_info", "label": "Name(s) and contact information", "type": "TextArea", "helperText": "Include names, relationships, phone numbers, and addresses", "required": true },
                
                { "key": "executor_trustee_header", "label": "Executor or Trustee", "type": "Instructions", "content": "These are the people legally responsible for managing your estate and carrying out your wishes." },
                { "key": "executor_trustee_info", "label": "Name(s) and contact information", "type": "TextArea", "helperText": "Include names, roles (executor/trustee), phone numbers, and addresses", "required": true },
                
                { "key": "add_additional_contacts", "label": "I have additional important contacts to document", "type": "Checkbox", "helperText": "Check this box to add other important people your next of kin should know about or contact (attorneys, CPAs, funeral directors, financial advisors, etc.)" }
              ],
              "groups": [
                {
                  "id": "additional_contacts",
                  "title": "Additional Important Contacts",
                  "isRepeatable": true,
                  "itemLabel": "Contact",
                  "conditionalOn": "add_additional_contacts",
                  "description": "Add other important people your next of kin should know about or contact.",
                  "fields": [
                    { "key": "contact_name", "label": "Name", "type": "TextInput", "helperText": "Full name of the contact person", "required": true },
                    { "key": "role_title", "label": "Role/Title", "type": "TextInput", "helperText": "e.g., Attorney, CPA, Funeral Director, Financial Advisor", "required": true },
                    { "key": "relationship", "label": "Relationship", "type": "TextInput", "helperText": "How this person relates to you (professional, family, friend, etc.)" },
                    { "key": "phone_number", "label": "Phone Number", "type": "TextInput", "helperText": "Primary phone number for this contact" },
                    { "key": "email_address", "label": "Email Address", "type": "TextInput", "helperText": "Email address for this contact" },
                    { "key": "company_organization", "label": "Company/Organization", "type": "TextInput", "helperText": "Name of their company, firm, or organization" },
                    { "key": "mailing_address", "label": "Mailing Address", "type": "TextArea", "helperText": "Complete mailing address for this contact" },
                    { "key": "priority_level", "label": "Priority Level", "type": "RadioGroup", "options": ["High - Must Contact Immediately", "Medium - Contact Within a Week", "Low - Contact When Convenient", "Notify Only - For Information"], "helperText": "How urgently should your next of kin contact this person?" },
                    { "key": "services_provided", "label": "Services Provided", "type": "TextArea", "helperText": "What services they provide or why they're important to contact" },
                    { "key": "special_instructions", "label": "Special Instructions", "type": "TextArea", "helperText": "Any specific instructions about contacting this person or using their services" },
                    { "key": "contact_documents", "label": "Related Documents or Business Cards", "type": "TextInputWithUpload", "helperText": "Upload business cards, contracts, or other relevant documents for this contact" }
                  ]
                }
              ]
            }
          ]
        },
        {
          "id": "2",
          "title": "Access Management",
          "subsections": [
            {
              "id": "2A",
              "title": "Kit Access Control",
              "fields": [
                { "key": "access_control_header", "label": "Instructions for Owners: Assigning Next of Kin & Access to Your Kit", "type": "Instructions", "content": "As the Owner of this Kit, you must designate at least one person who will be able to access your kit when needed. You can assign one Primary Next of Kin (responsible for the full kit), and/or multiple additional trusted people who may access all or only certain portions of the Kit.\\n\\nStep 1: Designate Who Will Manage the Kit\\nAs the Owner of this Kit, you must assign:\\n• At least one Primary Next of Kin (responsible for the full kit), and/or\\n• Multiple additional trusted people who may access all or only certain portions of the Kit.\\n\\nStep 2: Adding Multiple People\\nUse the \\\"+ Add Person\\\" button below to register another person (name, relationship, email, phone). For each person added, you will be prompted to select which sections of the Kit they can access:\\n• Entire Kit (Full Access), or\\n• Specific sections only (e.g., Insurance Policies, Vehicles, Legal Documents).\\n\\nEach person will have:\\n• Separate login credentials (their own registered email/phone).\\n• A unique Master Access Password (either created by you or system-generated).\\n• A separate Password Card (printable/exportable PDF for storage).\\n\\nStep 3: Create Master Access Passwords\\nFor every person assigned:\\n• The system will generate a Password Card.\\n• You must print or export each card individually.\\n• Store each card in a secure location (recommended: your Fireproof Document Bag) and inform each person where their card is stored.\\n\\n⚠️ Important:\\n• Do not give anyone their password directly.\\n• Only share the location of their Password Card.\\n• You must designate at least one person to access your kit.\\n\\nStep 4: How People Log In\\nEach assigned person will:\\n1. Go to the Next of Kin Login page.\\n2. Enter their registered email or phone number.\\n3. Enter their unique Master Access Password (from their Password Card).\\n4. Access the specific sections of the Kit that you allowed them to see.\\n\\nStep 5: Owner Notifications & Revocation\\nEvery time someone logs in:\\n• You will receive a notification (phone/email).\\n• Notification includes the person's name, access type (Full Kit or Sectional), and timestamp.\\n• A Revoke Access button will be included so you can immediately end their session if:\\n• Access was accidental, or\\n• A rogue login attempt occurred.\\n\\nYou may also:\\n• Revoke or reset access for any individual from your Owner Dashboard.\\n• Use \\\"Revoke All\\\" to instantly lock down the Kit from everyone." },
                { "key": "authorized_people", "label": "Authorized People", "type": "AccessManagement", "required": true, "helperText": "You must designate at least one person who can access your Orderly Affairs Kit" }
              ]
            }
          ]
        },
        {
          "id": "3",
          "title": "Vehicles",
          "subsections": [
            {
              "id": "3A",
              "title": "Current Vehicles",
              "repeatable": true,
              "itemLabel": "Vehicle",
              "fields": [
                { "key": "year", "label": "Year", "type": "TextInput", "helperText": "Vehicle year" },
                { "key": "make", "label": "Make", "type": "TextInput", "helperText": "Vehicle manufacturer" },
                { "key": "model", "label": "Model", "type": "TextInput", "helperText": "Vehicle model" },
                { "key": "color", "label": "Color", "type": "TextInput", "helperText": "Vehicle color" },
                { "key": "vin", "label": "VIN", "type": "TextInput", "helperText": "Vehicle identification number" },
                { "key": "license_plate", "label": "License Plate", "type": "TextInput", "helperText": "Current license plate number" },
                { "key": "registration_expiry", "label": "Registration Expiry", "type": "DatePicker", "helperText": "When does registration expire?" },
                { "key": "insurance_company", "label": "Insurance Company", "type": "TextInput", "helperText": "Current insurance provider" },
                { "key": "insurance_policy", "label": "Insurance Policy Number", "type": "TextInput", "helperText": "Insurance policy number" },
                { "key": "financing", "label": "Financing Information", "type": "TextArea", "helperText": "Loan details, payment information, or if owned outright" },
                { "key": "maintenance_records", "label": "Maintenance Records", "type": "TextInputWithUpload", "helperText": "Service records, receipts, or maintenance schedule" },
                { "key": "parking_location", "label": "Usual Parking Location", "type": "TextInput", "helperText": "Where the vehicle is typically parked" },
                { "key": "spare_keys", "label": "Spare Key Locations", "type": "TextInput", "helperText": "Where spare keys are located" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this vehicle" }
              ]
            }
          ]
        }
      ]
    }
  ]
};