export type NextKinTourStep = {
  section: string;
  selector: string;
  title: string;
  description: string;
};

/**
 * Short tour for next-of-kin users — access scope and where to find guidance.
 */
export const nextKinTour: NextKinTourStep[] = [
  {
    section: 'nok_dashboard',
    selector: '.nok-welcome',
    title: 'Your secure dashboard',
    description:
      'You have controlled access to this vault. Everything you open here is logged for the owner’s peace of mind.',
  },
  {
    section: 'nok_dashboard',
    selector: '.authorized-sections',
    title: 'Areas you can open',
    description:
      'These are the sections the owner shared with you. Open only what you need — start with any letter or instructions left for you.',
  },
  {
    section: 'nok_dashboard',
    selector: '.owner-letter',
    title: 'Owner’s letter & guidance',
    description:
      'Read the letter and notes left for you first. They explain what to do next and where important documents live.',
  },
];
