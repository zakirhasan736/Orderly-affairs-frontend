export enum SectionCategory {
  GENERAL = 'General',
  CORE = 'Core Information',
  ASSETS = 'Assets & Lifestyle',
  LEGACY = 'Legacy & Messages',
  FINANCIAL = 'Financial',
}

export interface Section {
  id: string;
  number: string;
  title: string;
  category: SectionCategory;
  icon?: string;
  progress: number;
  statusText: string;
  description: string;
  isCompleted?: boolean;
}
