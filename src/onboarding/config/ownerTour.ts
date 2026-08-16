export type OwnerTourStep = {
  section: string;
  selector: string;
  title: string;
  description: string;
  /** Force this vault section visible before spotlight (usually dashboard). */
  ensureSection?: string;
  /** Switch the People & messages hub to this tab before spotlight. */
  peopleTab?: 'access' | 'nok-letters' | 'messages';
  /** Force tooltip placement relative to the spotlight target. */
  tooltipPlacement?: 'auto' | 'beside' | 'below';
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
    section: 'Just saved',
    selector: '[data-tour="tour-new-data-hub"]',
    ensureSection: 'dashboard',
    title: 'New data lives in the sidebar',
    description:
      'After you Accept an AI fill, the matching vault section rises under Review these first in the left sidebar. Tap it to open the section — you do not need a second copy on the dashboard.',
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
      "Start with the basics: money and property, documents, and key life details. Letters and final wishes for your loved ones are grouped at the bottom for when you're ready. Open any card to fill it in, or check what AI has already pulled from documents you've uploaded.",
  },
  {
    section: 'Access',
    selector: '[data-tour="tour-people-manage-access"]',
    ensureSection: 'dashboard',
    peopleTab: 'access',
    title: 'Access',
    description:
      "This is your trust hub — the three ways you share information with the people you choose.\n\nWho can see your vault, and what they're allowed to view or manage.",
  },
  {
    section: 'Letter',
    selector: '[data-tour="tour-people-tab-letter"]',
    ensureSection: 'dashboard',
    peopleTab: 'nok-letters',
    title: 'Letter',
    description:
      'Your note to next of kin, usually the first thing people write here.',
  },
  {
    section: 'Messages',
    selector: '[data-tour="tour-people-tab-messages"]',
    ensureSection: 'dashboard',
    peopleTab: 'messages',
    title: 'Messages',
    description:
      "Text, audio, or video for specific people, saved for when they need it.\n\nKeep this current. It's the information your loved ones will rely on most.",
  },
  {
    section: 'Sidebar',
    selector: '.sidebar-navigation',
    ensureSection: 'dashboard',
    tooltipPlacement: 'beside',
    title: 'All vault sections',
    description:
      'Open any of the 21 sections here anytime. Hover an added item (Pet #1, a policy card, etc.) and the grip becomes trash if you need to remove it. You do not have to finish in order.',
  },
  {
    section: 'Progress',
    selector: '[data-tour="tour-progress-explain"]',
    ensureSection: 'dashboard',
    tooltipPlacement: 'below',
    title: 'What the % means',
    description:
      "This percentage, and the ring next to each section, count how many fields have a value, nothing else. A section can hit 100% just by typing in details yourself. Uploading a document isn't required and doesn't automatically move the number.",
  },
  {
    section: 'After upload',
    selector: '[data-tour="tour-fill-empty-bar"]',
    ensureSection: '1',
    title: 'Review fields after AI fills',
    description:
      "When you open a section that was just filled, this bar says This card was just filled. Tap Review fields to see empty blanks and already-filled values — same popup every time, even if you skipped it earlier.",
  },
  {
    section: 'Home',
    selector: '.owner-dashboard-item',
    ensureSection: 'dashboard',
    tooltipPlacement: 'beside',
    title: 'Back to overview anytime',
    description:
      "Dashboard is the overall view of your vault. Tap it anytime to check your progress, review uploaded documents, or open any section. When you're ready, upload another document or pick up where you left off.",
  },
];
