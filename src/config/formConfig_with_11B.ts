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
                { "key": "property_address", "label": "Property Address", "type": "TextArea", "helperText": "Full address of the property" },
                { "key": "ownership_type", "label": "Ownership Type", "type": "Dropdown", "options": ["Sole Ownership", "Joint Tenancy", "Tenants in Common", "Community Property", "Life Estate", "Trust Ownership", "Other"], "helperText": "How the property is owned" },
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
                { "key": "membership_id", "label": "Membership/Account ID", "type": "TextInput", "helperText": "Membership number or account identifier" },
                { "key": "subscription_cost", "label": "Subscription Cost", "type": "TextInput", "helperText": "Monthly, annual, or other payment amount" },
                { "key": "billing_cycle", "label": "Billing Cycle", "type": "Dropdown", "options": ["Monthly", "Quarterly", "Annually", "Other"], "helperText": "How often you are billed" },
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
                { "key": "donation_amount", "label": "Donation Amount", "type": "TextInput", "helperText": "Amount donated (monthly, annually, or total)" },
                { "key": "donation_frequency", "label": "Donation Frequency", "type": "Dropdown", "options": ["Monthly", "Quarterly", "Annually", "One-time", "As needed", "Other"], "helperText": "How often you contribute" },
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
                { "key": "service_component", "label": "Service Component", "type": "Dropdown", "options": ["Active Duty", "Reserve", "National Guard"], "helperText": "Type of military service" },
                { "key": "service_start_date", "label": "Service Start Date", "type": "DatePicker", "helperText": "When did you enter service?" },
                { "key": "service_end_date", "label": "Service End Date", "type": "DatePicker", "helperText": "When did you leave service?" },
                { "key": "service_years", "label": "Total Years of Service", "type": "TextInput", "helperText": "Total time served" },
                { "key": "entry_rank", "label": "Entry Rank", "type": "TextInput", "helperText": "Rank when you entered service" },
                { "key": "service_rank", "label": "Final/Highest Rank", "type": "TextInput", "helperText": "Final rank achieved" },
                { "key": "military_occupation", "label": "Military Occupation/MOS", "type": "TextInput", "helperText": "Military Occupational Specialty or job" },
                { "key": "units_served", "label": "Units/Commands Served", "type": "TextArea", "helperText": "Units, commands, or bases where you served" },
                { "key": "deployments", "label": "Deployments/Combat Service", "type": "TextArea", "helperText": "Overseas deployments, combat zones, or special assignments" },
                { "key": "decorations_awards", "label": "Decorations & Awards", "type": "TextArea", "helperText": "Military medals, ribbons, commendations, or awards received" },
                { "key": "discharge_type", "label": "Type of Discharge", "type": "Dropdown", "options": ["Honorable", "General", "Other Than Honorable", "Bad Conduct", "Dishonorable", "Medical", "Administrative"], "helperText": "Character of discharge" },
                { "key": "discharge_reason", "label": "Discharge Reason", "type": "TextInput", "helperText": "Reason for separation from service" },
                { "key": "service_number", "label": "Service Number", "type": "TextInput", "helperText": "Military service number or DOD ID" },
                { "key": "va_claim_number", "label": "VA Claim Number", "type": "TextInput", "helperText": "Veterans Affairs claim or file number" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about your military service" }
              ]
            },
            {
              "id": "9B",
              "title": "Veterans Benefits",
              "repeatable": true,
              "itemLabel": "Military Benefit",
              "fields": [
                { "key": "benefit_type", "label": "Benefit Type", "type": "Dropdown", "options": ["Disability Compensation", "Pension", "Education (GI Bill)", "Healthcare", "Home Loan", "Life Insurance", "Burial Benefits", "Vocational Rehabilitation", "Other"], "helperText": "Type of VA benefit", "required": true },
                { "key": "benefit_status", "label": "Benefit Status", "type": "Dropdown", "options": ["Active/Receiving", "Applied/Pending", "Eligible/Not Applied", "Denied", "Appealing", "Unknown"], "helperText": "Current status of this benefit" },
                { "key": "claim_number", "label": "Claim/File Number", "type": "TextInput", "helperText": "VA claim or file number for this benefit" },
                { "key": "disability_rating", "label": "Disability Rating", "type": "TextInput", "helperText": "VA disability rating percentage (if applicable)" },
                { "key": "monthly_amount", "label": "Monthly Benefit Amount", "type": "TextInput", "helperText": "Monthly compensation or pension amount" },
                { "key": "effective_date", "label": "Effective Date", "type": "DatePicker", "helperText": "When did the benefit begin?" },
                { "key": "va_contact", "label": "VA Contact Information", "type": "TextArea", "helperText": "Regional office, representative, or contact information" },
                { "key": "benefit_details", "label": "Benefit Details", "type": "TextArea", "helperText": "Specific details about the benefit or coverage" },
                { "key": "application_date", "label": "Application Date", "type": "DatePicker", "helperText": "When was the benefit applied for?" },
                { "key": "supporting_documents", "label": "Supporting Documents", "type": "TextInputWithUpload", "helperText": "Medical records, claim files, correspondence" },
                { "key": "dependents_info", "label": "Dependents Information", "type": "TextArea", "helperText": "Information about dependents included in benefits" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this benefit" }
              ]
            },
            {
              "id": "9C",
              "title": "Military Documents",
              "repeatable": true,
              "itemLabel": "Military Document",
              "fields": [
                { "key": "document_type", "label": "Document Type", "type": "Dropdown", "options": ["DD-214 (Discharge Papers)", "DD-215 (Correction to DD-214)", "Service Medical Records", "Personnel Records", "Award/Commendation Citations", "Training Certificates", "Security Clearance", "VA Rating Decision", "Military ID Cards", "Other"], "helperText": "Type of military document", "required": true },
                { "key": "document_description", "label": "Document Description", "type": "TextInput", "helperText": "Brief description of the document" },
                { "key": "document_date", "label": "Document Date", "type": "DatePicker", "helperText": "Date the document was issued" },
                { "key": "issuing_authority", "label": "Issuing Authority", "type": "TextInput", "helperText": "Which military office or agency issued this document" },
                { "key": "document_number", "label": "Document Number", "type": "TextInput", "helperText": "Document or reference number" },
                { "key": "original_location", "label": "Original Document Location", "type": "TextInput", "helperText": "Where the original document is stored" },
                { "key": "copies_location", "label": "Copies Location", "type": "TextInput", "helperText": "Where copies are stored" },
                { "key": "digital_copy", "label": "Digital Copy", "type": "TextInputWithUpload", "helperText": "Upload or note location of digital copy" },
                { "key": "document_importance", "label": "Document Importance", "type": "Dropdown", "options": ["Critical", "Important", "Reference"], "helperText": "How important is this document?" },
                { "key": "replacement_info", "label": "Replacement Information", "type": "TextArea", "helperText": "How to obtain replacements if lost" },
                { "key": "access_restrictions", "label": "Access Restrictions", "type": "TextArea", "helperText": "Any security classifications or access limitations" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this document" }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "chunk4", 
      "title": "Financial Accounts",
      "sections": [
        {
          "id": "10",
          "title": "Financial Accounts",
          "subsections": [
            {
              "id": "10A",
              "title": "Bank Accounts",
              "repeatable": true,
              "itemLabel": "Bank Account",
              "fields": [
                { "key": "bank_name", "label": "Bank Name", "type": "TextInput", "helperText": "Name of the bank or financial institution", "required": true },
                { "key": "account_type", "label": "Account Type", "type": "Dropdown", "options": ["Checking", "Savings", "Money Market", "CD (Certificate of Deposit)", "Business Checking", "Business Savings", "Other"], "helperText": "Type of bank account", "required": true },
                { "key": "account_number", "label": "Account Number", "type": "TextInput", "helperText": "Bank account number" },
                { "key": "routing_number", "label": "Routing Number", "type": "TextInput", "helperText": "Bank routing number" },
                { "key": "account_purpose", "label": "Account Purpose", "type": "TextInput", "helperText": "What this account is used for (general, bills, emergency, etc.)" },
                { "key": "current_balance", "label": "Approximate Current Balance", "type": "TextInput", "helperText": "Estimated account balance" },
                { "key": "account_holders", "label": "Account Holders", "type": "RepeatableGroup", "helperText": "People who have access to this account", "subFields": [
                  { "key": "individual_name", "label": "Name", "type": "TextInput", "helperText": "Full name of account holder" },
                  { "key": "relationship", "label": "Relationship", "type": "Dropdown", "options": ["Primary", "Joint", "Authorized User", "Power of Attorney", "Beneficiary", "Other"], "helperText": "Relationship to the account" },
                  { "key": "access_level", "label": "Access Level", "type": "Dropdown", "options": ["Full Access", "View Only", "Limited Access", "Signature Required"], "helperText": "Level of access to the account" }
                ]},
                { "key": "online_banking", "label": "Online Banking Information", "type": "TextArea", "helperText": "Website, username, security questions (or note where this info is stored)" },
                { "key": "automatic_transactions", "label": "Automatic Transactions", "type": "TextArea", "helperText": "Direct deposits, automatic payments, recurring transactions" },
                { "key": "debit_cards", "label": "Associated Debit Cards", "type": "TextArea", "helperText": "Debit cards linked to this account" },
                { "key": "safe_deposit_box", "label": "Safe Deposit Box", "type": "TextInput", "helperText": "Safe deposit box number and key location (if applicable)" },
                { "key": "branch_location", "label": "Primary Branch Location", "type": "TextInput", "helperText": "Address of the main branch you use" },
                { "key": "contact_info", "label": "Bank Contact Information", "type": "TextArea", "helperText": "Customer service phone, personal banker contact" },
                { "key": "important_documents", "label": "Important Documents", "type": "TextInputWithUpload", "helperText": "Account agreements, statements, or other important paperwork" },
                { "key": "beneficiaries", "label": "Beneficiaries", "type": "TextArea", "helperText": "POD (Payable on Death) or TOD (Transfer on Death) beneficiaries" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this account" }
              ]
            },
            {
              "id": "10B",
              "title": "Cryptocurrency Accounts",
              "instructions": "Document your cryptocurrency holdings, wallets, and exchange accounts. This is critical information for your next of kin to manage your digital assets.",
              "repeatable": true,
              "itemLabel": "Cryptocurrency Account",
              "optOut": {
                "enabled": true,
                "label": "I do not own any cryptocurrency",
                "description": "Check this box if you do not own any cryptocurrency or digital assets. This will mark this subsection as not applicable."
              },
              "fields": [
                { "key": "service_name", "label": "Exchange/Wallet Name", "type": "TextInput", "helperText": "Name of cryptocurrency exchange or wallet service", "required": true },
                { "key": "account_type", "label": "Account Type", "type": "Dropdown", "options": ["Exchange Account", "Hardware Wallet", "Software Wallet", "Paper Wallet", "Online Wallet", "Mobile Wallet", "Other"], "helperText": "Type of cryptocurrency account or wallet", "required": true },
                { "key": "custom_account_type", "label": "Specify Account Type", "type": "TextInput", "placeholder": "Enter custom account type", "helperText": "Please specify the type of account", "conditionalOn": "account_type", "conditionalValue": "Other" },
                { "key": "cryptocurrencies", "label": "Cryptocurrencies Held", "type": "TextArea", "helperText": "List of cryptocurrencies and approximate amounts (Bitcoin, Ethereum, etc.)" },
                { "key": "wallet_address", "label": "Wallet Address(es)", "type": "TextInputWithUpload", "helperText": "Public wallet addresses (store securely)" },
                { "key": "private_keys", "label": "Private Keys/Seed Phrases", "type": "TextInputWithUpload", "helperText": "CRITICAL: Private keys or seed phrases (store extremely securely)" },
                { "key": "login_credentials", "label": "Login Credentials", "type": "TextInputWithUpload", "helperText": "Username, password, 2FA information for exchange accounts" },
                { "key": "hardware_wallet_info", "label": "Hardware Wallet Information", "type": "TextArea", "helperText": "Model, PIN, location of physical device" },
                { "key": "backup_locations", "label": "Backup Locations", "type": "TextArea", "helperText": "Where backups of keys/phrases are stored" },
                { "key": "approximate_value", "label": "Approximate Total Value", "type": "TextInput", "helperText": "Estimated current value in USD" },
                { "key": "purchase_records", "label": "Purchase Records", "type": "TextInputWithUpload", "helperText": "Records of purchases for tax purposes" },
                { "key": "tax_information", "label": "Tax Information", "type": "TextArea", "helperText": "Tax advisor contact, cost basis, or tax treatment notes" },
                { "key": "transfer_instructions", "label": "Transfer Instructions", "type": "TextArea", "helperText": "Instructions for your next of kin on how to access or transfer" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about these digital assets" }
              ]
            },
            {
              "id": "10C",
              "title": "Digital Payment Apps",
              "instructions": "Document your digital payment and financial apps like Venmo, PayPal, Cash App, etc. Include account information and balances.",
              "repeatable": true,
              "itemLabel": "Payment App",
              "optOut": {
                "enabled": true,
                "label": "I do not use digital payment apps",
                "description": "Check this box if you do not use any digital payment applications. This will mark this subsection as not applicable."
              },
              "fields": [
                { "key": "app_name", "label": "App/Service Name", "type": "TextInput", "helperText": "Name of the payment app or service", "required": true },
                { "key": "app_category", "label": "App Category", "type": "Dropdown", "options": ["Peer-to-Peer Payment", "Digital Wallet", "Investment App", "Banking App", "Budgeting App", "Expense Tracking", "Other Financial App"], "helperText": "Type of financial app", "required": true },
                { "key": "username_email", "label": "Username/Email", "type": "TextInput", "helperText": "Login username or email address" },
                { "key": "phone_number", "label": "Associated Phone Number", "type": "TextInput", "helperText": "Phone number linked to the account" },
                { "key": "current_balance", "label": "Current Balance", "type": "TextInput", "helperText": "Approximate current balance in the app" },
                { "key": "linked_accounts", "label": "Linked Bank Accounts/Cards", "type": "TextArea", "helperText": "Bank accounts or credit cards connected to this app" },
                { "key": "payment_methods", "label": "Payment Methods", "type": "TextArea", "helperText": "How money is added to or withdrawn from the app" },
                { "key": "recurring_payments", "label": "Recurring Payments", "type": "TextArea", "helperText": "Any automatic or scheduled payments through this app" },
                { "key": "contacts_payees", "label": "Frequent Contacts/Payees", "type": "TextArea", "helperText": "People you regularly send money to through this app" },
                { "key": "security_settings", "label": "Security Settings", "type": "TextArea", "helperText": "PIN, biometric settings, security questions" },
                { "key": "transaction_history", "label": "Transaction History Access", "type": "TextInputWithUpload", "helperText": "How to access transaction history or statements" },
                { "key": "customer_support", "label": "Customer Support Info", "type": "TextArea", "helperText": "Contact information for app customer support" },
                { "key": "account_closure", "label": "Account Closure Instructions", "type": "TextArea", "helperText": "How to close the account or withdraw remaining balance" },
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
              "title": "Online Account Information",
              "repeatable": true,
              "itemLabel": "Online Account",
              "fields": [
                { "key": "account_type", "label": "Account Type", "type": "Dropdown", "options": ["Social Media", "Email", "Shopping", "Banking", "Streaming", "Cloud Storage", "Professional", "Government", "Utilities", "Other"], "helperText": "Type of online account", "required": true },
                { "key": "custom_account_type", "label": "Specify Account Type", "type": "TextInput", "placeholder": "Enter custom account type", "helperText": "Please specify the type of account", "conditionalOn": "account_type", "conditionalValue": "Other" },
                { "key": "service_name", "label": "Service/Website Name", "type": "TextInput", "placeholder": "Facebook, Gmail, Amazon, etc.", "helperText": "Name of the service or website" },
                { "key": "website_url", "label": "Website URL", "type": "TextInput", "placeholder": "https://www.example.com", "helperText": "Website address" },
                { "key": "username", "label": "Username", "type": "TextInput", "placeholder": "Username", "helperText": "Username or email address for login" },
                { "key": "password", "label": "Password", "type": "TextInput", "placeholder": "Password", "helperText": "Password or password manager note" },
                { "key": "two_factor_auth", "label": "Two-Factor Authentication", "type": "TextInputWithUpload", "helperText": "2FA method, backup codes, or authenticator app details" },
                { "key": "recovery_info", "label": "Recovery Information", "type": "TextArea", "helperText": "Security questions, recovery emails, or backup methods" },
                { "key": "account_importance", "label": "Account Importance", "type": "Dropdown", "options": ["Critical", "Important", "Moderate", "Low"], "helperText": "How important is this account?" },
                { "key": "closure_instructions", "label": "Account Closure Instructions", "type": "TextArea", "helperText": "How to close or memorialize this account" },
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this account" }
              ]
            },
            {
              "id": "11B",
              "title": "Physical Access Codes",
              "instructions": "Use this sheet to securely document all codes, combinations, and key locations for your physical locks, safes, vehicles, and other secured items. You can also store this information on your encrypted USB drive.\nPlease note the type of lock and access tools that are stored to ensure your next of kin can locate them easily.",
              "repeatable": true,
              "itemLabel": "Physical Access Code",
              "fields": [
                { "key": "item_type", "label": "Type of Secured Item", "type": "Dropdown", "options": ["Home Safe", "Bank Safe Deposit Box", "Vehicle", "Door Lock", "Gate Lock", "Storage Unit", "Office Safe", "Gun Safe", "Mailbox", "Garage Door", "Security System", "Other"], "helperText": "Type of item that is secured", "required": true },
                { "key": "custom_item_type", "label": "Specify Item Type", "type": "TextInput", "placeholder": "Enter custom item type", "helperText": "Please specify the type of secured item", "conditionalOn": "item_type", "conditionalValue": "Other" },
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
          "title": "Credit Cards & Debts",
          "subsections": [
            {
              "id": "13A",
              "title": "Credit Cards",
              "repeatable": true,
              "itemLabel": "Credit Card",
              "fields": [
                { "key": "card_name", "label": "Card Name", "type": "TextInput", "helperText": "Name of the credit card", "required": true },
                { "key": "card_type", "label": "Card Type", "type": "Dropdown", "options": ["Visa", "Mastercard", "American Express", "Discover", "Store Card", "Other"], "helperText": "Type of credit card", "required": true },
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
                { "key": "notes", "label": "Additional Notes", "type": "TextArea", "helperText": "Any other important information about this credit card" }
              ]
            },
            {
              "id": "13B",
              "title": "Debts & Loans",
              "repeatable": true,
              "itemLabel": "Debt/Loan",
              "fields": [
                { "key": "debt_type", "label": "Type of Debt", "type": "Dropdown", "options": ["Mortgage", "Personal Loan", "Auto Loan", "Student Loan", "Home Equity Loan", "Business Loan", "Medical Debt", "Tax Debt", "Credit Line", "Other"], "helperText": "Type of debt or loan", "required": true },
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
                { "key": "loan_documents", "label": "Loan Documents Location", "type": "TextInputWithUpload", "helperText": "Where loan agreements and documents are stored" },
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