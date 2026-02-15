export type AppMode =
  | 'owner_login'
  | 'owner'
  | 'nok_login'
  | 'nok_pending_approval'
  | 'nextkin_login'
  | 'nok_dashboard'
  | 'nok_section_view'
  | 'test_access_management'
  | 'test_mfa';

export type LoginStep =
  | 'credentials'
  | 'mfa_method_selection'
  | 'mfa_setup'
  | 'mfa_verify'
  | 'first_time_setup';

export type MFAMethod = 'authenticator' | 'email' | 'sms';
