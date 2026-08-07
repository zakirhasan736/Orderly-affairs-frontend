/**
 * Scan vault form data for expiry / renewal dates used by overview alerts
 * and reminder scheduling context on the client.
 */

export type OverviewExpiryAlert = {
  id: string;
  sectionId: string;
  fieldKey: string;
  label: string;
  expiryIso: string;
  daysUntil: number;
  tone: 'critical' | 'warn' | 'ok' | 'info';
  text: string;
  /** True when this item is in the email reminder window (10 / 5 / 1 / 0 days or overdue). */
  emailDue: boolean;
};

/** Only surface items this close (or overdue) in the overview reminders strip. */
export const OVERVIEW_URGENT_WITHIN_DAYS = 14;

/** Matches vault reminder email schedule: 10, 5, 1 days before, and on the day. */
export const OVERVIEW_EMAIL_MILESTONE_DAYS = [10, 5, 1, 0] as const;

export function isOverviewEmailMilestone(daysUntil: number): boolean {
  if (daysUntil < 0) return true; // overdue — still offer email
  return (OVERVIEW_EMAIL_MILESTONE_DAYS as readonly number[]).includes(
    daysUntil,
  );
}

export function isOverviewUrgentAlert(daysUntil: number): boolean {
  return daysUntil < 0 || daysUntil <= OVERVIEW_URGENT_WITHIN_DAYS;
}

const EXPIRY_KEY_RE =
  /(expir|expiration|expiry|renewal_date|policy_expiry|registration_expiry|passport_expiry|license_expiry|drivers_license_expiry|valid_through|valid_until|end_date|lease_end_date|maturity_date|loan_maturity|mortgage_maturity|tax_filing_deadline|property_tax_due|filing_deadline|next_payment_due_date|next_due_date|cd_maturity|warranty_expiry|subscription_renewal|account_expiry)/i;

/** Signed / historical dates — never treat as renewals or expiries. */
const NEVER_EXPIRY_KEY_RE =
  /(will_date|birth|dob|signed|executed|created|updated|start_date|hire_date|service_dates|employment_dates|inventory_date|important_dates|wedding|anniversary)/i;

/** Sections with no policy/registration-style renewals in the vault model. */
const NEVER_EXPIRY_SECTIONS = new Set(['0', '2', '3', '4', '21']);

const SKIP_KEY_RE = /(requirement|instruction|header|note|location|document|upload)/i;
const SKIP_EXACT_KEYS = new Set(['payment_due_date']);

const FIELD_LABELS: Record<string, string> = {
  policy_expiry: 'Insurance policy',
  registration_expiry: 'Vehicle registration',
  passport_expiry: 'Passport',
  expiration_date: 'Document',
  expiry_date: 'Expiry date',
  drivers_license_expiry: "Driver's license",
  license_expiry: 'License',
  mortgage_maturity_date: 'Mortgage / home loan',
  loan_maturity_date: 'Loan maturity',
  property_tax_due_date: 'Property tax',
  tax_filing_deadline: 'Tax filing',
  lease_end_date: 'Lease end',
  next_payment_due_date: 'Next payment due',
  renewal_date: 'Membership renewal',
  cd_maturity_date: 'CD / account maturity',
  last_statement_date: 'Last bank statement',
  subscription_renewal_date: 'Subscription renewal',
  account_expiry_date: 'Account / access expiry',
};

function asText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    for (const key of ['text', 'label', 'name', 'value', 'date']) {
      const nested = record[key];
      if (typeof nested === 'string' && nested.trim()) return nested.trim();
    }
  }
  return '';
}

export function parseFlexibleDate(raw: string | null | undefined): Date | null {
  const text = (raw || '').trim();
  if (!text) return null;

  try {
    if (text.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(text)) {
      const d = new Date(text);
      if (!Number.isNaN(d.getTime())) return d;
    }
  } catch {
    // continue
  }

  const patterns = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    let month = Number(match[1]);
    let day = Number(match[2]);
    let year = Number(match[3]);
    if (year < 100) year += 2000;
    // Prefer US m/d/y; if month > 12 swap (d/m/y)
    if (month > 12 && day <= 12) {
      const tmp = month;
      month = day;
      day = tmp;
    }
    const d = new Date(year, month - 1, day);
    if (!Number.isNaN(d.getTime())) return d;
  }

  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) return new Date(parsed);
  return null;
}

/**
 * Expiry reminders only make sense for renewals in a modern planning window.
 * Reject OCR/AI junk (e.g. year 899 from a sample will) and ancient signed dates.
 */
export function isPlausibleExpiryDate(
  date: Date,
  today: Date = new Date(),
): boolean {
  if (Number.isNaN(date.getTime())) return false;
  const year = date.getFullYear();
  const minYear = today.getFullYear() - 5;
  const maxYear = today.getFullYear() + 40;
  if (year < minYear || year > maxYear) return false;
  const days = daysBetween(today, date);
  // More than ~5 years overdue is almost always bad extraction, not a real reminder.
  if (days < -(365 * 5 + 2)) return false;
  return true;
}

function daysBetween(from: Date, to: Date) {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
}

function formatDaysUntil(days: number): string {
  if (days < 0) {
    const ago = Math.abs(days);
    if (ago === 1) return 'expired yesterday';
    if (ago < 30) return `expired ${ago} days ago`;
    if (ago < 365) return `expired ${Math.round(ago / 30)} months ago`;
    return `expired ${Math.round(ago / 365)} years ago`;
  }
  if (days === 0) return 'expires today';
  if (days === 1) return 'expires tomorrow';
  if (days < 14) return `expires in ${days} days`;
  if (days < 60) return `expires in ${Math.round(days / 7)} weeks`;
  if (days < 370) return `expires in ${Math.round(days / 30)} months`;
  return `expires in ${Math.round(days / 365)} years`;
}

function humanLabel(fieldKey: string, sectionId: string): string {
  if (FIELD_LABELS[fieldKey]) return FIELD_LABELS[fieldKey];
  if (sectionId === '7') return 'Insurance';
  if (sectionId === '5') return 'Vehicle registration';
  if (sectionId === '6') return 'Home / mortgage';
  if (sectionId === '16') return 'Loan / debt';
  if (sectionId === '19') return 'Property';
  if (sectionId === '20') return 'Tax / legal deadline';
  if (sectionId === '8') return 'Membership';
  if (sectionId === '21') return 'Estate document';
  if (sectionId === '1') return 'Vital record';
  return fieldKey.replace(/_/g, ' ');
}

function toneForDays(days: number): OverviewExpiryAlert['tone'] {
  if (days < 0) return 'critical';
  if (days <= 10) return 'critical';
  if (days <= 45) return 'warn';
  if (days <= 120) return 'info';
  return 'ok';
}

/** Pull vehicle / insurance name from the same card as the expiry field. */
function itemContextLabel(
  record: Record<string, unknown>,
  sectionId: string,
  fieldKey: string,
  path: string[],
): string {
  const arrayIndex = [...path]
    .reverse()
    .find(part => /^\d+$/.test(part));

  if (sectionId === '5' || fieldKey === 'registration_expiry') {
    const year = asText(record.year);
    const make = asText(record.make);
    const model = asText(record.model);
    const color = asText(record.color);
    const plate = asText(record.license_plate);
    const named = [year, make, model].filter(Boolean).join(' ');
    if (named) return named;
    if (color && plate) return `${color} · ${plate}`;
    if (plate) return `Plate ${plate}`;
    if (arrayIndex != null) return `Vehicle ${Number(arrayIndex) + 1}`;
    return '';
  }

  if (sectionId === '7' || fieldKey === 'policy_expiry') {
    const type = asText(record.policy_type);
    const other = asText(record.policy_type_other);
    const company = asText(record.policy_company);
    const typeLabel =
      type.toLowerCase() === 'other' && other
        ? other
        : type || (arrayIndex != null ? `Policy ${Number(arrayIndex) + 1}` : '');
    if (typeLabel && company) return `${typeLabel} · ${company}`;
    if (typeLabel) return typeLabel;
    if (company) return company;
    if (arrayIndex != null) return `Policy ${Number(arrayIndex) + 1}`;
    return '';
  }

  const title =
    asText(record.title) ||
    asText(record.name) ||
    asText(record.label) ||
    asText(record.account_name);
  return title;
}

function buildAlertText(opts: {
  label: string;
  context: string;
  days: number;
  renewStyle: boolean;
  date: Date;
}): string {
  const { label, context, days, renewStyle, date } = opts;
  const subject = context ? `${label} (${context})` : label;
  void date;

  if (renewStyle) {
    if (days < 0) return `${subject} overdue (${Math.abs(days)}d).`;
    if (days === 0) return `${subject} due today.`;
    if (days === 1) return `${subject} due tomorrow.`;
    if (days < 60) return `${subject} due in ${days} days.`;
    return `${subject} due in ${Math.round(days / 30)} months.`;
  }

  return `${subject} ${formatDaysUntil(days)}.`;
}

function walk(
  value: unknown,
  sectionId: string,
  path: string[],
  out: OverviewExpiryAlert[],
  today: Date,
  withinDays: number,
) {
  if (value == null) return;
  if (NEVER_EXPIRY_SECTIONS.has(sectionId)) return;

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      walk(
        item,
        sectionId,
        [...path, String(index)],
        out,
        today,
        withinDays,
      ),
    );
    return;
  }

  if (typeof value !== 'object') return;

  const record = value as Record<string, unknown>;
  Object.entries(record).forEach(([key, nested]) => {
    if (SKIP_EXACT_KEYS.has(key) || NEVER_EXPIRY_KEY_RE.test(key)) {
      if (nested && typeof nested === 'object') {
        walk(nested, sectionId, [...path, key], out, today, withinDays);
      }
      return;
    }

    if (SKIP_KEY_RE.test(key) && !EXPIRY_KEY_RE.test(key)) {
      if (nested && typeof nested === 'object') {
        walk(nested, sectionId, [...path, key], out, today, withinDays);
      }
      return;
    }

    if (EXPIRY_KEY_RE.test(key)) {
      const text = asText(nested);
      const date = parseFlexibleDate(text);
      if (date && isPlausibleExpiryDate(date, today)) {
        const days = daysBetween(today, date);
        const baseLabel = humanLabel(key, sectionId);
        const context = itemContextLabel(record, sectionId, key, path);
        const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const renewStyle =
          sectionId === '7' ||
          /policy_expiry|renew|maturity|deadline|tax_|mortgage_|loan_|lease_end|next_payment|next_due/i.test(
            key,
          );

        // Overdue always included; future dates only within the window.
        if (days >= 0 && days > withinDays) {
          // continue to recurse
        } else {
          out.push({
            id: `${sectionId}:${path.join('.')}.${key}:${iso}:${context || 'item'}`,
            sectionId,
            fieldKey: key,
            label: context ? `${baseLabel} · ${context}` : baseLabel,
            expiryIso: iso,
            daysUntil: days,
            tone: toneForDays(days),
            emailDue: isOverviewEmailMilestone(days),
            text: buildAlertText({
              label: baseLabel,
              context,
              days,
              renewStyle,
              date,
            }),
          });
        }
      }
    }

    if (nested && typeof nested === 'object') {
      walk(nested, sectionId, [...path, key], out, today, withinDays);
    }
  });
}

/** Collapse identical / near-identical alert lines so the strip stays short. */
export function dedupeOverviewExpiryAlerts(
  alerts: OverviewExpiryAlert[],
): OverviewExpiryAlert[] {
  const seenIds = new Set<string>();
  const seenFingerprints = new Set<string>();
  const out: OverviewExpiryAlert[] = [];

  for (const alert of alerts) {
    if (seenIds.has(alert.id)) continue;

    const fingerprint = [
      alert.sectionId,
      alert.fieldKey,
      alert.expiryIso,
      alert.label.toLowerCase().replace(/\s+/g, ' ').trim(),
      alert.text.toLowerCase().replace(/\s+/g, ' ').trim(),
    ].join('|');

    const textOnly = alert.text.toLowerCase().replace(/\s+/g, ' ').trim();

    if (seenFingerprints.has(fingerprint) || seenFingerprints.has(`text:${textOnly}`)) {
      continue;
    }

    seenIds.add(alert.id);
    seenFingerprints.add(fingerprint);
    seenFingerprints.add(`text:${textOnly}`);
    out.push(alert);
  }

  return out;
}

/** Default horizon for overview strip / notifications (overdue + next year). */
export const OVERVIEW_REMINDER_HORIZON_DAYS = 365;

export function collectOverviewExpiryAlerts(
  formData: Record<string, unknown> | null | undefined,
  options?: { limit?: number; withinDays?: number },
): OverviewExpiryAlert[] {
  if (!formData || typeof formData !== 'object') return [];

  const today = new Date();
  const alerts: OverviewExpiryAlert[] = [];
  const withinDays = options?.withinDays ?? OVERVIEW_REMINDER_HORIZON_DAYS;
  const limit = options?.limit ?? 40;

  Object.entries(formData).forEach(([sectionId, data]) => {
    if (!/^\d+$/.test(sectionId)) return;
    walk(data, sectionId, [], alerts, today, withinDays);
  });

  const list = dedupeOverviewExpiryAlerts(
    alerts.sort((a, b) => a.daysUntil - b.daysUntil),
  );

  return list.slice(0, Math.max(1, limit));
}

export function buildExpiryReminderMailto(
  alert: OverviewExpiryAlert,
  ownerEmail?: string | null,
): string {
  const subject = encodeURIComponent(`Reminder: ${alert.label}`);
  const when =
    alert.daysUntil < 0
      ? `overdue by ${Math.abs(alert.daysUntil)} day(s)`
      : alert.daysUntil === 0
        ? 'due today'
        : `due in ${alert.daysUntil} day(s)`;
  const body = encodeURIComponent(
    [
      `Orderly Affairs reminder`,
      ``,
      alert.text,
      ``,
      `Expiry / due date: ${alert.expiryIso} (${when})`,
      `Vault section: ${alert.sectionId}`,
      ``,
      `Please renew or update this item in your vault.`,
    ].join('\n'),
  );
  const to = ownerEmail?.trim() || '';
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

const EMAIL_PROMPT_STORAGE_KEY = 'orderly.overview.expiryEmailPrompts.v1';

export function wasExpiryEmailPromptShown(
  alertId: string,
  daysUntil: number,
): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(EMAIL_PROMPT_STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    return map[`${alertId}@${daysUntil}`] === 1;
  } catch {
    return false;
  }
}

export function markExpiryEmailPromptShown(
  alertId: string,
  daysUntil: number,
): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(EMAIL_PROMPT_STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    map[`${alertId}@${daysUntil}`] = 1;
    window.localStorage.setItem(EMAIL_PROMPT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}
