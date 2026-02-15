export const formConfig = {
  "appName": "Orderly Affairs",
  "version": "1.0",
  "chunks": [
    {
      "id": "chunk1",
      "title": "Personal Information",
      "sections": [
        {
          "id": "1",
          "title": "Vital Information",
          "component": "VitalInfoSection"
        },
        {
          "id": "2",
          "title": "Vehicles",
          "subsections": [
            {
              "id": "2A",
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
        },
        {
          "id": "3",
          "title": "Important Documents",
          "subsections": [
            {
              "id": "3A",
              "title": "Personal Documents Location",
              "fields": [
                { "key": "birth_certificate", "label": "Birth Certificate", "type": "TextInputWithUpload", "helperText": "Location or attach copy of birth certificate" },
                { "key": "social_security_card", "label": "Social Security Card", "type": "TextInputWithUpload", "helperText": "Location or attach copy of social security card" },
                { "key": "passport", "label": "Passport", "type": "TextInputWithUpload", "helperText": "Location or attach copy of passport" },
                { "key": "drivers_license", "label": "Driver's License", "type": "TextInputWithUpload", "helperText": "Location or attach copy of driver's license" },
                { "key": "marriage_certificate", "label": "Marriage Certificate", "type": "TextInputWithUpload", "helperText": "Location or attach copy of marriage certificate" },
                { "key": "divorce_decree", "label": "Divorce Decree", "type": "TextInputWithUpload", "helperText": "Location or attach copy of divorce decree" },
                { "key": "military_records", "label": "Military Service Records", "type": "TextInputWithUpload", "helperText": "DD-214 or other military service documents" },
                { "key": "adoption_papers", "label": "Adoption Papers", "type": "TextInputWithUpload", "helperText": "Location or attach copy of adoption papers" },
                { "key": "naturalization_papers", "label": "Naturalization Papers", "type": "TextInputWithUpload", "helperText": "Location or attach copy of naturalization/citizenship papers" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important personal documents" }
              ]
            },
            {
              "id": "3B",
              "title": "Other Important Documents",
              "repeatable": true,
              "itemLabel": "Document",
              "fields": [
                { "key": "doc_type", "label": "Document Type", "type": "TextInput", "helperText": "Type of document", "required": true },
                { "key": "doc_location", "label": "Document Location", "type": "TextInputWithUpload", "helperText": "Where the document is stored or attach copy" },
                { "key": "doc_description", "label": "Description", "type": "TextArea", "helperText": "Brief description of the document and its importance" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this document" }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "chunk2",
      "title": "Property & Insurance",
      "sections": [
        {
          "id": "4",
          "title": "Real Estate & Property",
          "subsections": [
            {
              "id": "4A",
              "title": "Real Estate Properties",
              "repeatable": true,
              "itemLabel": "Property",
              "fields": [
                { "key": "property_type", "label": "Property Type", "type": "Dropdown", "options": ["Primary Residence", "Secondary Home", "Rental Property", "Commercial Property", "Vacant Land", "Other"], "helperText": "Type of property", "required": true },
                { "key": "custom_property_type", "label": "Specify Property Type", "type": "TextInput", "placeholder": "Enter custom property type", "helperText": "Please specify the type of property", "conditionalOn": "property_type", "conditionalValue": "Other" },
                { "key": "property_address", "label": "Property Address", "type": "TextArea", "helperText": "Full address of the property" },
                { "key": "ownership_type", "label": "Ownership Type", "type": "Dropdown", "options": ["Sole Ownership", "Joint Tenancy", "Tenants in Common", "Community Property", "Life Estate", "Trust Ownership", "Other"], "helperText": "How the property is owned" },
                { "key": "custom_ownership_type", "label": "Specify Ownership Type", "type": "TextInput", "placeholder": "Enter custom ownership type", "helperText": "Please specify the type of ownership", "conditionalOn": "ownership_type", "conditionalValue": "Other" },
                { "key": "deed_location", "label": "Deed Location", "type": "TextInputWithUpload", "helperText": "Where the deed is stored or attach copy" },
                { "key": "mortgage_info", "label": "Mortgage Information", "type": "TextArea", "helperText": "Lender, account number, monthly payment, balance" },
                { "key": "property_taxes", "label": "Property Tax Information", "type": "TextArea", "helperText": "Annual tax amount, payment schedule, tax assessor contact" },
                { "key": "homeowners_insurance", "label": "Homeowner's Insurance", "type": "TextArea", "helperText": "Insurance company, policy number, coverage details" },
                { "key": "utilities", "label": "Utilities Information", "type": "TextArea", "helperText": "Electric, gas, water, internet, and other utility account information" },
                { "key": "property_manager", "label": "Property Manager/Contacts", "type": "TextArea", "helperText": "Property manager, HOA, or other important contacts" },
                { "key": "estimated_value", "label": "Estimated Value", "type": "TextInput", "helperText": "Current estimated market value" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this property" }
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
              "title": "Insurance Policy Details",
              "repeatable": true,
              "itemLabel": "Policy",
              "fields": [
                { "key": "policy_type", "label": "Policy Type", "type": "Dropdown", "options": ["Life Insurance", "Health Insurance", "Auto Insurance", "Homeowner's Insurance", "Renter's Insurance", "Disability Insurance", "Umbrella Policy", "Other"], "helperText": "Type of insurance policy", "required": true },
                { "key": "custom_policy_type", "label": "Specify Policy Type", "type": "TextInput", "placeholder": "Enter custom policy type", "helperText": "Please specify the type of insurance policy", "conditionalOn": "policy_type", "conditionalValue": "Other" },
                { "key": "policy_company", "label": "Insurance Company", "type": "TextInput", "helperText": "Name of the insurance company" },
                { "key": "policy_number", "label": "Policy Number", "type": "TextInput", "helperText": "Insurance policy number" },
                { "key": "agent_contact", "label": "Agent Contact Information", "type": "TextArea", "helperText": "Agent name, phone, email, and office address" },
                { "key": "coverage_amount", "label": "Coverage Amount", "type": "TextInput", "helperText": "Coverage limit or benefit amount" },
                { "key": "premium_amount", "label": "Premium Amount", "type": "TextInput", "helperText": "Monthly or annual premium cost" },
                { "key": "payment_method", "label": "Payment Method", "type": "TextInput", "helperText": "How premiums are paid (auto-pay, check, etc.)" },
                { "key": "beneficiaries", "label": "Beneficiaries", "type": "TextArea", "helperText": "Primary and contingent beneficiaries" },
                { "key": "policy_location", "label": "Policy Document Location", "type": "TextInputWithUpload", "helperText": "Where policy documents are stored or attach copy" },
                { "key": "renewal_date", "label": "Renewal/Expiry Date", "type": "DatePicker", "helperText": "When does the policy renew or expire?" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this policy" }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "chunk3",
      "title": "Community & Professional Life",
      "sections": [
        {
          "id": "6",
          "title": "Community Memberships & Subscriptions",
          "subsections": [
            {
              "id": "6A",
              "title": "Community Memberships",
              "repeatable": true,
              "itemLabel": "Membership",
              "fields": [
                { "key": "organization_name", "label": "Organization Name", "type": "TextInput", "helperText": "Name of the organization or group", "required": true },
                { "key": "membership_type", "label": "Membership Type", "type": "Dropdown", "options": ["Religious Organization", "Professional Association", "Social Club", "Volunteer Organization", "Sports/Recreation Club", "Educational Institution", "Alumni Association", "Community Group", "Other"], "helperText": "Type of organization", "required": true },
                { "key": "custom_membership_type", "label": "Specify Membership Type", "type": "TextInput", "placeholder": "Enter custom membership type", "helperText": "Please specify the type of membership", "conditionalOn": "membership_type", "conditionalValue": "Other" },
                { "key": "role_involvement", "label": "Role/Involvement", "type": "TextInput", "helperText": "Your role or level of involvement (member, volunteer, board member, etc.)" },
                { "key": "membership_number", "label": "Membership Number/ID", "type": "TextInput", "helperText": "Membership number or identification" },
                { "key": "contact_info", "label": "Organization Contact Information", "type": "TextArea", "helperText": "Phone, email, address, or website" },
                { "key": "meeting_schedule", "label": "Meeting Schedule", "type": "TextInput", "helperText": "When and where the group meets" },
                { "key": "membership_fees", "label": "Membership Fees", "type": "TextInput", "helperText": "Annual or monthly membership costs" },
                { "key": "key_contacts", "label": "Key Contacts", "type": "TextArea", "helperText": "Important people within the organization to notify" },
                { "key": "membership_benefits", "label": "Membership Benefits", "type": "TextArea", "helperText": "Benefits, privileges, or services included" },
                { "key": "online_accounts", "label": "Online Accounts", "type": "TextArea", "helperText": "Website accounts, member portals, or online profiles related to this membership" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this membership" }
              ]
            },
            {
              "id": "6B",
              "title": "Physical Memberships & Subscriptions",
              "repeatable": true,
              "itemLabel": "Physical Membership",
              "fields": [
                { "key": "company_service_name", "label": "Company/Service Name", "type": "TextInput", "helperText": "Name of the company or service", "required": true },
                { "key": "subscription_category", "label": "Subscription Category", "type": "Dropdown", "options": ["Gym/Fitness Center", "Country Club", "Golf Club", "Magazine/Newspaper", "Streaming Service", "Software/App", "Food/Meal Delivery", "Entertainment", "Transportation", "Storage Unit", "Other"], "helperText": "Type of subscription or membership", "required": true },
                { "key": "custom_subscription_category", "label": "Specify Subscription Category", "type": "TextInput", "placeholder": "Enter custom subscription category", "helperText": "Please specify the type of subscription or membership", "conditionalOn": "subscription_category", "conditionalValue": "Other" },
                { "key": "membership_id", "label": "Membership/Account ID", "type": "TextInput", "helperText": "Membership number or account identifier" },
                { "key": "subscription_cost", "label": "Subscription Cost", "type": "TextInput", "helperText": "Monthly, annual, or other payment amount" },
                { "key": "billing_cycle", "label": "Billing Cycle", "type": "Dropdown", "options": ["Monthly", "Quarterly", "Annually", "Other"], "helperText": "How often you are billed" },
                { "key": "custom_billing_cycle", "label": "Specify Billing Cycle", "type": "TextInput", "placeholder": "Enter custom billing cycle", "helperText": "Please specify how often you are billed", "conditionalOn": "billing_cycle", "conditionalValue": "Other" },
                { "key": "payment_method", "label": "Payment Method", "type": "TextInput", "helperText": "Credit card, bank account, or other payment method used" },
                { "key": "renewal_date", "label": "Renewal Date", "type": "DatePicker", "helperText": "When does the subscription renew?" },
                { "key": "cancellation_info", "label": "Cancellation Information", "type": "TextArea", "helperText": "How to cancel the subscription and any required notice" },
                { "key": "contact_info", "label": "Company Contact Information", "type": "TextArea", "helperText": "Customer service phone, email, website" },
                { "key": "access_details", "label": "Access Details", "type": "TextArea", "helperText": "How to access the service (cards, apps, websites, login info)" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this subscription" }
              ]
            }
          ]
        },
        {
          "id": "7",
          "title": "Charitable Contributions",
          "subsections": [
            {
              "id": "7A",
              "title": "Charitable Donations & Contributions",
              "repeatable": true,
              "itemLabel": "Charitable Donation",
              "fields": [
                { "key": "organization_name", "label": "Organization Name", "type": "TextInput", "helperText": "Name of the charitable organization", "required": true },
                { "key": "donation_type", "label": "Type of Contribution", "type": "Dropdown", "options": ["Monthly Donation", "Annual Donation", "One-time Donation", "Recurring Pledge", "Memorial/Tribute Gift", "Legacy/Planned Gift", "Volunteer Time", "In-kind Donation", "Other"], "helperText": "Type of charitable contribution", "required": true },
                { "key": "custom_donation_type", "label": "Specify Contribution Type", "type": "TextInput", "placeholder": "Enter custom contribution type", "helperText": "Please specify the type of charitable contribution", "conditionalOn": "donation_type", "conditionalValue": "Other" },
                { "key": "donation_amount", "label": "Donation Amount", "type": "TextInput", "helperText": "Amount donated (monthly, annually, or total)" },
                { "key": "donation_frequency", "label": "Donation Frequency", "type": "Dropdown", "options": ["Monthly", "Quarterly", "Annually", "One-time", "As needed", "Other"], "helperText": "How often you contribute" },
                { "key": "custom_donation_frequency", "label": "Specify Donation Frequency", "type": "TextInput", "placeholder": "Enter custom donation frequency", "helperText": "Please specify how often you contribute", "conditionalOn": "donation_frequency", "conditionalValue": "Other" },
                { "key": "payment_method", "label": "Payment Method", "type": "TextInput", "helperText": "How the donation is paid (auto-debit, check, online, etc.)" },
                { "key": "donation_start_date", "label": "Donation Start Date", "type": "DatePicker", "helperText": "When did you start contributing?" },
                { "key": "organization_contact", "label": "Organization Contact", "type": "TextArea", "helperText": "Contact information for the organization" },
                { "key": "donor_number", "label": "Donor Number/ID", "type": "TextInput", "helperText": "Your donor identification number" },
                { "key": "tax_deductible", "label": "Tax Deductible Status", "type": "RadioButtons", "options": ["Yes", "No", "Unknown"], "helperText": "Is this donation tax deductible?" },
                { "key": "designation", "label": "Donation Designation", "type": "TextArea", "helperText": "Specific program, fund, or purpose for the donation" },
                { "key": "legacy_intentions", "label": "Legacy/Will Intentions", "type": "TextArea", "helperText": "Any plans to include this organization in your will or estate" },
                { "key": "discontinue_instructions", "label": "Discontinuation Instructions", "type": "TextArea", "helperText": "Instructions for stopping donations after your passing" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this charitable relationship" }
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
              "title": "Educational Background",
              "repeatable": true,
              "itemLabel": "Education",
              "fields": [
                { "key": "institution_name", "label": "Institution Name", "type": "TextInput", "helperText": "Name of school, college, or university", "required": true },
                { "key": "education_level", "label": "Education Level", "type": "Dropdown", "options": ["High School", "Associate Degree", "Bachelor's Degree", "Master's Degree", "Doctorate/PhD", "Professional Degree", "Certificate Program", "Trade School", "Other"], "helperText": "Type of education or degree", "required": true },
                { "key": "custom_education_level", "label": "Specify Education Level", "type": "TextInput", "placeholder": "Enter custom education level", "helperText": "Please specify the type of education or degree", "conditionalOn": "education_level", "conditionalValue": "Other" },
                { "key": "field_of_study", "label": "Field of Study/Major", "type": "TextInput", "helperText": "Main area of study or concentration" },
                { "key": "graduation_year", "label": "Graduation Year", "type": "TextInput", "helperText": "Year completed or graduated" },
                { "key": "gpa_honors", "label": "GPA/Honors", "type": "TextInput", "helperText": "Grade point average or honors received" },
                { "key": "activities", "label": "Activities & Organizations", "type": "TextArea", "helperText": "Clubs, sports, societies, or other activities" },
                { "key": "location", "label": "Institution Location", "type": "TextInput", "helperText": "City and state/country of the institution" },
                { "key": "alumni_status", "label": "Alumni Association Status", "type": "TextInput", "helperText": "Alumni membership, involvement, or contact information" },
                { "key": "transcripts_diplomas", "label": "Transcripts/Diplomas Location", "type": "TextInputWithUpload", "helperText": "Where official documents are stored or attach copies" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this education" }
              ]
            },
            {
              "id": "8B",
              "title": "Professional Certifications & Licenses",
              "repeatable": true,
              "itemLabel": "Certification",
              "fields": [
                { "key": "certification_name", "label": "Certification/License Name", "type": "TextInput", "helperText": "Name of the certification or license", "required": true },
                { "key": "issuing_organization", "label": "Issuing Organization", "type": "TextInput", "helperText": "Organization that issued the certification" },
                { "key": "certification_number", "label": "Certification/License Number", "type": "TextInput", "helperText": "Official certification or license number" },
                { "key": "issue_date", "label": "Issue Date", "type": "DatePicker", "helperText": "When was the certification issued?" },
                { "key": "expiry_date", "label": "Expiry Date", "type": "DatePicker", "helperText": "When does the certification expire?" },
                { "key": "renewal_requirements", "label": "Renewal Requirements", "type": "TextArea", "helperText": "What's needed to maintain or renew this certification" },
                { "key": "professional_field", "label": "Professional Field", "type": "TextInput", "helperText": "Industry or field this certification relates to" },
                { "key": "continuing_education", "label": "Continuing Education", "type": "TextArea", "helperText": "Required continuing education or maintenance requirements" },
                { "key": "certificate_location", "label": "Certificate Location", "type": "TextInputWithUpload", "helperText": "Where the certificate is stored or attach copy" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this certification" }
              ]
            },
            {
              "id": "8C",
              "title": "Awards & Achievements",
              "repeatable": true,
              "itemLabel": "Achievement",
              "fields": [
                { "key": "award_name", "label": "Award/Achievement Name", "type": "TextInput", "helperText": "Name of the award, honor, or achievement", "required": true },
                { "key": "achievement_type", "label": "Achievement Type", "type": "Dropdown", "options": ["Professional Award", "Academic Honor", "Community Recognition", "Military Honor", "Sports Achievement", "Artistic Achievement", "Volunteer Recognition", "Industry Recognition", "Other"], "helperText": "Type of award or achievement", "required": true },
                { "key": "custom_achievement_type", "label": "Specify Achievement Type", "type": "TextInput", "placeholder": "Enter custom achievement type", "helperText": "Please specify the type of award or achievement", "conditionalOn": "achievement_type", "conditionalValue": "Other" },
                { "key": "awarding_organization", "label": "Awarding Organization", "type": "TextInput", "helperText": "Organization that gave the award" },
                { "key": "date_received", "label": "Date Received", "type": "DatePicker", "helperText": "When was the award received?" },
                { "key": "achievement_description", "label": "Achievement Description", "type": "TextArea", "helperText": "Description of what the award was for or achievement details" },
                { "key": "significance", "label": "Significance", "type": "TextArea", "helperText": "Why this achievement was important or meaningful" },
                { "key": "physical_award_location", "label": "Physical Award Location", "type": "TextInput", "helperText": "Where the physical award, trophy, or certificate is located" },
                { "key": "documentation", "label": "Documentation", "type": "TextInputWithUpload", "helperText": "Certificates, articles, photos, or other documentation" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this achievement" }
              ]
            },
            {
              "id": "8D",
              "title": "Publications & Creative Works",
              "repeatable": true,
              "itemLabel": "Publication/Document",
              "fields": [
                { "key": "title", "label": "Title", "type": "TextInput", "helperText": "Title of the work or publication", "required": true },
                { "key": "document_type", "label": "Type of Work", "type": "Dropdown", "options": ["Academic Paper", "Book", "Article", "Blog Post", "Patent", "Artwork", "Musical Composition", "Photograph", "Video/Film", "Presentation", "Report", "Manual/Guide", "Other"], "helperText": "Type of publication or creative work", "required": true },
                { "key": "custom_document_type", "label": "Specify Work Type", "type": "TextInput", "placeholder": "Enter custom work type", "helperText": "Please specify the type of publication or creative work", "conditionalOn": "document_type", "conditionalValue": "Other" },
                { "key": "publication_venue", "label": "Publication Venue", "type": "TextInput", "helperText": "Journal, publisher, gallery, platform, or venue where published/displayed" },
                { "key": "publication_date", "label": "Publication/Creation Date", "type": "DatePicker", "helperText": "When was it published or created?" },
                { "key": "collaborators", "label": "Co-authors/Collaborators", "type": "TextArea", "helperText": "Names of any co-authors, collaborators, or contributors" },
                { "key": "description", "label": "Description", "type": "TextArea", "helperText": "Brief description of the work and its significance" },
                { "key": "access_info", "label": "Access Information", "type": "TextArea", "helperText": "Where others can find or access this work (URL, DOI, ISBN, etc.)" },
                { "key": "physical_location", "label": "Physical Location", "type": "TextInput", "helperText": "Where physical copies or originals are stored" },
                { "key": "copyright_info", "label": "Copyright/Ownership Info", "type": "TextArea", "helperText": "Copyright details, licensing, or ownership information" },
                { "key": "file_backup", "label": "Digital Files", "type": "TextInputWithUpload", "helperText": "Digital copies or backup files" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this work" }
              ]
            }
          ]
        },
        {
          "id": "9",
          "title": "Military Service",
          "subsections": [
            {
              "id": "9A",
              "title": "Military Service Record",
              "repeatable": true,
              "itemLabel": "Service Period",
              "fields": [
                { "key": "branch_of_service", "label": "Branch of Service", "type": "Dropdown", "options": ["Army", "Navy", "Air Force", "Marines", "Coast Guard", "Space Force", "National Guard", "Reserves", "Other"], "helperText": "Which branch of the military", "required": true },
                { "key": "custom_branch_of_service", "label": "Specify Branch of Service", "type": "TextInput", "placeholder": "Enter custom branch of service", "helperText": "Please specify the branch of service", "conditionalOn": "branch_of_service", "conditionalValue": "Other" },
                { "key": "service_rank", "label": "Rank/Grade", "type": "TextInput", "helperText": "Final rank or grade achieved" },
                { "key": "service_years", "label": "Years of Service", "type": "TextInput", "helperText": "Start and end dates of service" },
                { "key": "service_number", "label": "Service Number", "type": "TextInput", "helperText": "Military service number or social security number" },
                { "key": "unit_assignments", "label": "Unit Assignments", "type": "TextArea", "helperText": "Units, bases, or ships where you served" },
                { "key": "deployments", "label": "Deployments", "type": "TextArea", "helperText": "Combat deployments, overseas assignments, or special missions" },
                { "key": "military_awards", "label": "Military Awards & Decorations", "type": "TextArea", "helperText": "Medals, ribbons, commendations, or other awards received" },
                { "key": "military_occupation", "label": "Military Occupation/MOS", "type": "TextInput", "helperText": "Military Occupational Specialty or job classification" },
                { "key": "discharge_type", "label": "Type of Discharge", "type": "Dropdown", "options": ["Honorable", "General", "Other Than Honorable", "Bad Conduct", "Dishonorable", "Medical", "Other"], "helperText": "Character of military discharge" },
                { "key": "custom_discharge_type", "label": "Specify Discharge Type", "type": "TextInput", "placeholder": "Enter custom discharge type", "helperText": "Please specify the type of discharge", "conditionalOn": "discharge_type", "conditionalValue": "Other" },
                { "key": "discharge_date", "label": "Discharge Date", "type": "DatePicker", "helperText": "Date of discharge from military service" },
                { "key": "va_claim_number", "label": "VA Claim/File Number", "type": "TextInput", "helperText": "Veterans Affairs claim or file number" },
                { "key": "disability_rating", "label": "VA Disability Rating", "type": "TextInput", "helperText": "Service-connected disability rating percentage" },
                { "key": "emergency_contacts_mil", "label": "Military Emergency Contacts", "type": "TextArea", "helperText": "Military friends, unit contacts, or veteran organization contacts" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about military service" }
              ]
            },
            {
              "id": "9B",
              "title": "Veterans Benefits",
              "repeatable": true,
              "itemLabel": "Benefit",
              "fields": [
                { "key": "benefit_type", "label": "Type of Benefit", "type": "Dropdown", "options": ["Disability Compensation", "Education Benefits (GI Bill)", "Healthcare", "Pension", "Home Loan", "Life Insurance", "Burial Benefits", "Vocational Rehabilitation", "Other"], "helperText": "Type of veterans benefit", "required": true },
                { "key": "custom_benefit_type", "label": "Specify Benefit Type", "type": "TextInput", "placeholder": "Enter custom benefit type", "helperText": "Please specify the type of veterans benefit", "conditionalOn": "benefit_type", "conditionalValue": "Other" },
                { "key": "benefit_status", "label": "Benefit Status", "type": "Dropdown", "options": ["Currently Receiving", "Eligible But Not Using", "Applied/Pending", "Denied", "Completed", "Unknown"], "helperText": "Current status of this benefit" },
                { "key": "va_file_number", "label": "VA File/Claim Number", "type": "TextInput", "helperText": "Veterans Affairs file or claim number for this benefit" },
                { "key": "monthly_amount", "label": "Monthly Benefit Amount", "type": "TextInput", "helperText": "Monthly payment amount (if applicable)" },
                { "key": "benefit_start_date", "label": "Benefit Start Date", "type": "DatePicker", "helperText": "When did this benefit begin?" },
                { "key": "benefit_documents", "label": "Benefit Documents", "type": "TextInputWithUpload", "helperText": "Award letters, certificates of eligibility, or other benefit documentation" },
                { "key": "va_facility", "label": "VA Facility/Contact", "type": "TextArea", "helperText": "VA medical center, regional office, or contact information" },
                { "key": "beneficiary_info", "label": "Beneficiary Information", "type": "TextArea", "helperText": "Designated beneficiaries for this benefit (if applicable)" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this veterans benefit" }
              ]
            },
            {
              "id": "9C",
              "title": "Military Documents",
              "repeatable": true,
              "itemLabel": "Military Document",
              "fields": [
                { "key": "document_type", "label": "Document Type", "type": "Dropdown", "options": ["DD-214 (Discharge Papers)", "DD-256 (Honorable Discharge Certificate)", "Military Orders", "Medical Records", "Training Certificates", "Security Clearance Documents", "Awards/Citations", "Unit Records", "Other"], "helperText": "Type of military document", "required": true },
                { "key": "custom_document_type", "label": "Specify Document Type", "type": "TextInput", "placeholder": "Enter custom document type", "helperText": "Please specify the type of military document", "conditionalOn": "document_type", "conditionalValue": "Other" },
                { "key": "document_description", "label": "Document Description", "type": "TextArea", "helperText": "Brief description of the document and its importance" },
                { "key": "document_location", "label": "Document Location", "type": "TextInputWithUpload", "helperText": "Where the document is stored or attach digital copy" },
                { "key": "document_date", "label": "Document Date", "type": "DatePicker", "helperText": "Date the document was issued" },
                { "key": "issuing_authority", "label": "Issuing Authority", "type": "TextInput", "helperText": "Military unit, office, or authority that issued the document" },
                { "key": "replacement_info", "label": "Replacement Information", "type": "TextArea", "helperText": "How to obtain copies or replacements of this document" },
                { "key": "security_level", "label": "Security Classification", "type": "Dropdown", "options": ["Unclassified", "Confidential", "Secret", "Top Secret", "Not Applicable"], "helperText": "Security classification of the document" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this military document" }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "chunk4",
      "title": "Financial Information",
      "sections": [
        {
          "id": "10",
          "title": "Bank Accounts & Financial Services",
          "subsections": [
            {
              "id": "10A",
              "title": "Bank Accounts",
              "repeatable": true,
              "itemLabel": "Bank Account",
              "fields": [
                { "key": "bank_name", "label": "Bank Name", "type": "TextInput", "helperText": "Name of the financial institution", "required": true },
                { "key": "account_type", "label": "Account Type", "type": "Dropdown", "options": ["Checking", "Savings", "Money Market", "Certificate of Deposit (CD)", "Trust Account", "Business Account", "Joint Account", "Other"], "helperText": "Type of bank account", "required": true },
                { "key": "custom_account_type", "label": "Specify Account Type", "type": "TextInput", "placeholder": "Enter custom account type", "helperText": "Please specify the type of bank account", "conditionalOn": "account_type", "conditionalValue": "Other" },
                { "key": "account_number", "label": "Account Number", "type": "TextInput", "helperText": "Bank account number" },
                { "key": "routing_number", "label": "Routing Number", "type": "TextInput", "helperText": "Bank routing number" },
                { "key": "account_nickname", "label": "Account Nickname", "type": "TextInput", "helperText": "How you refer to this account (e.g., 'Main Checking', 'Emergency Fund')" },
                { "key": "current_balance", "label": "Approximate Current Balance", "type": "TextInput", "helperText": "Approximate account balance" },
                { "key": "account_purpose", "label": "Account Purpose", "type": "TextArea", "helperText": "What this account is used for (daily expenses, savings, etc.)" },
                { "key": "account_holders", "label": "Account Holders", "type": "RepeatableGroup", "itemLabel": "Account Holder", "fields": [
                  { "key": "individual_name", "label": "Name", "type": "TextInput", "helperText": "Full name of account holder", "required": true },
                  { "key": "relationship", "label": "Relationship", "type": "TextInput", "helperText": "Relationship to you (self, spouse, child, etc.)" },
                  { "key": "access_level", "label": "Access Level", "type": "Dropdown", "options": ["Primary Owner", "Joint Owner", "Authorized User", "Power of Attorney", "Beneficiary", "Other"], "helperText": "Level of access to the account" },
                  { "key": "custom_access_level", "label": "Specify Access Level", "type": "TextInput", "placeholder": "Enter custom access level", "helperText": "Please specify the access level", "conditionalOn": "access_level", "conditionalValue": "Other" }
                ]},
                { "key": "online_access", "label": "Online Access", "type": "TextArea", "helperText": "Website, app, and login information" },
                { "key": "automatic_transfers", "label": "Automatic Transfers", "type": "TextArea", "helperText": "Scheduled transfers, direct deposits, or automatic payments" },
                { "key": "associated_cards", "label": "Associated Cards", "type": "TextArea", "helperText": "Debit cards, ATM cards, or credit cards linked to this account" },
                { "key": "branch_info", "label": "Branch Information", "type": "TextArea", "helperText": "Primary branch location and contact information" },
                { "key": "account_alerts", "label": "Account Alerts & Notifications", "type": "TextArea", "helperText": "Email or text alerts set up for this account" },
                { "key": "beneficiaries", "label": "Beneficiaries", "type": "TextArea", "helperText": "Payable-on-death (POD) or transfer-on-death (TOD) beneficiaries" },
                { "key": "special_instructions", "label": "Special Instructions", "type": "TextArea", "helperText": "Any special handling instructions for this account" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this bank account" }
              ]
            },
            {
              "id": "10B",
              "title": "Cryptocurrency Accounts",
              "repeatable": true,
              "itemLabel": "Cryptocurrency Account",
              "fields": [
                { "key": "service_name", "label": "Service/Exchange Name", "type": "TextInput", "helperText": "Name of cryptocurrency exchange or wallet service", "required": true },
                { "key": "account_type", "label": "Account Type", "type": "Dropdown", "options": ["Exchange Account", "Hardware Wallet", "Software Wallet", "Mobile Wallet", "Web Wallet", "Paper Wallet", "Other"], "helperText": "Type of cryptocurrency account or wallet", "required": true },
                { "key": "custom_account_type", "label": "Specify Account Type", "type": "TextInput", "placeholder": "Enter custom account type", "helperText": "Please specify the type of cryptocurrency account", "conditionalOn": "account_type", "conditionalValue": "Other" },
                { "key": "cryptocurrencies", "label": "Cryptocurrencies Held", "type": "TextArea", "helperText": "List of cryptocurrencies and approximate amounts (Bitcoin, Ethereum, etc.)" },
                { "key": "wallet_addresses", "label": "Wallet Addresses", "type": "TextArea", "helperText": "Public wallet addresses for receiving payments" },
                { "key": "recovery_phrase", "label": "Recovery Phrase/Seed", "type": "TextInputWithUpload", "helperText": "12-24 word recovery phrase (store very securely)" },
                { "key": "private_keys", "label": "Private Key Storage", "type": "TextInputWithUpload", "helperText": "Where private keys are stored (very important for access)" },
                { "key": "account_access", "label": "Account Access Information", "type": "TextArea", "helperText": "Login credentials, 2FA setup, security questions" },
                { "key": "hardware_info", "label": "Hardware Information", "type": "TextArea", "helperText": "Hardware wallet model, serial number, physical location" },
                { "key": "backup_locations", "label": "Backup Locations", "type": "TextArea", "helperText": "Where backup recovery phrases or keys are stored" },
                { "key": "purchase_records", "label": "Purchase Records", "type": "TextInputWithUpload", "helperText": "Records of cryptocurrency purchases for tax purposes" },
                { "key": "tax_information", "label": "Tax Information", "type": "TextArea", "helperText": "Tax reporting details, basis information, accountant contact" },
                { "key": "trusted_contacts", "label": "Trusted Contacts", "type": "TextArea", "helperText": "People who can help with cryptocurrency access or questions" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about cryptocurrency holdings" }
              ]
            },
            {
              "id": "10C",
              "title": "Digital Payment Apps",
              "repeatable": true,
              "itemLabel": "Payment App",
              "fields": [
                { "key": "app_name", "label": "App Name", "type": "TextInput", "helperText": "Name of the payment app", "required": true },
                { "key": "app_category", "label": "App Category", "type": "Dropdown", "options": ["Peer-to-Peer Payment", "Mobile Wallet", "Buy Now Pay Later", "Cryptocurrency Exchange", "Investment App", "Banking App", "International Transfer", "Business Payment", "Other"], "helperText": "Type of payment app", "required": true },
                { "key": "custom_app_category", "label": "Specify App Category", "type": "TextInput", "placeholder": "Enter custom app category", "helperText": "Please specify the type of payment app", "conditionalOn": "app_category", "conditionalValue": "Other" },
                { "key": "account_username", "label": "Username/Account ID", "type": "TextInput", "helperText": "Your username or account identifier" },
                { "key": "linked_accounts", "label": "Linked Bank Accounts/Cards", "type": "TextArea", "helperText": "Bank accounts, credit cards, or other payment methods linked" },
                { "key": "current_balance", "label": "Current Balance", "type": "TextInput", "helperText": "Approximate current balance in the app" },
                { "key": "automatic_transfers", "label": "Automatic Transfers", "type": "TextArea", "helperText": "Scheduled transfers, direct deposits, or automatic payments" },
                { "key": "recurring_payments", "label": "Recurring Payments", "type": "TextArea", "helperText": "Subscriptions or recurring payments set up through this app" },
                { "key": "security_settings", "label": "Security Settings", "type": "TextArea", "helperText": "2FA, PIN, biometric settings, or other security features" },
                { "key": "transaction_limits", "label": "Transaction Limits", "type": "TextArea", "helperText": "Daily, weekly, or monthly spending/transfer limits" },
                { "key": "contact_list", "label": "Frequent Contacts", "type": "TextArea", "helperText": "People you frequently send money to or request from" },
                { "key": "business_use", "label": "Business Use", "type": "TextArea", "helperText": "If used for business, include business details and tax implications" },
                { "key": "customer_support", "label": "Customer Support", "type": "TextInput", "helperText": "Customer service phone number or contact method" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this payment app" }
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
              "title": "Online Accounts & Passwords",
              "repeatable": true,
              "itemLabel": "Online Account",
              "fields": [
                { "key": "service_name", "label": "Service/Website Name", "type": "TextInput", "helperText": "Name of the website or service", "required": true },
                { "key": "website_url", "label": "Website URL", "type": "TextInput", "helperText": "Web address of the service" },
                { "key": "account_type", "label": "Account Type", "type": "Dropdown", "options": ["Social Media", "Email", "Shopping", "Streaming Service", "Cloud Storage", "Professional/Work", "Financial", "Gaming", "News/Media", "Government", "Health/Medical", "Utilities", "Education", "Travel", "Other"], "helperText": "Type of online account", "required": true },
                { "key": "custom_account_type", "label": "Specify Account Type", "type": "TextInput", "placeholder": "Enter custom account type", "helperText": "Please specify the type of online account", "conditionalOn": "account_type", "conditionalValue": "Other" },
                { "key": "username", "label": "Username/Email", "type": "TextInput", "helperText": "Username or email used for login" },
                { "key": "password_info", "label": "Password Information", "type": "TextInputWithUpload", "helperText": "Password or location where password is stored securely" },
                { "key": "two_factor_auth", "label": "Two-Factor Authentication", "type": "TextArea", "helperText": "2FA method (app, SMS, hardware token) and backup codes" },
                { "key": "security_questions", "label": "Security Questions & Answers", "type": "TextArea", "helperText": "Security questions and their answers" },
                { "key": "account_value", "label": "Account Value/Importance", "type": "TextArea", "helperText": "Why this account is important and what it contains" },
                { "key": "subscription_info", "label": "Subscription Information", "type": "TextArea", "helperText": "Paid subscriptions, billing details, renewal dates" },
                { "key": "recovery_options", "label": "Account Recovery Options", "type": "TextArea", "helperText": "Recovery email, phone number, or other backup access methods" },
                { "key": "connected_accounts", "label": "Connected Accounts", "type": "TextArea", "helperText": "Other accounts or services linked to this account" },
                { "key": "account_closure", "label": "Account Closure Instructions", "type": "TextArea", "helperText": "How to close or deactivate this account if needed" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this online account" }
              ]
            },
            {
              "id": "11B",
              "title": "Physical Access Codes",
              "repeatable": true,
              "itemLabel": "Physical Access Code",
              "fields": [
                { "key": "item_type", "label": "Type of Item", "type": "Dropdown", "options": ["Safe", "Security System", "Garage Door", "Gate/Fence", "Storage Unit", "Office Building", "Vehicle", "Mailbox", "Door Lock", "Other"], "helperText": "What type of item requires the access code", "required": true },
                { "key": "custom_item_type", "label": "Specify Item Type", "type": "TextInput", "placeholder": "Enter custom item type", "helperText": "Please specify the type of item", "conditionalOn": "item_type", "conditionalValue": "Other" },
                { "key": "item_description", "label": "Item Description/Location", "type": "TextInput", "placeholder": "Master bedroom closet safe, garage side door, etc.", "helperText": "Brief description and location of the secured item" },
                { "key": "lock_type", "label": "Type of Lock/Security", "type": "Dropdown", "options": ["Combination Lock", "Digital Keypad", "Key Lock", "Biometric", "Smart Lock", "Electronic Code", "Card Access", "Multiple Security Types", "Other"], "helperText": "Type of locking mechanism" },
                { "key": "access_code", "label": "Access Code/Combination", "type": "TextInputWithUpload", "placeholder": "12-34-56 or 123456", "helperText": "Combination, PIN, or access code (store securely)" },
                { "key": "key_location", "label": "Key Location", "type": "TextInputWithUpload", "helperText": "Where physical keys are stored (if applicable)" },
                { "key": "backup_access", "label": "Backup Access Method", "type": "TextArea", "helperText": "Alternative ways to access (spare keys, master codes, etc.)" },
                { "key": "access_tools_required", "label": "Tools Required for Access", "type": "TextArea", "placeholder": "Special key, key fob, smartphone app, etc.", "helperText": "Any special tools, devices, or equipment needed to access" },
                { "key": "tool_storage_location", "label": "Tool Storage Location", "type": "TextInput", "helperText": "Where access tools (key fobs, special keys, etc.) are stored" },
                { "key": "manufacturer_model", "label": "Manufacturer/Model", "type": "TextInput", "placeholder": "SentrySafe X055, Kwikset SmartCode, etc.", "helperText": "Brand and model of the lock or security device" },
                { "key": "installation_date", "label": "Installation Date", "type": "DatePicker", "helperText": "When was this security installed?" },
                { "key": "last_code_change", "label": "Last Code Change", "type": "DatePicker", "helperText": "When was the code/combination last changed?" },
                { "key": "who_else_has_access", "label": "Who Else Has Access", "type": "TextArea", "helperText": "List of other people who know the code or have keys" },
                { "key": "reset_instructions", "label": "Reset Instructions", "type": "TextArea", "helperText": "How to reset or change the code/combination" },
                { "key": "warranty_service_info", "label": "Warranty/Service Information", "type": "TextInputWithUpload", "helperText": "Warranty details, service contacts, or user manual" },
                { "key": "emergency_override", "label": "Emergency Override", "type": "TextArea", "helperText": "Emergency access methods (locksmith contact, override codes, etc.)" },
                { "key": "contents_overview", "label": "Contents Overview", "type": "TextArea", "helperText": "Brief description of what's stored inside (for safes/secured storage)" },
                { "key": "importance_level", "label": "Importance Level", "type": "Dropdown", "options": ["Critical", "Important", "Moderate", "Low"], "helperText": "How important is access to this item?" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about accessing this secured item" }
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
              "title": "Investment Account Details",
              "repeatable": true,
              "itemLabel": "Investment Account",
              "fields": [
                { "key": "institution_name", "label": "Financial Institution", "type": "TextInput", "helperText": "Name of brokerage, bank, or investment company", "required": true },
                { "key": "account_type", "label": "Account Type", "type": "Dropdown", "options": ["401(k)", "403(b)", "Traditional IRA", "Roth IRA", "SEP-IRA", "Simple IRA", "Brokerage Account", "Savings Account", "CD", "Pension", "Annuity", "529 Education Plan", "HSA", "Other"], "helperText": "Type of investment account", "required": true },
                { "key": "custom_account_type", "label": "Specify Account Type", "type": "TextInput", "placeholder": "Enter custom account type", "helperText": "Please specify the type of investment account", "conditionalOn": "account_type", "conditionalValue": "Other" },
                { "key": "account_number", "label": "Account Number", "type": "TextInput", "helperText": "Investment account number" },
                { "key": "account_value", "label": "Approximate Account Value", "type": "TextInput", "helperText": "Current estimated value" },
                { "key": "contribution_info", "label": "Contribution Information", "type": "TextArea", "helperText": "Monthly contributions, employer match, contribution limits" },
                { "key": "investment_mix", "label": "Investment Mix", "type": "TextArea", "helperText": "Types of investments (stocks, bonds, mutual funds, etc.)" },
                { "key": "beneficiaries", "label": "Beneficiaries", "type": "TextArea", "helperText": "Primary and contingent beneficiaries" },
                { "key": "employer_plan", "label": "Employer Plan Details", "type": "TextArea", "helperText": "Employer name, HR contact, plan administrator (if applicable)" },
                { "key": "financial_advisor", "label": "Financial Advisor", "type": "TextArea", "helperText": "Advisor name, contact information, firm" },
                { "key": "online_access", "label": "Online Access", "type": "TextArea", "helperText": "Website, username (password stored separately)" },
                { "key": "statements_location", "label": "Statements Location", "type": "TextInputWithUpload", "helperText": "Where account statements are stored" },
                { "key": "loan_info", "label": "Loans Against Account", "type": "TextArea", "helperText": "Any loans taken against this account" },
                { "key": "rollover_instructions", "label": "Rollover Instructions", "type": "TextArea", "helperText": "Instructions for account transfers or rollovers" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this investment account" }
              ]
            }
          ]
        },
        {
          "id": "13",
          "title": "Health & Medical Records",
          "subsections": [
            {
              "id": "13A",
              "title": "Current Medical Information",
              "fields": [
                { "key": "primary_physician", "label": "Primary Care Physician", "type": "TextArea", "helperText": "Name, specialty, contact information, and office address" },
                { "key": "medical_conditions", "label": "Current Medical Conditions", "type": "TextArea", "helperText": "List any ongoing medical conditions, chronic illnesses, or health issues" },
                { "key": "medications", "label": "Current Medications", "type": "TextArea", "helperText": "List all current medications, dosages, and prescribing doctors" },
                { "key": "allergies", "label": "Allergies", "type": "TextArea", "helperText": "List any allergies to medications, foods, or other substances" },
                { "key": "emergency_medical_info", "label": "Emergency Medical Information", "type": "TextArea", "helperText": "Critical medical information for emergency situations" },
                { "key": "blood_type", "label": "Blood Type", "type": "TextInput", "helperText": "Your blood type (A+, B-, O+, etc.)" },
                { "key": "organ_donor_status", "label": "Organ Donor Status", "type": "RadioButtons", "options": ["Yes", "No", "Unknown"], "helperText": "Are you registered as an organ donor?" },
                { "key": "medical_power_of_attorney", "label": "Medical Power of Attorney", "type": "TextArea", "helperText": "Person designated to make medical decisions if you cannot" },
                { "key": "healthcare_directives", "label": "Healthcare Directives", "type": "TextInputWithUpload", "helperText": "Your living will, advance directives, or DNR orders" },
                { "key": "medical_records_location", "label": "Medical Records Location", "type": "TextInputWithUpload", "helperText": "Your medical records and health documents location" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important medical information" }
              ]
            },
            {
              "id": "13B",
              "title": "Healthcare Providers",
              "repeatable": true,
              "itemLabel": "Healthcare Provider",
              "fields": [
                { "key": "provider_name", "label": "Provider Name", "type": "TextInput", "helperText": "Name of the healthcare provider", "required": true },
                { "key": "specialty", "label": "Specialty", "type": "TextInput", "helperText": "Medical specialty or type of practice" },
                { "key": "contact_info", "label": "Contact Information", "type": "TextArea", "helperText": "Phone number, email, and office address" },
                { "key": "patient_id", "label": "Patient ID/Account Number", "type": "TextInput", "helperText": "Your patient identification number" },
                { "key": "frequency", "label": "Frequency of Visits", "type": "TextInput", "helperText": "How often you see this provider" },
                { "key": "last_visit", "label": "Last Visit Date", "type": "DatePicker", "helperText": "When was your last appointment?" },
                { "key": "online_portal", "label": "Online Portal Access", "type": "TextArea", "helperText": "Website and login information for patient portal" },
                { "key": "insurance_info", "label": "Insurance Information", "type": "TextArea", "helperText": "Insurance accepted, copay amounts, or billing details" },
                { "key": "referral_source", "label": "Referral Source", "type": "TextInput", "helperText": "Who referred you to this provider (if applicable)" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this provider" }
              ]
            },
            {
              "id": "13C",
              "title": "Health Insurance",
              "repeatable": true,
              "itemLabel": "Health Insurance Plan",
              "fields": [
                { "key": "insurance_company", "label": "Insurance Company", "type": "TextInput", "helperText": "Name of the insurance provider", "required": true },
                { "key": "coverage_type", "label": "Coverage Type", "type": "Dropdown", "options": ["Health Insurance", "Dental Insurance", "Vision Insurance", "Long-term Care", "Disability Insurance", "Medicare", "Medicare Supplement", "Medicaid", "Other"], "helperText": "Type of health coverage", "required": true },
                { "key": "custom_coverage_type", "label": "Specify Coverage Type", "type": "TextInput", "placeholder": "Enter custom coverage type", "helperText": "Please specify the type of health coverage", "conditionalOn": "coverage_type", "conditionalValue": "Other" },
                { "key": "policy_number", "label": "Policy/Member Number", "type": "TextInput", "helperText": "Policy or member identification number" },
                { "key": "group_number", "label": "Group Number", "type": "TextInput", "helperText": "Group number (if employer-sponsored)" },
                { "key": "employer_plan", "label": "Employer Plan Information", "type": "TextArea", "helperText": "Employer name, HR contact, plan details (if applicable)" },
                { "key": "premium_info", "label": "Premium Information", "type": "TextArea", "helperText": "Monthly premium, how it's paid, employer contribution" },
                { "key": "deductible_info", "label": "Deductible & Coverage Details", "type": "TextArea", "helperText": "Annual deductible, co-pays, coverage limits" },
                { "key": "covered_services", "label": "Covered Services", "type": "TextArea", "helperText": "What services are covered and any exclusions" },
                { "key": "pharmacy_info", "label": "Pharmacy Benefits", "type": "TextArea", "helperText": "Prescription drug coverage and preferred pharmacies" },
                { "key": "customer_service", "label": "Customer Service", "type": "TextInput", "helperText": "Customer service phone number" },
                { "key": "online_access", "label": "Online Access", "type": "TextArea", "helperText": "Website and login information for member portal" },
                { "key": "card_location", "label": "Insurance Card Location", "type": "TextInputWithUpload", "helperText": "Where your insurance cards are kept or attach photos" },
                { "key": "renewal_date", "label": "Plan Renewal Date", "type": "DatePicker", "helperText": "When does the plan renew?" },
                { "key": "broker_agent", "label": "Insurance Broker/Agent", "type": "TextArea", "helperText": "Contact information for your insurance agent or broker" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this health coverage" }
              ]
            },
            {
              "id": "13D",
              "title": "Past Medical Information",
              "fields": [
                { "key": "major_surgeries", "label": "Major Surgeries", "type": "TextArea", "helperText": "List of major surgeries with dates and details" },
                { "key": "hospitalizations", "label": "Previous Hospitalizations", "type": "TextArea", "helperText": "Significant hospital stays with dates and reasons" },
                { "key": "chronic_conditions_history", "label": "History of Chronic Conditions", "type": "TextArea", "helperText": "Past medical conditions that are no longer active" },
                { "key": "family_medical_history", "label": "Family Medical History", "type": "TextArea", "helperText": "Significant medical conditions in your family history" },
                { "key": "previous_medications", "label": "Previous Medications", "type": "TextArea", "helperText": "Important medications you've taken in the past" },
                { "key": "immunization_records", "label": "Immunization Records", "type": "TextInputWithUpload", "helperText": "Vaccination history and records" },
                { "key": "medical_test_results", "label": "Important Medical Test Results", "type": "TextInputWithUpload", "helperText": "Significant test results, scans, or lab work" },
                { "key": "mental_health_history", "label": "Mental Health History", "type": "TextArea", "helperText": "Previous mental health treatment or conditions" },
                { "key": "substance_use_history", "label": "Substance Use History", "type": "TextArea", "helperText": "Relevant history of alcohol, tobacco, or drug use" },
                { "key": "occupational_health", "label": "Occupational Health Issues", "type": "TextArea", "helperText": "Work-related injuries or health exposures" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important past medical information" }
              ]
            },
            {
              "id": "13E",
              "title": "Medicare & Medicaid",
              "repeatable": true,
              "itemLabel": "Medicare/Medicaid Plan",
              "fields": [
                { "key": "program_type", "label": "Program Type", "type": "Dropdown", "options": ["Medicare Part A (Hospital)", "Medicare Part B (Medical)", "Medicare Part C (Medicare Advantage)", "Medicare Part D (Prescription Drug)", "Medicaid", "Medicare Supplement (Medigap)", "Dual Eligible Special Needs Plan", "Other"], "helperText": "Type of Medicare or Medicaid program", "required": true },
                { "key": "custom_program_type", "label": "Specify Program Type", "type": "TextInput", "placeholder": "Enter custom program type", "helperText": "Please specify the type of Medicare/Medicaid program", "conditionalOn": "program_type", "conditionalValue": "Other" },
                { "key": "plan_name", "label": "Plan Name", "type": "TextInput", "helperText": "Specific name of your Medicare or Medicaid plan" },
                { "key": "medicare_number", "label": "Medicare/Medicaid Number", "type": "TextInput", "helperText": "Your Medicare Beneficiary Identifier (MBI) or Medicaid ID" },
                { "key": "effective_date", "label": "Effective Date", "type": "DatePicker", "helperText": "When did this coverage begin?" },
                { "key": "premium_info", "label": "Premium Information", "type": "TextArea", "helperText": "Monthly premium amount and how it's paid" },
                { "key": "coverage_details", "label": "Coverage Details", "type": "TextArea", "helperText": "What services are covered, deductibles, co-pays" },
                { "key": "preferred_providers", "label": "Preferred Providers", "type": "TextArea", "helperText": "In-network doctors, hospitals, or pharmacies" },
                { "key": "prescription_coverage", "label": "Prescription Drug Coverage", "type": "TextArea", "helperText": "Drug formulary, preferred pharmacies, coverage gaps" },
                { "key": "customer_service", "label": "Customer Service", "type": "TextInput", "helperText": "Customer service phone number" },
                { "key": "online_access", "label": "Online Access", "type": "TextArea", "helperText": "Website and login information for plan management" },
                { "key": "card_location", "label": "Medicare/Medicaid Card Location", "type": "TextInputWithUpload", "helperText": "Where your Medicare/Medicaid cards are kept or attach photos" },
                { "key": "enrollment_period", "label": "Enrollment Period", "type": "TextInput", "helperText": "When you can make changes to this coverage" },
                { "key": "state_program_info", "label": "State Program Information", "type": "TextArea", "helperText": "Details about state-specific Medicaid programs or assistance" },
                { "key": "eligibility_basis", "label": "Eligibility Basis", "type": "TextInput", "helperText": "Why you qualify for this program (age, disability, income, etc.)" },
                { "key": "coordination_benefits", "label": "Coordination with Other Benefits", "type": "TextArea", "helperText": "How this coverage works with other insurance or benefits" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about your Medicare/Medicaid coverage" }
              ]
            }
          ]
        },
        {
          "id": "14",
          "title": "Credit Cards & Debt",
          "subsections": [
            {
              "id": "14A",
              "title": "Credit Cards",
              "repeatable": true,
              "itemLabel": "Credit Card",
              "fields": [
                { "key": "card_name", "label": "Card Name", "type": "TextInput", "helperText": "Name of the credit card", "required": true },
                { "key": "card_type", "label": "Card Type", "type": "Dropdown", "options": ["Visa", "Mastercard", "American Express", "Discover", "Store Card", "Other"], "helperText": "Type of credit card", "required": true },
                { "key": "custom_card_type", "label": "Specify Card Type", "type": "TextInput", "placeholder": "Enter custom card type", "helperText": "Please specify the type of credit card", "conditionalOn": "card_type", "conditionalValue": "Other" },
                { "key": "issuing_bank", "label": "Issuing Bank/Company", "type": "TextInput", "helperText": "Bank or company that issued the card" },
                { "key": "card_number", "label": "Card Number (Last 4 digits)", "type": "TextInput", "helperText": "Last 4 digits of card number for identification" },
                { "key": "credit_limit", "label": "Credit Limit", "type": "TextInput", "helperText": "Maximum credit limit" },
                { "key": "current_balance", "label": "Current Balance", "type": "TextInput", "helperText": "Approximate current balance owed" },
                { "key": "minimum_payment", "label": "Minimum Monthly Payment", "type": "TextInput", "helperText": "Minimum required monthly payment" },
                { "key": "interest_rate", "label": "Interest Rate (APR)", "type": "TextInput", "helperText": "Annual percentage rate" },
                { "key": "payment_due_date", "label": "Payment Due Date", "type": "TextInput", "helperText": "Monthly payment due date" },
                { "key": "autopay_info", "label": "Autopay Information", "type": "TextArea", "helperText": "Automatic payment setup details" },
                { "key": "rewards_program", "label": "Rewards Program", "type": "TextArea", "helperText": "Cashback, points, or rewards program details" },
                { "key": "authorized_users", "label": "Authorized Users", "type": "TextArea", "helperText": "Other people authorized to use this card" },
                { "key": "customer_service", "label": "Customer Service", "type": "TextInput", "helperText": "Customer service phone number" },
                { "key": "online_account", "label": "Online Account Access", "type": "TextArea", "helperText": "Website and login information" },
                { "key": "annual_fee", "label": "Annual Fee", "type": "TextInput", "helperText": "Annual fee amount and due date" },
                { "key": "closure_instructions", "label": "Account Closure Instructions", "type": "TextArea", "helperText": "How to close this account" },
                { "key": "statement_documents", "label": "Statements & Documents", "type": "TextInputWithUpload", "helperText": "Upload credit card statements, terms & conditions, or take photos of important documents" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this credit card" }
              ]
            },
            {
              "id": "14B",
              "title": "Debt & Loans",
              "repeatable": true,
              "itemLabel": "Debt/Loan",
              "fields": [
                { "key": "debt_type", "label": "Type of Debt", "type": "Dropdown", "options": ["Mortgage", "Personal Loan", "Auto Loan", "Student Loan", "Home Equity Loan", "Business Loan", "Medical Debt", "Tax Debt", "Credit Line", "Other"], "helperText": "Type of debt or loan", "required": true },
                { "key": "custom_debt_type", "label": "Specify Debt Type", "type": "TextInput", "placeholder": "Enter custom debt type", "helperText": "Please specify the type of debt or loan", "conditionalOn": "debt_type", "conditionalValue": "Other" },
                { "key": "creditor_name", "label": "Creditor/Lender Name", "type": "TextInput", "helperText": "Name of the creditor or lending institution" },
                { "key": "account_number", "label": "Account/Loan Number", "type": "TextInput", "helperText": "Account or loan number" },
                { "key": "original_amount", "label": "Original Loan Amount", "type": "TextInput", "helperText": "Original amount borrowed" },
                { "key": "current_balance", "label": "Current Balance", "type": "TextInput", "helperText": "Current amount owed" },
                { "key": "monthly_payment", "label": "Monthly Payment", "type": "TextInput", "helperText": "Required monthly payment amount" },
                { "key": "interest_rate", "label": "Interest Rate", "type": "TextInput", "helperText": "Interest rate (APR)" },
                { "key": "payment_due_date", "label": "Payment Due Date", "type": "TextInput", "helperText": "Monthly payment due date" },
                { "key": "loan_term", "label": "Loan Term", "type": "TextInput", "helperText": "Length of loan (years/months)" },
                { "key": "maturity_date", "label": "Loan Maturity Date", "type": "DatePicker", "helperText": "When the loan will be paid off" },
                { "key": "collateral", "label": "Collateral", "type": "TextArea", "helperText": "Property or assets securing the loan" },
                { "key": "cosigners", "label": "Co-signers", "type": "TextArea", "helperText": "Names of any co-signers on the loan" },
                { "key": "autopay_info", "label": "Autopay Information", "type": "TextArea", "helperText": "Automatic payment setup" },
                { "key": "loan_documents", "label": "Loan Documents & Statements", "type": "TextInputWithUpload", "helperText": "Upload loan agreements, mortgage documents, statements, or take photos of important paperwork" },
                { "key": "creditor_contact", "label": "Creditor Contact Information", "type": "TextArea", "helperText": "Customer service phone, website, account management" },
                { "key": "payoff_instructions", "label": "Payoff Instructions", "type": "TextArea", "helperText": "How to pay off the loan early or get payoff quotes" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this debt" }
              ]
            }
          ]
        }
      ]
    }
  ]
};