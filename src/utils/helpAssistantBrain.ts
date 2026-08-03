/**
 * Orderly Affairs help assistant — vault-aware replies for owners.
 */

import { VAULT_NAVIGATION } from '@/utils/vaultNavigation';
import {
  getSectionProgress,
  listIncompleteFieldsForSection,
} from '@/utils/sectionCompletion';

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
  | { type: 'show_empty'; sectionId: string; label: string }
  | { type: 'upload' };

export type HelpChatMessage = {
  id: string;
  role: HelpChatRole;
  text: string;
  actions?: HelpChatAction[];
  suggestions?: string[];
  createdAt: number;
  /** When true, UI can reveal this message with a typing animation. */
  animate?: boolean;
  /** Server message id for live-agent sync. */
  remoteId?: string;
};

export type HelpVaultContext = {
  formData?: Record<string, unknown>;
  currentSectionId?: string | null;
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
    // Only multi-word / distinctive tokens — never split titles into "next"/"to"/"of".
    keywords: [section.title.toLowerCase()],
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
  return (
    map[id] ||
    `${title} keeps that part of your affairs organized for your family.`
  );
}

function hasWholeWord(haystack: string, needle: string): boolean {
  const word = needle.trim().toLowerCase();
  if (!word || word.length < 3) return false;
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(haystack);
}

function refersToCurrentSection(query: string): boolean {
  return /\b(this section|this page|current section|where i am|right here)\b/.test(
    query,
  );
}

/**
 * Resolve a vault section ONLY when the user named it.
 * Never invent a section from stop-words or the page they happen to be on.
 */
function findSection(query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  const hints = sectionHints();

  const byFullTitle = hints
    .filter(item => {
      const title = item.title.toLowerCase();
      return title.length >= 5 && q.includes(title);
    })
    .sort((a, b) => b.title.length - a.title.length);
  if (byFullTitle[0]) return byFullTitle[0];

  const aliases: Array<{ id: string; words: string[] }> = [
    { id: '1', words: ['vital information', 'vital', 'passport', 'ssn'] },
    {
      id: '2',
      words: [
        'access management',
        'next of kin',
        'next-of-kin',
        'nok people',
        'trusted people',
      ],
    },
    {
      id: '3',
      words: [
        'nok letter',
        'next of kin letter',
        'letter to next of kin',
        'introductory letter',
      ],
    },
    {
      id: '4',
      words: ['personal messages', 'video message', 'audio message'],
    },
    {
      id: '5',
      words: ['vehicles', 'vehicle', 'cars', 'car', 'vin', 'registration'],
    },
    {
      id: '6',
      words: ['main residence', 'residence', 'mortgage', 'deed', 'house', 'home'],
    },
    {
      id: '7',
      words: [
        'insurance',
        'insurances',
        'insurance policy',
        'insurance policies',
        'premium',
      ],
    },
    {
      id: '8',
      words: ['community', 'membership', 'memberships'],
    },
    { id: '9', words: ['charitable', 'charity', 'donation'] },
    { id: '10', words: ['education', 'accomplishments', 'awards'] },
    { id: '11', words: ['military', 'service record'] },
    {
      id: '12',
      words: ['banking', 'bank', 'banks', 'checking', 'savings', 'venmo', 'paypal'],
    },
    {
      id: '13',
      words: ['passwords', 'password', 'online accounts', 'credentials'],
    },
    { id: '14', words: ['investment', 'investments', 'brokerage', 'retirement'] },
    { id: '15', words: ['health information', 'medical', 'medicare'] },
    { id: '16', words: ['credit cards', 'credit card', 'debt'] },
    {
      id: '17',
      words: [
        'treasured items',
        'family treasures',
        'pets',
        'pet',
        'sentimental',
      ],
    },
    { id: '18', words: ['employment', 'business', 'employer'] },
    { id: '19', words: ['assets', 'valuables', 'jewelry'] },
    {
      id: '20',
      words: [
        'legal documents',
        'legal document',
        'last will',
        'my will',
        'attorney',
        'lawyer',
      ],
    },
    { id: '21', words: ['estate planning', 'final wishes', 'funeral', 'burial'] },
  ];

  // Longer phrases first so "next of kin letter" beats "next of kin".
  const ranked = aliases
    .flatMap(alias =>
      alias.words.map(word => ({ id: alias.id, word, score: word.length })),
    )
    .sort((a, b) => b.score - a.score);

  for (const alias of ranked) {
    const hit = alias.word.includes(' ')
      ? q.includes(alias.word)
      : hasWholeWord(q, alias.word);
    if (!hit) continue;
    // Don't treat bare "home" as residence when user said "home page/overview".
    if (
      alias.word === 'home' &&
      /\b(home page|overview|dashboard)\b/.test(q)
    ) {
      continue;
    }
    // Bare "policy/policies" in renewal questions → insurance is OK via renewal handler.
    return hints.find(item => item.id === alias.id) || null;
  }

  return null;
}

function resolveSectionForQuestion(
  query: string,
  ctx?: HelpVaultContext,
): ReturnType<typeof findSection> {
  const explicit = findSection(query);
  if (explicit) return explicit;
  if (
    refersToCurrentSection(query) &&
    ctx?.currentSectionId &&
    /^\d+$/.test(ctx.currentSectionId)
  ) {
    return (
      sectionHints().find(item => item.id === ctx.currentSectionId) || null
    );
  }
  return null;
}

function isRenewalIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    /\brenew(?:al|als|ing)?\b/.test(lower) ||
    /\bexpir(?:e|es|ed|ing|y|ation)?\b/.test(lower) ||
    /\b(due date|days left|how many days|upcoming due|coming due)\b/.test(
      lower,
    ) ||
    /\bwhen\b.{0,48}\b(renew|expir|due|policy|registration|insurance)\b/.test(
      lower,
    )
  );
}

function isEmptyIntent(text: string): boolean {
  return /\b(empty|missing|blank|incomplete|still need|how many field|what's left|what is left|whats left|gaps|unfilled)\b/.test(
    text,
  );
}

function isUploadIntent(text: string): boolean {
  // Do NOT match bare "document" — that collides with Legal Documents, etc.
  return /\b(upload|uploader|scan|scanned|pdf|photo|autofill|auto-fill|drag\s*and\s*drop|drop a file)\b/.test(
    text,
  );
}

function isFillOrOpenIntent(text: string): boolean {
  return /\b(fill|complete|help me with|help me fill|update|add|open|go to|take me to|show me|put|enter)\b/.test(
    text,
  );
}

function defaultEmptySectionId(query: string): string {
  if (/\binsurance|policy\b/.test(query)) return '7';
  if (/\bhome|house|residence\b/.test(query)) return '6';
  if (/\bbank|checking|savings\b/.test(query)) return '12';
  return '5';
}

function asPlain(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }
  if (typeof value === 'object' && value !== null && 'text' in value) {
    return asPlain((value as { text?: unknown }).text);
  }
  return '';
}

function parseFlexibleDate(raw: string): Date | null {
  const text = raw.trim();
  if (!text) return null;
  const iso = Date.parse(text);
  if (!Number.isNaN(iso)) return new Date(iso);
  const m = text.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{2,4})$/);
  if (m) {
    const month = Number(m[1]) - 1;
    const day = Number(m[2]);
    let year = Number(m[3]);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

type RenewalHit = {
  sectionId: string;
  label: string;
  field: string;
  date: Date;
  days: number;
};

function collectRenewals(formData?: Record<string, unknown>): RenewalHit[] {
  if (!formData || typeof formData !== 'object') return [];
  try {
  const dateKeys =
    /(expir|renew|due|valid_until|valid_through|registration_expiry|policy_expiry|maturity|deadline|next_payment|next_due)/i;
  const hits: RenewalHit[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const visit = (
    sectionId: string,
    label: string,
    record: Record<string, unknown>,
  ) => {
    Object.entries(record).forEach(([key, value]) => {
      if (!dateKeys.test(key)) return;
      const parsed = parseFlexibleDate(asPlain(value));
      if (!parsed) return;
      const days = Math.round(
        (parsed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      hits.push({
        sectionId,
        label,
        field: key.replace(/_/g, ' '),
        date: parsed,
        days,
      });
    });
  };

  Object.entries(formData).forEach(([sectionId, raw]) => {
    if (!/^\d+$/.test(sectionId) || !raw || typeof raw !== 'object') return;
    const sectionLabel =
      VAULT_NAVIGATION.find(item => item.id === sectionId)?.title ||
      `Section ${sectionId}`;
    const data = raw as Record<string, unknown>;
    Object.values(data).forEach(bucket => {
      if (Array.isArray(bucket)) {
        bucket.forEach((item, index) => {
          if (!item || typeof item !== 'object') return;
          const titleBits = [
            'make',
            'model',
            'policy_company',
            'insurance_company',
            'company_name',
            'policy_type',
            'carrier',
          ]
            .map(k => asPlain((item as Record<string, unknown>)[k]))
            .filter(Boolean)
            .join(' ');
          visit(
            sectionId,
            titleBits
              ? `${sectionLabel} · ${titleBits}`
              : `${sectionLabel} #${index + 1}`,
            item as Record<string, unknown>,
          );
        });
      } else if (bucket && typeof bucket === 'object') {
        visit(sectionId, sectionLabel, bucket as Record<string, unknown>);
      }
    });
  });

  return hits.sort((a, b) => a.days - b.days);
  } catch {
    return [];
  }
}

function emptyFieldSummary(
  sectionId: string,
  formData?: Record<string, unknown>,
): {
  filled: number;
  total: number;
  remaining: number;
  emptyLabels: string[];
} | null {
  if (!formData || typeof formData !== 'object') return null;
  try {
    const sectionData = formData[sectionId] as
      | Record<string, unknown>
      | undefined;
    const progress = getSectionProgress(sectionId, { formData });
    const empties = listIncompleteFieldsForSection(sectionId, sectionData);
    const remaining = Math.max(0, progress.total - progress.filled);
    return {
      filled: progress.filled,
      total: progress.total,
      remaining,
      emptyLabels: empties.slice(0, 12).map(item => item.label || item.key),
    };
  } catch {
    return null;
  }
}

function withFollowUps(
  message: Omit<HelpChatMessage, 'id' | 'createdAt'> & {
    id?: string;
    createdAt?: number;
  },
  suggestions: string[],
): HelpChatMessage {
  return {
    id: message.id || createAssistantId(),
    createdAt: message.createdAt || Date.now(),
    role: message.role,
    text: message.text,
    actions: message.actions,
    suggestions: suggestions.slice(0, 6),
    animate: message.animate ?? true,
    remoteId: message.remoteId,
  };
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

export function buildWelcomeMessage(
  ctx?: HelpVaultContext,
): HelpChatMessage {
  const section =
    ctx?.currentSectionId && /^\d+$/.test(ctx.currentSectionId)
      ? sectionHints().find(item => item.id === ctx.currentSectionId)
      : null;
  const here = section
    ? `\n\nI see you’re in ${section.title} right now — happy to help with that area specifically.`
    : '';
  return withFollowUps(
    {
      role: 'assistant',
      text:
        `Hi there — thanks for reaching out.\n\nI’m your Orderly Affairs assistant. Think of me like a helpful support desk inside your vault: I can point you to the right section, check what’s still empty after an upload, look up renewals, draft next steps, or connect you by email.${here}\n\nWhat can I help you with today?`,
      actions: [
        { type: 'tour' },
        { type: 'upload' },
        { type: 'email' },
      ],
      animate: false,
    },
    [
      section ? `What's empty in ${section.title}?` : 'What is still empty in Vehicles?',
      'When is my next insurance renewal?',
      'Help me fill vehicles',
      'Email support',
    ],
  );
}

/** Suggestion chips that follow the latest user/assistant topic. */
export function followUpSuggestions(
  lastUserText: string,
  lastAssistant?: HelpChatMessage | null,
): string[] {
  if (lastAssistant?.suggestions?.length) {
    return lastAssistant.suggestions;
  }
  const lower = lastUserText.toLowerCase();
  const section = findSection(lower);
  if (section) {
    return [
      `Open ${section.title}`,
      `What's empty in ${section.title}?`,
      `Help me fill ${section.title}`,
      'Upload a document for this',
      'When is my next renewal?',
      'Email support',
    ];
  }
  if (/\b(renew|expir|due)\b/.test(lower)) {
    return [
      'Open insurance section',
      'Open vehicles section',
      'Open home section',
      "What's empty in insurance?",
      'Email support',
    ];
  }
  if (/\b(empty|missing|blank|incomplete)\b/.test(lower)) {
    return [
      'Open Vehicles',
      'Open Insurance',
      'Help me fill that section',
      'Upload a document',
    ];
  }
  return [
    'Start a tour',
    'Help with insurance',
    'Fill vehicle section',
    'What is still empty?',
    'Email support',
  ];
}

export function respondToHelpMessage(
  input: string,
  ctx?: HelpVaultContext,
): HelpChatMessage {
  try {
    return respondToHelpMessageUnsafe(input, ctx);
  } catch (err) {
    console.error('[helpAssistant] reply failed', err);
    return withFollowUps(
      {
        role: 'assistant',
        text:
          'Something went wrong while looking that up. Try again, name a section (Vehicles, Insurance, Home), or email support.',
        actions: [
          { type: 'email' },
          { type: 'tour' },
        ],
      },
      ['Email support', 'Open Vehicles', 'Start a tour'],
    );
  }
}

function respondToHelpMessageUnsafe(
  input: string,
  ctx?: HelpVaultContext,
): HelpChatMessage {
  const text = input.trim();
  const lower = text.toLowerCase();
  // Intent first — never let a guessed section hijack the answer.
  const renewalQuestion = isRenewalIntent(lower);
  const emptyQuestion = isEmptyIntent(lower);
  const uploadQuestion = isUploadIntent(lower);
  const fillOrOpenQuestion = isFillOrOpenIntent(lower);
  const section = resolveSectionForQuestion(lower, ctx);

  if (
    /^(hi|hello|hey|hiya|howdy|good\s+(morning|afternoon|evening))\b/.test(
      lower,
    )
  ) {
    return withFollowUps(
      {
        role: 'assistant',
        text:
          'Hello! Nice to hear from you.\n\nI can help you find any vault area, see which fields are still empty, check upcoming renewals, guide a document upload, or email our team.\n\nTap a suggestion below, or just tell me what you need — like “what’s empty in Vehicles?”',
        actions: [{ type: 'tour' }, { type: 'upload' }, { type: 'email' }],
      },
      [
        "What's empty in Vehicles?",
        'When is my next insurance renewal?',
        'Help me fill insurance',
        'Email support',
      ],
    );
  }

  if (
    /\b((live|human)\s+agent|live\s+chat|real\s+person|chat with (a )?human|talk to (a )?(live |human )?agent)\b/.test(
      lower,
    )
  ) {
    return withFollowUps(
      {
        role: 'assistant',
        text:
          'Live agent chat is coming soon.\n\nFor now you can use AI assistance here in this chat, or Email support — both are available. We’ll notify you when live agents are ready.',
        actions: [{ type: 'email' }, { type: 'tour' }],
      },
      ['Email support', 'What can you help with?', 'Start a tour'],
    );
  }

  if (/\b(email|e-mail|mail us|contact form|write to support)\b/.test(lower)) {
    return withFollowUps(
      {
        role: 'assistant',
        text: `Of course. You can write to our team at ${SUPPORT_EMAIL}.\n\nPrefer to stay in the app? Use the Email tab — we route it to support. AI chat is also available anytime for vault questions.`,
        actions: [{ type: 'email' }],
      },
      ['Email support', 'Ask about Vehicles', 'Start a tour'],
    );
  }

  if (/\b(tour|walkthrough|show me around|guide me)\b/.test(lower)) {
    return withFollowUps(
      {
        role: 'assistant',
        text:
          'Absolutely — I can walk you through the vault like a short guided tour.\n\nTap Start tour and I’ll highlight each area so the layout feels clear. You can pause anytime and come back here with questions.',
        actions: [{ type: 'tour' }],
      },
      ['Upload a document', 'Open Vehicles', 'Email support'],
    );
  }

  if (renewalQuestion) {
    const renewals = collectRenewals(ctx?.formData).filter(item => {
      if (/\bvehicle|car|auto|registration\b/.test(lower)) {
        return item.sectionId === '5' || item.sectionId === '7';
      }
      if (/\bhome|house|residence\b/.test(lower)) {
        return item.sectionId === '6' || item.sectionId === '7';
      }
      if (/\binsurance|policy\b/.test(lower)) return item.sectionId === '7';
      return true;
    });
    if (!renewals.length) {
      return withFollowUps(
        {
          role: 'assistant',
          text:
            'I looked through your vault and don’t see renewal or expiry dates saved yet.\n\nOnce those are in Vehicles, Home, or Insurance (or you upload the documents), I can tell you exactly how many days you have left. Want me to open Insurance or Vehicles so we can add them?',
          actions: [
            { type: 'navigate', sectionId: '7', label: 'Insurance' },
            { type: 'navigate', sectionId: '5', label: 'Vehicles' },
            { type: 'upload' },
          ],
        },
        ['Open Insurance', 'Open Vehicles', 'Upload a document'],
      );
    }
    const lines = renewals.slice(0, 5).map(item => {
      const when =
        item.days < 0
          ? `${Math.abs(item.days)} day(s) overdue`
          : item.days === 0
            ? 'due today'
            : `${item.days} day(s) left`;
      return `• ${item.label} — ${item.field}: ${item.date.toLocaleDateString()} (${when})`;
    });
    const first = renewals[0];
    const firstTitle =
      VAULT_NAVIGATION.find(s => s.id === first.sectionId)?.title ||
      first.label;
    return withFollowUps(
      {
        role: 'assistant',
        text: `Here’s your next renewals / expiries from the vault:\n\n${lines.join('\n')}\n\nI can open that section if you’d like to update anything or attach a newer document.`,
        actions: [
          {
            type: 'navigate',
            sectionId: first.sectionId,
            label: firstTitle,
          },
          {
            type: 'show_empty',
            sectionId: first.sectionId,
            label: firstTitle,
          },
        ],
      },
      [
        `Open ${firstTitle}`,
        "What's empty there?",
        'Upload a renewal document',
        'Email support',
      ],
    );
  }

  if (emptyQuestion) {
    const target =
      section ||
      sectionHints().find(item => item.id === defaultEmptySectionId(lower)) ||
      null;
    // If they didn't name a section and didn't say "this section", ask first.
    if (!section && !refersToCurrentSection(lower)) {
      // defaultEmptySectionId still gives Vehicles when they said nothing specific —
      // only auto-pick when they named a domain (insurance/home/bank/vehicles words).
      const namedDomain =
        /\b(vehicle|vehicles|car|cars|insurance|policy|home|house|residence|bank|banks)\b/.test(
          lower,
        );
      if (!namedDomain) {
        return withFollowUps(
          {
            role: 'assistant',
            text:
              'Sure — which area should I check for empty fields?\n\nVehicles, Insurance, Home, or Banks are common. Name the section and I’ll list only the blanks that are actually empty.',
          },
          [
            "What's empty in Vehicles?",
            "What's empty in Insurance?",
            "What's empty in Home?",
          ],
        );
      }
    }
    if (!target) {
      return withFollowUps(
        {
          role: 'assistant',
          text:
            'Sure — which area should I check?\n\nVehicles, Insurance, Home, or Banks are common. Tell me the section and I’ll list empty fields and open a fill popup.',
        },
        ['Vehicles empty fields', 'Insurance empty fields', 'Home empty fields'],
      );
    }
    const summary = emptyFieldSummary(target.id, ctx?.formData);
    if (!summary || summary.total === 0) {
      return withFollowUps(
        {
          role: 'assistant',
          text: `I checked ${target.title}, but there isn’t enough structured data to count fields yet.\n\nLet’s open the section (or upload a document) and I can help fill from there.`,
          actions: [
            { type: 'navigate', sectionId: target.id, label: target.title },
            { type: 'fill_section', sectionId: target.id, label: target.title },
            { type: 'upload' },
          ],
        },
        [`Open ${target.title}`, 'Upload a document', 'Email support'],
      );
    }
    const remaining = summary.remaining;
    const list =
      remaining === 0
        ? '\n\nEverything countable in this section looks filled — nice work.'
        : summary.emptyLabels.length > 0
          ? `\n\nStill empty (${remaining}):\n${summary.emptyLabels
              .map(l => `• ${l}`)
              .join('\n')}${
              remaining > summary.emptyLabels.length
                ? `\n• …and ${remaining - summary.emptyLabels.length} more`
                : ''
            }`
          : `\n\n${remaining} field${remaining === 1 ? '' : 's'} still empty.`;
    return withFollowUps(
      {
        role: 'assistant',
        text: `Quick status for ${target.title}:\n\n${summary.filled} of ${summary.total} fields filled · ${remaining} still empty.${list}\n\nTap Review empty fields to fill them in a popup — or tell me the missing values here and I’ll guide you where they go.`,
        actions: [
          { type: 'show_empty', sectionId: target.id, label: target.title },
          { type: 'navigate', sectionId: target.id, label: target.title },
          { type: 'upload' },
        ],
      },
      [
        `Open ${target.title}`,
        'Upload a document to fill gaps',
        'When is my next renewal?',
        'Email support',
      ],
    );
  }

  if (uploadQuestion) {
    return withFollowUps(
      {
        role: 'assistant',
        text:
          'Great idea — uploading a document is often the fastest path.\n\nUse Upload on Overview (or inside a section). I’ll read policies, IDs, and statements, then place details on the matching cards.\n\nAfterward, ask “what’s still empty in Vehicles?” and I’ll open a fill popup for anything left blank.',
        actions: [
          { type: 'upload' },
          ...(section
            ? [
                {
                  type: 'navigate' as const,
                  sectionId: section.id,
                  label: section.title,
                },
                {
                  type: 'show_empty' as const,
                  sectionId: section.id,
                  label: section.title,
                },
              ]
            : []),
        ],
      },
      section
        ? [
            `What's empty in ${section.title}?`,
            `Open ${section.title}`,
            'Email support',
          ]
        : ['Open Vehicles', 'Open Insurance', "What's still empty?"],
    );
  }

  if (section && fillOrOpenQuestion) {
    return withFollowUps(
      {
        role: 'assistant',
        text: `Got it — ${section.title} is a great place to focus.\n\n${section.blurb}\n\nI can open it now, show what’s empty in a fill popup, or take you to document upload so we can autofill from a file.`,
        actions: [
          { type: 'fill_section', sectionId: section.id, label: section.title },
          { type: 'show_empty', sectionId: section.id, label: section.title },
          { type: 'upload' },
          { type: 'tour' },
        ],
      },
      [
        `What's empty in ${section.title}?`,
        `Open ${section.title}`,
        'Upload a document',
        'Email support',
      ],
    );
  }

  // Named section info — only when the user actually named it (no silent page fallback).
  if (section && findSection(lower)) {
    return withFollowUps(
      {
        role: 'assistant',
        text: `${section.title} — that’s section ${section.id} in your vault.\n\n${section.blurb}\n\nWould you like me to open it, check empty fields, help you fill it, or start a short vault tour?`,
        actions: [
          { type: 'navigate', sectionId: section.id, label: section.title },
          { type: 'show_empty', sectionId: section.id, label: section.title },
          { type: 'fill_section', sectionId: section.id, label: section.title },
          { type: 'tour' },
        ],
      },
      [
        `What's empty in ${section.title}?`,
        `Help me fill ${section.title}`,
        'Upload a document',
        'When is my next renewal?',
      ],
    );
  }

  if (/\b(dashboard|overview|home page)\b/.test(lower)) {
    return withFollowUps(
      {
        role: 'assistant',
        text:
          'Your Overview is the home base — due-soon reminders, Access / Letter / Messages shortcuts, document upload, continue cards, and recent activity.\n\nFrom there you can jump into any vault section. Want me to focus upload, or start a tour?',
        actions: [{ type: 'upload' }, { type: 'tour' }],
      },
      ['Upload a document', 'Open Vehicles', 'Start a tour'],
    );
  }

  if (/\b(help|support|stuck|confused|what can you)\b/.test(lower)) {
    return withFollowUps(
      {
        role: 'assistant',
        text:
          'You’re in the right place.\n\nI can explain any section by name (try “insurance” or “vehicles”), check empty fields after autofill, spot renewals, run a guided tour, help fill from a document, or email support.\n\nWhat would you like to tackle first?',
        actions: [{ type: 'tour' }, { type: 'upload' }, { type: 'email' }],
      },
      [
        "What's empty in Vehicles?",
        'When is my next renewal?',
        'Email support',
      ],
    );
  }

  return withFollowUps(
    {
      role: 'assistant',
      text:
        'Thanks for the note — I want to make sure I point you to the right place.\n\nTry naming a section (insurance, vehicles, banks, passwords), or ask about empty fields, renewals, a tour, document upload, or email support.',
      actions: [{ type: 'tour' }, { type: 'email' }, { type: 'upload' }],
    },
    [
      'Open Vehicles',
      'Open Insurance',
      "What's still empty?",
      'When is my next renewal?',
      'Email support',
    ],
  );
}
