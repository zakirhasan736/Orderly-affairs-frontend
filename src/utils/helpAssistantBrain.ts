/**
 * Orderly Affairs help assistant — vault-aware replies for owners.
 */

import { VAULT_NAVIGATION } from '@/utils/vaultNavigation';

export const SUPPORT_EMAIL =
  (typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()) ||
  'support@orderlyaffairs.com';

export type HelpChatRole = 'user' | 'assistant' | 'system' | 'live_agent';

export type HelpChatAction =
  | { type: 'tour' }
  | { type: 'navigate'; sectionId: string; label: string }
  | { type: 'email' }
  | { type: 'live_agent' }
  | { type: 'fill_section'; sectionId: string; label: string }
  | { type: 'upload' };

export type HelpChatMessage = {
  id: string;
  role: HelpChatRole;
  text: string;
  actions?: HelpChatAction[];
  createdAt: number;
  /** When true, UI can reveal this message with a typing animation. */
  animate?: boolean;
  /** Server message id for live-agent sync. */
  remoteId?: string;
};

function sectionHints(): Array<{
  id: string;
  title: string;
  keywords: string[];
  blurb: string;
}> {
  return VAULT_NAVIGATION.map(section => ({
    id: section.id,
    title: section.title,
    keywords: [
      section.title.toLowerCase(),
      ...section.title.toLowerCase().split(/\s+/),
      section.id,
    ],
    blurb: sectionBlurb(section.id, section.title),
  }));
}

function sectionBlurb(id: string, title: string): string {
  const map: Record<string, string> = {
    '0': 'Start here for how the vault works and what to fill first.',
    '1': 'IDs, contacts, and vital details your loved ones will need first.',
    '2': 'Choose who can open your kit and when they get access.',
    '3': 'A letter that greets your next of kin and points them to the kit.',
    '4': 'Personal letters, audio, or video for specific people.',
    '5': 'Cars, titles, registration, and related documents.',
    '6': 'Home details, deeds, mortgage, and access notes.',
    '7': 'Life, auto, home, health, and other insurance policies.',
    '12': 'Checking, savings, and digital payment accounts.',
    '13': 'Logins, recovery notes, and online account access.',
    '14': 'Brokerage, retirement, and investment accounts.',
    '15': 'Providers, health coverage, and medical notes.',
    '20': 'Wills, legal papers, and where documents are stored.',
    '21': 'Funeral wishes, estate plans, and final instructions.',
  };
  return map[id] || `${title} keeps that part of your affairs organized for your family.`;
}

function findSection(query: string) {
  const q = query.toLowerCase();
  const hints = sectionHints();

  const byTitle = hints
    .filter(
      item =>
        q.includes(item.title.toLowerCase()) ||
        item.keywords.some(k => k.length > 3 && q.includes(k)),
    )
    .sort((a, b) => b.title.length - a.title.length);

  if (byTitle[0]) return byTitle[0];

  const aliases: Array<{ id: string; words: string[] }> = [
    { id: '1', words: ['vital', 'id', 'passport', 'contact', 'ssn'] },
    { id: '2', words: ['access', 'next of kin', 'nok', 'permission', 'trusted'] },
    { id: '3', words: ['letter', 'introductory'] },
    { id: '4', words: ['message', 'video message', 'audio', 'recording'] },
    { id: '5', words: ['vehicle', 'car', 'vin', 'registration', 'title'] },
    { id: '6', words: ['home', 'house', 'residence', 'mortgage', 'deed'] },
    { id: '7', words: ['insurance', 'policy', 'expire', 'premium'] },
    { id: '12', words: ['bank', 'checking', 'savings', 'venmo', 'paypal'] },
    { id: '13', words: ['password', 'login', 'online account', 'credential'] },
    { id: '14', words: ['invest', 'brokerage', '401', 'ira', 'retirement'] },
    { id: '15', words: ['health', 'medical', 'doctor', 'medicare'] },
    { id: '20', words: ['will', 'legal', 'document', 'attorney'] },
    { id: '21', words: ['estate', 'funeral', 'wish', 'burial'] },
  ];

  for (const alias of aliases) {
    if (alias.words.some(word => q.includes(word))) {
      return hints.find(item => item.id === alias.id) || null;
    }
  }

  return null;
}

export function createAssistantId() {
  return `help-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Delay before showing the AI reply — feels like typing. */
export function typingDelayMs(replyText: string): number {
  const base = 650;
  const perChar = Math.min(28, Math.max(12, Math.round(replyText.length * 0.9)));
  return Math.min(2200, base + perChar);
}

export function buildWelcomeMessage(): HelpChatMessage {
  return {
    id: createAssistantId(),
    role: 'assistant',
    text:
      "Hi — I'm your Orderly Affairs assistant. I know every vault section (access, letters, vehicles, insurance, banks, and more). I can explain an area, start a guided tour, help you fill fields from a document, or connect you to a live agent in our admin support inbox.",
    actions: [
      { type: 'tour' },
      { type: 'upload' },
      { type: 'email' },
      { type: 'live_agent' },
    ],
    createdAt: Date.now(),
  };
}

export function respondToHelpMessage(input: string): HelpChatMessage {
  const text = input.trim();
  const lower = text.toLowerCase();
  const section = findSection(lower);

  if (/\b(tour|walkthrough|show me around|guide me)\b/.test(lower)) {
    return {
      id: createAssistantId(),
      role: 'assistant',
      text:
        'I can walk you through the vault step by step. Tap Start tour and I’ll highlight each area so the layout feels clear.',
      actions: [{ type: 'tour' }],
      createdAt: Date.now(),
      animate: true,
    };
  }

  if (/\b(email|e-mail|mail us|contact form|write to)\b/.test(lower)) {
    return {
      id: createAssistantId(),
      role: 'assistant',
      text: `I can open an email form to our team at ${SUPPORT_EMAIL}. Prefer a live person in chat? I can connect you to the admin support inbox instead.`,
      actions: [{ type: 'email' }, { type: 'live_agent' }],
      createdAt: Date.now(),
      animate: true,
    };
  }

  if (
    /\b(live|human|person|agent|chat with someone|talk to|real person)\b/.test(
      lower,
    )
  ) {
    return {
      id: createAssistantId(),
      role: 'assistant',
      text:
        'I can connect you to a live Orderly Affairs agent. Your messages go to our admin support inbox, and their replies appear here in this chat.',
      actions: [{ type: 'live_agent' }, { type: 'email' }],
      createdAt: Date.now(),
      animate: true,
    };
  }

  if (/\b(upload|document|scan|pdf|photo|autofill)\b/.test(lower)) {
    return {
      id: createAssistantId(),
      role: 'assistant',
      text:
        'Use Upload a document on your dashboard. I read policies, IDs, and statements, then fill matching vault sections. You can review each card after it’s filled.',
      actions: [
        { type: 'upload' },
        ...(section
          ? [
              {
                type: 'navigate' as const,
                sectionId: section.id,
                label: section.title,
              },
            ]
          : []),
      ],
      createdAt: Date.now(),
      animate: true,
    };
  }

  if (
    section &&
    /\b(fill|complete|autofill|help me with|update|add|open)\b/.test(lower)
  ) {
    return {
      id: createAssistantId(),
      role: 'assistant',
      text: `${section.title} (section ${section.id}): ${section.blurb} I can open it now, or you can upload a document on the dashboard and I’ll fill what the file supports.`,
      actions: [
        { type: 'fill_section', sectionId: section.id, label: section.title },
        { type: 'upload' },
        { type: 'tour' },
      ],
      createdAt: Date.now(),
      animate: true,
    };
  }

  if (section) {
    return {
      id: createAssistantId(),
      role: 'assistant',
      text: `${section.title} is section ${section.id}. ${section.blurb} Would you like me to open it, help fill it, or start a full vault tour?`,
      actions: [
        { type: 'navigate', sectionId: section.id, label: section.title },
        { type: 'fill_section', sectionId: section.id, label: section.title },
        { type: 'tour' },
      ],
      createdAt: Date.now(),
      animate: true,
    };
  }

  if (/\b(dashboard|overview|home)\b/.test(lower)) {
    return {
      id: createAssistantId(),
      role: 'assistant',
      text:
        'Your dashboard shows due-soon reminders, Access / Letter / Messages shortcuts, document upload, continue cards, and recent activity. From there you jump into any vault section.',
      actions: [{ type: 'upload' }, { type: 'tour' }],
      createdAt: Date.now(),
      animate: true,
    };
  }

  if (/\b(help|support|stuck|confused|how|what can you)\b/.test(lower)) {
    return {
      id: createAssistantId(),
      role: 'assistant',
      text:
        'I can explain any section by name (try “insurance” or “vehicles”), run a guided tour, help fill from a document, email support, or connect a live agent who replies from our admin messaging area.',
      actions: [
        { type: 'tour' },
        { type: 'upload' },
        { type: 'email' },
        { type: 'live_agent' },
      ],
      createdAt: Date.now(),
      animate: true,
    };
  }

  return {
    id: createAssistantId(),
    role: 'assistant',
    text:
      'I didn’t catch a specific section. Try naming one — insurance, vehicles, banks, passwords, letter, access — or ask for a tour, document upload, email, or a live agent.',
    actions: [
      { type: 'tour' },
      { type: 'email' },
      { type: 'live_agent' },
      { type: 'upload' },
    ],
    createdAt: Date.now(),
    animate: true,
  };
}
