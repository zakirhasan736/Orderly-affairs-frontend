export type OwnerTourStep = {
  section: string;
  selector: string;
  title: string;
  description: string;
  /** Force this vault section visible before spotlight (usually dashboard). */
  ensureSection?: string;
};

/**
 * Guided tour for vault owners — meaningful areas first:
 * overview → document upload / AI autofill → tasks → people → navigation.
 */
export const ownerTour: OwnerTourStep[] = [
  {
    section: 'Overview',
    selector: '.overview-vault-snapshot',
    ensureSection: 'dashboard',
    title: 'Your vault overview',
    description:
      'Start here. These cards show how complete your vault is, any reminders due, and how many documents AI has already filled. Tap a card to jump into the next useful action.',
  },
  {
    section: 'Upload',
    selector: '[data-ai-overview-upload]',
    ensureSection: 'dashboard',
    title: 'Upload documents to auto-fill',
    description:
      'Drop PDFs or photos here. We detect the right section and fill matching fields for you — no need to type everything by hand. You can upload several files at once.',
  },
  {
    section: 'Upload types',
    selector: '.overview-upload-types',
    ensureSection: 'dashboard',
    title: 'What you can upload',
    description:
      'Personal IDs and forms, employment & income papers, education records, insurance & vehicle docs, bank and investment statements, healthcare records, legal documents (will, POA, trusts), and assets / estate planning files all work well.',
  },
  {
    section: 'Browse',
    selector: '[data-tour="tour-vault-by-category"]',
    ensureSection: 'dashboard',
    title: 'Vault by category',
    description:
      'Browse the vault in short groups — Finance, Property, Passwords, Insurance, Healthcare, Identity, Work, Community, then Family and Legal. Tap a category to see its sections, then open any section to fill it. Same sections as the sidebar, just easier to scan.',
  },
  {
    section: 'Tasks',
    selector: '.overview-task-board',
    ensureSection: 'dashboard',
    title: 'Continue where it matters',
    description:
      'These cards group everyday vault work first — money & property, documents, and life details — with letters and final wishes for loved ones at the bottom. Open any card to fill that section, or review what AI already drafted from a document.',
  },
  {
    section: 'People',
    selector: '.overview-people-hub',
    ensureSection: 'dashboard',
    title: 'People, letter & messages',
    description:
      'This is the trust hub: who may access your vault, your Next of Kin letter (the note most people write first), and personal messages (text, audio, or video) for specific people. Keep this current — it is the most important information for the people you trust.',
  },
  {
    section: 'Sidebar',
    selector: '.sidebar-navigation',
    ensureSection: 'dashboard',
    title: 'All vault sections',
    description:
      'Open any of the 21 sections here anytime. Hover an added item (Pet #1, a policy card, etc.) and the grip becomes trash if you need to remove it. You do not have to finish in order.',
  },
  {
    section: 'Progress',
    selector: '[data-tour="tour-progress-explain"]',
    ensureSection: 'dashboard',
    title: 'What the % means',
    description:
      'This bar and the rings beside each section show field-fill progress — how many tracked fields have a value. 100% means the fields are filled, not that a document was uploaded.',
  },
  {
    section: 'After upload',
    selector: '[data-ai-overview-upload]',
    ensureSection: 'dashboard',
    title: 'Finish blanks after AI fills',
    description:
      'Path: upload a document → Accept the AI fill → open that section. Remaining blanks show a sticky “Fill empty fields” bar (and a sparkle on incomplete items). Use it to walk through only what’s still empty.',
  },
  {
    section: 'Home',
    selector: '.owner-dashboard-item',
    ensureSection: 'dashboard',
    title: 'Back to overview anytime',
    description:
      'Tap Dashboard to return to this overview — progress, document inbox, tasks, and people. When you are ready, upload another document or open a task card and keep going.',
  },
];
