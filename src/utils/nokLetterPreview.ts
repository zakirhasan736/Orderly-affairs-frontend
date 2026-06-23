import type { NOKLetter, NOKLetterIn } from '@/services/nokLetterApi';
import type { NextKinAccessResponse } from '@/services/authApi';

export type NokLetterData = Partial<NOKLetter & NOKLetterIn>;

export const NOK_LETTER_DEFAULTS = {
  letter_greeting: 'Dear',
  access_url: 'https://orderly-affairs.com',
  letter_opening:
    "I'm writing you this note as someone I trust deeply.\n\nAs my next of kin, the executor of my will, a close friend, my attorney, or someone who cares—I want you to know that I've prepared something to help guide you through what comes next.",
  kit_description:
    "I've subscribed to an Orderly Affairs Kit. Inside, you'll find everything you may need to manage my affairs if I'm no longer able to, or when I'm gone. It includes not only documents, but also instructions—gentle step-by-step guides to make this process less overwhelming.",
  accessible_sections:
    "Once you log in, you'll be able to manage the sections below on my behalf:\n\n(Autofill sections based on selection in the access management section)",
  key_bag_info:
    '• The Key Bag: This contains important keys and a guide to what each is for. It may include house keys, PO box keys, or vehicle keys. It is located',
  documents_bag_info:
    '• The Documents Bag: Please keep this safe. It contains original documents and space to store items such as death certificates. You may need to refer to it even after everything has been settled. It is located',
  incomplete_kit_message:
    "If any part of the kit is incomplete, please don't worry. Even the unfinished parts can still help you stay organized. I've done my best to make sure you won't be left searching through drawers or wondering where things are.",
  closing_message:
    "Above all, this kit is my way of caring for you—even when I can't be here in person.\n\nTake your time. Breathe. You've got this, and I'm grateful it's you.",
  letter_signature: 'With love,',
};

export function mergeNokLetterAutofill(
  letter: NokLetterData,
  person?: NextKinAccessResponse | null,
): NokLetterData {
  if (!person) return letter;

  return {
    ...letter,
    letter_to: person.full_name || letter.letter_to,
    nok_email: person.email || letter.nok_email,
    nok_phone: person.phone_number || letter.nok_phone,
    password_card_location:
      person.card_storage_location || letter.password_card_location,
    key_bag_location: person.key_bag_location || letter.key_bag_location,
    documents_bag_location:
      person.documents_bag_location || letter.documents_bag_location,
  };
}

export function buildNokLetterPreviewText(
  localData: NokLetterData,
  person?: NextKinAccessResponse | null,
): string {
  const data = mergeNokLetterAutofill(localData, person);
  const loginCredentialsText =
    data.login_credentials_text ||
    `I have registered your email address (${
      data.nok_email || 'will auto-populate from Access Management'
    }) and your phone number (${
      data.nok_phone || 'will auto-populate from Access Management'
    }), which you can use as your login credentials. The password to gain access to the kit is printed on a password card located ${
      data.password_card_location ||
      'will auto-populate from Access Management'
    }.`;

  const date = data.letter_date
    ? new Date(data.letter_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Upon Death';

  return `${date}

${data.letter_greeting || NOK_LETTER_DEFAULTS.letter_greeting} ${
    data.letter_to || '[Next of Kin Name]'
  },

${data.letter_opening || NOK_LETTER_DEFAULTS.letter_opening}

${data.kit_description || NOK_LETTER_DEFAULTS.kit_description}

You can access the kit online at: ${data.access_url || NOK_LETTER_DEFAULTS.access_url}

${loginCredentialsText}

${data.accessible_sections || NOK_LETTER_DEFAULTS.accessible_sections}

In addition to the online kit, you'll find two important physical items:

${data.key_bag_info || NOK_LETTER_DEFAULTS.key_bag_info} ${
    data.key_bag_location || '[Key Bag Location]'
  }.

${data.documents_bag_info || NOK_LETTER_DEFAULTS.documents_bag_info} ${
    data.documents_bag_location || '[Documents Bag Location]'
  }.

${data.incomplete_kit_message || NOK_LETTER_DEFAULTS.incomplete_kit_message}

${data.closing_message || NOK_LETTER_DEFAULTS.closing_message}

${data.letter_signature || NOK_LETTER_DEFAULTS.letter_signature}

[Your signature]`;
}

export function isNokLetterDelivered(
  letter?: NokLetterData | null,
): boolean {
  return letter?.delivery_status === 'sent';
}
