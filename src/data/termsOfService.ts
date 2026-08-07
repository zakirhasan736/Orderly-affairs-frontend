export const TOS_META = {
  code: 'OP-30 · Legal',
  title: 'Terms of Service',
  subtitle:
    'The agreement between you and Orderly Affairs Digital, LLC covering the website, the web app, and the mobile app.',
  mobileSubtitle: 'Your agreement with Orderly Affairs Digital, LLC.',
  lastUpdatedLabel: 'August 7, 2026',
  lastUpdatedShort: 'Aug 7, 2026',
  version: '2.1',
  supportEmail: 'support@orderly-affairs.com',
  company: 'Orderly Affairs Digital, LLC',
  addressLines: ['5900 Balcones Drive STE 100', 'Austin, TX 78731'],
} as const;

export type TosSection = {
  id: string;
  number: number;
  navLabel: string;
  title: string;
  /** Short mobile preview when collapsed sections list shows excerpts for open items */
  mobileSummary?: string;
};

export const TOS_NAV: TosSection[] = [
  { id: 'tos-1', number: 1, navLabel: 'Acceptance of terms', title: '1. Acceptance of Terms' },
  { id: 'tos-2', number: 2, navLabel: 'What the Service is', title: '2. Description of the Service' },
  {
    id: 'tos-3',
    number: 3,
    navLabel: 'Not legal or financial advice',
    title: '3. Not Legal, Financial, or Tax Advice',
  },
  { id: 'tos-4', number: 4, navLabel: 'Accounts and eligibility', title: '4. Accounts and Eligibility' },
  {
    id: 'tos-5',
    number: 5,
    navLabel: 'Subscription, fees, billing',
    title: '5. Subscription, Fees, and Billing',
  },
  { id: 'tos-6', number: 6, navLabel: 'Your content', title: '6. Your Content' },
  {
    id: 'tos-7',
    number: 7,
    navLabel: 'Our intellectual property',
    title: '7. Intellectual Property in the Service',
  },
  { id: 'tos-8', number: 8, navLabel: 'Acceptable use', title: '8. Acceptable Use' },
  { id: 'tos-9', number: 9, navLabel: 'Third-party services', title: '9. Third-Party Services' },
  { id: 'tos-10', number: 10, navLabel: 'Data security', title: '10. Data Security; No Guarantee' },
  {
    id: 'tos-11',
    number: 11,
    navLabel: 'Disclaimer of warranties',
    title: '11. Disclaimer of Warranties',
  },
  {
    id: 'tos-12',
    number: 12,
    navLabel: 'Limitation of liability',
    title: '12. Limitation of Liability',
  },
  { id: 'tos-13', number: 13, navLabel: 'Indemnification', title: '13. Indemnification' },
  {
    id: 'tos-14',
    number: 14,
    navLabel: 'Suspension and termination',
    title: '14. Term, Suspension, and Termination',
  },
  {
    id: 'tos-15',
    number: 15,
    navLabel: 'Death or incapacity',
    title: '15. Death, Incapacity, or Unavailability of the Account Holder',
  },
  {
    id: 'tos-16',
    number: 16,
    navLabel: 'Governing law; disputes',
    title: '16. Governing Law; Dispute Resolution',
  },
  {
    id: 'tos-17',
    number: 17,
    navLabel: 'Changes to these terms',
    title: '17. Changes to These Terms',
  },
  { id: 'tos-18', number: 18, navLabel: 'Miscellaneous', title: '18. Miscellaneous' },
  { id: 'tos-19', number: 19, navLabel: 'Contact us', title: '19. Contact' },
];

export const TOS_SHORT_VERSION = [
  {
    title: 'Your files stay yours.',
    body: 'We host and display them only to run the vault for you and the people you authorise.',
    tone: 'green' as const,
  },
  {
    title: 'We are not a law firm.',
    body: 'The vault organises your records. It does not write or replace a will, trust, or power of attorney.',
    tone: 'amber' as const,
  },
  {
    title: 'Cancel any time.',
    body: 'Cancel before the next billing cycle starts; access runs to the end of the cycle you paid for.',
    tone: 'blue' as const,
  },
  {
    title: 'Release takes proof.',
    body: 'A next of kin gets access only after the verification steps you configured are met.',
    tone: 'blue' as const,
  },
] as const;
