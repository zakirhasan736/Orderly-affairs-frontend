'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { DynamicFormField } from '@/components/DynamicFormField';

/**
 * SECTION 1
 * Instructions / Introduction
 *
 * This section is intentionally static.
 * No form state, no saving, no repeatables.
 */

const Section0PersonalInformation = () => {
  return (
    <div className="space-y-6">
      {/* 1. We’re honored you’re here */}
      <Card className="gap-0!">
        <div >
          <CardHeader>
            <CardTitle>We’re honored you’re here</CardTitle>
          </CardHeader>
          <CardContent className="pb-0! pt-4">
            <DynamicFormField
              field={{
                key: 'honored_youre_here',
                label: '',
                type: 'Instructions',
                content: `Thank you for your support of our small business. Whether you're planning ahead or navigating life after a loss, this kit offers you clarity, and support during overwhelming times. It provides an easy framework to gather, organize, and communicate important details to you and your loved ones.

This isn't just about paperwork; it's about peace of mind and making things easier for those who may open this kit with a heavy heart. Each section guides you through life areas—financial, legal, personal, or practical—with simple instructions. Some parts are straightforward, such as listing vehicles, while others, like estate plans, require more careful consideration. The kit uses color-coded tabs: green for manageable sections, yellow for those needing more time, and red for sections with documents that may take longer to gather.`,
              }}
              value={null}
              onChange={() => {}}
            />
          </CardContent>
        </div>
        {/* 2. Go at your own pace */}
        <div >
          <CardHeader>
            <CardTitle>Go at your own pace</CardTitle>
          </CardHeader>
          <CardContent className="pb-0! pt-4">
            <DynamicFormField
              field={{
                key: 'go_at_your_pace',
                label: '',
                type: 'Instructions',
                content: `You can write neatly or scribble notes. Add sticky tabs, folders, or printouts, including extra letters or passwords. Make this kit reflect your life, story, and preferences.

As you fill it out, consider those who might hold it—spouse, daughter, son-in-law, or friend. They may not know where everything is or your wishes, but your care and clarity will guide them.

This kit is a gift—not just for the future but for now—offering control, comfort, and preparedness.`,
              }}
              value={null}
              onChange={() => {}}
            />
          </CardContent>
        </div>
        {/* 3. Things to keep in mind */}
        <div id="subsection-1C">
          <CardHeader>
            <CardTitle>A few things to keep in mind</CardTitle>
          </CardHeader>
          <CardContent className="pb-0! pt-4">
            <DynamicFormField
              field={{
                key: 'things_to_keep_in_mind',
                label: '',
                type: 'Instructions',
                content: `• This isn't about getting everything perfect. It's about making sure your life is understandable and accessible.

• Life changes. So should your kit. Come back to it from time to time—when you move, get a new pet, sell a car, or update your will.

• Keep it in one place. Let someone you trust know where to find it.

• And most importantly, remember this is not a legal document. Please consult with an attorney when drafting your will, designating beneficiaries, or making binding decisions.`,
              }}
              value={null}
              onChange={() => {}}
            />
          </CardContent>
        </div>
        {/* 4. What's included */}
        <div id="subsection-1D">
          <CardHeader>
            <CardTitle>What’s included in your Orderly Affairs Kit</CardTitle>
          </CardHeader>
          <CardContent className="pb-0! pt-4">
            <DynamicFormField
              field={{
                key: 'whats_included',
                label: '',
                type: 'Instructions',
                content: `1 Fireproof Document Protector Bag:
Use this for passports, birth certificates, or anything you keep in a safe. Your next of kin can also use it to safely store critical documents during estate handling.

1 Fireproof Key Bag + 10 Key Tags:
We guide you through labeling and storing your home and personal keys. For your next of kin, we provide instructions to keep everything secure and accounted for.`,
              }}
              value={null}
              onChange={() => {}}
            />
          </CardContent>
        </div>
        {/* 5. Copyright */}
        <div >
          <CardHeader>
            <CardTitle>Copyright & legal notice</CardTitle>
          </CardHeader>
          <CardContent className="pb-0! pt-4">
            <DynamicFormField
              field={{
                key: 'copyright_legal_notice',
                label: '',
                type: 'Instructions',
                content: `The Orderly Affairs Kit was created with great care and compassion to help people bring peace, clarity, and dignity to one of life's most difficult transitions.

Orderly Affairs is not affiliated with any other product or company, and all material herein is protected by copyright. This kit is offered as a personal organizational tool and does not constitute legal, financial, or medical advice.

Please do not redistribute, copy, or resell any portion without written permission.`,
              }}
              value={null}
              onChange={() => {}}
            />
          </CardContent>
        </div>
      </Card>
    </div>
  );
};

export default Section0PersonalInformation;
