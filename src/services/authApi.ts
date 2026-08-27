import { createApi } from '@reduxjs/toolkit/query/react';
import { createSecureBaseQuery } from '@/libs/baseQueryWithReauth';
import { otpSessionHeaders } from '@/utils/otpSession';

export interface NextKinCreatePayload {
  email: string;
  full_name: string;
  relationship: string;
  phone_number?: string | null;
  access_level?: string;
  authorized_sections?: string[];
  immediate_access?: boolean;
  nok_letter_received?: boolean;
  master_password?: string | null;
  password_card_generated?: boolean;
  card_storage_location?: string | null;
  key_bag_location?: string | null;
  documents_bag_location?: string | null;
  special_instructions?: string | null;
  death_certificate_authorization_agreed?: boolean;
  death_certificate_authorization_signature?: string | null;
}

export interface FamilyMemberPayload {
  email: string;
  full_name: string;
  relationship: string;
  phone_number?: string | null;
  access_level?: string;
  authorized_sections?: string[];
  portal_role?: string;
  master_password?: string | null;
}

export interface FamilyMemberResponse {
  id: string;
  email: string;
  full_name?: string;
  relationship?: string;
  phone_number?: string | null;
  access_level: string;
  authorized_sections: string[];
  access_type: 'family';
  portal_role: string;
  immediate_access: boolean;
  has_master_password?: boolean;
  /** False until the owner shares the vault DEK wrap for this member. */
  e2ee_wrap_configured?: boolean;
  master_password?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface CreateNextKinSingleResponse {
  message: string;
  email: string;
  relationship: string;
  owner: string;
  id: string;
  temp_password_sent: boolean;
  master_password?: string | null;
}
export interface CreateNextKinBulkItem {
  index: number;
  id?: string;
  email?: string;
  full_name?: string;
  relationship?: string;
  status: 'ok' | 'error';
  message?: string;
  error?: string;
}
export interface CreateNextKinBulkResponse { results: CreateNextKinBulkItem[] }

export interface NextKinOwnerSummary {
  id: string;
  email?: string;
  full_name?: string;
  status: 'alive' | 'deceased' | string;
  death_report_pending?: boolean;
}

export interface DiditSessionPayload {
  configured: boolean;
  status?: string;
  approved?: boolean;
  session_url?: string | null;
  verified_at?: string | null;
  required?: boolean;
  is_attorney_or_executor?: boolean;
  didit_before_report?: boolean;
  claimant_kind?: string;
}

export interface DeathVerificationPayload {
  certificate_uploaded?: boolean;
  certificate_filename?: string | null;
  certificate_uploaded_at?: string | null;
  ssdmf_status?: string | null;
  ssdmf_full_match?: boolean | null;
  ssdmf_checked_at?: string | null;
  ssdmf_error?: string | null;
}

export interface NextKinAccessResponse {
  id: string;
  email: string;
  full_name?: string;
  relationship?: string;
  phone_number?: string | null;
  full_access: boolean;
  authorized_sections: 'all' | string[];
  access_level: string;
  portal_role?: string;
  immediate_access: boolean;
  access_timing?: 'immediate' | 'upon_death' | string;
  immediate_access_pending?: boolean;
  living_access_state?: string;
  immediate_access_email_at?: string | null;
  nok_letter_received?: boolean;
  owner_id: string;
  owner?: NextKinOwnerSummary;
  didit?: DiditSessionPayload;
  death_verification?: DeathVerificationPayload | null;
  vault_push?: {
    state: 'active' | 'paused' | 'off';
    collaborators_enabled: boolean;
  };
  nextkin: {
    id: string;
    email: string;
    full_name?: string;
    relationship?: string;
  };
  password_card_generated?: boolean;
  has_master_password?: boolean;
  /** Owner-only: returned by GET /my-nextkin for access cards / print. */
  master_password?: string | null;
  card_storage_location?: string | null;
  key_bag_location?: string | null;
  documents_bag_location?: string | null;
  special_instructions?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type PortalRoleId =
  | 'viewer'
  | 'editor'
  | 'portal_manager'
  | 'admin'
  | 'super_admin';

export interface PortalRoleOption {
  id: PortalRoleId | string;
  label: string;
  description: string;
  can_write: boolean;
  can_upload: boolean;
  can_manage_family_access?: boolean;
  can_manage_nextkin?: boolean;
  can_manage_billing?: boolean;
  can_view_vault_settings?: boolean;
}

export interface FamilyRoleAreaEntry {
  access_level: 'Full Dashboard Access' | 'Area-Specific Access' | string;
  authorized_sections: string[];
  portal_role?: string;
  portal_role_label?: string;
}

export interface FamilyRoleAreasResponse {
  roles: Record<string, FamilyRoleAreaEntry>;
}

export interface FamilyRoleAreasUpdatePayload {
  roles: Record<string, FamilyRoleAreaEntry>;
  apply_to_members?: boolean;
}

export interface FamilyRoleAreasUpdateResponse {
  message: string;
  roles: Record<string, FamilyRoleAreaEntry>;
  updated_roles: string[];
  members_updated: number;
}

export interface SectionFootprintActor {
  user_id?: string;
  full_name?: string;
  email?: string;
  role?: string;
  portal_role?: string | null;
  portal_role_label?: string;
  source?: string;
}

export interface SectionFootprintLatest {
  section_id: string;
  section_key?: string;
  updated_at?: string;
  actor: SectionFootprintActor;
}

export interface SectionFootprintSubsectionLatest {
  section_id: string;
  section_key?: string;
  scope_id: string;
  subsection_id?: string;
  updated_at?: string;
  actor: SectionFootprintActor;
}

export interface SectionFootprintHistoryItem {
  id: string;
  section_id: string;
  section_key?: string;
  source?: string;
  scopes?: string[];
  created_at: string;
  actor: SectionFootprintActor;
}

export interface AccessActionResponse {
  message: string;
  nextkin_email?: string;
  immediate_access?: boolean;
  updated?: number;
  emailed?: number;
  owner_id?: string;
}

export interface ReportOwnerDeceasedResponse {
  status: 'deceased' | 'pending_review' | string;
  already_reported: boolean;
  pending_review?: boolean;
  message: string;
  upon_death_granted?: number;
  identity_verification_required?: boolean;
}
// SMS OTP
export interface SendSmsOtpRequest {
  email: string;
  phone_number?: string; // optional → only required if not saved
}

export interface VerifySmsOtpRequest {
  email: string;
  code: string;
}

export interface SmsOtpResponse {
  message: string;
  phone_number?: string;
  phone?: string;
  requires_phone?: boolean;
  cooldown_seconds?: number;
  already_sent?: boolean;
}

export interface OtpSecurityPayload {
  captcha_token?: string;
  otp_session_id?: string;
  /** Signup OTP — backend skips Cloudflare Turnstile */
  flow?: 'signup' | 'login';
}

export interface SendEmailOtpRequest {
  email: string;
  captcha_token?: string;
  otp_session_id?: string;
  mfa_challenge_token?: string;
  /** Signup OTP — backend skips Cloudflare Turnstile */
  flow?: 'signup' | 'login';
}

export interface EmailOtpResponse {
  message: string;
  cooldown_seconds?: number;
  already_sent?: boolean;
}

export interface LoginResponse {
  message?: string;
  authenticated?: boolean;
  mfa_required?: boolean;
  method?: MFAMethod;
  methods?: MFAMethod[];
  mfa_methods?: Partial<MFAMethods>;
  otp_sent?: boolean;
  otp_error?: string;
  cooldown_seconds?: number;
  mfa_challenge_token?: string;
  phone?: string;
  role?: string;
  email?: string;
  access_type?: string;
  portal?: string;
  full_name?: string;
  returning_user?: boolean;
  billing_status?: string;
  requires_billing?: boolean;
  must_change_password?: boolean;
  must_enroll_mfa?: boolean;
  must_verify_identity?: boolean;
  security_setup_required?: boolean;
}

export interface VerifyEmailCodeRequest {
  email: string;
  code: number;
  otp_session_id?: string;
  mfa_challenge_token?: string;
}
export type MFAMethod = 'authenticator' | 'email' | 'sms';

export type MFAMethods = Record<MFAMethod, boolean>;

export interface OwnerMeResponse {
  email: string;
  phone?: string | null;
  role: string;
  mfa_enabled: boolean;
  primary_mfa?: MFAMethod | null;
  mfa_methods: Partial<MFAMethods>;
  must_change_password?: boolean;
  must_enroll_mfa?: boolean;
  must_verify_identity?: boolean;
  security_setup_required?: boolean;
  death_certificate_authorization?: {
    agreed: boolean;
    agreed_at?: string | null;
    signature_name?: string | null;
    version?: string | null;
  };
  death_claim_alert?: {
    kind?: string;
    title?: string;
    body?: string;
    ends_at?: string;
    elapsed?: boolean;
    remaining_days?: number;
    remaining_seconds?: number;
    can_dispute?: boolean;
  } | null;
}

export interface DeathCertificateAuthorizationResponse {
  title: string;
  last_updated: string;
  version: string;
  company: string;
  support_email: string;
  address_lines: string[];
  intro: string[];
  sections: Array<{ number: string; title: string; body: string }>;
  checkbox_label: string;
  agreed: boolean;
  agreed_at?: string | null;
  signature_name?: string | null;
  can_sign: boolean;
}
const authBaseQuery = createSecureBaseQuery('/auth');

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: async (args, api, extraOptions) => {
    const prepared = typeof args === 'string' ? { url: args } : { ...args };
    const sessionHeaders = otpSessionHeaders();
    const headers = new Headers(prepared.headers as HeadersInit | undefined);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    Object.entries(sessionHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
    return authBaseQuery(
      { ...prepared, headers, credentials: 'include' },
      api,
      extraOptions,
    );
  },
  tagTypes: [
    'NextKin',
    'NextKinAccess',
    'Family',
    'NotificationPrefs',
    'DeathCertAuth',
  ],
  endpoints: builder => ({
    // Owner auth
    signup: builder.mutation({
      query: b => ({ url: '/signup', method: 'POST', body: b }),
    }),
    resumePendingSignup: builder.mutation({
      query: b => ({
        url: '/resume-pending-signup',
        method: 'POST',
        body: b,
      }),
    }),
    login: builder.mutation<LoginResponse, { email: string; password: string; captcha_token?: string; otp_session_id?: string }>({
      query: b => ({ url: '/login', method: 'POST', body: b }),
    }),
    ownerLogout: builder.mutation({
      query: () => ({ url: '/owner-logout', method: 'POST' }),
    }),
    // Password reset
    requestPasswordReset: builder.mutation<
      {
        message: string;
        full_name?: string | null;
        email?: string;
        portal_role?: string;
        portal_role_label?: string;
        access_type?: string;
      },
      { email: string; captcha_token?: string; otp_session_id?: string }
    >({
      query: body => ({
        url: '/request-password-reset',
        method: 'POST',
        body,
      }),
    }),

    resetPassword: builder.mutation<
      { message: string },
      {
        email: string;
        otp: string;
        new_password: string;
        captcha_token?: string;
      }
    >({
      query: body => ({
        url: '/reset-password',
        method: 'POST',
        body,
      }),
    }),
    // ==========================
    // 📱 SMS OTP
    // ==========================
    sendSmsOtp: builder.mutation<SmsOtpResponse, SendSmsOtpRequest>({
      query: body => ({
        url: '/send-sms-otp',
        method: 'POST',
        body,
      }),
    }),

    verifySmsOtp: builder.mutation<
      { authenticated?: boolean; message: string },
      VerifySmsOtpRequest &
        OtpSecurityPayload & { mfa_challenge_token?: string }
    >({
      query: body => ({
        url: '/verify-sms-otp',
        method: 'POST',
        body,
      }),
    }),
    startSmsMfa: builder.mutation<
      SmsOtpResponse,
      { email: string; phoneNumber?: string } & OtpSecurityPayload & {
          mfa_challenge_token?: string;
        }
    >({
      query: body => ({
        url: '/start-sms-mfa',
        method: 'POST',
        body,
      }),
    }),
    startEmailMfa: builder.mutation<
      EmailOtpResponse,
      SendEmailOtpRequest & { mfa_challenge_token?: string }
    >({
      query: body => ({
        url: '/start-email-mfa',
        method: 'POST',
        body,
      }),
    }),
    resendSmsMfa: builder.mutation<
      SmsOtpResponse,
      { email: string } & OtpSecurityPayload
    >({
      query: body => ({
        url: '/resend-sms-mfa',
        method: 'POST',
        body,
      }),
    }),
    // NOK auth
    nextkinLogin: builder.mutation<
      LoginResponse,
      {
        email: string;
        master_password: string;
        captcha_token?: string;
        otp_session_id?: string;
        portal?: 'nextkin' | 'family';
      }
    >({
      query: b => ({ url: '/nextkin-login', method: 'POST', body: b }),
      invalidatesTags: ['NextKinAccess'],
    }),
    nextkinLogout: builder.mutation({
      query: () => ({ url: '/nextkin-logout', method: 'POST' }),
      invalidatesTags: ['NextKinAccess'],
    }),
    startNextKinClaim: builder.mutation<
      { email: string; full_name?: string | null; relationship?: string | null },
      { token: string }
    >({
      query: body => ({ url: '/claim-nextkin/start', method: 'POST', body }),
    }),
    completeNextKinClaim: builder.mutation<
      LoginResponse,
      { token: string; password: string; confirm_password: string }
    >({
      query: body => ({
        url: '/claim-nextkin/complete',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['NextKinAccess'],
    }),
    revealNextKinPassword: builder.mutation<
      {
        success: boolean;
        nextkin_id: string;
        email?: string;
        master_password: string;
        message?: string;
      },
      {
        id: string;
        password?: string;
        mfa_challenge_token?: string;
        step_up_token?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/reveal-nextkin-password/${id}`,
        method: 'POST',
        body,
      }),
    }),

    // Owner-only NOK management
    createNextKin: builder.mutation<
      CreateNextKinSingleResponse | CreateNextKinBulkResponse,
      NextKinCreatePayload | NextKinCreatePayload[]
    >({
      query: b => ({ url: '/create-nextkin', method: 'POST', body: b }),
      invalidatesTags: ['NextKin'],
    }),
    getMyNextKin: builder.query<NextKinAccessResponse[], void>({
      query: () => ({ url: '/my-nextkin', method: 'GET' }),
      providesTags: ['NextKin'],
    }),
    getPortalRoles: builder.query<{ roles: PortalRoleOption[] }, void>({
      query: () => ({ url: '/portal-roles', method: 'GET' }),
    }),
    getFamilyRoleAreas: builder.query<FamilyRoleAreasResponse, void>({
      query: () => ({ url: '/family-role-areas', method: 'GET' }),
      providesTags: ['Family'],
    }),
    updateFamilyRoleAreas: builder.mutation<
      FamilyRoleAreasUpdateResponse,
      FamilyRoleAreasUpdatePayload
    >({
      query: body => ({
        url: '/family-role-areas',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Family'],
    }),
    getSectionFootprints: builder.query<
      {
        latest: SectionFootprintLatest[];
        latest_subsections?: SectionFootprintSubsectionLatest[];
        history: SectionFootprintHistoryItem[];
      },
      { limit?: number; section_id?: string } | void
    >({
      query: args => {
        const params = new URLSearchParams();
        if (args?.limit) params.set('limit', String(args.limit));
        if (args?.section_id) params.set('section_id', args.section_id);
        const qs = params.toString();
        return {
          url: qs ? `/section-footprints?${qs}` : '/section-footprints',
          method: 'GET',
        };
      },
      providesTags: ['Family'],
      keepUnusedDataFor: 15,
    }),
    createFamilyMember: builder.mutation<
      {
        message: string;
        email: string;
        id: string;
        portal_role: string;
        master_password?: string;
        temp_password_sent?: boolean;
      },
      FamilyMemberPayload
    >({
      query: body => ({ url: '/create-family', method: 'POST', body }),
      invalidatesTags: ['Family'],
    }),
    getMyFamily: builder.query<FamilyMemberResponse[], void>({
      query: () => ({ url: '/my-family', method: 'GET' }),
      providesTags: ['Family'],
    }),
    updateFamilyMember: builder.mutation<
      { message: string; family_id: string; password_email_sent?: boolean },
      { id: string; body: Partial<FamilyMemberPayload> }
    >({
      query: ({ id, body }) => ({
        url: `/update-family/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Family'],
    }),
    deleteFamilyMember: builder.mutation<{ message: string; deleted_id: string }, string>(
      {
        query: id => ({ url: `/delete-family/${id}`, method: 'DELETE' }),
        invalidatesTags: ['Family'],
      },
    ),
    approveNextKinAccess: builder.mutation<
      AccessActionResponse,
      { id: string; password?: string }
    >({
      query: ({ id, password }) => ({
        url: `/approve-nextkin-access/${id}`,
        method: 'POST',
        body: password ? { password } : {},
      }),
      invalidatesTags: ['NextKin', 'NextKinAccess'],
    }),

    revokeNextKinAccess: builder.mutation<AccessActionResponse, string>({
      query: id => ({ url: `/revoke-nextkin-access/${id}`, method: 'POST' }),
      invalidatesTags: ['NextKin', 'NextKinAccess'],
    }),
    revokeAllNextKinAccess: builder.mutation<AccessActionResponse, void>({
      query: () => ({ url: `/revoke-all-nextkin-access`, method: 'POST' }),
      invalidatesTags: ['NextKin', 'NextKinAccess'],
    }),
    approveAllNextKinAccess: builder.mutation<AccessActionResponse, void>({
      query: () => ({ url: `/approve-all-nextkin-access`, method: 'POST' }),
      invalidatesTags: ['NextKin', 'NextKinAccess'],
    }),
    updateNextKin: builder.mutation({
      query: ({
        nextkinId,
        body,
      }: {
        nextkinId: string;
        body: object;
      }) => ({
        url: `/update-nextkin/${nextkinId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['NextKin', 'NextKinAccess'],
    }),
    deleteNextKin: builder.mutation({
      query: (id: string) => ({
        url: `/delete-nextkin/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['NextKin', 'NextKinAccess'],
    }),

    // MFA/OTP shared
    verifyTotp: builder.mutation({
      query: b => ({ url: '/verify-totp', method: 'POST', body: b }),
    }),
    generateMfa: builder.mutation({
      query: b => ({ url: '/generate-mfa', method: 'POST', body: b }),
    }),
    linkAuthenticator: builder.mutation({
      query: b => ({ url: '/link-authenticator', method: 'POST', body: b }),
    }),
    sendEmailOtp: builder.mutation<EmailOtpResponse, SendEmailOtpRequest>({
      query: b => ({ url: '/send-email', method: 'POST', body: b }),
    }),
    verifyEmailCode: builder.mutation<
      {
        authenticated?: boolean;
        message: string;
        requires_billing?: boolean;
        billing_status?: string;
        role?: string;
        email?: string;
      },
      VerifyEmailCodeRequest
    >({
      query: b => ({ url: '/verify-email', method: 'POST', body: b }),
    }),
    disableMfaMethod: builder.mutation<
      {
        message: string;
        mfa_enabled: boolean;
        primary_mfa?: MFAMethod | null;
        mfa_methods: MFAMethods;
      },
      {
        method: MFAMethod;
        password?: string;
        mfa_challenge_token?: string;
        step_up_token?: string;
      }
    >({
      query: b => ({ url: '/mfa/disable', method: 'POST', body: b }),
    }),
    deleteAccount: builder.mutation<
      {
        success: boolean;
        message: string;
        summary?: Record<string, unknown>;
      },
      {
        password: string;
        confirm: string;
        mfa_challenge_token?: string;
        step_up_token?: string;
      }
    >({
      query: b => ({ url: '/delete-account', method: 'POST', body: b }),
    }),

    // Session helpers
    getSession: builder.query<
      {
        authenticated: boolean;
        role?: string;
        email?: string;
        owner_id?: string;
      },
      void
    >({
      query: () => ({ url: '/session', method: 'GET' }),
    }),
    refreshToken: builder.mutation({
      query: () => ({ url: '/refresh-token', method: 'POST' }),
    }),
    getMe: builder.query<OwnerMeResponse, void>({
      query: () => ({ url: '/me', method: 'GET' }),
    }),
    getDeathCertificateAuthorization: builder.query<
      DeathCertificateAuthorizationResponse,
      void
    >({
      query: () => ({
        url: '/death-certificate-authorization',
        method: 'GET',
      }),
      providesTags: ['DeathCertAuth'],
    }),
    agreeDeathCertificateAuthorization: builder.mutation<
      DeathCertificateAuthorizationResponse,
      { agreed: boolean; signature_name: string }
    >({
      query: body => ({
        url: '/death-certificate-authorization',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DeathCertAuth'],
    }),

    // NOK self access
    getMyNextKinAccess: builder.query<NextKinAccessResponse, void>({
      query: () => ({ url: '/nextkin-access', method: 'GET' }),
      providesTags: ['NextKinAccess'],
    }),
    getNotificationPreferences: builder.query<
      {
        in_app_enabled: boolean;
        email_reminders_enabled: boolean;
        push_state: 'active' | 'paused' | 'off';
        push_for_collaborators: boolean;
        section_update_recipient_ids?: string[] | null;
        section_update_recipients_by_section?: Record<string, string[]>;
        special_days_enabled?: boolean;
        special_days?: Array<{
          kind: string;
          month: number;
          day: number;
          label?: string;
          enabled?: boolean;
          source?: string;
        }>;
        vault_push?: {
          state: 'active' | 'paused' | 'off';
          collaborators_enabled: boolean;
        };
      },
      void
    >({
      query: () => ({ url: '/notification-preferences', method: 'GET' }),
      providesTags: ['NotificationPrefs'],
    }),
    updateNotificationPreferences: builder.mutation<
      {
        in_app_enabled: boolean;
        email_reminders_enabled: boolean;
        push_state: 'active' | 'paused' | 'off';
        push_for_collaborators: boolean;
        section_update_recipient_ids?: string[] | null;
        section_update_recipients_by_section?: Record<string, string[]>;
        special_days_enabled?: boolean;
        special_days?: Array<{
          kind: string;
          month: number;
          day: number;
          label?: string;
          enabled?: boolean;
          source?: string;
        }>;
        vault_push?: {
          state: 'active' | 'paused' | 'off';
          collaborators_enabled: boolean;
        };
      },
      {
        in_app_enabled?: boolean;
        email_reminders_enabled?: boolean;
        push_state?: 'active' | 'paused' | 'off';
        push_for_collaborators?: boolean;
        section_update_recipient_ids?: string[] | null;
        section_update_recipients_by_section?: Record<string, string[] | null>;
        special_days_enabled?: boolean;
        special_days?: Array<{
          kind: string;
          month: number;
          day: number;
          label?: string;
          enabled?: boolean;
          source?: string;
        }>;
      }
    >({
      query: body => ({
        url: '/notification-preferences',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['NotificationPrefs'],
    }),
    getVapidPublicKey: builder.query<
      { configured: boolean; publicKey: string | null; message?: string },
      void
    >({
      query: () => ({ url: '/vapid-public-key', method: 'GET' }),
    }),
    pushSubscribe: builder.mutation<
      { ok: boolean; message?: string },
      {
        endpoint: string;
        keys: { p256dh: string; auth: string };
        user_agent?: string;
      }
    >({
      query: body => ({
        url: '/push-subscribe',
        method: 'POST',
        body,
      }),
    }),
    pushUnsubscribe: builder.mutation<{ ok: boolean }, { endpoint: string }>({
      query: body => ({
        url: '/push-unsubscribe',
        method: 'POST',
        body,
      }),
    }),
    reportOwnerDeceased: builder.mutation<
      ReportOwnerDeceasedResponse,
      { master_password: string; confirm: boolean }
    >({
      query: body => ({
        url: '/nextkin/report-owner-deceased',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['NextKinAccess'],
    }),
    startDiditSession: builder.mutation<DiditSessionPayload, void>({
      query: () => ({
        url: '/nextkin/didit/session',
        method: 'POST',
      }),
      invalidatesTags: ['NextKinAccess'],
    }),
    getDiditStatus: builder.query<DiditSessionPayload, void>({
      query: () => ({ url: '/nextkin/didit/status', method: 'GET' }),
      providesTags: ['NextKinAccess'],
    }),
    getAfterDeathCase: builder.query<
      {
        case: {
          case_reference?: string;
          owner_display_name?: string;
          relationship?: string;
          identity_label?: string;
          certificate_label?: string;
          death_record_label?: string;
          protection_label?: string;
          admin_label?: string;
          access_label?: string;
        } | null;
      },
      void
    >({
      query: () => ({ url: '/nextkin/after-death-case', method: 'GET' }),
      providesTags: ['NextKinAccess'],
    }),
    stopAfterDeathRequest: builder.mutation<
      { ok: boolean; status?: string; already_stopped?: boolean },
      { password: string }
    >({
      query: body => ({
        url: '/stop-after-death-request',
        method: 'POST',
        body,
      }),
    }),
    uploadDeathCertificate: builder.mutation<
      {
        ok: boolean;
        message?: string;
        death_verification?: DeathVerificationPayload;
      },
      FormData
    >({
      query: body => ({
        url: '/nextkin/death-certificate',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['NextKinAccess'],
    }),
    collaboratorChangePassword: builder.mutation<
      {
        message: string;
        must_change_password?: boolean;
        must_enroll_mfa?: boolean;
        must_verify_identity?: boolean;
        security_setup_required?: boolean;
      },
      { current_password: string; new_password: string }
    >({
      query: body => ({
        url: '/collaborator-change-password',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useOwnerLogoutMutation,
  useNextkinLoginMutation,
  useNextkinLogoutMutation,
  useStartNextKinClaimMutation,
  useCompleteNextKinClaimMutation,
  useRevealNextKinPasswordMutation,
  useCreateNextKinMutation,
  useGetMyNextKinQuery,
  useGetPortalRolesQuery,
  useGetFamilyRoleAreasQuery,
  useUpdateFamilyRoleAreasMutation,
  useGetSectionFootprintsQuery,
  useCreateFamilyMemberMutation,
  useGetMyFamilyQuery,
  useUpdateFamilyMemberMutation,
  useDeleteFamilyMemberMutation,
  useApproveNextKinAccessMutation,
  useUpdateNextKinMutation,
  useDeleteNextKinMutation,
  useGenerateMfaMutation,
  useLinkAuthenticatorMutation,
  useVerifyTotpMutation,
  useSendEmailOtpMutation,
  useVerifyEmailCodeMutation,
  useGetSessionQuery,
  useRefreshTokenMutation,
  useGetMeQuery,
  useGetDeathCertificateAuthorizationQuery,
  useAgreeDeathCertificateAuthorizationMutation,
  useRevokeNextKinAccessMutation,
  useRevokeAllNextKinAccessMutation,
  useApproveAllNextKinAccessMutation,
  useGetMyNextKinAccessQuery,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  useGetVapidPublicKeyQuery,
  usePushSubscribeMutation,
  usePushUnsubscribeMutation,
  useReportOwnerDeceasedMutation,
  useStartDiditSessionMutation,
  useGetDiditStatusQuery,
  useGetAfterDeathCaseQuery,
  useStopAfterDeathRequestMutation,
  useUploadDeathCertificateMutation,
  useCollaboratorChangePasswordMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useSendSmsOtpMutation,
  useVerifySmsOtpMutation,
  useStartSmsMfaMutation,
  useStartEmailMfaMutation,
  useResendSmsMfaMutation,
  useResumePendingSignupMutation,
  useDisableMfaMethodMutation,
  useDeleteAccountMutation,
} = authApi;
