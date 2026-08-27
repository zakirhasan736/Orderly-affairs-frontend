import type { NOKLetter, NOKLetterIn } from '@/services/nokLetterApi';
import type { NextKinAccessResponse } from '@/services/authApi';

export type NokLetterData = Partial<NOKLetter & NOKLetterIn>;

export const NOK_LETTER_DEFAULTS = {
  letter_greeting: 'Dear',
  access_url: 'https://vault.orderly-affairs.com/next-kin',
  letter_opening:
    "I'm writing you this note as someone I trust deeply.\n\nAs my next of kin, the executor of my will, a close friend, my attorney, or someone who cares—I want you to know that I've prepared something to help guide you through what comes next.",
  kit_description:
    "I've subscribed to an Orderly Affairs Vault. Inside, you'll find everything you may need to manage my affairs if I'm no longer able to, or when I'm gone. It includes not only documents, but also instructions—gentle step-by-step guides to make this process less overwhelming.",
  keep_email_notice:
    'SAVE THIS EMAIL. DO NOT DELETE IT. Keep it with this letter. You will need the portal link later.',
  accessible_sections:
    "Once you log in, you'll be able to manage the sections below on my behalf:\n\n(Autofill sections based on selection in the access management section)",
  key_bag_info:
    '• The Key Bag: This contains important keys and a guide to what each is for. It may include house keys, PO box keys, or vehicle keys. It is located',
  documents_bag_info:
    '• The Documents Bag: Please keep this safe. It contains originals of the essential documents that you may need to refer to it even after everything has been settled. It is located',
  incomplete_kit_message:
    "If any part of the Vault is incomplete, please don't worry. Even the unfinished parts can still help you stay organized. I've done my best to make sure you won't be left searching through drawers or wondering where things are.",
  closing_message:
    "Above all, this Vault is my way of caring for you—even when I can't be here in person.\n\nTake your time. Breathe. You've got this, and I'm grateful it's you.",
  letter_signature: 'With love,',
};

/** Prior default — upgrade saved letters that still have this wording. */
const LEGACY_DOCUMENTS_BAG_INFO =
  '• The Documents Bag: Please keep this safe. It contains original documents and space to store items such as death certificates. You may need to refer to it even after everything has been settled. It is located';

function defaultLoginCredentialsText(data: NokLetterData): string {
  const email =
    data.nok_email || 'will auto-populate from Access Management';
  const phone =
    data.nok_phone || 'will auto-populate from Access Management';
  const portal =
    data.access_url || NOK_LETTER_DEFAULTS.access_url;
  return `${NOK_LETTER_DEFAULTS.keep_email_notice}

I have registered your email address (${email}) and your phone number (${phone}). Bookmark the next-of-kin portal: ${portal}

Nobody is handed my Vault password. After I pass and access is released, you will receive a one-time claim link at this email. You will set your own password and sign in at that portal.`;
}

const LEGACY_LOGIN_CREDENTIALS_MARKER =
  'The password to gain access to the Vault is printed on a password card';

function normalizeDocumentsBagInfo(value?: string | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === LEGACY_DOCUMENTS_BAG_INFO) {
    return NOK_LETTER_DEFAULTS.documents_bag_info;
  }
  return trimmed;
}

function normalizeLoginCredentialsText(
  value?: string | null,
  data?: NokLetterData,
): string | undefined {
  if (value == null || !String(value).trim()) {
    return data ? defaultLoginCredentialsText(data) : undefined;
  }
  if (String(value).includes(LEGACY_LOGIN_CREDENTIALS_MARKER)) {
    return defaultLoginCredentialsText(data || {});
  }
  return value;
}

/**
 * Apply current template defaults where fields are empty or still on a
 * superseded Documents Bag sentence.
 */
export function applyNokLetterTemplateDefaults(
  letter: NokLetterData,
): NokLetterData {
  return {
    ...letter,
    documents_bag_info: normalizeDocumentsBagInfo(letter.documents_bag_info),
    login_credentials_text: normalizeLoginCredentialsText(
      letter.login_credentials_text,
      letter,
    ),
  };
}

/** Collapse "Amber Amber Furst" → "Amber Furst". */
export function dedupeConsecutiveNameWords(name: string): string {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length < 2) return parts.join(' ');
  const out: string[] = [];
  for (const part of parts) {
    const prev = out[out.length - 1];
    if (prev && prev.toLowerCase() === part.toLowerCase()) continue;
    out.push(part);
  }
  return out.join(' ');
}

export function mergeNokLetterAutofill(
  letter: NokLetterData,
  person?: NextKinAccessResponse | null,
): NokLetterData {
  if (!person) return letter;

  const resolvedTo = dedupeConsecutiveNameWords(
    String(person.full_name || letter.letter_to || '').trim(),
  );

  return {
    ...letter,
    letter_to: resolvedTo || letter.letter_to,
    nok_email: person.email || letter.nok_email,
    nok_phone: person.phone_number || letter.nok_phone,
    password_card_location:
      person.card_storage_location || letter.password_card_location,
    key_bag_location: person.key_bag_location || letter.key_bag_location,
    documents_bag_location:
      person.documents_bag_location || letter.documents_bag_location,
  };
}

/** Printed name under the closing line (owner name / editable signer). */
export function resolveNokLetterSignerName(
  data: NokLetterData,
  ownerName?: string | null,
): string {
  const fromLetter = String(data.signer_name || '').trim();
  if (fromLetter) return fromLetter;
  const fromOwner = String(ownerName || '').trim();
  if (fromOwner) return fromOwner;
  return '[Your name]';
}

/**
 * Build "Dear Amber," using only the recipient's first name, without duplicating
 * a first name that was already typed into the greeting field.
 */
export function formatNokLetterSalutation(
  greeting?: string | null,
  letterTo?: string | null,
): string {
  const rawGreeting = String(
    greeting || NOK_LETTER_DEFAULTS.letter_greeting,
  ).trim();
  const rawTo = dedupeConsecutiveNameWords(
    String(letterTo || '').trim() || '[Next of Kin Name]',
  );
  const firstName = rawTo.split(/\s+/)[0] || rawTo;

  const withComma = (value: string) =>
    value.endsWith(',') ? value : `${value},`;

  const greetingLower = rawGreeting.toLowerCase();
  const firstLower = firstName.toLowerCase();
  const toLower = rawTo.toLowerCase();

  // Greeting already includes the first name or full recipient name.
  if (
    greetingLower === firstLower ||
    greetingLower === toLower ||
    greetingLower.endsWith(` ${firstLower}`) ||
    greetingLower.endsWith(` ${toLower}`) ||
    greetingLower.endsWith(toLower)
  ) {
    // If greeting still has a full name, trim to first name only.
    if (
      greetingLower.endsWith(` ${toLower}`) ||
      greetingLower === toLower
    ) {
      const withoutFull = rawGreeting
        .slice(0, rawGreeting.length - rawTo.length)
        .trimEnd();
      const base = withoutFull || NOK_LETTER_DEFAULTS.letter_greeting;
      return withComma(`${base} ${firstName}`.trim());
    }
    return withComma(rawGreeting);
  }

  return withComma(`${rawGreeting} ${firstName}`);
}

export function buildNokLetterPreviewText(
  localData: NokLetterData,
  person?: NextKinAccessResponse | null,
  ownerName?: string | null,
): string {
  const data = applyNokLetterTemplateDefaults(
    mergeNokLetterAutofill(localData, person),
  );
  const loginCredentialsText =
    data.login_credentials_text || defaultLoginCredentialsText(data);

  const date = data.letter_date
    ? new Date(data.letter_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Upon Death';

  const signer = resolveNokLetterSignerName(data, ownerName);
  const salutation = formatNokLetterSalutation(
    data.letter_greeting,
    data.letter_to,
  );

  return `${date}

${salutation}

${data.letter_opening || NOK_LETTER_DEFAULTS.letter_opening}

${data.kit_description || NOK_LETTER_DEFAULTS.kit_description}

You can access the Vault online at: ${data.access_url || NOK_LETTER_DEFAULTS.access_url}

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

${signer}`;
}

export function isNokLetterDelivered(
  letter?: NokLetterData | null,
): boolean {
  return letter?.delivery_status === 'sent';
}

export type NokLetterUiStatus = 'needs_write' | 'saved' | 'sent';

export function resolveNokLetterUiStatus(
  letter?: NokLetterData | null,
): NokLetterUiStatus {
  if (letter?.delivery_status === 'sent') return 'sent';
  if (letter?.id) return 'saved';
  return 'needs_write';
}
