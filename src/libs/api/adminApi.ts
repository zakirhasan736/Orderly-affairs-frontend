import { secureFetch } from '@/libs/secureFetch';
import { resolveApiBaseUrl } from '@/libs/apiBase';

async function adminFetch(path: string, options: RequestInit = {}) {
  let res: Response;
  try {
    res = await secureFetch(path.startsWith('http') ? path : path, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/failed to fetch|networkerror|load failed|mixed content/i.test(msg)) {
      throw new Error(
        'Could not reach the API. Redeploy the portal so /oa-api proxies to https://api.orderly-affairs.com (set NEXT_PUBLIC_API_BASE_URL + rebuild).',
      );
    }
    throw err instanceof Error ? err : new Error(msg || 'Request failed');
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { detail: text };
  }
  if (!res.ok) {
    const detail =
      data &&
      typeof data === 'object' &&
      'detail' in data &&
      (data as { detail?: unknown }).detail;
    const msg =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map(d => (d as { msg?: string }).msg || String(d)).join(', ')
          : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export type AdminSession = {
  authenticated: boolean;
  email?: string;
  admin_role?: string;
  admin_areas?: string[];
  admin_mfa_enabled?: boolean;
  can_manage_roles?: boolean;
  can_edit_profile_email?: boolean;
  can_suspend_accounts?: boolean;
  can_clear_rate_limits?: boolean;
  can_force_logout?: boolean;
  can_delete_users?: boolean;
  can_manage_subscriptions?: boolean;
  can_issue_coupons?: boolean;
  read_only?: boolean;
  full_name?: string | null;
};

export type AdminUser = {
  id: string;
  email: string;
  full_name?: string | null;
  role?: string;
  billing_status?: string | null;
  plan?: string | null;
  trial_end?: string | null;
  is_complimentary?: boolean;
  last_login?: string | null;
  suspended?: boolean;
  deleted_at?: string | null;
  section_count?: number | null;
  is_admin?: boolean;
  admin_role?: string | null;
  created_at?: string | null;
};

export type AdminCoupon = {
  code: string;
  kind: 'duration' | 'lifetime';
  duration_days?: number | null;
  status: string;
  expires_at?: string | null;
  note?: string | null;
  plan_label?: string | null;
  created_at?: string | null;
  created_by?: string | null;
  redeemed_at?: string | null;
  redeemed_by?: string | null;
};

export type AdminOverview = {
  users: number;
  active: number;
  trial: number;
  suspended: number;
  complimentary: number;
  pending: number;
  mrr?: number | null;
  mrr_estimate?: number | null;
  recent_audit: Array<{
    id: string;
    admin_email?: string;
    action?: string;
    target?: string;
    created_at?: string;
  }>;
};

export async function adminLogin(email: string, password: string) {
  return adminFetch('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }) as Promise<{
    authenticated?: boolean;
    mfa_setup_required?: boolean;
    mfa_required?: boolean;
    setup_token?: string;
    mfa_challenge_token?: string;
    email?: string;
    message?: string;
  }>;
}

export async function adminMfaSetupStart(email: string, setup_token: string) {
  return adminFetch('/admin/auth/mfa/setup/start', {
    method: 'POST',
    body: JSON.stringify({ email, setup_token }),
  }) as Promise<{
    otpauth_url: string;
    secret: string;
    qr_png_base64: string;
  }>;
}

export async function adminMfaSetupConfirm(
  email: string,
  setup_token: string,
  code: string,
) {
  return adminFetch('/admin/auth/mfa/setup/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, setup_token, code }),
  }) as Promise<AdminSession>;
}

export async function adminMfaVerify(
  email: string,
  mfa_challenge_token: string,
  code: string,
) {
  return adminFetch('/admin/auth/mfa/verify', {
    method: 'POST',
    body: JSON.stringify({ email, mfa_challenge_token, code }),
  }) as Promise<AdminSession>;
}

export async function adminGetSession() {
  return adminFetch('/admin/auth/session') as Promise<AdminSession>;
}

export async function adminLogout() {
  return adminFetch('/admin/auth/logout', { method: 'POST' });
}

export async function adminGetOverview() {
  return adminFetch('/admin/overview') as Promise<AdminOverview>;
}

export async function adminListUsers(params?: {
  q?: string;
  status?: string;
  page?: number;
  page_size?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.q) sp.set('q', params.q);
  if (params?.status) sp.set('status', params.status);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.page_size) sp.set('page_size', String(params.page_size));
  const qs = sp.toString();
  return adminFetch(`/admin/users/${qs ? `?${qs}` : ''}`) as Promise<{
    users: AdminUser[];
    total: number;
    page: number;
    page_size: number;
  }>;
}

export async function adminGetUser(id: string) {
  return adminFetch(`/admin/users/${id}`) as Promise<AdminUser>;
}

export async function adminPatchUser(
  id: string,
  body: Record<string, unknown>,
) {
  return adminFetch(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }) as Promise<AdminUser>;
}

export async function adminDeleteUser(id: string, reason: string) {
  const qs = `?reason=${encodeURIComponent(reason.trim())}`;
  return adminFetch(`/admin/users/${id}${qs}`, { method: 'DELETE' });
}

export async function adminForceLogoutUser(id: string, reason: string) {
  return adminFetch(`/admin/users/${id}/force-logout`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason.trim() }),
  });
}

export async function adminGrantComp(
  id: string,
  body: {
    kind: 'lifetime' | 'duration';
    duration_days?: number;
    note?: string;
    send_email?: boolean;
  },
) {
  return adminFetch(`/admin/users/${id}/grant-comp`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function adminCouponStats() {
  return adminFetch('/admin/coupons/stats') as Promise<{
    unused: number;
    redeemed: number;
    expired: number;
    revoked: number;
    total: number;
  }>;
}

export async function adminListCoupons(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return adminFetch(`/admin/coupons/${qs}`) as Promise<{
    coupons: AdminCoupon[];
  }>;
}

export async function adminGenerateCoupons(body: {
  kind: 'duration' | 'lifetime';
  duration_days?: number;
  quantity: number;
  expires_at?: string;
  note?: string;
  plan_label?: string;
}) {
  return adminFetch('/admin/coupons/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{ coupons: AdminCoupon[] }>;
}

export async function adminRevokeCoupon(code: string) {
  return adminFetch(`/admin/coupons/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  });
}

export async function adminBroadcast(body: {
  subject: string;
  body: string;
  audience: 'all' | 'active' | 'trial' | 'suspended';
  user_emails?: string[];
}) {
  return adminFetch('/admin/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function adminNotificationHistory() {
  return adminFetch('/admin/notifications/history') as Promise<{
    items?: Array<{
      id: string;
      subject: string;
      body: string;
      audience: string;
      created_at?: string;
      created_by?: string;
      recipient_count?: number;
    }>;
    broadcasts?: Array<{
      id: string;
      subject: string;
      body: string;
      audience: string;
      created_at?: string;
      created_by?: string;
      recipient_count?: number;
    }>;
  }>;
}

export async function adminAuditLog(
  page = 1,
  opts?: { page_size?: number; action?: string },
) {
  const sp = new URLSearchParams();
  sp.set('page', String(page));
  sp.set('page_size', String(opts?.page_size ?? 50));
  if (opts?.action) sp.set('action', opts.action);
  return adminFetch(`/admin/audit?${sp}`) as Promise<{
    items?: Array<{
      id: string;
      admin_email?: string;
      action?: string;
      target?: string;
      created_at?: string;
      meta?: Record<string, unknown>;
    }>;
    audit?: Array<{
      id: string;
      admin_email?: string;
      action?: string;
      target?: string;
      created_at?: string;
      meta?: Record<string, unknown>;
    }>;
    total: number;
    page?: number;
    page_size?: number;
  }>;
}

export async function adminBillingOverview() {
  return adminFetch('/admin/billing/overview') as Promise<{
    stats: Array<{ _id: string | null; count: number }>;
  }>;
}

export async function adminBillingUsers() {
  return adminFetch('/admin/billing/users') as Promise<
    Array<{
      email: string;
      status?: string;
      plan?: string;
      trial_end?: string;
      is_complimentary?: boolean;
      subscription_id?: string;
      payment_method_attached?: boolean;
    }>
  >;
}

export async function adminBillingReport() {
  return adminFetch('/admin/billing/report') as Promise<{
    mrr: number;
    net_month: number;
    failed: number;
    disputes: number;
    monthly: Array<{
      month: string;
      txns: number;
      gross: number;
      refunds: number;
      net: number;
      mrr: number;
      delta_pct?: number | null;
    }>;
    transactions: Array<{
      date: string;
      customer: string;
      invoice: string;
      method: string;
      amount: number;
      status: string;
      currency?: string;
    }>;
  }>;
}

export async function adminClearRateLimits(email: string, reason?: string) {
  const trimmed = email.trim();
  if (!trimmed) {
    throw new Error('Email is required to clear rate limits');
  }
  return adminFetch('/admin/billing/clear-rate-limits', {
    method: 'POST',
    body: JSON.stringify({
      email: trimmed,
      clear_auth_limits: true,
      clear_otp_logs: true,
      reason: reason?.trim() || undefined,
    }),
  });
}

export type AdminDsar = {
  id: string;
  case_id: string;
  requester_email: string;
  owner_email?: string;
  request_type: string;
  status: string;
  notes?: string | null;
  received_at?: string;
  deadline_at?: string;
  days_left?: number | null;
};

export async function adminListDsar(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return adminFetch(`/admin/dsar${qs}`) as Promise<{
    items: AdminDsar[];
    total: number;
    open: number;
  }>;
}

export async function adminCreateDsar(body: {
  requester_email: string;
  request_type: 'export' | 'delete' | 'correct' | 'restrict';
  notes?: string;
  owner_email?: string;
}) {
  return adminFetch('/admin/dsar', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<AdminDsar>;
}

export async function adminPatchDsar(
  id: string,
  body: { status?: string; notes?: string },
) {
  return adminFetch(`/admin/dsar/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }) as Promise<AdminDsar>;
}

export type AdminLegacy = {
  id: string;
  case_id: string;
  deceased_name?: string;
  deceased_email: string;
  requester_name: string;
  requester_email: string;
  relationship: string;
  designated?: boolean;
  death_cert?: boolean;
  id_verified?: boolean;
  documents_label?: string;
  status: string;
  approver_a?: { email?: string; at?: string } | null;
  approver_b?: { email?: string; at?: string } | null;
  granted_at?: string | null;
  notes?: string | null;
};

export async function adminListLegacy(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return adminFetch(`/admin/legacy${qs}`) as Promise<{
    items: AdminLegacy[];
    total: number;
    open: number;
  }>;
}

export async function adminCreateLegacy(body: {
  deceased_email: string;
  deceased_name?: string;
  requester_name: string;
  requester_email: string;
  relationship: string;
  designated?: boolean;
  death_cert?: boolean;
  id_verified?: boolean;
  notes?: string;
}) {
  return adminFetch('/admin/legacy', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<AdminLegacy>;
}

export async function adminPatchLegacy(
  id: string,
  body: Record<string, unknown>,
) {
  return adminFetch(`/admin/legacy/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }) as Promise<AdminLegacy>;
}

export async function adminApproveLegacy(id: string, note?: string) {
  return adminFetch(`/admin/legacy/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  }) as Promise<AdminLegacy>;
}

export async function adminDenyLegacy(id: string, note?: string) {
  return adminFetch(`/admin/legacy/${id}/deny`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  }) as Promise<AdminLegacy>;
}

export async function adminSecurityOverview() {
  return adminFetch('/admin/security/overview') as Promise<{
    failed_logins_24h: number;
    failed_threshold: number;
    locked_accounts: number;
    admins_without_mfa: number;
    admins_without_mfa_list: Array<{
      email?: string;
      full_name?: string;
      admin_role?: string;
    }>;
    high_severity_7d: number;
    weekly_monitor_enabled?: boolean;
    alerts: Array<{
      id: string;
      alert: string;
      severity: string;
      target?: string;
      created_at?: string;
      source?: string;
    }>;
  }>;
}

export async function adminRunWeeklySecurityMonitor() {
  return adminFetch('/admin/security/weekly-monitor/run', {
    method: 'POST',
    body: JSON.stringify({}),
  }) as Promise<{
    ran_at?: string;
    issue_count: number;
    issues: string[];
    locked_accounts: number;
    admins_without_mfa: number;
  }>;
}

export async function adminGetAnalytics() {
  return adminFetch('/admin/analytics') as Promise<{
    totals: {
      users: number;
      active: number;
      trial: number;
      convert_pct?: number | null;
      unused_coupons?: number;
    };
    monthly_signups: Array<{ month: string; label: string; count: number }>;
    plans: Array<{ plan: string; count: number }>;
    section_completion: Array<{
      section_id: string;
      label: string;
      pct: number;
      owners_with_data?: number;
      attention?: boolean;
    }>;
  }>;
}

export type AdminArea = { id: string; label: string };
export type AdminRoleDef = {
  id: string;
  label: string;
  description?: string;
  areas: string[];
  can_manage_roles?: boolean;
  can_delete_users?: boolean;
  read_only?: boolean;
  builtin?: boolean;
};
export type AdminStaff = {
  id: string;
  email: string;
  full_name?: string | null;
  admin_role: string;
  admin_role_label?: string;
  admin_areas: string[];
  admin_mfa_enabled?: boolean;
  is_admin?: boolean;
  suspended?: boolean;
  last_login?: string | null;
};

export async function adminRolesCatalog() {
  return adminFetch('/admin/roles/catalog') as Promise<{
    areas: AdminArea[];
    roles: AdminRoleDef[];
    matrix_columns: Array<{ id: string; label: string }>;
    matrix_rows: Array<{ name: string; note: string; flags: number[] }>;
  }>;
}

export async function adminListStaff(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  return adminFetch(`/admin/roles/staff${qs}`) as Promise<{
    staff: AdminStaff[];
    total: number;
  }>;
}

export async function adminInviteStaff(body: {
  email: string;
  full_name: string;
  password: string;
  admin_role: string;
  admin_areas?: string[];
  note?: string;
}) {
  return adminFetch('/admin/roles/staff', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function adminPatchStaff(
  id: string,
  body: Record<string, unknown>,
) {
  return adminFetch(`/admin/roles/staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function adminCreateRoleDef(body: {
  id: string;
  label: string;
  description?: string;
  areas: string[];
  can_manage_roles?: boolean;
  read_only?: boolean;
}) {
  return adminFetch('/admin/roles/definitions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function adminDeleteRoleDef(roleId: string) {
  return adminFetch(`/admin/roles/definitions/${encodeURIComponent(roleId)}`, {
    method: 'DELETE',
  });
}

export type AdminBackupItem = {
  filename: string;
  created_at?: string | null;
  bytes: number;
  sha256?: string | null;
  s3_key?: string | null;
  document_count: number;
  collections?: Record<string, number>;
  vault_file_count?: number;
  is_latest?: boolean;
};

export type AdminBackupsList = {
  backup_root: string;
  backup_enabled: boolean;
  s3_enabled: boolean;
  retention_days: number;
  cron_utc: string;
  count: number;
  latest?: string | null;
  items: AdminBackupItem[];
};

export async function adminListBackups() {
  return adminFetch('/admin/backups') as Promise<AdminBackupsList>;
}

export async function adminRunBackup(upload_s3?: boolean | null) {
  return adminFetch('/admin/backups/run', {
    method: 'POST',
    body: JSON.stringify({ upload_s3: upload_s3 ?? null }),
  }) as Promise<{
    local_path?: string;
    sha256?: string;
    bytes?: number;
    s3_key?: string | null;
    collections?: Record<string, number>;
  }>;
}

export async function adminRestoreBackup(
  filename: string,
  opts?: { create_safety_backup?: boolean },
) {
  return adminFetch(`/admin/backups/${encodeURIComponent(filename)}/restore`, {
    method: 'POST',
    body: JSON.stringify({
      confirm: 'RESTORE',
      create_safety_backup: opts?.create_safety_backup !== false,
    }),
  }) as Promise<{
    restored_from: string;
    document_count: number;
    collections: Record<string, number>;
    safety_backup_filename?: string | null;
    vault_files_restored?: number;
    duration_seconds?: number;
  }>;
}

export const adminApiBase = () => resolveApiBaseUrl();
