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
    section: 'Tasks',
    selector: '.overview-task-board',
    ensureSection: 'dashboard',
    title: 'Continue where it matters',
    description:
      'These cards group the highest-impact work — letters for loved ones, money & property, and everyday life details. Open any card to fill that section, or review what AI already drafted from a document.',
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
      'Use the sidebar to open any of the 21 sections anytime. You do not have to finish in order — fill what you have documents for, then return here when you are ready for the next piece.',
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
