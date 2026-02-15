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
              "title": "Personal Information",
              "fields": [
                { "key": "full_legal_name", "label": "Full Legal Name", "type": "TextInput", "helperText": "Your complete legal name as it appears on official documents" },
                { "key": "date_of_birth", "label": "Date of Birth", "type": "DatePicker", "helperText": "Your birth date" },
                { "key": "place_of_birth", "label": "Place of Birth", "type": "TextInput", "helperText": "City and state where you were born" },
                { "key": "social_security_number", "label": "Social Security Number", "type": "TextInput", "helperText": "Your SSN for identification purposes" },
                { "key": "current_address", "label": "Current Address", "type": "TextArea", "helperText": "Your current residential address" },
                { "key": "phone_number", "label": "Phone Number", "type": "TextInput", "helperText": "Primary contact number" },
                { "key": "email", "label": "Email Address", "type": "TextInput", "helperText": "Primary email address" },
                { "key": "marital_status", "label": "Marital Status", "type": "Dropdown", "options": ["Single", "Married", "Divorced", "Widowed", "Separated"], "helperText": "Current marital status" }
              ]
            },
            {
              "id": "1B",
              "title": "Emergency Contacts",
              "fields": [
                { "key": "primary_emergency_contact", "label": "Primary Emergency Contact", "type": "TextArea", "helperText": "Name, relationship, phone number, and address of primary emergency contact" },
                { "key": "secondary_emergency_contact", "label": "Secondary Emergency Contact", "type": "TextArea", "helperText": "Name, relationship, phone number, and address of secondary emergency contact" },
                { "key": "medical_emergency_contact", "label": "Medical Emergency Contact", "type": "TextArea", "helperText": "Healthcare proxy or medical contact person" }
              ]
            },
            {
              "id": "1C",
              "title": "Important Personal Contacts",
              "repeatable": true,
              "itemLabel": "Contact",
              "fields": [
                { "key": "contact_name", "label": "Contact Name", "type": "TextInput", "helperText": "Name of the contact person", "required": true },
                { "key": "role_title", "label": "Role/Title", "type": "TextInput", "helperText": "Their role or title (e.g., Attorney, Accountant, Doctor)" },
                { "key": "company_organization", "label": "Company/Organization", "type": "TextInput", "helperText": "Name of their company or organization" },
                { "key": "phone_number", "label": "Phone Number", "type": "TextInput", "helperText": "Primary phone number" },
                { "key": "email", "label": "Email", "type": "TextInput", "helperText": "Email address" },
                { "key": "address", "label": "Address", "type": "TextArea", "helperText": "Physical address" },
                { "key": "notes", "label": "Notes", "type": "TextArea", "helperText": "Any additional notes about this contact" }
              ]
            }
          ]
        },
        {
          "id": "2",
          "title": "Access Management",
          "description": "This section manages who can access your Orderly Affairs Kit after your passing. You must designate at least one person as your Primary Next of Kin with full access, and can optionally add additional trusted people with either full or limited access to specific sections. Each person receives unique login credentials and a master access password for secure entry. The system notifies you whenever someone logs in and allows you to revoke access at any time.",
          "subsections": [
            {
              "id": "2A",
              "title": "Authorized People",
              "fields": [
                { "key": "authorized_people", "label": "Kit Access Management", "type": "AccessManagement", "helperText": "Manage who can access your Orderly Affairs Kit and control their permissions" }
              ]
            }
          ]
        },
        {
          "id": "3",
          "title": "Messages to loved ones and friends",
          "description": "Create heartfelt messages for your loved ones - letters, video messages, and audio recordings that can be delivered when needed. These personal messages provide comfort and guidance to those you care about most.",
          "subsections": [
            {
              "id": "3A",
              "title": "Letter to Next of Kin",
              "fields": [
                { "key": "nok_letter_instructions", "label": "Letter to Your Next of Kin", "type": "Instructions", "content": "This letter will be provided to the person(s) you've designated to manage this kit. The email address and phone number will automatically populate from your Access Management section. You can edit the letter content to personalize it for your situation." },
                { "key": "nok_letter_data", "label": "Next of Kin Letter", "type": "NextOfKinLetter", "helperText": "Create and customize the letter for your next of kin with auto-populated information from Access Management" }
              ]
            },
            {
              "id": "3B",
              "title": "Personal Messages",
              "fields": [
                { "key": "access_control_header", "label": "Instructions for Owners: Assigning Next of Kin & Access to Your Kit", "type": "Instructions", "content": "As the Owner of this Kit, you must designate at least one person who will be able to access your kit when needed. You can assign one Primary Next of Kin (responsible for the full kit), and/or multiple additional trusted people who may access all or only certain portions of the Kit.\\n\\nStep 1: Designate Who Will Manage the Kit\\nAs the Owner of this Kit, you must assign:\\n• At least one Primary Next of Kin (responsible for the full kit), and/or\\n• Multiple additional trusted people who may access all or only certain portions of the Kit.\\n\\nStep 2: Adding Multiple People\\nUse the \\\"+ Add Person\\\" button below to register another person (name, relationship, email, phone). For each person added, you will be prompted to select which sections of the Kit they can access:\\n• Entire Kit (Full Access), or\\n• Specific sections only (e.g., Insurance Policies, Vehicles, Legal Documents).\\n\\nEach person will have:\\n• Separate login credentials (their own registered email/phone).\\n• A unique Master Access Password (either created by you or system-generated).\\n• A separate Password Card (printable/exportable PDF for storage).\\n\\nStep 3: Create Master Access Passwords\\nFor every person assigned:\\n• The system will generate a Password Card.\\n• You must print or export each card individually.\\n• Store each card in a secure location (recommended: your Fireproof Document Bag) and inform each person where their card is stored.\\n\\n⚠️ Important:\\n• Do not give anyone their password directly.\\n• Only share the location of their Password Card.\\n• You must designate at least one person to access your kit.\\n\\nStep 4: How People Log In\\nEach assigned person will:\\n1. Go to the Next of Kin Login page.\\n2. Enter their registered email or phone number.\\n3. Enter their unique Master Access Password (from their Password Card).\\n4. Access the specific sections of the Kit that you allowed them to see.\\n\\nStep 5: Owner Notifications & Revocation\\nEvery time someone logs in:\\n• You will receive a notification (phone/email).\\n• Notification includes the person's name, access type (Full Kit or Sectional), and timestamp.\\n• A Revoke Access button will be included so you can immediately end their session if:\\n• Access was accidental, or\\n• A rogue login attempt occurred.\\n\\nYou may also:\\n• Revoke or reset access for any individual from your Owner Dashboard.\\n• Use \\\"Revoke All\\\" to instantly lock down the Kit from everyone." },
                { "key": "letters_data", "label": "Letters and Messages", "type": "LettersToNextOfKin", "helperText": "Create and manage personal letters, video messages, and audio recordings for your loved ones" }
              ]
            }
          ]
        },
        {
          "id": "4",
          "title": "Vehicles",
          "subsections": [
            {
              "id": "4A",
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