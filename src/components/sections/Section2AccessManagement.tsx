'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/common/ui/card';
import { DynamicFormField } from '@/components/DynamicFormField';
import { AccessManagement } from '@/components/AccessManagement';

/* ------------------------------------------------------------------ */
/* JSON-LOCKED CONFIG (matches your config exactly)                     */
/* ------------------------------------------------------------------ */

const SECTION_2A = {
  id: '2A',
  title: 'Kit Access Control',
  fields: [
    {
      key: 'access_control_header',
      label:
        'Instructions for Owners: Assigning Next of Kin & Access to Your Kit',
      type: 'Instructions',
      content:
        'As the Owner of this Kit, you must designate at least one person who will be able to access your kit when needed. You can assign one Primary Next of Kin (responsible for the full kit), and/or multiple additional trusted people who may access all or only certain portions of the Kit.\\n\\n**Step 1: Designate Who Will Manage the Kit**\\nAs the Owner of this Kit, you must assign:\\n• At least one Primary Next of Kin (responsible for the full kit), and/or\\n• Multiple additional trusted people who may access all or only certain portions of the Kit.\\n\\n**Step 2: Adding Multiple People**\\nUse the \\"+ Add Person\\" button below to register another person (name, relationship, email, phone). For each person added, you will be prompted to select which sections of the Kit they can access:\\n• Entire Kit (Full Access), or\\n• Specific sections only (e.g., Insurance Policies, Vehicles, Legal Documents).\\n\\nEach person will have:\\n• Separate login credentials (their own registered email/phone).\\n• A unique Master Access Password (either created by you or system-generated).\\n• A separate Password Card (printable/exportable PDF for storage).\\n\\n**Step 3: Create Master Access Passwords**\\nFor every person assigned:\\n• The system will generate a Password Card.\\n• You must print or export each card individually.\\n• Store each card in a secure location (recommended: your Fireproof Document Bag) and inform each person where their card is stored.\\n\\n**⚠️ Important:**\\n• Do not give anyone their password directly.\\n• Only share the location of their Password Card.\\n• You must designate at least one person to access your kit.\\n\\n**Step 4: How People Log In**\\nEach assigned person will:\\n1. Go to the Next of Kin Login page.\\n2. Enter their registered email or phone number.\\n3. Enter their unique Master Access Password (from their Password Card).\\n4. Access the specific sections of the Kit that you allowed them to see.\\n\\n**Step 5: Owner Notifications & Revocation**\\nEvery time someone logs in:\\n• You will receive a notification (phone/email).\\n• Notification includes the person\'s name, access type (Full Kit or Sectional), and timestamp.\\n• A Revoke Access button will be included so you can immediately end their session if:\\n  - Access was accidental, or\\n  - A rogue login attempt occurred.\\n\\nYou may also:\\n• Revoke or reset access for any individual from your Owner Dashboard.\\n• Use \\"Revoke All\\" to instantly lock down the Kit from everyone.',
    },
    {
      key: 'access_management_data',
      label: 'Access Management',
      type: 'AccessManagement',
      helperText:
        'Manage who can access your Orderly Affairs Kit and what sections they can view',
    },
  ],
};

/* ------------------------------------------------------------------ */
/* PROPS                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  data?: any;
  onChange?: (data: any) => void;
  isActive?: boolean;
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function Section2AccessManagement({
  // data = {},
  // onChange = () => {},
  isActive = false,
}: Props) {
  // const subsectionData = data['2A'] || {};
  // const authorizedPeople = subsectionData.access_management_data || [];

  // const updateAuthorizedPeople = (people: any[]) => {
  //   onChange({
  //     ...data,
  //     '2A': {
  //       ...subsectionData,
  //       access_management_data: people,
  //     },
  //   });
  // };

  return (
    <Card
      id="subsection-2A"
      className={isActive ? 'ring-2 ring-primary/50 bg-primary/5' : ''}
    >
      {/* ================= HEADER ================= */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[16px]">
          <span className="text-sm text-muted-foreground">{SECTION_2A.id}</span>
          {SECTION_2A.title}
        </CardTitle>
      </CardHeader>

      {/* ================= CONTENT ================= */}
      <CardContent className="space-y-8">
        {/* Instructions */}
        <DynamicFormField
          field={SECTION_2A.fields[0]}
          value={null}
          onChange={() => {}}
        />

        {/* Access Management Controller */}
        <AccessManagement
          // authorizedPeople={authorizedPeople}
          // onChange={updateAuthorizedPeople}
        />
      </CardContent>
    </Card>
  );
}
