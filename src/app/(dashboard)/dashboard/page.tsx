'use client';
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { GuidedTour } from '@/onboarding/components/GuidedTour';
import { useOnboarding } from '@/onboarding/components/OnboardingProvider';

import { deleteUpload } from '@/libs/api/upload';
import { VAULT_NAVIGATION } from '@/utils/vaultNavigation';
import {
  findDynamicTopic,
  getTopicElementId,
} from '@/utils/dynamicVaultTopics';
import {
  applySubsectionOrder,
  loadSubsectionOrder,
  remapTopicIdAfterReorder,
  remapTopicIdAfterDelete,
  reorderIds,
  reorderTopicInFormData,
  removeTopicFromFormData,
  saveSubsectionOrder,
} from '@/utils/vaultNavOrder';
import { VaultSidebarNavigation } from '@/components/VaultSidebarNavigation';
import {
  getSectionProgress as computeSectionProgress,
  type SectionProgress,
} from '@/utils/sectionCompletion';
import { AiDocumentRoutingProvider } from '@/contexts/AiDocumentRoutingContext';
import { DashboardAiBatchProvider } from '@/contexts/DashboardAiBatchContext';
import { HelpAssistantProvider } from '@/components/help/HelpAssistantContext';
import { HelpAssistantHost } from '@/components/help/HelpAssistantHost';
import { LeaveFeedbackWidget } from '@/components/feedback/LeaveFeedbackWidget';
import { AiReviewInboxDialog } from '@/components/ai/AiReviewInboxDialog';
import {
  normalizeVaultActivityTab,
  type VaultActivityTab,
  type VaultActivityTabInput,
} from '@/utils/vaultActivityTabs';
import { VaultFillGapsProvider } from '@/components/vault/VaultFillGapsContext';
import { ActiveSubsectionFillBar } from '@/components/vault/ActiveSubsectionFillBar';
import { SubsectionFootprintStrip } from '@/components/vault/SubsectionFootprintStrip';
import {
  collectOverviewExpiryAlerts,
  OVERVIEW_REMINDER_HORIZON_DAYS,
} from '@/utils/overviewExpiryAlerts';
import { AiActiveSectionProvider } from '@/contexts/AiActiveSectionContext';
import { AiPendingUploadSectionBanner } from '@/components/ai/AiPendingUploadSectionBanner';
import {
  AiSectionFieldMatchDialog,
  stashToMatchDocument,
} from '@/components/ai/AiSectionFieldMatchDialog';
import {
  hasUnpersistedDashboardAiPatches,
  listDashboardAiPatchesForSection,
  takeDashboardAiPatch,
  type StashedAiPatch,
} from '@/utils/aiDashboardPatchCache';
import { selectMatchReviewDocuments } from '@/utils/aiMatchReviewDocs';
import {
  markAiSectionFilled,
  wasAiSectionRecentlyFilled,
} from '@/utils/aiSectionFillGuard';
import {
  applyAiResultToSectionForm,
  applyAiResultToSectionFormDetailed,
  countFilledAiFields,
  type AiSectionApplyStats,
} from '@/utils/aiSectionFormApply';
import { buildUpsertAutofillNotice } from '@/utils/aiItemDedup';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';
import { applyFieldEditsToSectionData } from '@/utils/aiFieldMatchReview';
import {
  markAiSectionReviewed,
} from '@/utils/aiSectionReviewState';
import {
  persistAllPendingStashesForSection,
  persistPartnerStashesForFiles,
} from '@/services/aiBackgroundSectionPersist';
import { markAiAutofillDoneForSection } from '@/utils/aiAutofillDoneSections';
import { ensureFreshSession } from '@/libs/secureFetch';
import {
  listSectionLastUpdated,
  setSectionLastUpdated,
} from '@/utils/sectionLastUpdated';
import { fetchSectionsUpdatedAt } from '@/services/sectionMeta';
import { VaultExportMenu } from '@/components/VaultExportMenu';
import { BrandSuccessScreen } from '@/components/BrandSuccessScreen';
import { exportVaultData } from '@/utils/vaultExport';
import {
  DashboardTopBar,
  MobileTopBar,
} from '@/components/dashboard/DashboardTopBar';
import {
  buildBillingNotices,
  buildEventNotices,
  buildExpiryNotices,
  buildMessageNotices,
  mergeDashboardNotices,
  type DashboardNotice,
} from '@/utils/dashboardNotifications';
import { useGetStatusQuery } from '@/services/billingApi';

import { fetchSession, nokLogout as apiNokLogout, ownerLogout as apiOwnerLogout, secureFetch } from '@/libs/secureFetch';
import { getSafeErrorMessage } from '@/utils/safeErrorMessage';
import { parseAuthApiError } from '@/utils/authRateLimit';
import {
  familyAllowedVaultSectionIds,
  familyCanFetchNextKinList,
  familyCanManageNextKin,
  familyCanSeeNokLetters,
  familyCanSeeMessages,
  familyCanSeeOverview,
  familyCanSeeVaultSection,
  familyCanUpload,
  familyCanUseOverviewUploads,
  familyCanViewVaultSettings,
  familyCanWrite,
  familyRoleBannerText,
  firstAllowedFamilySectionId,
  parseFamilyDashboardSession,
  type FamilyDashboardSession,
} from '@/utils/familyDashboardAccess';
import { FamilyAclProvider, FamilyReadOnlyGuard } from '@/contexts/FamilyAclContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/ui/button';
import { Card, CardContent } from '@/components/common/ui/card';
import { Badge } from '@/components/common/ui/badge';
import {
  Save,
  FileText,
  User,
  Home,
  LayoutGrid,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  MobileBottomSheet,
  MobileSheetHandle,
} from '@/components/MobileBottomSheet';
import { OverviewBrowseGrid } from '@/components/ai/OverviewBrowseGrid';
import { NextOfKinLoginPage } from '@/components/NextOfKinLoginPage';
import { TurnstileCaptcha } from '@/components/TurnstileCaptcha';
import { getOtpSessionId } from '@/utils/otpSession';
import { buildWelcomeMessage } from '@/utils/welcomeMessage';
import { OwnerNotificationModal } from '@/components/OwnerNotificationModal';
import { EnhancedNOKDashboard } from '@/components/EnhancedNOKDashboard';
import { EnhancedSectionView } from '@/components/EnhancedSectionView';
import { RevocationModal } from '@/components/RevocationModal';
import { OwnerLetterModal } from '@/components/OwnerLetterModal';
import { MessagesDeliveryModal } from '@/components/MessagesDeliveryModal';
// import { AccessManagementTest } from '@/components/AccessManagementTest';
import { DataBindingDashboard } from '@/components/DataBindingDashboard';
import { E2eeMigrationBanner } from '@/components/vault/E2eeMigrationBanner';
import { hasDoveTag } from '@/config/nokConfig';
import {
  useNextkinLoginMutation,
  useGetMyNextKinQuery,
  useApproveNextKinAccessMutation,
  useOwnerLogoutMutation,
  useNextkinLogoutMutation,
} from '@/services/authApi';
import Section1VitalInformation from '@/components/sections/Section1VitalInformation';
import Section0PersonalInformation from '@/components/sections/Section0PersonalInformation';
import Section2AccessManagement from '@/components/sections/Section2AccessManagement';
import Section3NextKinLetter from '@/components/sections/Section3NextKinLetter';
import Section4NextKInMessages from '@/components/sections/Section4NextKInMessages';
import Section5Vehicles from '@/components/sections/Section5Vehicles';
import Section6MainResidences from '@/components/sections/Section6MainResidence';
import Section7InsurancePolicies from '@/components/sections/Section7InsurencePolicies';
import Section8CommunityMembership from '@/components/sections/Section8CommunityMembership';
import Section9CharitableGiving from '@/components/sections/Section9CharitableGiving';
import Section10EducationAccomplishments from '@/components/sections/Section10EducationAccomplishments';
import Section11MilitaryService from '@/components/sections/Section11MilitaryService';
import Section12BankingFinancialAccounts from '@/components/sections/Section12BankingFinancialAccounts';
import Section13PasswordsOnlineAccounts from '@/components/sections/Section13PasswordsOnlineAccounts';
import Section14InvestmentAccounts from '@/components/sections/Section14InvestmentAccounts';
import Section15HealthInformation from '@/components/sections/Section15HealthInformation';
import Section16CreditCardsDebt from '@/components/sections/Section16CreditCardsDebt';
import Section17FamilyTreasuredConnections from '@/components/sections/Section17FamilyTreasuredConnections';
import Section18EmploymentBusiness from '@/components/sections/Section18EmploymentBusiness';
import Section19AssetsValuables from '@/components/sections/Section19AssetsValuables';
import Section20LegalDocumentsRecords from '@/components/sections/Section20LegalDocumentsRecords';
import Section21EstatePlanningFinalWishes from '@/components/sections/Section21EstatePlanningFinalWishes';
import VaultSettings from '@/components/VaultSettings';

import { getSection1, saveSection1 } from '@/libs/api/section1';
import { getSection5, saveSection5 } from '@/libs/api/section5';
import { getSection6, saveSection6 } from '@/libs/api/section6';
import { getSection7, saveSection7 } from '@/libs/api/section7';
import { getSection8, saveSection8 } from '@/libs/api/section8';
import { getSection9, saveSection9 } from '@/libs/api/section9';
import { getSection10, saveSection10 } from '@/libs/api/section10';
import { getSection11, saveSection11 } from '@/libs/api/section11';
import { getSection12, saveSection12 } from '@/libs/api/section12';
import { getSection13, saveSection13 } from '@/libs/api/section13';
import { getSection14, saveSection14 } from '@/libs/api/section14';
import { getSection15, saveSection15 } from '@/libs/api/section15';
import { getSection16, saveSection16 } from '@/libs/api/section16';
import { getSection17, saveSection17 } from '@/libs/api/section17';
import { getSection18, saveSection18 } from '@/libs/api/section18';
import { getSection19, saveSection19 } from '@/libs/api/section19';
import { getSection20, saveSection20 } from '@/libs/api/section20';
import { getSection21, saveSection21 } from '@/libs/api/section21';
import { clearAllMessages, getMessages } from '@/libs/api/lettersOfNaxtKinMessage';

import {
  mapUIToSection1Payload,
  mapSection1ResponseToUI,
} from '@/libs/mappers/section1Mapper';
import { useGetNokLetterQuery } from '@/services/nokLetterApi';
import { WelcomeModal } from '@/onboarding/components/WelcomeModal';
import {
  useGetTourStatusQuery,
  useUpdateTourStatusMutation,
} from '@/services/onboardingApi';

type AppMode =
  | 'owner_login'
  | 'owner'
  | 'nok_login'
  | 'nok_pending_approval'
  | 'nok_dashboard'
  | 'nok_section_view'
  | 'test_access_management'
  | 'test_mfa';

export default function DashboardPage() {
  const router = useRouter();
  // App mode and NOK state
  const [appMode, setAppMode] = useState<AppMode>('owner_login');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sectionLastUpdatedMap, setSectionLastUpdatedMap] = useState<
    Record<string, string>
  >({});
  const [currentNOK, setCurrentNOK] = useState<any>(null);
  const [pendingNOK, setPendingNOK] = useState<any>(null);
  const [showOwnerNotification, setShowOwnerNotification] = useState(false);
  const [showRevocationModal, setShowRevocationModal] = useState(false);
  const [revocationReason, setRevocationReason] = useState('');
  const [nokSessionTime, setNokSessionTime] = useState(15 * 60); // 15 minutes
  const [nokActiveSection, setNokActiveSection] = useState<string | null>(null);
  const [showOwnerLetter, setShowOwnerLetter] = useState(false);
  const [showMessagesDelivery, setShowMessagesDelivery] = useState(false);
  const [nokCaptchaToken, setNokCaptchaToken] = useState('');
  const [nokCaptchaReady, setNokCaptchaReady] = useState(false);
  const [nokCaptchaResetKey, setNokCaptchaResetKey] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [tourStarted, setTourStarted] = useState(false);
  const [familyAcl, setFamilyAcl] = useState<FamilyDashboardSession>(() =>
    parseFamilyDashboardSession({}),
  );
  const [sessionReady, setSessionReady] = useState(false);
  const [vaultPrefetchKey, setVaultPrefetchKey] = useState(0);
  const [familyVaultGate, setFamilyVaultGate] = useState<
    'checking' | 'ready' | 'needs_unlock' | 'needs_owner_wrap'
  >('checking');
  const [familyUnlockPassword, setFamilyUnlockPassword] = useState('');
  const [familyUnlockBusy, setFamilyUnlockBusy] = useState(false);
  const derivedRole = useMemo(() => {
    if (appMode === 'owner') return 'owner';
    if (appMode === 'nok_dashboard' || appMode === 'nok_section_view')
      return 'nextkin';
    return null;
  }, [appMode]);

  const { startTour, activeRole } = useOnboarding();

  const { data: status, isLoading: loading } = useGetTourStatusQuery(undefined, {
    // Family sessions are NOK cookies — skip owner tour until session is ready.
    skip: !sessionReady || familyAcl.isFamily,
  });
  const [updateStatus] = useUpdateTourStatusMutation();
  const { data: billingStatus } = useGetStatusQuery(undefined, {
    // Billing is owner-cookie only; calling it as family caused 401 refresh races.
    skip: appMode !== 'owner' || !sessionReady || familyAcl.isFamily,
  });
  const [pendingMessageCount, setPendingMessageCount] = useState(0);
  const [supportUnread, setSupportUnread] = useState(0);

  // backed next kin handler
  const [nextkinLogin] = useNextkinLoginMutation();

  const canFetchNextKin =
    appMode === 'owner' &&
    sessionReady &&
    familyCanFetchNextKinList(familyAcl);

  const { data: myNextKin, refetch: refetchNextKin } = useGetMyNextKinQuery(
    undefined,
    {
      skip: !canFetchNextKin,
    },
  );
  const firstNokId = myNextKin?.[0]?.id;

  const sectionSaveMap: Record<
    string,
    (data: any) => Promise<any>
  > = {
    '1': async (data) =>
      saveSection1(mapUIToSection1Payload(data)),

    '5': saveSection5,
    '6': async (data) => saveSection6({ '6A': data?.['6A'] }),
    '7': async (data) => saveSection7({ '7A': data?.['7A'] }),
    '8': async (data) => saveSection8({ '8A': data?.['8A'] }),
    '9': async (data) => saveSection9({ '9A': data?.['9A'] }),
    '10': async (data) => saveSection10({ '10A': data?.['10A'] }),
    '11': async (data) => saveSection11({ '11A': data?.['11A'] }),
    '12': async (data) =>
      saveSection12({
        ...(data?.['12A'] && { '12A': data['12A'] }),
        ...(data?.['12B'] && { '12B': data['12B'] }),
      }),
    '13': async (data) => saveSection13({ '13A': data?.['13A'] }),
    '14': async (data) => saveSection14({ '14A': data?.['14A'] }),
    '15': async (data) =>
      saveSection15({
        ...(data?.['15A'] && { '15A': data['15A'] }),
        ...(data?.['15B'] && { '15B': data['15B'] }),
      }),
    '16': async (data) =>
      saveSection16({
        ...(data?.['16A'] && { '16A': data['16A'] }),
        ...(data?.['16B'] && { '16B': data['16B'] }),
      }),
    '17': saveSection17,
    '18': saveSection18,
    '19': saveSection19,
    '20': saveSection20,
    '21': saveSection21,
  };

  const [approveNextKinAccess] = useApproveNextKinAccessMutation();
  const [ownerLogout] = useOwnerLogoutMutation();
  const [nextkinLogout] = useNextkinLogoutMutation();
  // Existing owner app state
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeSubsection, setActiveSubsection] = useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [messagesClearNonce, setMessagesClearNonce] = useState(0);
  const sectionLoadedSnapshotRef = useRef<Record<string, string>>({});
  const sectionsPrefetchedRef = useRef(false);
  type DashboardFormData = Record<string, any>;

  const [formData, setFormData] = useState<DashboardFormData>({});

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [kitReadyOpen, setKitReadyOpen] = useState(false);
  const [reviewInboxOpen, setReviewInboxOpen] = useState(false);
  const [reviewInboxTab, setReviewInboxTab] =
    useState<VaultActivityTab>('alerts');
  const kitReadyShownRef = useRef(false);
  const [sectionMatchReview, setSectionMatchReview] = useState<{
    sectionId: string;
    documents: StashedAiPatch[];
  } | null>(null);
  const [sectionMatchApplying, setSectionMatchApplying] = useState(false);
  const sectionMatchShownRef = useRef<string | null>(null);
  const [aiPatchTick, setAiPatchTick] = useState(0);
  const [disabledSections, setDisabledSections] = useState<
    Record<string, boolean>
  >({});
  const [disabledSubsections, setDisabledSubsections] = useState<
    Record<string, boolean>
  >({});
  const [collapsedSubsections, setCollapsedSubsections] = useState<
    Record<string, boolean>
  >({ '17E': true }); // Start with 17E collapsed
  const [subsectionOrder, setSubsectionOrder] = useState<
    Record<string, string[]>
  >({});
  const allSections = useMemo(() => {
    let sections = VAULT_NAVIGATION.map(section => {
      if (!section.subsections?.length) return section;
      return {
        ...section,
        subsections: applySubsectionOrder(
          section.subsections,
          section.id,
          subsectionOrder,
        ),
      };
    });

    if (familyAcl.isFamily) {
      const allowed = familyAllowedVaultSectionIds(familyAcl);
      if (allowed !== 'all') {
        sections = sections.filter(section =>
          familyCanSeeVaultSection(familyAcl, section.id),
        );
      } else {
        // Full dashboard: hide Section 2 unless they can open NOK management/view.
        sections = sections.filter(
          section =>
            section.id !== '2' || familyCanSeeVaultSection(familyAcl, '2'),
        );
      }
    }

    return sections;
  }, [subsectionOrder, familyAcl]);
  // Sections that include obituary content (marked with dove symbol)
  const obituarySections = useMemo(
    () => new Set(['8', '9', '10', '11', '16']),
    [],
  );
  const obituarySubsections = useMemo(() => new Set(['20B']), []);

  const { data: dashboardNokLetter } = useGetNokLetterQuery(
    { nokId: firstNokId },
    { skip: !firstNokId },
  );

  const recordLoadedSection = useCallback(
    (sectionId: string, data: unknown) => {
      if (data == null) return;
      if (
        typeof data === 'object' &&
        !Array.isArray(data) &&
        Object.keys(data as object).length === 0
      ) {
        return;
      }

      // Never clobber a just-applied AI autofill with a late GET response.
      if (wasAiSectionRecentlyFilled(sectionId)) {
        return;
      }

      // Never clobber a just-applied AI autofill that is not yet on the vault.
      // Persisted stashes must not block GET — otherwise remounts look empty.
      if (hasUnpersistedDashboardAiPatches(sectionId)) {
        return;
      }

      sectionLoadedSnapshotRef.current[sectionId] = JSON.stringify(data);
      setFormData(prev => {
        const existing = prev[sectionId];
        if (
          existing &&
          typeof existing === 'object' &&
          wasAiSectionRecentlyFilled(sectionId)
        ) {
          return prev;
        }

        // Never replace a longer multi-card list with a shorter stale GET
        // (e.g. late prefetch after Accept already appended Toyota+Honda+Jeep).
        if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
          const existingRec = existing as Record<string, unknown>;
          const incomingRec = data as Record<string, unknown>;
          for (const key of Object.keys(existingRec)) {
            const cur = existingRec[key];
            const next = incomingRec?.[key];
            if (Array.isArray(cur)) {
              if (!Array.isArray(next) || next.length < cur.length) {
                return prev;
              }
            }
          }
        }

        return {
          ...prev,
          [sectionId]: data,
        };
      });
    },
    [],
  );

  // Prefetch owner section data on load so sidebar checkmarks are accurate
  // without requiring the user to visit each section first.
  useEffect(() => {
    if (appMode !== 'owner' || !sessionReady) {
      sectionsPrefetchedRef.current = false;
      return;
    }

    // Wait for vault unlock when E2EE is configured (owner after hard refresh,
    // or family before the shared DEK is unlocked).
    if (
      familyVaultGate === 'checking' ||
      familyVaultGate === 'needs_unlock' ||
      familyVaultGate === 'needs_owner_wrap'
    ) {
      return;
    }

    if (sectionsPrefetchedRef.current) return;

    sectionsPrefetchedRef.current = true;

    const allowed = familyAllowedVaultSectionIds(familyAcl);
    const canLoad = (id: string) =>
      allowed === 'all' || allowed.has(id);

    if (canLoad('1')) {
      getSection1()
        .then(res => recordLoadedSection('1', mapSection1ResponseToUI(res)))
        .catch(err => console.error('Failed to load Section 1', err));
    }

    const sectionLoaders: Array<{
      id: string;
      load: () => Promise<any>;
      pick?: (res: any) => any;
    }> = [
      {
        id: '5',
        load: getSection5,
        pick: res => (res?.data ? res.data : null),
      },
      { id: '6', load: getSection6, pick: res => res?.data },
      { id: '7', load: getSection7, pick: res => res?.data },
      { id: '8', load: getSection8, pick: res => res?.data },
      { id: '9', load: getSection9, pick: res => res?.data },
      { id: '10', load: getSection10, pick: res => res?.data },
      { id: '11', load: getSection11, pick: res => res?.data },
      {
        id: '12',
        load: getSection12,
        pick: res => (res?.data ? res.data : null),
      },
      {
        id: '13',
        load: getSection13,
        pick: res => (res?.data ? res.data : null),
      },
      {
        id: '14',
        load: getSection14,
        pick: res => (res?.data ? res.data : null),
      },
      {
        id: '15',
        load: getSection15,
        pick: res => (res?.data ? res.data : null),
      },
      {
        id: '16',
        load: getSection16,
        pick: res => (res?.data ? res.data : null),
      },
      {
        id: '17',
        load: getSection17,
        pick: res => (res?.data ? res.data : null),
      },
      {
        id: '18',
        load: getSection18,
        pick: res => (res?.data ? res.data : null),
      },
      {
        id: '19',
        load: getSection19,
        pick: res => (res?.data ? res.data : null),
      },
      {
        id: '20',
        load: getSection20,
        pick: res => (res?.data ? res.data : null),
      },
      {
        id: '21',
        load: getSection21,
        pick: res => (res?.data ? res.data : null),
      },
    ];

    for (const entry of sectionLoaders) {
      if (!canLoad(entry.id)) continue;
      entry
        .load()
        .then(res => {
          const data = entry.pick ? entry.pick(res) : res;
          if (data) recordLoadedSection(entry.id, data);
        })
        .catch(err =>
          console.error(`Failed to load Section ${entry.id}`, err),
        );
    }

    if (canLoad('4')) {
      getMessages()
        .then(messages => {
          if (Array.isArray(messages) && messages.length > 0) {
            recordLoadedSection('4', { '4A': { letters_data: messages } });
          }
        })
        .catch(err => console.error('Failed to load Section 4 messages', err));
    }
  }, [appMode, sessionReady, familyAcl, recordLoadedSection, vaultPrefetchKey, familyVaultGate]);

  // Owner unlock toast for migration progress + idle auto-lock notice.
  useEffect(() => {
    if (appMode !== 'owner' || familyAcl.isFamily || !sessionReady) return;
    let cancelled = false;
    (async () => {
      const { setE2eeAutoLockHandler, isE2eeUnlocked } = await import(
        '@/libs/e2ee/unlock'
      );
      setE2eeAutoLockHandler(() => {
        if (cancelled) return;
        void (async () => {
          const { fetchE2eeStatus } = await import('@/libs/e2ee/vaultApi');
          const status = await fetchE2eeStatus().catch(() => null);
          // Server AES mode (E2EE off): idle lock must not show the unlock banner.
          if (!status?.enabled) {
            setFamilyVaultGate('ready');
            return;
          }
          setFamilyVaultGate('needs_unlock');
          sectionsPrefetchedRef.current = false;
          toast.info(
            'Vault locked for safety after inactivity. Unlock to see encrypted sections again.',
          );
        })();
      });
      if (isE2eeUnlocked()) {
        const { fetchE2eeMigrationStatus } = await import(
          '@/libs/e2ee/vaultApi'
        );
        const status = await fetchE2eeMigrationStatus().catch(() => null);
        if (
          !cancelled &&
          status?.enabled &&
          (status.legacy_v2 || 0) > 0 &&
          isE2eeUnlocked()
        ) {
          const { migrateLegacySectionsToE2ee } = await import(
            '@/libs/e2ee/unlock'
          );
          const result = await migrateLegacySectionsToE2ee();
          if (!cancelled && result.migrated > 0) {
            toast.success(
              result.migration_complete
                ? `Upgraded ${result.migrated} section(s) to end-to-end encryption`
                : `Upgraded ${result.migrated} section(s); ${result.legacy_remaining} still need migration`,
            );
          }
        }
      }
    })();
    return () => {
      cancelled = true;
      void import('@/libs/e2ee/unlock').then(({ setE2eeAutoLockHandler }) =>
        setE2eeAutoLockHandler(null),
      );
    };
  }, [appMode, familyAcl.isFamily, sessionReady]);

  // Owner and family need the vault DEK unlocked to read E2EE (v3) sections.
  // When E2EE_ENABLED=false, never show the unlock banner — sections use server AES.
  useEffect(() => {
    if (!sessionReady || appMode !== 'owner') {
      setFamilyVaultGate('ready');
      return;
    }

    let cancelled = false;
    (async () => {
      setFamilyVaultGate('checking');
      try {
        const { fetchE2eeStatus } = await import('@/libs/e2ee/vaultApi');
        const status = await fetchE2eeStatus();
        if (cancelled) return;

        // Server AES mode (E2EE off): no client DEK required.
        if (!status.enabled) {
          setFamilyVaultGate('ready');
          return;
        }

        const { isE2eeUnlocked, tryRestoreSessionDek } = await import(
          '@/libs/e2ee/unlock'
        );
        if (!isE2eeUnlocked()) {
          await tryRestoreSessionDek();
        }
        if (isE2eeUnlocked()) {
          if (!cancelled) setFamilyVaultGate('ready');
          return;
        }

        if (status.configured) {
          setFamilyVaultGate('needs_unlock');
        } else if (familyAcl.isFamily) {
          setFamilyVaultGate('needs_owner_wrap');
        } else {
          setFamilyVaultGate('ready');
        }
      } catch {
        // Fail open when status is unknown — do not block overview with unlock UI.
        if (!cancelled) setFamilyVaultGate('ready');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionReady, appMode, familyAcl.isFamily]);

  const handleFamilyVaultUnlock = useCallback(async () => {
    const pw = familyUnlockPassword.trim();
    if (!pw) {
      toast.error(
        familyAcl.isFamily
          ? 'Enter your family login password to unlock the vault'
          : 'Enter your account password to unlock the vault',
      );
      return;
    }
    setFamilyUnlockBusy(true);
    try {
      const { unlockVaultWithPassword, isE2eeUnlocked } = await import(
        '@/libs/e2ee/unlock'
      );
      await unlockVaultWithPassword(pw);
      if (!isE2eeUnlocked()) {
        toast.error(
          familyAcl.isFamily
            ? 'Could not unlock encrypted sections. Ask the owner to edit your family access and re-save your password while their vault is unlocked.'
            : 'Could not unlock encrypted sections. Check your password and try again.',
        );
        if (familyAcl.isFamily) {
          setFamilyVaultGate('needs_owner_wrap');
        }
        return;
      }
      setFamilyUnlockPassword('');
      setFamilyVaultGate('ready');
      sectionsPrefetchedRef.current = false;
      setVaultPrefetchKey(k => k + 1);
      toast.success(
        familyAcl.isFamily
          ? 'Vault unlocked — loading owner sections'
          : 'Vault unlocked — loading your sections',
      );
    } catch (err) {
      toast.error(
        getSafeErrorMessage(err, 'Could not unlock the shared vault'),
      );
    } finally {
      setFamilyUnlockBusy(false);
    }
  }, [familyUnlockPassword, familyAcl.isFamily]);

  // Section 3 letters are stored per next-of-kin via a separate API.
  useEffect(() => {
    if (appMode !== 'owner' || !Array.isArray(myNextKin) || myNextKin.length === 0) {
      return;
    }

    const letterReadyPeople = myNextKin.filter(
      person => !person.immediate_access && person.nok_letter_received,
    );

    if (letterReadyPeople.length === 0) return;

    Promise.all(
      letterReadyPeople.map(person =>
        secureFetch(
          `/nok-letter?nok_id=${encodeURIComponent(person.id)}`,
        ).then(res => (res.ok ? res.json() : null)),
      ),
    )
      .then(results => {
        const lettersByNok: Record<string, unknown> = {};

        results.forEach((letter, index) => {
          if (
            letter &&
            typeof letter === 'object' &&
            Object.keys(letter).length > 0
          ) {
            lettersByNok[letterReadyPeople[index].id] = letter;
          }
        });

        if (Object.keys(lettersByNok).length === 0) return;

        recordLoadedSection('3', {
          selected_nok_id: letterReadyPeople[0].id,
          next_of_kin_letter_data: lettersByNok[letterReadyPeople[0].id],
          next_of_kin_letters_by_nok: lettersByNok,
        });
      })
      .catch(err => console.error('Failed to load Section 3 letters', err));
  }, [appMode, myNextKin, recordLoadedSection]);

  // Refresh the active section when navigated — but skip when AI fill is pending
  // or already applied, otherwise a late GET overwrites autofilled fields.
  useEffect(() => {
    if (appMode !== 'owner') return;

    if (
      familyVaultGate === 'checking' ||
      familyVaultGate === 'needs_unlock' ||
      familyVaultGate === 'needs_owner_wrap'
    ) {
      return;
    }

    if (
      ![
        '1',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '19',
        '20',
        '21',
      ].includes(activeSection)
    ) {
      return;
    }

    if (wasAiSectionRecentlyFilled(activeSection)) {
      return;
    }

    if (hasUnpersistedDashboardAiPatches(activeSection)) {
      return;
    }

    if (activeSection === '1') {
      getSection1()
        .then(res => recordLoadedSection('1', mapSection1ResponseToUI(res)))
        .catch(err => console.error('Failed to refresh Section 1', err));
      return;
    }

    const refreshMap: Record<string, () => Promise<{ data?: unknown }>> = {
      '5': getSection5,
      '6': getSection6,
      '7': getSection7,
      '8': getSection8,
      '9': getSection9,
      '10': getSection10,
      '11': getSection11,
      '12': getSection12,
      '13': getSection13,
      '14': getSection14,
      '15': getSection15,
      '16': getSection16,
      '17': getSection17,
      '18': getSection18,
      '19': getSection19,
      '20': getSection20,
      '21': getSection21,
    };

    const loader = refreshMap[activeSection];
    if (!loader) return;

    loader()
      .then(res => {
        if (res?.data) recordLoadedSection(activeSection, res.data);
      })
      .catch(err =>
        console.error(`Failed to refresh Section ${activeSection}`, err),
      );
  }, [activeSection, appMode, recordLoadedSection, familyVaultGate]);

  // Timer refs for cleanup
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const nokTimerRef = useRef<NodeJS.Timeout | null>(null);

  const autoSave = useCallback(async () => {
    if (appMode !== 'owner') return; // Only auto-save for owner mode

    setAutoSaving(true);
    try {
      const sanitizedFormData = { ...formData };
      delete sanitizedFormData['1']; // 🚫 NEVER STORE SECTION 1
      localStorage.setItem(
        'orderlyAffairsDisabledSections',
        JSON.stringify(disabledSections),
      );
      localStorage.setItem(
        'orderlyAffairsDisabledSubsections',
        JSON.stringify(disabledSubsections),
      );
      localStorage.setItem(
        'orderlyAffairsCollapsedSubsections',
        JSON.stringify(collapsedSubsections),
      );
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [
    formData,
    disabledSections,
    disabledSubsections,
    collapsedSubsections,
    appMode,
  ]);

  useEffect(() => {
    if (!loading && status && !status.has_completed && !tourStarted) {
      setShowWelcome(true);
    }
  }, [loading, status, tourStarted]);

  useEffect(() => {
    if (appMode !== 'owner') return;
    if (familyAcl.isFamily && !familyCanWrite(familyAcl)) return;
    if (!activeSection || activeSection === 'dashboard') return;
    if (!sectionSaveMap[activeSection]) return;

    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }

    autoSaveRef.current = setTimeout(async () => {
      try {
        setAutoSaving(true);

        const sectionData = formData[activeSection];
        if (!sectionData) return;

        const serialized = JSON.stringify(sectionData);
        if (sectionLoadedSnapshotRef.current[activeSection] === serialized) {
          return;
        }

        const { isE2eeUnlocked, tryRestoreSessionDek } = await import(
          '@/libs/e2ee/unlock'
        );
        if (!isE2eeUnlocked()) {
          await tryRestoreSessionDek();
        }
        if (!isE2eeUnlocked()) {
          const { fetchE2eeStatus } = await import('@/libs/e2ee/vaultApi');
          const status = await fetchE2eeStatus().catch(() => null);
          if (status?.enabled && status?.configured) {
            setFamilyVaultGate('needs_unlock');
            toast.error(
              'Vault locked — unlock encryption to auto-save this section.',
            );
            return;
          }
        }

        await sectionSaveMap[activeSection](sectionData);

        sectionLoadedSnapshotRef.current[activeSection] = serialized;
        setLastSaved(new Date());
      } catch (err) {
        console.error('Auto-save failed:', err);
        toast.error(
          getSafeErrorMessage(err, 'Could not auto-save. Unlock vault and retry.'),
        );
      } finally {
        setAutoSaving(false);
      }
    }, 2000);

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [formData[activeSection], activeSection]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
      if (nokTimerRef.current) {
        clearInterval(nokTimerRef.current);
      }
    };
  }, []);

  // Load session from HttpOnly cookies (server-side only)
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const session = await fetchSession();
      if (cancelled) return;

      if (session.authenticated && session.role === 'nextkin') {
        if (String(session.access_type || '').toLowerCase() === 'family') {
          const acl = parseFamilyDashboardSession(session);
          setFamilyAcl(acl);
          setCurrentUser({
            email: session.email || '',
            full_name: session.full_name,
            returning_user: session.returning_user,
          });
          setAppMode('owner');
          setSessionReady(true);
          try {
            sessionStorage.setItem('oa_portal_kind', 'family');
          } catch {
            /* ignore */
          }
          return;
        }
        router.replace('/next-kin/dashboard');
        return;
      }

      if (session.authenticated && session.role === 'owner') {
        setFamilyAcl(parseFamilyDashboardSession({}));
        setCurrentUser({
          email: session.email || '',
          full_name: session.full_name,
          returning_user: session.returning_user,
        });
        // Do not reset activeSection here — remounts/re-hydrates must not
        // yank the owner off the section they are editing.
        setAppMode('owner');
        setSessionReady(true);
        return;
      }

      router.replace('/');
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Redirect family collaborators away from areas they cannot open
  useEffect(() => {
    if (!sessionReady || !familyAcl.isFamily || appMode !== 'owner') return;

    if (
      activeSection === 'vault-settings' &&
      !familyCanViewVaultSettings(familyAcl)
    ) {
      setActiveSection(firstAllowedFamilySectionId(familyAcl));
      return;
    }

    if (activeSection === 'dashboard' && !familyCanSeeOverview(familyAcl)) {
      setActiveSection(firstAllowedFamilySectionId(familyAcl));
      return;
    }

    if (
      activeSection &&
      activeSection !== 'dashboard' &&
      activeSection !== 'vault-settings'
    ) {
      const allowed = familyAllowedVaultSectionIds(familyAcl);
      const nokOk =
        activeSection !== '2' || familyCanSeeVaultSection(familyAcl, '2');
      if (
        (allowed !== 'all' && !familyCanSeeVaultSection(familyAcl, activeSection)) ||
        !nokOk
      ) {
        setActiveSection(firstAllowedFamilySectionId(familyAcl));
      }
    }
  }, [sessionReady, familyAcl, appMode, activeSection]);

  // Load form data when switching to owner mode
  useEffect(() => {
    if (appMode === 'owner') {
      const savedDisabled = localStorage.getItem(
        'orderlyAffairsDisabledSections',
      );
      const savedDisabledSubsections = localStorage.getItem(
        'orderlyAffairsDisabledSubsections',
      );
      const savedCollapsedSubsections = localStorage.getItem(
        'orderlyAffairsCollapsedSubsections',
      );

      if (savedDisabled) {
        try {
          const parsedDisabled = JSON.parse(savedDisabled);
          setDisabledSections(parsedDisabled);
        } catch (error) {
          console.error('Error loading disabled sections:', error);
        }
      }
      if (savedDisabledSubsections) {
        try {
          const parsedDisabledSubsections = JSON.parse(
            savedDisabledSubsections,
          );
          setDisabledSubsections(parsedDisabledSubsections);
        } catch (error) {
          console.error('Error loading disabled subsections:', error);
        }
      }
      if (savedCollapsedSubsections) {
        try {
          const parsedCollapsedSubsections = JSON.parse(
            savedCollapsedSubsections,
          );
          setCollapsedSubsections(parsedCollapsedSubsections);
        } catch (error) {
          console.error('Error loading collapsed subsections:', error);
        }
      }

      setSubsectionOrder(loadSubsectionOrder());
    }
  }, [appMode]); // Only when appMode changes to 'owner'

  // Optimized update functions — family Viewers cannot mutate vault fields.
  const updateSectionData = useCallback(
    (sectionId: string, data: any) => {
      if (familyAcl.isFamily && !familyCanWrite(familyAcl)) {
        toast.error(
          'Your family role is view-only. Ask the kit owner for Editor or higher.',
        );
        return;
      }
      setFormData(prev => ({ ...prev, [sectionId]: data }));
    },
    [familyAcl],
  );

  // When owner opens a section after overview upload: show read↔field match
  // dialog for EVERY pending document (Toyota + Honda + Jeep), not just one.
  // Also reopen for partner sections (Main Residence, Vehicles, …) that still
  // have unreviwed stashes after background save.
  useEffect(() => {
    sectionMatchShownRef.current = null;
  }, [activeSection]);

  const openSectionMatchReview = useCallback(
    (sectionId: string, opts?: { force?: boolean }) => {
      if (appMode !== 'owner') return;
      if (!sectionId || sectionId === 'dashboard') return;
      if (!/^\d+$/.test(sectionId)) return;

      const stashes = selectMatchReviewDocuments(
        sectionId,
        listDashboardAiPatchesForSection(sectionId),
      );
      if (!stashes.length) {
        // No unreviwed data for this section — close its dialog if open.
        if (sectionId === activeSection) {
          setSectionMatchReview(null);
        }
        return;
      }

      const shownKey = `${sectionId}:${stashes
        .map(item => `${item.file_id}:${item.createdAt}`)
        .join('|')}`;
      if (!opts?.force && sectionMatchShownRef.current === shownKey) return;

      sectionMatchShownRef.current = shownKey;
      setSectionMatchReview({
        sectionId,
        documents: stashes,
      });

      const firstSub = stashes[0]?.subsection;
      if (firstSub && sectionId === activeSection) {
        const uiSubsection =
          firstSub === 'vital_info'
            ? '1A'
            : firstSub === 'next_of_kin' ||
                firstSub === 'executor_trustee' ||
                firstSub === 'additional_contacts'
              ? '1C'
              : firstSub;
        setActiveSubsection(uiSubsection);
      }
    },
    [activeSection, appMode],
  );

  useEffect(() => {
    openSectionMatchReview(activeSection, { force: true });
  }, [activeSection, appMode, aiPatchTick, openSectionMatchReview]);

  useEffect(() => {
    if (appMode !== 'owner') return;

    const onAiPatch = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { sectionId?: string }
        | undefined;
      setAiPatchTick(tick => tick + 1);
      if (detail?.sectionId && detail.sectionId === activeSection) {
        sectionMatchShownRef.current = null;
        openSectionMatchReview(detail.sectionId, { force: true });
      }
    };

    window.addEventListener('orderly-ai-patch-stashed', onAiPatch);
    return () =>
      window.removeEventListener('orderly-ai-patch-stashed', onAiPatch);
  }, [activeSection, appMode, openSectionMatchReview]);

  // Background AI saves update in-memory form without user opening the section.
  useEffect(() => {
    if (appMode !== 'owner') return;

    const onPersisted = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { sectionId?: string; data?: Record<string, unknown> }
        | undefined;
      if (!detail?.sectionId || !detail.data) return;
      setFormData(prev => ({
        ...prev,
        [detail.sectionId as string]: detail.data,
      }));
      setSectionLastUpdated(detail.sectionId);
      setSectionLastUpdatedMap(listSectionLastUpdated());
    };

    window.addEventListener('orderly-ai-section-persisted', onPersisted);
    return () =>
      window.removeEventListener('orderly-ai-section-persisted', onPersisted);
  }, [appMode]);

  // Load last-updated timestamps for overview cards.
  useEffect(() => {
    if (appMode !== 'owner') return;

    let cancelled = false;
    const load = async () => {
      const map = await fetchSectionsUpdatedAt();
      if (!cancelled) setSectionLastUpdatedMap(map);
    };
    void load();

    const onLocalUpdate = () => {
      setSectionLastUpdatedMap(listSectionLastUpdated());
    };
    window.addEventListener('orderly-section-last-updated', onLocalUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener('orderly-section-last-updated', onLocalUpdate);
    };
  }, [appMode]);

  const toggleSectionDisabled = useCallback(
    (sectionId: string, disabled: boolean) => {
      setDisabledSections(prev => ({ ...prev, [sectionId]: disabled }));
      if (disabled) {
        setFormData(prev => {
          const { [sectionId]: _, ...rest } = prev;
          return rest;
        });
      }
    },
    [],
  );

  // NOK LOGIN — store in nok_auth_token (do NOT touch auth_token)
  const refreshNokCaptcha = useCallback(() => {
    setNokCaptchaToken('');
    setNokCaptchaReady(false);
    setNokCaptchaResetKey(k => k + 1);
  }, []);

  const handleNokLogin = useCallback(
    async (loginData: { email: string; password: string }) => {
      if (!nokCaptchaReady || !nokCaptchaToken) {
        toast.error('Complete the security check before signing in');
        throw new Error('Complete the security check before signing in');
      }

      try {
        return await nextkinLogin({
          email: loginData.email,
          master_password: loginData.password,
          captcha_token: nokCaptchaToken,
          otp_session_id: getOtpSessionId(),
        }).unwrap();
      } catch (error: unknown) {
        const parsed = parseAuthApiError(error, '');
        refreshNokCaptcha();
        if (
          parsed.status === 400 &&
          /captcha|security check/i.test(parsed.message)
        ) {
          toast.error(
            'Security check expired. Complete the Cloudflare check again, then sign in.',
          );
        } else {
          toast.error(
            getSafeErrorMessage(
              error,
              'Login failed. Please check your email and password.',
            ),
          );
        }
        throw error;
      }
    },
    [nextkinLogin, nokCaptchaToken, nokCaptchaReady, refreshNokCaptcha],
  );

  const handleNokAuthenticated = useCallback(
    async (result: { authenticated?: boolean; access_type?: string }) => {
      if (!result.authenticated) {
        toast.error('Session was not established.');
        refreshNokCaptcha();
        return;
      }
      const session = await fetchSession();
      if (session.role === 'nextkin') {
        setCurrentNOK({
          email: session.email || '',
          owner_id: session.owner_id || '',
        });
        setAppMode('nok_dashboard');
        setActiveSection('dashboard');
        router.replace('/dashboard');
        toast.success(
          buildWelcomeMessage({
            fullName: session.full_name,
            email: session.email,
            returning: session.returning_user,
          }),
        );
      } else {
        toast.error('Invalid role in session.');
        setAppMode('nok_login');
        refreshNokCaptcha();
      }
    },
    [router, refreshNokCaptcha],
  );
  const handleOwnerApproval = useCallback(async () => {
    try {
      if (!pendingNOK) return;

      await approveNextKinAccess(pendingNOK.id).unwrap();

      toast.success('Next of Kin access approved.');

      setShowOwnerNotification(false);
      setPendingNOK(null);

      refetchNextKin(); // refresh owner NOK list
    } catch (error) {
      console.error('Approval failed:', error);
      toast.error('Failed to approve access.');
    }
  }, [pendingNOK, approveNextKinAccess, refetchNextKin]);

  // NOK LOGOUT — clear ONLY nok_auth_token
  const handleNokLogout = useCallback(async () => {
    try {
      await nextkinLogout({}).unwrap();
    } catch {}
    try {
      await apiNokLogout();
    } catch {}
    setCurrentNOK(null);
    // setPendingNOK(null);
    setNokSessionTime(15 * 60);
    setNokActiveSection(null);
    setShowOwnerLetter(false);
    setShowMessagesDelivery(false);
    setAppMode('nok_login');
    toast.success('You have been logged out successfully.');
  }, [nextkinLogout]);

  // NOK Session Management - Simplified and more stable
  useEffect(() => {
    if (appMode === 'nok_dashboard' || appMode === 'nok_section_view') {
      nokTimerRef.current = setInterval(() => {
        setNokSessionTime(prev => {
          if (prev <= 1) {
            handleNokLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (nokTimerRef.current) {
        clearInterval(nokTimerRef.current);
        nokTimerRef.current = null;
      }
    }

    return () => {
      if (nokTimerRef.current) {
        clearInterval(nokTimerRef.current);
        nokTimerRef.current = null;
      }
    };
  }, [appMode]);

  const handleOwnerLogout = async () => {
    if (familyAcl.isFamily) {
      try {
        const { lockE2ee } = await import('@/libs/e2ee/unlock');
        lockE2ee();
      } catch {
        /* ignore */
      }
      try {
        await nextkinLogout({}).unwrap();
      } catch {}
      try {
        await apiNokLogout();
      } catch {}
      try {
        sessionStorage.removeItem('oa_portal_kind');
      } catch {
        /* ignore */
      }
      router.push('/family/login');
      return;
    }
    try {
      await ownerLogout({}).unwrap();
    } catch {}
    try {
      await apiOwnerLogout();
    } catch {}
    try {
      sessionStorage.removeItem('oa_portal_kind');
    } catch {
      /* ignore */
    }
    router.push('/');
  };

  const handleBackToOwner = useCallback(() => {
    setAppMode('owner');
    setCurrentNOK(null);
    setPendingNOK(null);
    // setShowOwnerNotification(false);
  }, []);

  const handleNokSectionView = useCallback((sectionId: string) => {
    setNokActiveSection(sectionId);
    setAppMode('nok_section_view');
  }, []);

  const handleNokBackToDashboard = useCallback(() => {
    setNokActiveSection(null);
    setAppMode('nok_dashboard');
  }, []);
  const [instructionRead, setInstructionRead] = useState(false);
  const instructionStorageKey = currentUser?.email
    ? `instruction_read:${String(currentUser.email).toLowerCase()}`
    : null;

  useEffect(() => {
    if (!instructionStorageKey) {
      setInstructionRead(false);
      return;
    }
    setInstructionRead(
      localStorage.getItem(instructionStorageKey) === 'true',
    );
  }, [instructionStorageKey]);

  useEffect(() => {
    if (!instructionStorageKey || !instructionRead) return;
    localStorage.setItem(instructionStorageKey, 'true');
  }, [instructionRead, instructionStorageKey]);

  // Field-fill progress: checkmark only at 100%
  const sectionProgressCtx = useMemo(
    () => ({
      formData,
      instructionRead,
      myNextKin: Array.isArray(myNextKin) ? myNextKin : null,
      dashboardNokLetter: dashboardNokLetter
        ? (dashboardNokLetter as unknown as Record<string, unknown>)
        : null,
      disabledSections,
    }),
    [formData, instructionRead, myNextKin, dashboardNokLetter, disabledSections],
  );

  // Recompute whenever form data / NOK list / letter / instructions change
  // (fill and delete both flow through sectionProgressCtx → formData).
  const sectionProgressMap = useMemo(() => {
    const map: Record<string, SectionProgress> = {};
    for (const section of allSections) {
      map[section.id] = computeSectionProgress(section.id, sectionProgressCtx);
    }
    return map;
  }, [allSections, sectionProgressCtx]);

  const getSectionProgress = useCallback(
    (sectionId: string): SectionProgress =>
      sectionProgressMap[sectionId] ??
      computeSectionProgress(sectionId, sectionProgressCtx),
    [sectionProgressMap, sectionProgressCtx],
  );

  const getSectionCompletionStatus = useCallback(
    (sectionId: string) => getSectionProgress(sectionId).complete,
    [getSectionProgress],
  );

  // Average of per-section fill percents (disabled sections count as 100)
  const progress = useMemo(() => {
    if (!allSections.length) return 0;

    try {
      const sum = allSections.reduce(
        (acc, section) =>
          acc + (sectionProgressMap[section.id]?.percent ?? 0),
        0,
      );
      return Math.round(sum / allSections.length);
    } catch (e) {
      console.error('Progress calculation error:', e);
      return 0;
    }
  }, [allSections, sectionProgressMap]);

  const completedSectionsCount = useMemo(
    () =>
      allSections.filter(s => sectionProgressMap[s.id]?.complete).length,
    [allSections, sectionProgressMap],
  );

  const currentSectionLabel = useMemo(() => {
    if (activeSection === 'dashboard') {
      return 'Dashboard';
    }
    if (activeSection === 'vault-settings') {
      return 'Vault Settings';
    }

    const section = allSections.find(s => s.id === activeSection);
    if (!section) return 'Dashboard';

    if (activeSubsection && section.subsections) {
      const sub = section.subsections.find(
        (ss: any) => ss.id === activeSubsection,
      );
      if (sub) {
        const activeTopic = findDynamicTopic(
          activeSection,
          formData[activeSection],
          activeTopicId,
        );

        if (activeTopic) {
          return `${sub.id}. ${sub.title} · ${activeTopic.label}`;
        }

        return `${sub.id}. ${sub.title}`;
      }
    }

    return `${section.id}. ${section.title}`;
  }, [activeSection, activeSubsection, activeTopicId, allSections, formData]);
  // Only jump to the overview when entering owner mode from another mode
  // (e.g. NOK → owner). Do not reset when owner mode is already active.
  const prevAppModeRef = useRef<AppMode>(appMode);
  useEffect(() => {
    const prev = prevAppModeRef.current;
    prevAppModeRef.current = appMode;
    if (appMode === 'owner' && prev !== 'owner') {
      setActiveSection('dashboard');
      setActiveSubsection(null);
      setActiveTopicId(null);
      setSidebarOpen(false);
      setMobileMoreOpen(false);
    }
  }, [appMode]);

  useEffect(() => {
  }, [myNextKin]);

  const manualSave = useCallback(async () => {
    try {
      setAutoSaving(true);

      // 🔥 COLLECT ALL DELETED CLOUDINARY FILES (SECTION 1 ONLY)
      const deletedPublicIds: string[] = [];

      Object.values(formData['1'] || {}).forEach((field: any) => {
        if (field?._deleted_files?.length) {
          deletedPublicIds.push(...field._deleted_files);
        }
      });

      // 🔥 DELETE FROM CLOUDINARY (OWNER ONLY)
      for (const public_id of deletedPublicIds) {
        try {
          await deleteUpload(public_id);
        } catch (err) {
          console.error('Cloudinary delete failed:', public_id, err);
        }
      }

      // 🔐 SAVE SECTION 1
      if (formData['1']) {
        await saveSection1(mapUIToSection1Payload(formData['1']));
      }

      // 🚗 SAVE SECTION 5 (Vehicles)
      if (formData['5']) {
        await saveSection5( formData['5']);
      }
      // 🏠 SAVE SECTION 6 (Main Residence)
      if (formData['6']?.['6A']) {
        const raw6A = formData['6']['6A'] as Record<string, unknown>;
        const normalized6A = Object.fromEntries(
          Object.entries(raw6A).map(([key, value]) => {
            if (typeof value !== 'string') return [key, value];
            const looksUploadKey =
              /deeds|mortgage|tax|inventory|warranty|manual|shutoff|breaker|security|builder|realtor|heloc|closing|paid_off|reverse|lienholder|property_deeds|home_inventory|appliance|utility|circuit/i.test(
                key,
              );
            if (looksUploadKey) {
              return [key, { text: value, files: [] }];
            }
            return [key, value];
          }),
        );
        await saveSection6({
          '6A': normalized6A,
        });
      }
      // 🛡️ SAVE SECTION 7 (Insurance Policies)
      if (formData['7']?.['7A']) {
        await saveSection7( {
          '7A': formData['7']['7A'],
        });
      }
      // 🛡️ SAVE SECTION 8 (Insurance Policies)
      if (formData['8']?.['8A']) {
        await saveSection8( {
          '8A': formData['8']['8A'],
        });
      }
      // 🛡️ SAVE SECTION 9 (Insurance Policies)
      if (formData['9']?.['9A']) {
        await saveSection9( {
          '9A': formData['9']['9A'],
        });
      }
      // 🛡️ SAVE SECTION 10 (Insurance Policies)
      if (formData['10']?.['10A']) {
        await saveSection10( {
          '10A': formData['10']['10A'],
        });
      }
      // 🛡️ SAVE SECTION 11 (Insurance Policies)
      if (formData['11']?.['11A']) {
        await saveSection11( {
          '11A': formData['11']['11A'],
        });
      }
      // 🏦 SAVE SECTION 12 (Banking & Financial Accounts)
      if (formData['12']?.['12A'] || formData['12']?.['12B']) {
        await saveSection12( {
          ...(formData['12']['12A'] && { '12A': formData['12']['12A'] }),
          ...(formData['12']['12B'] && { '12B': formData['12']['12B'] }),
        });
      }
      // 🛡️ SAVE SECTION 13 (Insurance Policies)
      if (formData['13']?.['13A']) {
        await saveSection13( {
          '13A': formData['13']['13A'],
        });
      }
      // 🛡️ SAVE SECTION 14 (Insurance Policies)
      if (formData['14']?.['14A']) {
        await saveSection14( {
          '14A': formData['14']['14A'],
        });
      }
      // 🏥 SAVE SECTION 15 (Health Information)
      if (formData['15']?.['15A'] || formData['15']?.['15B']) {
        await saveSection15( {
          ...(formData['15']['15A'] && { '15A': formData['15']['15A'] }),
          ...(formData['15']['15B'] && { '15B': formData['15']['15B'] }),
        });
      }
      // 🏥 SAVE SECTION 16 (Health Information)
      if (formData['16']?.['16A'] || formData['16']?.['16B']) {
        await saveSection16( {
          ...(formData['16']['16A'] && { '16A': formData['16']['16A'] }),
          ...(formData['16']['16B'] && { '16B': formData['16']['16B'] }),
        });
      }
      // SAVE SECTION 17 (Family & Treasured Connections)
      if (formData['17']) {
        await saveSection17( formData['17']);
      }
      // SAVE SECTION 18 (Employment & Business)
      if (formData['18']) {
        await saveSection18( formData['18']);
      }
      // SAVE SECTION 19 (Employment & Business)
      if (formData['19']) {
        await saveSection19( formData['19']);
      }
      // SAVE SECTION 20 (Legal Documents)
      if (formData['20']) {
        await saveSection20( formData['20']);
      }
      // SAVE SECTION 21
      if (formData['21']) {
        await saveSection21( formData['21']);
      }

      // 💾 SAVE NON-SENSITIVE UI STATE
      localStorage.setItem(
        'orderlyAffairsDisabledSections',
        JSON.stringify(disabledSections),
      );
      localStorage.setItem(
        'orderlyAffairsDisabledSubsections',
        JSON.stringify(disabledSubsections),
      );
      localStorage.setItem(
        'orderlyAffairsCollapsedSubsections',
        JSON.stringify(collapsedSubsections),
      );

      setLastSaved(new Date());
      Object.keys(formData).forEach(sectionId => {
        if (formData[sectionId] != null) {
          setSectionLastUpdated(sectionId);
        }
      });
      setSectionLastUpdatedMap(listSectionLastUpdated());
      toast.success('Saved successfully!');
    } catch (error) {
      console.error('Manual save failed:', error);
      toast.error('Save failed. Please try again.');
    } finally {
      setAutoSaving(false);
    }
  }, [formData, disabledSections, disabledSubsections, collapsedSubsections]);

  const exportPayload = useMemo(
    () => ({
      formData,
      disabledSections,
      disabledSubsections,
    }),
    [formData, disabledSections, disabledSubsections],
  );

  const clearSectionData = useCallback(
    async (sectionId: string, subsectionId?: string) => {
      const confirmed = window.confirm(
        subsectionId
          ? `Are you sure you want to clear all data from subsection ${subsectionId}? This action cannot be undone.`
          : `Are you sure you want to clear all data from section ${sectionId}? This action cannot be undone.`,
      );

      if (!confirmed) return;

      if (sectionId === '4' && subsectionId === '4A') {
        try {
          const result = await clearAllMessages();
          setMessagesClearNonce(prev => prev + 1);
          toast.success(
            result?.count
              ? `Cleared ${result.count} personal message${result.count === 1 ? '' : 's'}.`
              : 'Personal messages cleared.',
          );
        } catch (error) {
          console.error('Failed to clear personal messages:', error);
          toast.error('Failed to clear messages. Please try again.');
          return;
        }
      }

      setFormData(prev => {
        const newData = { ...prev };

        if (subsectionId) {
          if (newData[sectionId]) {
            const { [subsectionId]: _, ...rest } = newData[sectionId];
            if (Object.keys(rest).length === 0) {
              const { [sectionId]: __, ...sectionRest } = newData;
              return sectionRest;
            }

            newData[sectionId] = rest;
          }
        } else {
          const { [sectionId]: _, ...rest } = newData;
          return rest;
        }

        return newData;
      });

      if (!(sectionId === '4' && subsectionId === '4A')) {
        toast.success(
          subsectionId
            ? `Subsection ${subsectionId} data cleared!`
            : `Section ${sectionId} data cleared!`,
        );
      }
    },
    [],
  );

  const currentSection = useMemo(() => {
    if (activeSection === 'dashboard') return null;
    return allSections.find(s => s.id === activeSection);
  }, [allSections, activeSection]);

  const ExportIcon = () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  );

  function renderSection() {
    switch (activeSection) {
      case '0':
        return (
          <Section0PersonalInformation
            onFullyRead={() => setInstructionRead(true)}
            onContinue={() => goToSection('1')}
          />
        );
      case '1':
        return (
          <Section1VitalInformation
            data={formData['1'] || {}}
            onChange={data => updateSectionData('1', data)}
            activeSubsection={activeSubsection as any}
            activeTopicId={activeTopicId}
          />
        );
      case '2':
        return familyCanSeeVaultSection(familyAcl, '2') ? (
          familyCanManageNextKin(familyAcl) ? (
            <Section2AccessManagement
              data={formData['2'] || {}}
              onChange={data => updateSectionData('2', data)}
            />
          ) : (
            <div className="space-y-4">
              <div className="rounded-3xl border border-teal-200 bg-teal-50/80 p-6 text-sm text-teal-950">
                <p className="font-semibold">Next of Kin — view access</p>
                <p className="mt-2 text-teal-900/80">
                  Your role can view Next of Kin on the overview. Approving,
                  revoking, or deleting requires Admin or Super Admin.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(myNextKin || []).map(
                  (person: {
                    id: string;
                    full_name?: string;
                    email?: string;
                    relationship?: string;
                    immediate_access?: boolean;
                  }) => (
                    <div
                      key={person.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-sm"
                    >
                      <p className="font-semibold text-slate-900">
                        {person.full_name || person.email || 'Next of Kin'}
                      </p>
                      <p className="mt-1 text-slate-500">
                        {person.relationship || '—'}
                        {person.immediate_access ? ' · Immediate access' : ''}
                      </p>
                    </div>
                  ),
                )}
                {!myNextKin?.length && (
                  <p className="text-sm text-slate-500">No Next of Kin listed.</p>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 text-sm text-amber-950">
            <p className="font-semibold">Next of Kin management is restricted</p>
            <p className="mt-2 text-amber-900/80">
              You do not have access to this area. Your role:{' '}
              {familyAcl.portalRoleLabel || 'Viewer'}.
            </p>
          </div>
        );
      case '3':
        return familyCanSeeNokLetters(familyAcl) ? (
          <Section3NextKinLetter
            data={formData['3'] || {}}
            onChange={data => updateSectionData('3', data)}
            ownerName={
              (formData['1'] as { vital_info?: { full_legal_name?: string } })
                ?.vital_info?.full_legal_name ||
              currentUser?.full_name ||
              null
            }
          />
        ) : (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 text-sm text-amber-950">
            <p className="font-semibold">Letters are restricted</p>
            <p className="mt-2 text-amber-900/80">
              Ask the owner to grant Section 3 (Letter to Next of Kin).
            </p>
          </div>
        );
      case '4':
        return familyCanSeeMessages(familyAcl) ? (
          <Section4NextKInMessages
            data={formData['4'] || {}}
            fullFormData={formData}
            onChange={data => updateSectionData('4', data)}
            isActive={!activeSubsection || activeSubsection === '4A'}
            messagesClearNonce={messagesClearNonce}
          />
        ) : (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 text-sm text-amber-950">
            <p className="font-semibold">Messages are restricted</p>
            <p className="mt-2 text-amber-900/80">
              Ask the owner to grant Section 4 (Personal Messages).
            </p>
          </div>
        );

      case '5':
        return (
          <Section5Vehicles
            data={formData['5'] || {}}
            onChange={data => updateSectionData('5', data)}
            activeSubsection={activeSubsection}
            activeTopicId={activeTopicId}
          />
        );
      case '6':
        return (
          <Section6MainResidences
            data={formData['6'] || {}}
            onChange={data => updateSectionData('6', data)}
            activeSubsection={activeSubsection}
            activeTopicId={activeTopicId}
          />
        );
      case '7':
        return (
          <Section7InsurancePolicies
            data={formData['7'] || {}}
            onChange={data => updateSectionData('7', data)}
            activeSubsection={activeSubsection}
            activeTopicId={activeTopicId}
            ownerEmail={currentUser?.email || ''}
            ownerName={currentUser?.full_name || currentUser?.email || 'Owner'}
            accessPeople={(myNextKin || []).filter(
              (person: { immediate_access?: boolean }) =>
                Boolean(person.immediate_access),
            )}
          />
        );
      case '8':
        return (
          <Section8CommunityMembership
            data={formData['8'] || {}}
            onChange={data => updateSectionData('8', data)}
            activeSubsection={activeSubsection}
            activeTopicId={activeTopicId}
          />
        );
      case '9':
        return (
          <Section9CharitableGiving
            data={formData['9'] || {}}
            onChange={data => updateSectionData('9', data)}
            activeSubsection={activeSubsection}
            activeTopicId={activeTopicId}
          />
        );
      case '10':
        return (
          <Section10EducationAccomplishments
            data={formData['10'] || {}}
            onChange={data => updateSectionData('10', data)}
            activeSubsection={activeSubsection}
            activeTopicId={activeTopicId}
          />
        );
      case '11':
        return (
          <Section11MilitaryService
            data={formData['11'] || {}}
            onChange={data => updateSectionData('11', data)}
            activeSubsection={activeSubsection}
            activeTopicId={activeTopicId}
          />
        );
      case '12':
        return (
          <Section12BankingFinancialAccounts
            data={formData['12'] || {}}
            onChange={data => updateSectionData('12', data)}
            activeSubsection={activeSubsection}
            activeTopicId={activeTopicId}
          />
        );
      case '13':
        return (
          <Section13PasswordsOnlineAccounts
            data={formData['13'] || {}}
            onChange={data => updateSectionData('13', data)}
            activeSubsection={activeSubsection}
            activeTopicId={activeTopicId}
          />
        );
      case '14':
        return (
          <Section14InvestmentAccounts
            data={formData['14'] || {}}
            onChange={data => updateSectionData('14', data)}
            activeSubsection={activeSubsection}
            activeTopicId={activeTopicId}
          />
        );
      case '15':
        return (
          <Section15HealthInformation
            data={formData['15'] || {}}
            onChange={data => updateSectionData('15', data)}
            activeSubsection={activeSubsection}
            activeTopicId={activeTopicId}
          />
        );
      case '16':
        return (
          <Section16CreditCardsDebt
            data={formData['16'] || {}}
            onChange={data => updateSectionData('16', data)}
            activeSubsection={activeSubsection}
            activeTopicId={activeTopicId}
          />
        );
      case '17':
        return (
          <Section17FamilyTreasuredConnections
            data={formData['17'] || {}}
            onChange={data => updateSectionData('17', data)}
            activeSubsection={activeSubsection}
            activeTopicId={activeTopicId}
          />
        );
      case '18':
        return (
          <Section18EmploymentBusiness
            data={formData['18'] || {}}
            onChange={data => updateSectionData('18', data)}
            activeSubsection={activeSubsection}
            activeTopicId={activeTopicId}
          />
        );
      case '19':
        return (
          <Section19AssetsValuables
            data={formData['19'] || {}}
            onChange={data => updateSectionData('19', data)}
            activeSubsection={activeSubsection}
            activeTopicId={activeTopicId}
          />
        );
      case '20':
        return (
          <Section20LegalDocumentsRecords
            data={formData['20'] || {}}
            onChange={data => updateSectionData('20', data)}
            activeSubsection={activeSubsection}
            activeTopicId={activeTopicId}
            disabledSubsections={disabledSubsections}
          />
        );
      case '21':
        return (
          <Section21EstatePlanningFinalWishes
            data={formData['21'] || {}}
            onChange={data => updateSectionData('21', data)}
            activeSubsection={activeSubsection}
            activeTopicId={activeTopicId}
          />
        );
      default:
        return (
          <Card>
            <CardContent>
              <p className="text-muted-foreground">
                Section under construction
              </p>
            </CardContent>
          </Card>
        );
    }
  }

  const nextTask = useMemo(() => {
    if (!allSections?.length) return null;

    for (const section of allSections) {
      const isComplete = getSectionCompletionStatus(section.id);

      if (!isComplete) {
        return {
          id: section.id,
          title: `${section.id}. ${section.title}`,
        };
      }
    }

    return null; // everything complete
  }, [allSections, getSectionCompletionStatus]);

  const primaryNextKin = useMemo(() => {
    if (!Array.isArray(myNextKin) || myNextKin.length === 0) return null;
    return (
      myNextKin.find(
        person =>
          person.full_access ||
          person.access_level === 'Full Kit Access' ||
          person.authorized_sections === 'all',
      ) || myNextKin[0]
    );
  }, [myNextKin]);

  const kitReadyDescription = useMemo(() => {
    const sectionPart =
      allSections.length > 0
        ? `All ${allSections.length} shared sections are complete`
        : 'Your shared sections are complete';
    const accessName =
      primaryNextKin?.full_name || primaryNextKin?.email || null;
    const accessPart = accessName
      ? `${accessName} has ${
          primaryNextKin?.full_access ||
          primaryNextKin?.access_level === 'Full Kit Access'
            ? 'full access'
            : 'access'
        }`
      : 'trusted people are set';
    const letterSealed = Boolean(primaryNextKin?.nok_letter_received);
    const letterPart = letterSealed
      ? 'and your letter is sealed'
      : 'and you can seal your letter when ready';

    return `${sectionPart}, ${accessPart}, ${letterPart}. We'll remind you every 6 months to check it's still true.`;
  }, [allSections.length, primaryNextKin]);

  useEffect(() => {
    if (appMode !== 'owner') return;
    if (!allSections.length) return;
    if (completedSectionsCount < allSections.length) return;
    if (kitReadyShownRef.current) return;

    try {
      if (window.localStorage.getItem('oa-kit-ready-celebrated') === '1') {
        kitReadyShownRef.current = true;
        return;
      }
    } catch {
      // ignore storage failures
    }

    kitReadyShownRef.current = true;
    setKitReadyOpen(true);
  }, [appMode, allSections.length, completedSectionsCount]);

  const dismissKitReady = useCallback((persist = true) => {
    setKitReadyOpen(false);
    if (!persist) return;
    try {
      window.localStorage.setItem('oa-kit-ready-celebrated', '1');
    } catch {
      // ignore
    }
  }, []);

  const completedSectionIds = useMemo(
    () =>
      allSections
        .filter(s => getSectionCompletionStatus(s.id))
        .map(s => s.id),
    [
      allSections,
      formData,
      disabledSections,
      myNextKin,
      instructionRead,
      dashboardNokLetter,
      getSectionCompletionStatus,
    ],
  );

  const getSectionDescription = (sectionId: string) => {
    switch (sectionId) {
      case '0':
        return 'Important legal information and instructions for using the Orderly Affairs Kit effectively.';
      case '2':
        return 'Manage who can access your Orderly Affairs Kit after your passing. Add your Primary Next of Kin, assign access levels, and keep secure credentials organized.';
      case '3':
        return 'Create an important introductory letter for your designated next of kin that explains how to access and use your Orderly Affairs Kit.';
      case '4':
        return 'Create heartfelt personal messages for your loved ones. Write letters, record video or audio, and choose when each message should be delivered.';
      case '5':
        return 'Document your current vehicles, registration details, insurance, financing, and anything your loved ones may need to manage these assets.';
      case '6':
        return 'Document your primary residence, ownership or rental details, mortgage, utilities, insurance, security details, and important home contacts.';
      case '7':
        return 'Keep your insurance policies updated with current statements, policy documents, photos, and contact information.';
      case '8':
        return 'Record the communities, memberships, organizations, clubs, churches, and professional groups that matter to you.';
      case '9':
        return 'Track your charitable giving, ongoing contributions, automatic donations, and charities you plan to include in your estate planning.';
      case '10':
        return 'Preserve your education, accomplishments, awards, and legacy details that may help your family tell your story.';
      case '11':
        return 'Record each service period, deployments, DD-214 documents, VA benefits, and legacy contacts.';
      case '12':
        return 'Organize bank accounts, digital payment services, statements, account contacts, automatic payments, and safe deposit information.';
      case '13':
        return 'Securely document important online accounts, usernames, recovery options, and instructions so accounts can be managed when needed.';
      case '14':
        return 'Document investment and retirement accounts, beneficiaries, advisors, plan documents, and distribution instructions.';
      case '15':
        return 'Record health information, medical providers, insurance details, medications, allergies, and healthcare directives for emergencies.';
      case '16':
        return 'Document credit cards, loans, debts, balances, payment methods, autopay details, and creditor contact information.';
      case '17':
        return 'Preserve family relationships, close friends, important people, sentimental items, pets, stories, and treasured connections.';
      case '18':
        return 'Document employment history, business ownership, income sources, benefits, business contacts, and succession details.';
      case '19':
        return 'Record valuable items, collectibles, jewelry, art, electronics, heirlooms, estimated values, and distribution wishes.';
      case '20':
        return 'Store and organize legal records, tax documents, estate documents, trust documents, and important paperwork locations.';
      case '21':
        return 'Document estate planning documents, end-of-life wishes, ceremonies, final arrangements, and instructions for your loved ones.';
      default:
        return 'Complete the sections below with your important information.';
    }
  };

  const goToSection = useCallback(
    (sectionId: string) => {
      if (familyAcl.isFamily) {
        if (
          sectionId === 'vault-settings' &&
          !familyCanViewVaultSettings(familyAcl)
        ) {
          toast.error('Vault Settings is not included in your access');
          return;
        }
        if (sectionId === 'dashboard' && !familyCanSeeOverview(familyAcl)) {
          setActiveSection(firstAllowedFamilySectionId(familyAcl));
          setActiveSubsection(null);
          setActiveTopicId(null);
          setSidebarOpen(false);
          setMobileMoreOpen(false);
          return;
        }
        if (sectionId === '2' && !familyCanSeeVaultSection(familyAcl, '2')) {
          toast.error('Next of Kin is not included in your access');
          return;
        }
        if (sectionId === '3' && !familyCanSeeNokLetters(familyAcl)) {
          toast.error('Letters are not included in your access');
          return;
        }
        if (sectionId === '4' && !familyCanSeeMessages(familyAcl)) {
          toast.error('Messages are not included in your access');
          return;
        }
        if (
          sectionId !== 'dashboard' &&
          sectionId !== 'vault-settings'
        ) {
          if (!familyCanSeeVaultSection(familyAcl, sectionId)) {
            toast.error('You do not have access to that section');
            return;
          }
        }
      }

      setActiveSection(sectionId);
      setActiveSubsection(null);
      setActiveTopicId(null);
      setSidebarOpen(false);
      setMobileMoreOpen(false);
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
        const main = document.querySelector('main');
        if (main instanceof HTMLElement) {
          main.scrollTo({ top: 0, behavior: 'auto' });
        }
      });
    },
    [familyAcl],
  );

  const goToDashboard = useCallback(() => {
    goToSection('dashboard');
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const overview = document.querySelector(
        '.owner-dashboard-overview-area',
      );
      if (overview instanceof HTMLElement) {
        overview.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 60);
  }, [goToSection]);

  const openReviewInbox = useCallback(
    (tab: VaultActivityTabInput = 'alerts') => {
      setReviewInboxTab(normalizeVaultActivityTab(tab));
      setReviewInboxOpen(true);
    },
    [],
  );

  useEffect(() => {
    const onOpenTab = (event: Event) => {
      const detail = (event as CustomEvent<{ tab?: VaultActivityTabInput }>)
        .detail;
      if (detail?.tab) {
        setReviewInboxTab(normalizeVaultActivityTab(detail.tab));
      }
      setReviewInboxOpen(true);
    };
    window.addEventListener('orderly-open-ai-inbox-tab', onOpenTab);
    return () => {
      window.removeEventListener('orderly-open-ai-inbox-tab', onOpenTab);
    };
  }, []);

  const inboxReminders = useMemo(
    () =>
      collectOverviewExpiryAlerts(formData, {
        limit: 40,
        withinDays: OVERVIEW_REMINDER_HORIZON_DAYS,
      }),
    [formData],
  );

  const handleNoticeSelect = useCallback(
    (notice: DashboardNotice) => {
      if (notice.id === 'event-support') {
        window.dispatchEvent(
          new CustomEvent('orderly-open-help', {
            detail: { mode: 'live' },
          }),
        );
        return;
      }
      if (notice.category === 'reminder') {
        openReviewInbox('dues');
        return;
      }
      if (!notice.sectionId) {
        openReviewInbox('alerts');
        return;
      }
      if (notice.sectionId === 'dashboard') {
        openReviewInbox('alerts');
        return;
      }
      goToSection(notice.sectionId);
    },
    [goToSection, openReviewInbox],
  );

  const headerNotices = useMemo(() => {
    if (appMode !== 'owner') return [] as DashboardNotice[];
    return mergeDashboardNotices([
      buildExpiryNotices(formData),
      buildBillingNotices(billingStatus),
      buildMessageNotices(pendingMessageCount),
      buildEventNotices({
        pendingNokName:
          showOwnerNotification && pendingNOK
            ? pendingNOK.full_name || pendingNOK.email || 'Next of kin'
            : null,
        supportUnread,
      }),
    ]);
  }, [
    appMode,
    formData,
    billingStatus,
    pendingMessageCount,
    showOwnerNotification,
    pendingNOK,
    supportUnread,
  ]);

  useEffect(() => {
    if (appMode !== 'owner') return;
    let cancelled = false;
    const load = async () => {
      try {
        const messages = await getMessages();
        if (cancelled) return;
        const list = Array.isArray(messages) ? messages : [];
        setPendingMessageCount(
          list.filter((item: { status?: string }) => item.status !== 'sent')
            .length,
        );
      } catch {
        /* ignore */
      }
      try {
        const { fetchMySupportThread } = await import(
          '@/libs/api/supportChat'
        );
        const { thread } = await fetchMySupportThread();
        if (!cancelled) {
          setSupportUnread(Number(thread?.unread || 0));
        }
      } catch {
        /* ignore — support optional */
      }
    };
    void load();
    const id = window.setInterval(() => void load(), 45000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [appMode]);

  // Cypress E2E: deterministic vault navigation (avoid flaky overlay/sidebar clicks)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!(window as Window & { Cypress?: unknown }).Cypress) return;
    (window as Window & { __oaGoToSection?: (id: string) => void }).__oaGoToSection =
      goToSection;
  }, [goToSection]);

  const goToSubsection = (sectionId: string, subsectionId: string) => {
    setActiveSection(sectionId);
    setActiveSubsection(subsectionId);
    setActiveTopicId(null);
    setSidebarOpen(false);
    setMobileMoreOpen(false);

    setTimeout(() => {
      const element = document.getElementById(`subsection-${subsectionId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const goToTopic = (
    sectionId: string,
    subsectionId: string,
    topicId: string,
  ) => {
    setActiveSection(sectionId);
    setActiveSubsection(subsectionId);
    setActiveTopicId(topicId);
    setSidebarOpen(false);
    setMobileMoreOpen(false);

    setTimeout(() => {
      const element = document.getElementById(getTopicElementId(topicId));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  const handleReorderSubsection = useCallback(
    (sectionId: string, fromSubsectionId: string, toSubsectionId: string) => {
      const section = VAULT_NAVIGATION.find(s => s.id === sectionId);
      if (!section?.subsections) return;

      const currentIds =
        subsectionOrder[sectionId] ?? section.subsections.map(sub => sub.id);
      const nextIds = reorderIds(currentIds, fromSubsectionId, toSubsectionId);
      const nextOrder = { ...subsectionOrder, [sectionId]: nextIds };
      setSubsectionOrder(nextOrder);
      saveSubsectionOrder(nextOrder);
    },
    [subsectionOrder],
  );

  const handleReorderTopic = useCallback(
    (
      sectionId: string,
      subsectionId: string,
      fromTopicId: string,
      toTopicId: string,
    ) => {
      const sectionData = formData[sectionId] as
        | Record<string, unknown>
        | undefined;
      const reordered = reorderTopicInFormData(
        sectionId,
        subsectionId,
        fromTopicId,
        toTopicId,
        sectionData,
      );
      if (!reordered) return;

      updateSectionData(sectionId, reordered);
      setActiveTopicId(prev => {
        if (!prev) return prev;
        return remapTopicIdAfterReorder(
          prev,
          subsectionId,
          fromTopicId,
          toTopicId,
        );
      });
    },
    [formData, updateSectionData],
  );

  const handleDeleteTopic = useCallback(
    (sectionId: string, subsectionId: string, topicId: string) => {
      const sectionData = formData[sectionId] as
        | Record<string, unknown>
        | undefined;
      const next = removeTopicFromFormData(
        sectionId,
        subsectionId,
        topicId,
        sectionData,
      );
      if (!next) return;

      updateSectionData(sectionId, next);
      setActiveTopicId(prev =>
        remapTopicIdAfterDelete(prev, subsectionId, topicId),
      );
    },
    [formData, updateSectionData],
  );

  return (
    <>
      <AiDocumentRoutingProvider
        currentSectionId={activeSection}
        onNavigateToSection={(sectionId, subsectionId) => {
          if (subsectionId) {
            goToSubsection(sectionId, subsectionId);
            return;
          }

          goToSection(sectionId);
        }}
      >
      <DashboardAiBatchProvider>
      <FamilyAclProvider session={familyAcl}>
      <HelpAssistantProvider>
      <VaultFillGapsProvider
        formData={formData}
        updateSectionData={(sectionId, data) =>
          updateSectionData(sectionId, data)
        }
      >
      <div className="min-h-screen bg-[#f6f8fb] text-slate-950 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <MobileTopBar
          title={
            activeSection === 'dashboard' ? 'Dashboard' : currentSectionLabel
          }
          subtitle={
            activeSection === 'dashboard'
              ? 'Overview'
              : activeSubsection
                ? 'Subsection'
                : 'Section'
          }
          completedCount={completedSectionsCount}
          totalCount={allSections.length}
          progressPercent={progress}
          showProgress={activeSection === 'dashboard'}
          onMenuClick={() => setSidebarOpen(true)}
          onLogoClick={goToDashboard}
          onAccountClick={() => setMobileMoreOpen(prev => !prev)}
          notices={headerNotices}
          onNoticeSelect={handleNoticeSelect}
          onOpenReviewInbox={() => openReviewInbox('alerts')}
        />

        <div className="flex min-h-screen md:min-h-0">
          <VaultSidebarNavigation
            sections={allSections}
            activeSection={activeSection}
            activeSubsection={activeSubsection}
            activeTopicId={activeTopicId}
            disabledSections={disabledSections}
            disabledSubsections={disabledSubsections}
            formData={formData}
            progress={progress}
            completedSectionsCount={completedSectionsCount}
            totalSectionsCount={allSections.length}
            getSectionCompletionStatus={getSectionCompletionStatus}
            getSectionProgress={getSectionProgress}
            obituarySections={obituarySections}
            obituarySubsections={obituarySubsections}
            hasDoveTag={hasDoveTag}
            sidebarOpen={sidebarOpen}
            onCloseSidebar={() => setSidebarOpen(false)}
            goToDashboard={goToDashboard}
            goToSection={goToSection}
            goToSubsection={goToSubsection}
            goToTopic={goToTopic}
            onReorderSubsection={handleReorderSubsection}
            onReorderTopic={handleReorderTopic}
            onDeleteTopic={handleDeleteTopic}
            onOpenHelp={() => {
              window.dispatchEvent(
                new CustomEvent('orderly-open-help', {
                  detail: { mode: 'chat' },
                }),
              );
            }}
          />

          {/* Drawer overlay */}
          {sidebarOpen && (
            <button
              type="button"
              className="fixed inset-0 z-[60] bg-slate-950/55 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation overlay"
            />
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            <DashboardTopBar
              currentSectionLabel={
                activeSection === 'dashboard'
                  ? 'Dashboard'
                  : currentSectionLabel
              }
              completedSectionsCount={completedSectionsCount}
              totalSectionsCount={allSections.length}
              progressPercent={progress}
              onRunTour={async () => {
                goToSection('dashboard');
                await updateStatus({ manually_started: true });
                startTour(derivedRole ?? 'owner');
                setTourStarted(true);
              }}
              exportPayload={exportPayload}
              currentUserEmail={currentUser?.email}
              onAccountInfo={() => {
                if (
                  familyAcl.isFamily &&
                  !familyCanViewVaultSettings(familyAcl)
                ) {
                  toast.error(
                    'Vault Settings is not included in your access',
                  );
                  return;
                }
                goToSection('vault-settings');
              }}
              onLogout={handleOwnerLogout}
              notices={headerNotices}
              onNoticeSelect={handleNoticeSelect}
              onOpenReviewInbox={() => openReviewInbox('alerts')}
            />

          {/* Main content */}
          <main className="min-w-0 flex-1">
            <div className="mx-auto w-full max-w-[1480px] px-4 py-4 sm:px-5 md:px-6 md:py-6 lg:px-8 xl:px-10">
              {activeSection === 'dashboard' ? (
                <div className="owner-dashboard-overview-area space-y-5 md:space-y-6">
                  {appMode === 'owner' && !familyAcl.isFamily && (
                    <E2eeMigrationBanner enabled={false} />
                  )}
                  {familyAcl.isFamily && familyRoleBannerText(familyAcl) && (
                    <div className="rounded-2xl border border-teal-200/80 bg-teal-50/90 px-4 py-3 text-sm text-teal-950">
                      <span className="font-semibold">
                        {familyRoleBannerText(familyAcl)}
                      </span>
                      <span className="mt-0.5 block text-teal-900/75">
                        You share the owner dashboard — only granted areas and
                        actions for your role are available.
                      </span>
                    </div>
                  )}
                  {(familyAcl.isFamily || appMode === 'owner') &&
                    (familyVaultGate === 'needs_unlock' ||
                      familyVaultGate === 'needs_owner_wrap') && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
                        <p className="font-semibold">
                          Encrypted vault sections are locked
                        </p>
                        <p className="mt-1 text-amber-900/80">
                          {familyVaultGate === 'needs_owner_wrap'
                            ? 'The owner has not shared the vault encryption key with your account yet. Ask them to open Vault Settings → Family access, edit your invite, enter your password, and save while their vault is unlocked.'
                            : familyAcl.isFamily
                              ? 'Enter the same password you used to sign in to unlock the owner’s completed sections and progress.'
                              : 'Enter your account password to unlock Vehicles, Insurance, and other encrypted sections. Without unlock they look empty even when saved.'}
                        </p>
                        {familyVaultGate === 'needs_unlock' && (
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                              type="password"
                              autoComplete="current-password"
                              value={familyUnlockPassword}
                              onChange={e =>
                                setFamilyUnlockPassword(e.target.value)
                              }
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  void handleFamilyVaultUnlock();
                                }
                              }}
                              placeholder={
                                familyAcl.isFamily
                                  ? 'Family login password'
                                  : 'Account password'
                              }
                              className="h-10 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-amber-400 sm:max-w-xs"
                            />
                            <Button
                              type="button"
                              className="rounded-xl"
                              disabled={familyUnlockBusy}
                              onClick={() => void handleFamilyVaultUnlock()}
                            >
                              {familyUnlockBusy
                                ? 'Unlocking…'
                                : 'Unlock vault'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  {/* Overview upload + task cards live inside DataBindingDashboard */}
                  {appMode === 'owner' ? (
                    <DataBindingDashboard
                      formData={formData}
                      nextKinList={myNextKin || []}
                      nokLetter={dashboardNokLetter || null}
                      nextTask={nextTask}
                      progress={progress}
                      completedCount={completedSectionsCount}
                      completedSectionIds={completedSectionIds}
                      sectionProgressById={sectionProgressMap}
                      lastUpdatedBySection={sectionLastUpdatedMap}
                      totalCount={allSections.length}
                      ownerEmail={currentUser?.email}
                      ownerName={
                        currentUser?.full_name || currentUser?.email || 'You'
                      }
                      isReturningUser={currentUser?.returning_user !== false}
                      notices={headerNotices}
                      onNavigateToSection={sectionId => goToSection(sectionId)}
                      readOnly={
                        familyAcl.isFamily && !familyCanWrite(familyAcl)
                      }
                      uploadsDisabled={
                        familyAcl.isFamily &&
                        !familyCanUseOverviewUploads(familyAcl)
                      }
                      allowedSectionIds={
                        familyAcl.isFamily
                          ? familyAllowedVaultSectionIds(familyAcl)
                          : 'all'
                      }
                      showAccessPeople={
                        !familyAcl.isFamily ||
                        familyCanSeeVaultSection(familyAcl, '2')
                      }
                      showNokLetters={
                        !familyAcl.isFamily || familyCanSeeNokLetters(familyAcl)
                      }
                      showMessages={
                        !familyAcl.isFamily || familyCanSeeMessages(familyAcl)
                      }
                    />
                  ) : (
                    <DataBindingDashboard
                      formData={formData}
                      nextKinList={myNextKin || []}
                      nokLetter={dashboardNokLetter || null}
                      nextTask={nextTask}
                      progress={progress}
                      completedCount={completedSectionsCount}
                      completedSectionIds={completedSectionIds}
                      sectionProgressById={sectionProgressMap}
                      lastUpdatedBySection={sectionLastUpdatedMap}
                      totalCount={allSections.length}
                      isNextOfKin
                      ownerEmail={currentUser?.email}
                      ownerName={
                        currentUser?.full_name || currentUser?.email || 'You'
                      }
                      isReturningUser={currentUser?.returning_user !== false}
                      notices={headerNotices}
                      onNavigateToSection={sectionId => goToSection(sectionId)}
                    />
                  )}
                </div>
              ) : activeSection === 'vault-settings' ? (
                <div className="space-y-4 sm:space-y-5">
                  <div className="rounded-[24px] border border-white/70 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Secure Account
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-[#213D59] sm:text-2xl md:text-3xl">
                      Vault Settings
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                      Manage your account, security keys, and access settings.
                    </p>
                  </div>
                  <VaultSettings />
                </div>
              ) : currentSection ? (
                <div className="space-y-5 md:space-y-6">
                  {familyAcl.isFamily && familyRoleBannerText(familyAcl) && (
                    <div className="rounded-2xl border border-teal-200/80 bg-teal-50/90 px-4 py-3 text-sm text-teal-950">
                      <span className="font-semibold">
                        {familyRoleBannerText(familyAcl)}
                      </span>
                    </div>
                  )}
                  {appMode === 'owner' &&
                    familyCanUpload(familyAcl) &&
                    familyCanWrite(familyAcl) && (
                    <AiPendingUploadSectionBanner
                      activeSectionId={activeSection}
                    />
                  )}
                  {appMode === 'owner' &&
                  familyCanWrite(familyAcl) &&
                  sectionMatchReview ? (
                    <AiSectionFieldMatchDialog
                      open={Boolean(sectionMatchReview)}
                      onOpenChange={open => {
                        if (!open) {
                          setSectionMatchReview(null);
                          sectionMatchShownRef.current = null;
                        }
                      }}
                      sectionId={sectionMatchReview.sectionId}
                      subsection={
                        sectionMatchReview.documents[0]?.subsection || null
                      }
                      documents={sectionMatchReview.documents.map(
                        stashToMatchDocument,
                      )}
                      sectionData={formData[sectionMatchReview.sectionId]}
                      applying={sectionMatchApplying}
                      onCloseReviewed={() => {
                        sectionMatchReview.documents.forEach(stash => {
                          markAiSectionReviewed({
                            sectionId: sectionMatchReview.sectionId,
                            fileId: stash.file_id,
                          });
                          takeDashboardAiPatch(
                            sectionMatchReview.sectionId,
                            stash.file_id,
                          );
                        });
                        setSectionMatchReview(null);
                      }}
                      onApplyAll={async () => {
                        setSectionMatchApplying(true);
                        try {
                          await ensureFreshSession();
                          const sectionId = sectionMatchReview.sectionId;
                          const ordered = [
                            ...sectionMatchReview.documents,
                          ].sort(
                            (a, b) => (a.createdAt || 0) - (b.createdAt || 0),
                          );

                          // Apply every document into vault arrays (append distinct
                          // policies/vehicles; merge true duplicates; skip identical).
                          let working = formData[sectionId] || {};
                          let totals: AiSectionApplyStats = {
                            added: 0,
                            updated: 0,
                            unchanged: 0,
                          };
                          for (const stash of ordered) {
                            const { data: applied, stats } =
                              applyAiResultToSectionFormDetailed(
                                sectionId,
                                working,
                                stash.result,
                                stash.subsection,
                              );
                            if (applied) working = applied;
                            totals = {
                              added: totals.added + stats.added,
                              updated: totals.updated + stats.updated,
                              unchanged: totals.unchanged + stats.unchanged,
                            };
                          }

                          const hadChanges =
                            totals.added > 0 || totals.updated > 0;

                          if (hadChanges) {
                            markAiSectionFilled(sectionId);
                            updateSectionData(sectionId, working);
                            const saver = sectionSaveMap[sectionId];
                            if (saver) {
                              await saver(working);
                              setSectionLastUpdated(sectionId);
                              setSectionLastUpdatedMap(
                                listSectionLastUpdated(),
                              );
                            }

                            // Also persist via queued API path + partner sections
                            // (insurance ↔ vehicles) so server state matches UI.
                            const clearedFiles = new Set<string>();
                            await persistAllPendingStashesForSection({
                              sectionId,
                              onFileDone: fileId => {
                                if (fileId) clearedFiles.add(fileId);
                              },
                            });
                            await persistPartnerStashesForFiles({
                              fileIds: [...clearedFiles],
                              excludeSectionId: sectionId,
                            });
                          }

                          ordered.forEach(stash => {
                            markAiSectionReviewed({
                              sectionId,
                              fileId: stash.file_id,
                            });
                            markAiAutofillDoneForSection({
                              sectionId,
                              fileId: stash.file_id,
                              fileName: stash.file_name,
                            });
                            takeDashboardAiPatch(sectionId, stash.file_id);
                          });

                          const itemLabel =
                            sectionId === '5'
                              ? 'Vehicle'
                              : sectionId === '7'
                                ? 'Policy'
                                : getAiSectionLabel(sectionId) || 'Entry';
                          const notice =
                            buildUpsertAutofillNotice(
                              totals.added,
                              totals.updated,
                              itemLabel,
                              undefined,
                              totals.unchanged,
                            ) ||
                            (hadChanges
                              ? `Filled ${countFilledAiFields(working as Record<string, unknown>)} fields from AI`
                              : 'Already on file — nothing new to fill.');

                          toast.success(notice);
                          setSectionMatchReview(null);
                        } finally {
                          setSectionMatchApplying(false);
                        }
                      }}
                      onSaveEdits={async (edits, document) => {
                        if (!Object.keys(edits).length) return;
                        setSectionMatchApplying(true);
                        try {
                          const sectionId = sectionMatchReview.sectionId;
                          const stash = sectionMatchReview.documents.find(
                            item =>
                              item.file_id === document.fileId ||
                              item.file_name === document.fileName,
                          );
                          // Prefer upserting this document's extract (creates/updates
                          // the right card) then overlay manual edits.
                          let working = formData[sectionId] || {};
                          if (stash?.result) {
                            const applied = applyAiResultToSectionForm(
                              sectionId,
                              working,
                              stash.result,
                              stash.subsection || document.subsection,
                            );
                            if (applied) working = applied;
                          }
                          const next = applyFieldEditsToSectionData({
                            sectionId,
                            subsection:
                              stash?.subsection || document.subsection,
                            sectionData: working,
                            edits,
                          });
                          markAiSectionFilled(sectionId);
                          updateSectionData(sectionId, next);
                          const saver = sectionSaveMap[sectionId];
                          if (saver) {
                            await saver(next);
                            setSectionLastUpdated(sectionId);
                            setSectionLastUpdatedMap(listSectionLastUpdated());
                          }
                          toast.success('Saved your field edits');
                          if (stash) {
                            markAiSectionReviewed({
                              sectionId,
                              fileId: stash.file_id,
                            });
                            takeDashboardAiPatch(sectionId, stash.file_id);
                          }
                          const remaining = sectionMatchReview.documents.filter(
                            item => item.file_id !== stash?.file_id,
                          );
                          setSectionMatchReview(
                            remaining.length
                              ? { sectionId, documents: remaining }
                              : null,
                          );
                        } finally {
                          setSectionMatchApplying(false);
                        }
                      }}
                    />
                  ) : null}
                  <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-sm">
                    <div className="relative p-5 sm:p-6 md:p-7">
                      <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-[60px] bg-[#213D59]/5" />
                      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#213D59] px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white">
                              Section {currentSection.id}
                            </span>
                            {activeSubsection && (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
                                {activeSubsection}
                              </span>
                            )}
                          </div>

                          <h2 className="text-[24px] font-semibold leading-tight text-[#213D59] sm:text-[30px] md:text-[34px]">
                            {(obituarySections.has(currentSection.id) ||
                              hasDoveTag(currentSection.id)) && (
                              <span className="mr-2">🕊️</span>
                            )}
                            {currentSection.title}
                          </h2>

                          <p className="mt-3 max-w-5xl whitespace-pre-line text-sm leading-7 text-slate-500 sm:text-[15px]">
                            {getSectionDescription(activeSection)}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                          {(!familyAcl.isFamily || familyCanWrite(familyAcl)) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            data-oa-mutate
                            onClick={manualSave}
                            className="rounded-2xl border-slate-200 bg-white px-4"
                          >
                            <Save className="mr-2 h-4 w-4" />
                            {autoSaving ? 'Saving...' : 'Save'}
                          </Button>
                          )}
                          <div data-oa-view-ok>
                          <VaultExportMenu
                            payload={exportPayload}
                            trigger={
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-2xl border-slate-200 bg-white px-4"
                              >
                                <ExportIcon />
                                <span className="ml-2">Export</span>
                              </Button>
                            }
                          />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {activeSection === '11' &&
                    (!familyAcl.isFamily || familyCanWrite(familyAcl)) && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="flex cursor-pointer items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50/80 p-4 shadow-sm sm:items-center sm:rounded-[24px] sm:p-5">
                        <input
                          type="checkbox"
                          id="military-service-opt-out"
                          checked={disabledSections['11'] || false}
                          onChange={e =>
                            toggleSectionDisabled('11', e.target.checked)
                          }
                          className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-primary focus:ring-primary sm:mt-0"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[#213D59] sm:text-[15px]">
                            I have not served in the military
                          </span>
                          <span className="mt-1 block text-sm leading-6 text-slate-500">
                            Marks this section as not applicable.
                          </span>
                        </span>
                      </label>

                      <div className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[24px] sm:p-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-[#213D59]">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div>
                            <h3 className="text-sm font-semibold text-[#213D59]">
                              VA Burial Benefits
                            </h3>
                            <p className="mt-0.5 text-sm text-slate-500">
                              Official VA burial allowance information.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(
                                'https://www.va.gov/burials-memorials/veterans-burial-allowance/',
                                '_blank',
                              )
                            }
                            className="w-auto shrink-0 rounded-2xl"
                          >
                            Open VA Info
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === '18' &&
                    (!familyAcl.isFamily || familyCanWrite(familyAcl)) && (
                    <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50/80 p-4 shadow-sm sm:items-center sm:rounded-[24px] sm:p-5">
                      <input
                        type="checkbox"
                        id="business-owner-opt-out"
                        checked={disabledSections['18'] || false}
                        onChange={e =>
                          toggleSectionDisabled('18', e.target.checked)
                        }
                        className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-primary focus:ring-primary sm:mt-0"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#213D59] sm:text-[15px]">
                          I am not a business owner
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-slate-500">
                          Marks Employment & Business as not applicable when
                          business ownership and related records do not apply.
                        </span>
                      </span>
                    </label>
                  )}

                  {activeSection === '20' &&
                    activeSubsection === '20B' &&
                    (!familyAcl.isFamily || familyCanWrite(familyAcl)) && (
                    <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50/80 p-4 shadow-sm sm:items-center sm:rounded-[24px] sm:p-5">
                      <input
                        type="checkbox"
                        id="business-taxes-opt-out"
                        checked={Boolean(disabledSubsections['20B'])}
                        onChange={e =>
                          setDisabledSubsections(prev => ({
                            ...prev,
                            '20B': e.target.checked,
                          }))
                        }
                        className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-primary focus:ring-primary sm:mt-0"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#213D59] sm:text-[15px]">
                          I am not a business owner — business taxes do not
                          apply
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-slate-500">
                          Marks Business Taxes & Issues as not applicable.
                        </span>
                      </span>
                    </label>
                  )}

                  <div
                    className={`transition-all duration-300 ${
                      disabledSections[activeSection]
                        ? 'pointer-events-none select-none opacity-30'
                        : ''
                    }`}
                  >
                    <ActiveSubsectionFillBar
                      sectionId={activeSection}
                      subsectionId={activeSubsection}
                      topicId={activeTopicId}
                      sectionData={
                        formData[activeSection] as
                          | Record<string, unknown>
                          | undefined
                      }
                    />
                    <SubsectionFootprintStrip
                      sectionId={activeSection}
                      subsectionId={activeSubsection}
                      topicId={activeTopicId}
                    />
                    <AiActiveSectionProvider
                      sectionId={activeSection}
                      subsectionId={activeSubsection}
                    >
                      {familyAcl.isFamily && !familyCanWrite(familyAcl) ? (
                        <FamilyReadOnlyGuard className="min-w-0">
                          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                            View-only — your family role cannot edit fields, use
                            Add buttons, or upload documents here.
                          </div>
                          {renderSection()}
                        </FamilyReadOnlyGuard>
                      ) : (
                        renderSection()
                      )}
                    </AiActiveSectionProvider>
                  </div>

                  {activeSection === '4' && familyCanWrite(familyAcl) && (
                    <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <p className="min-w-0 text-[11px] leading-snug text-slate-400">
                        Need a clean slate? Wipe every message in this section.
                      </p>
                      <Button
                        onClick={() => clearSectionData('4', '4A')}
                        variant="ghost"
                        size="sm"
                        className="h-7 shrink-0 rounded-lg px-2 text-[11px] font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                      >
                        Clear all
                      </Button>
                    </div>
                  )}

                  {disabledSections[activeSection] && (
                    <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-center shadow-sm">
                      <p className="text-sm text-slate-500">
                        This section has been marked as not applicable. Uncheck
                        the box above to enable it.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-[28px] border border-white/70 bg-white p-10 text-center shadow-sm">
                  <p className="text-sm text-slate-500">
                    Select a section to begin.
                  </p>
                </div>
              )}
            </div>
          </main>

        {/* Summary footer for desktop — sits under content column only */}
        <footer className="mt-auto hidden border-t border-slate-200 bg-white md:block">
          <div className="flex items-center justify-between px-6 py-3.5 lg:px-8 xl:px-10">
            <span className="text-sm font-medium text-slate-600">
              {completedSectionsCount} of {allSections.length} sections completed
            </span>
            <span className="text-xs text-slate-400">
              Last updated · keep saving as you go
            </span>
          </div>
        </footer>
          </div>
        </div>

        {/* Mobile More Sheet */}
        {mobileMoreOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[75] bg-slate-950/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMoreOpen(false)}
              aria-label="Close more menu"
            />
            <div className="fixed inset-x-3 bottom-24 z-[80] rounded-[30px] border border-white/70 bg-white p-3 shadow-2xl md:hidden">
              <div className="px-3 pb-3 pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Account
                </p>
                {currentUser && (
                  <p className="mt-1 truncate text-sm font-semibold text-[#213D59]">
                    {currentUser.email}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => goToSection('vault-settings')}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-[#213D59]"
                >
                  Vault Settings <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={manualSave}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-[#213D59]"
                >
                  Save Now <Save className="h-4 w-4" />
                </button>
                <VaultExportMenu
                  payload={exportPayload}
                  align="start"
                  trigger={
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-[#213D59]"
                    >
                      Export Data <ExportIcon />
                    </button>
                  }
                />
                <button
                  type="button"
                  onClick={handleOwnerLogout}
                  className="rounded-2xl bg-rose-50 px-4 py-3 text-left text-sm font-semibold text-rose-600"
                >
                  Log Out
                </button>
              </div>
            </div>
          </>
        )}

        {/* Mobile bottom navigation */}
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl md:hidden">
          <div className="grid grid-cols-5 gap-0.5">
            <button
              type="button"
              onClick={() => {
                goToDashboard();
              }}
              className={`relative flex flex-col items-center justify-center rounded-xl px-1 py-2 transition active:scale-95 ${
                activeSection === 'dashboard'
                  ? 'text-[#213D59]'
                  : 'text-slate-400'
              }`}
            >
              {activeSection === 'dashboard' ? (
                <span className="absolute left-1/2 top-0 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[#213D59]" />
              ) : null}
              <Home className="h-5 w-5" />
              <span className="mt-1 text-[9px] font-semibold">Dashboard</span>
            </button>

            <button
              type="button"
              data-tour="tour-vault-by-category"
              onClick={() => {
                setMobileMoreOpen(false);
                setBrowseOpen(true);
              }}
              className={`flex flex-col items-center justify-center rounded-xl px-1 py-2 transition active:scale-95 ${
                browseOpen ? 'text-[#213D59]' : 'text-slate-400'
              }`}
            >
              <LayoutGrid className="h-5 w-5" />
              <span className="mt-1 text-[9px] font-semibold">Browse</span>
            </button>

            <button
              type="button"
              onClick={() => {
                goToDashboard();
                window.setTimeout(() => {
                  window.dispatchEvent(
                    new CustomEvent('orderly-open-people-hub'),
                  );
                  document
                    .getElementById('mobile-hub')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 120);
              }}
              className="flex flex-col items-center justify-center rounded-xl px-1 py-2 text-slate-400 transition active:scale-95"
            >
              <User className="h-5 w-5" />
              <span className="mt-1 text-[9px] font-semibold">People</span>
            </button>

            <button
              type="button"
              onClick={() => goToSection('4')}
              className={`flex flex-col items-center justify-center rounded-xl px-1 py-2 transition active:scale-95 ${
                activeSection === '4' ? 'text-[#213D59]' : 'text-slate-400'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="mt-1 text-[9px] font-semibold">Messages</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMoreOpen(prev => !prev)}
              className={`flex flex-col items-center justify-center rounded-xl px-1 py-2 transition active:scale-95 ${
                mobileMoreOpen ? 'text-[#213D59]' : 'text-slate-400'
              }`}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="mt-1 text-[9px] font-semibold">More</span>
            </button>
          </div>
        </nav>

        <MobileBottomSheet
          open={browseOpen}
          onClose={() => setBrowseOpen(false)}
          className="max-h-[88dvh]"
          labelledBy="mobile-browse-title"
        >
          <div className="flex h-[min(88dvh,40rem)] min-h-0 flex-col">
            <MobileSheetHandle />
            <div className="flex shrink-0 items-center justify-between border-b px-4 pb-3 pt-1">
              <h3
                id="mobile-browse-title"
                className="text-lg font-semibold text-[#213D59]"
              >
                Browse
              </h3>
            </div>
            <div className="min-h-0 flex-1">
              <OverviewBrowseGrid
                variant="sheet"
                onNavigateToSection={sectionId => {
                  setBrowseOpen(false);
                  goToSection(sectionId);
                }}
                completedSectionIds={completedSectionIds}
                allowedSectionIds={
                  familyAcl.isFamily
                    ? familyAllowedVaultSectionIds(familyAcl)
                    : 'all'
                }
              />
            </div>
          </div>
        </MobileBottomSheet>

        {showWelcome && (
          <WelcomeModal
            role={derivedRole ?? 'owner'}
            firstName={
              (currentUser?.full_name || '')
                .trim()
                .split(/\s+/)
                .filter(Boolean)[0] || undefined
            }
            onStart={async () => {
              setShowWelcome(false);
              goToSection('dashboard');
              await updateStatus({ manually_started: true });
              startTour(derivedRole ?? 'owner');
              setTourStarted(true);
            }}
            onSkip={async () => {
              await updateStatus({ has_completed: true });
              setShowWelcome(false);
            }}
          />
        )}

        {tourStarted && activeRole === 'owner' && (
          <GuidedTour
            role="owner"
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
        )}

        {tourStarted && activeRole === 'nextkin' && (
          <GuidedTour
            role="nextkin"
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
        )}

        {showOwnerNotification && pendingNOK && (
          <OwnerNotificationModal
            nokData={pendingNOK}
            onApprove={handleOwnerApproval}
            onRevoke={() => {}}
            onClose={() => setShowOwnerNotification(false)}
          />
        )}

        <HelpAssistantHost
          currentSectionId={activeSection}
          formData={formData as Record<string, unknown>}
          onStartTour={() => {
            startTour(derivedRole ?? 'owner');
            setTourStarted(true);
          }}
          onNavigateToSection={sectionId => {
            if (sectionId === 'dashboard') {
              goToDashboard();
              return;
            }
            goToSection(sectionId);
          }}
          onFocusUpload={() => {
            goToDashboard();
            window.setTimeout(() => {
              document
                .querySelector('[data-ai-overview-upload]')
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 250);
          }}
        />

        <LeaveFeedbackWidget />

        <AiReviewInboxDialog
          open={reviewInboxOpen}
          onOpenChange={setReviewInboxOpen}
          initialTab={reviewInboxTab}
          onNavigateToSection={sectionId => goToSection(sectionId)}
          ownerName={
            currentUser?.full_name || currentUser?.email || 'You'
          }
          ownerEmail={currentUser?.email}
          reminders={inboxReminders}
          notices={headerNotices}
        />

        <BrandSuccessScreen
          open={kitReadyOpen}
          variant="celebration"
          title="Your kit is ready for your family"
          description={kitReadyDescription}
          secondaryAction={{
            label: 'Download a copy',
            variant: 'outline',
            onClick: () => {
              void exportVaultData(exportPayload, 'pdf')
                .then(() => dismissKitReady(true))
                .catch(() => toast.error('Export failed. Please try again.'));
            },
          }}
          primaryAction={{
            label: 'Back to overview',
            variant: 'primary',
            onClick: () => {
              dismissKitReady(true);
              goToDashboard();
            },
          }}
          onClose={() => dismissKitReady(true)}
        />
      </div>
      </VaultFillGapsProvider>
      </HelpAssistantProvider>
      </FamilyAclProvider>
      </DashboardAiBatchProvider>
      </AiDocumentRoutingProvider>
    </>
  );
}
