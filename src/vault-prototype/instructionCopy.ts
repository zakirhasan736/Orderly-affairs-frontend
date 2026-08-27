export type InstructionCopyBlock = {
  id: string;
  title: string;
  paragraphs: string[];
};

/** Static Instructions section copy (not a fillable form). */
export const INSTRUCTION_SECTION_COPY: InstructionCopyBlock[] = [
  {
    id: 'how-it-works',
    title: 'How the Vault Works',
    paragraphs: [
      'The Vault saves your entries as you go. Stop anytime and pick up where you left off.',
      "Nobody sees your Vault while you're alive unless you invite them. Add a next of kin or family member from Access Management when you're ready.",
      'Fill in sections in any order. Start with the ones your family reaches for most: Vital Information & Key Contacts, Passwords & Online Accounts, Main Residence, and Bank Accounts. Save Estate Planning & Final Wishes for later, once the daily-use sections are in place.',
      "You don't need a free afternoon. Ten minutes on one section moves the whole Vault forward.",
      'Build this with a spouse, partner, or family member if you want. Two people filling in details catch more than one person working alone.',
    ],
  },
  {
    id: 'dove-legend',
    title: 'What the Dove Icons Mean',
    paragraphs: [
      'A dove icon marks fields your family will need to write your obituary: your full name, dates, places you lived, work history, and the people and organizations that mattered to you.',
      'The Vault turns those fields into a first draft your family can edit, so nobody starts from a blank page during a hard week.',
      "Add notes on tone (short, formal, funny, plain) and anything you want said or left out. Attach a photo you'd want used.",
    ],
  },
  {
    id: 'keeping-current',
    title: 'Keeping It Current',
    paragraphs: [
      'A Vault three years out of date can cause more confusion than no Vault at all. Passwords change, accounts close, policies expire.',
      "Set a reminder cadence below: every 3 months, every 6 months, or once a year. Pick a day you'll remember, like a birthday or New Year's.",
      'Turn on expiry nudges so the Vault flags a password or policy before it lapses, not after.',
      'Treat review sessions the same as filling in the Vault the first time: short, regular, and never all at once.',
    ],
  },
  {
    id: 'disclaimer',
    title: 'Not a Legal Document',
    paragraphs: [
      'The Vault organizes your information. It does not replace a will, trust, or power of attorney, and Orderly Affairs does not give legal, tax, or medical advice.',
      'Use the Legal Documents & Records and Estate Planning & Final Wishes sections to note whether you have a signed will, when you last spoke with an attorney, and who that attorney is.',
      'For anything binding, work with a licensed attorney in your state.',
    ],
  },
];

export const INSTRUCTION_PAGE_BANNER =
  'A short orientation, not a form. Read through, then head into the sections below.';

export function instructionCopyForSub(subId: string): string[] {
  return INSTRUCTION_SECTION_COPY.find(block => block.id === subId)?.paragraphs || [];
}
