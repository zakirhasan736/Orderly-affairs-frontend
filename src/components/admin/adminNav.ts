export type AdminNavItem = {
  href: string;
  id: string;
  label: string;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: 'Operations',
    items: [
      { id: 'overview', href: '/admin', label: 'Overview' },
      { id: 'users', href: '/admin/users', label: 'Users' },
      { id: 'activity', href: '/admin/activity', label: 'Activity monitor' },
      { id: 'analytics', href: '/admin/analytics', label: 'Analytics' },
    ],
  },
  {
    label: 'Revenue',
    items: [
      { id: 'subs', href: '/admin/subscriptions', label: 'Subscriptions' },
      { id: 'coupons', href: '/admin/coupons', label: 'Coupon codes' },
      { id: 'billing', href: '/admin/billing', label: 'Billing & payments' },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { id: 'notifs', href: '/admin/notifications', label: 'Notifications' },
    ],
  },
  {
    label: 'Requests',
    items: [
      { id: 'support', href: '/admin/support', label: 'Support tools' },
      { id: 'feedback', href: '/admin/feedback', label: 'Feedback' },
      { id: 'dsar', href: '/admin/dsar', label: 'DSAR tracker' },
      { id: 'legacy', href: '/admin/legacy', label: 'Legacy access' },
    ],
  },
  {
    label: 'Governance',
    items: [
      { id: 'roles', href: '/admin/roles', label: 'Roles & permissions' },
      { id: 'audit', href: '/admin/audit', label: 'Audit log' },
      { id: 'security', href: '/admin/security', label: 'Security' },
      { id: 'backups', href: '/admin/backups', label: 'Backups' },
    ],
  },
];

export const ADMIN_PAGE_META: Record<
  string,
  { title: string; subtitle: string }
> = {
  overview: {
    title: 'Overview',
    subtitle: 'Platform health, and what needs a decision today',
  },
  users: {
    title: 'User management',
    subtitle: 'View, edit, suspend or delete accounts · roles and trial state',
  },
  activity: {
    title: 'Activity monitor',
    subtitle: 'Who is signed in, from where, doing what',
  },
  subs: {
    title: 'Subscriptions & trials',
    subtitle: 'Plans, renewals, pauses, refunds and trial programmes',
  },
  coupons: {
    title: 'Coupon codes',
    subtitle: 'One-time-use codes granting 7 days to lifetime access',
  },
  billing: {
    title: 'Billing & payments',
    subtitle: 'Payment history and month-by-month transaction reporting',
  },
  notifs: {
    title: 'Notifications',
    subtitle: 'Account status, subscription and product messages',
  },
  roles: {
    title: 'Roles & permissions',
    subtitle: 'Which admin role may do what, and who holds it',
  },
  analytics: {
    title: 'Analytics',
    subtitle: 'Aggregated and anonymised — no per-user content statistics',
  },
  support: {
    title: 'Support tools',
    subtitle: 'Live support inbox · every reply audited',
  },
  feedback: {
    title: 'Feedback',
    subtitle: 'Product feedback from vault owners',
  },
  dsar: {
    title: 'DSAR tracker',
    subtitle: 'Data subject requests and their statutory deadlines',
  },
  legacy: {
    title: 'Legacy access',
    subtitle: 'Deceased-user access requests · dual approval required',
  },
  audit: {
    title: 'Audit log',
    subtitle: 'Immutable, append-only record of every admin action',
  },
  security: {
    title: 'Security',
    subtitle: 'Alerts, lockouts and MFA policy compliance',
  },
  backups: {
    title: 'Backups',
    subtitle:
      'Daily encrypted Mongo snapshots · restore after wipe or corruption',
  },
};

export function adminPageKeyFromPath(pathname: string): string {
  if (pathname === '/admin' || pathname === '/admin/') return 'overview';
  const part = pathname.replace(/^\/admin\/?/, '').split('/')[0] || 'overview';
  const map: Record<string, string> = {
    users: 'users',
    activity: 'activity',
    subscriptions: 'subs',
    coupons: 'coupons',
    billing: 'billing',
    notifications: 'notifs',
    roles: 'roles',
    analytics: 'analytics',
    support: 'support',
    feedback: 'feedback',
    dsar: 'dsar',
    legacy: 'legacy',
    audit: 'audit',
    security: 'security',
    backups: 'backups',
  };
  return map[part] || 'overview';
}

export function statusTagClass(status?: string | null): string {
  const s = (status || '').toLowerCase();
  if (['active', 'complimentary', 'paid', 'redeemed', 'unused'].includes(s)) {
    return 'ok';
  }
  if (['trial', 'trialing', 'pending'].includes(s)) return 'blue';
  if (['past_due', 'paused', 'suspended', 'locked'].includes(s)) return 'warn';
  if (['blocked', 'unpaid', 'deleted', 'revoked', 'lapsed'].includes(s)) {
    return 'bad';
  }
  return 'flat';
}
