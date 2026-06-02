'use client';
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { GuidedTour } from '@/onboarding/components/GuidedTour';
import { shouldTriggerContextualTour } from '@/onboarding/utils/contextualTrigger';
import { useOnboarding } from '@/onboarding/components/OnboardingProvider';

import { deleteUpload } from '@/libs/api/upload';
import { VAULT_NAVIGATION } from '@/utils/vaultNavigation';

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/ui/button';
import { Card, CardContent } from '@/components/common/ui/card';
import { Badge } from '@/components/common/ui/badge';
import { Progress } from '@/components/common/ui/progress';
import {
  CheckCircle,
  Circle,
  Save,
  FileText,
  User,
  Home,
  LayoutList,
  Clock3,
  MoreHorizontal,
  X,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { NextOfKinLoginPage } from '@/components/NextOfKinLoginPage';
import { OwnerNotificationModal } from '@/components/OwnerNotificationModal';
import { EnhancedNOKDashboard } from '@/components/EnhancedNOKDashboard';
import { EnhancedSectionView } from '@/components/EnhancedSectionView';
import { RevocationModal } from '@/components/RevocationModal';
import { OwnerLetterModal } from '@/components/OwnerLetterModal';
import { MessagesDeliveryModal } from '@/components/MessagesDeliveryModal';
// import { AccessManagementTest } from '@/components/AccessManagementTest';
import { DataBindingDashboard } from '@/components/DataBindingDashboard';
import { MFATestComponent } from '@/components/MFATestComponent';
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
// Suppress Iterable SDK errors from browser extensions
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (message.includes('iterable') || message.includes('Iterable')) {
      return; // Suppress Iterable-related errors
    }
    originalError.apply(console, args);
  };
}
export default function DashboardPage() {
  const router = useRouter();
  // App mode and NOK state
  const [appMode, setAppMode] = useState<AppMode>('owner_login');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentNOK, setCurrentNOK] = useState<any>(null);
  const [pendingNOK, setPendingNOK] = useState<any>(null);
  const [showOwnerNotification, setShowOwnerNotification] = useState(false);
  const [showRevocationModal, setShowRevocationModal] = useState(false);
  const [revocationReason, setRevocationReason] = useState('');
  const [nokSessionTime, setNokSessionTime] = useState(15 * 60); // 15 minutes
  const [nokActiveSection, setNokActiveSection] = useState<string | null>(null);
  const [showOwnerLetter, setShowOwnerLetter] = useState(false);
  const [showMessagesDelivery, setShowMessagesDelivery] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [tourStarted, setTourStarted] = useState(false);
  const derivedRole = useMemo(() => {
    if (appMode === 'owner') return 'owner';
    if (appMode === 'nok_dashboard' || appMode === 'nok_section_view')
      return 'nextkin';
    return null;
  }, [appMode]);

  const { startTour, activeRole } = useOnboarding();

  const { data: status, isLoading: loading } = useGetTourStatusQuery();
  const [updateStatus] = useUpdateTourStatusMutation();

  // backed next kin handler
  const [nextkinLogin] = useNextkinLoginMutation();

  const { data: myNextKin, refetch: refetchNextKin } = useGetMyNextKinQuery(
    undefined,
    {
      skip: appMode !== 'owner',
    },
  );
  const firstNokId = myNextKin?.[0]?.id;

  const sectionSaveMap: Record<
    string,
    (token: string, data: any) => Promise<any>
  > = {
    '1': async (token, data) =>
      saveSection1(token, mapUIToSection1Payload(data)),

    '5': saveSection5,
    '6': async (token, data) => saveSection6(token, { '6A': data?.['6A'] }),
    '7': async (token, data) => saveSection7(token, { '7A': data?.['7A'] }),
    '8': async (token, data) => saveSection8(token, { '8A': data?.['8A'] }),
    '9': async (token, data) => saveSection9(token, { '9A': data?.['9A'] }),
    '10': async (token, data) => saveSection10(token, { '10A': data?.['10A'] }),
    '11': async (token, data) => saveSection11(token, { '11A': data?.['11A'] }),
    '12': async (token, data) =>
      saveSection12(token, {
        ...(data?.['12A'] && { '12A': data['12A'] }),
        ...(data?.['12B'] && { '12B': data['12B'] }),
      }),
    '13': async (token, data) => saveSection13(token, { '13A': data?.['13A'] }),
    '14': async (token, data) => saveSection14(token, { '14A': data?.['14A'] }),
    '15': async (token, data) =>
      saveSection15(token, {
        ...(data?.['15A'] && { '15A': data['15A'] }),
        ...(data?.['15B'] && { '15B': data['15B'] }),
      }),
    '16': async (token, data) =>
      saveSection16(token, {
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
  const skipInitialContextualNavigation = useRef(true);
  type DashboardFormData = Record<string, any>;

  const [formData, setFormData] = useState<DashboardFormData>({});
  const contextualStep = useMemo(() => {
    if (appMode !== 'owner') return null;
    return shouldTriggerContextualTour(formData, myNextKin || []);
  }, [formData, myNextKin, appMode]);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [disabledSections, setDisabledSections] = useState<
    Record<string, boolean>
  >({});
  const [disabledSubsections, setDisabledSubsections] = useState<
    Record<string, boolean>
  >({});
  const [collapsedSubsections, setCollapsedSubsections] = useState<
    Record<string, boolean>
  >({ '17E': true }); // Start with 17E collapsed
  const allSections = VAULT_NAVIGATION;
  // Sections that include obituary content (marked with dove symbol)
  const obituarySections = useMemo(
    () => new Set(['7', '8', '9', '10', '16']),
    [],
  );
  const obituarySubsections = useMemo(() => new Set(['20B']), []);

  const { data: dashboardNokLetter } = useGetNokLetterQuery(
    firstNokId ? { nokId: firstNokId } : undefined,
  );
  useEffect(() => {
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
    )
      return;

    const token = Cookies.get('auth_token') || Cookies.get('nok_auth_token');
    if (!token) return;

    getSection1(token).then(res => {
      setFormData(prev => ({
        ...prev,
        '1': mapSection1ResponseToUI(res),
      }));
    });
    getSection5(token)
      .then(res => {
        if (res?.data) {
          setFormData(prev => ({
            ...prev,
            '5': res.data,
          }));
        }
      })
      .catch(err => {
        console.error('Failed to load Section 5', err);
      });
    getSection6(token).then(res => {
      setFormData(prev => ({
        ...prev,
        '6': res.data,
      }));
    });
    getSection7(token).then(res => {
      setFormData(prev => ({
        ...prev,
        '7': res.data,
      }));
    });
    getSection8(token).then(res => {
      setFormData(prev => ({
        ...prev,
        '8': res.data,
      }));
    });
    getSection9(token).then(res => {
      setFormData(prev => ({
        ...prev,
        '9': res.data,
      }));
    });
    getSection10(token).then(res => {
      setFormData(prev => ({
        ...prev,
        '10': res.data,
      }));
    });
    getSection11(token).then(res => {
      setFormData(prev => ({
        ...prev,
        '11': res.data,
      }));
    });
    getSection12(token).then(res => {
      if (res?.data) {
        setFormData(prev => ({
          ...prev,
          '12': res.data,
        }));
      }
    });
    getSection13(token).then(res => {
      if (res?.data) {
        setFormData(prev => ({
          ...prev,
          '13': res.data,
        }));
      }
    });
    getSection14(token).then(res => {
      if (res?.data) {
        setFormData(prev => ({
          ...prev,
          '14': res.data,
        }));
      }
    });
    getSection15(token).then(res => {
      if (res?.data) {
        setFormData(prev => ({
          ...prev,
          '15': res.data,
        }));
      }
    });
    getSection16(token).then(res => {
      if (res?.data) {
        setFormData(prev => ({
          ...prev,
          '16': res.data,
        }));
      }
    });
    getSection17(token).then(res => {
      if (res?.data) {
        setFormData(prev => ({
          ...prev,
          '17': res.data,
        }));
      }
    });
    getSection18(token).then(res => {
      if (res?.data) {
        setFormData(prev => ({
          ...prev,
          '18': res.data,
        }));
      }
    });
    getSection19(token).then(res => {
      if (res?.data) {
        setFormData(prev => ({
          ...prev,
          '19': res.data,
        }));
      }
    });
    getSection20(token).then(res => {
      if (res?.data) {
        setFormData(prev => ({
          ...prev,
          '20': res.data,
        }));
      }
    });
    getSection21(token)
      .then(res => {
        if (res?.data) {
          setFormData(prev => ({
            ...prev,
            '21': res.data,
          }));
        }
      })
      .catch(err => {
        console.error('Failed to load Section 12', err);
      });
  }, [activeSection]);

  // Timer refs for cleanup
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const nokTimerRef = useRef<NodeJS.Timeout | null>(null);

  const autoSave = useCallback(async () => {
    if (appMode !== 'owner') return; // Only auto-save for owner mode

    setAutoSaving(true);
    try {
      // localStorage.setItem('orderlyAffairsData', JSON.stringify(formData));
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
    if (!activeSection || activeSection === 'dashboard') return;
    if (!sectionSaveMap[activeSection]) return;

    const token = Cookies.get('auth_token');
    if (!token) return;

    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }

    autoSaveRef.current = setTimeout(async () => {
      try {
        setAutoSaving(true);

        const sectionData = formData[activeSection];
        if (!sectionData) return;

        await sectionSaveMap[activeSection](token, sectionData);

        setLastSaved(new Date());
      } catch (err) {
        console.error('Auto-save failed:', err);
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

  //  Load backend auth (JWT) instead of localStorage
  useEffect(() => {
    // Check NOK first (so a NOK can be logged in while owner is also logged in)
    const nokToken = Cookies.get('nok_auth_token');
    if (nokToken) {
      try {
        const d = JSON.parse(atob(nokToken.split('.')[1]));
        if (d?.role === 'nextkin') {
          setCurrentNOK({ email: d.sub, owner_id: d.owner_id });
          setAppMode('nok_dashboard');
          return;
        }
      } catch (e) {
        /* ignore */
      }
    }

    // Fallback to owner
    const ownerToken = Cookies.get('auth_token');
    if (ownerToken) {
      try {
        const d = JSON.parse(atob(ownerToken.split('.')[1]));
        if (d?.role === 'owner') {
          setCurrentUser({ email: d.sub });
          setActiveSection('dashboard');
          setActiveSubsection(null);
          setSidebarOpen(false);
          setMobileMoreOpen(false);
          skipInitialContextualNavigation.current = true;
          setAppMode('owner');
          return;
        }
      } catch (e) {
        /* ignore */
      }
    }

    setAppMode('owner_login');
  }, [router]);

  // Load form data when switching to owner mode
  useEffect(() => {
    if (appMode === 'owner') {
      const saved = localStorage.getItem('orderlyAffairsData');
      const savedDisabled = localStorage.getItem(
        'orderlyAffairsDisabledSections',
      );
      const savedDisabledSubsections = localStorage.getItem(
        'orderlyAffairsDisabledSubsections',
      );
      const savedCollapsedSubsections = localStorage.getItem(
        'orderlyAffairsCollapsedSubsections',
      );

      if (saved) {
        try {
          const parsedData = JSON.parse(saved);
          setFormData(parsedData);
          setLastSaved(new Date());
        } catch (error) {
          console.error('Error loading saved data:', error);
        }
      }
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
    }
  }, [appMode]); // Only when appMode changes to 'owner'

  // Optimized update functions
  const updateSectionData = useCallback((sectionId: string, data: any) => {
    setFormData(prev => ({ ...prev, [sectionId]: data }));
  }, []);

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
  const handleNokLogin = useCallback(
    async (loginData: { email: string; password: string }) => {
      try {
        const result = await nextkinLogin({
          email: loginData.email,
          master_password: loginData.password,
        }).unwrap();

        if (result.access_token) {
          Cookies.set('nok_auth_token', result.access_token, {
            expires: 7,
            secure: true,
            sameSite: 'strict',
            path: '/',
          });

          const decoded = JSON.parse(atob(result.access_token.split('.')[1]));
          if (decoded?.role === 'nextkin') {
            setCurrentNOK({
              email: decoded.sub,
              owner_id: decoded.owner_id,
            });
            setAppMode('nok_dashboard');
            router.push('/dashboard');
            toast.success(`Welcome back, ${decoded.email}!`);
          } else {
            toast.error('Invalid role in token.');
            setAppMode('nok_login');
          }
        } else {
          toast.error('No token received from server.');
        }
      } catch (error: any) {
        toast.error(
          error?.data?.message ||
            'Login failed. Please check your credentials.',
        );
      }
    },
    [nextkinLogin, router],
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
  const handleNokLogout = useCallback(() => {
    try {
      nextkinLogout({});
    } catch {}
    Cookies.remove('nok_auth_token', { path: '/' });
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

  const handleOwnerLogout = () => {
    try {
      ownerLogout({});
    } catch {}
    Cookies.remove('auth_token', { path: '/' });
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
  useEffect(() => {
    const stored = localStorage.getItem('instruction_read');
    if (stored === 'true') {
      setInstructionRead(true);
    }
  }, []);

  useEffect(() => {
    if (instructionRead) {
      localStorage.setItem('instruction_read', 'true');
    }
  }, [instructionRead]);

  // Simplified section completion status function
  const getSectionCompletionStatus = useCallback(
    (sectionId: string) => {
      if (disabledSections[sectionId]) return true;

      // 🔥 SPECIAL CASE: INSTRUCTIONS
      if (sectionId === '0') {
        return instructionRead;
      }

      if (sectionId === '2') {
        return Array.isArray(myNextKin) && myNextKin.length > 0;
      }

      const sectionData = formData[sectionId];
      if (!sectionData) return false;

      return Object.keys(sectionData).length > 0;
    },
    [formData, disabledSections, myNextKin, instructionRead],
  );

  // Simplified progress calculation to avoid performance issues
  const progress = useMemo(() => {
    if (!allSections.length) return 0;

    try {
      const completed = allSections.filter(section =>
        getSectionCompletionStatus(section.id),
      ).length;
      return Math.round((completed / allSections.length) * 100);
    } catch (e) {
      console.error('Progress calculation error:', e);
      return 0;
    }
  }, [allSections.length, formData, disabledSections, myNextKin]);

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
        return `${sub.id}. ${sub.title}`;
      }
    }

    return `${section.id}. ${section.title}`;
  }, [activeSection, activeSubsection, allSections]);
  useEffect(() => {
    if (appMode === 'owner') {
      setActiveSection('dashboard');
      setActiveSubsection(null);
      setSidebarOpen(false);
      setMobileMoreOpen(false);
      skipInitialContextualNavigation.current = true;
    }
  }, [appMode]);

  useEffect(() => {
    if (!contextualStep) return;

    if (skipInitialContextualNavigation.current) {
      skipInitialContextualNavigation.current = false;
      return;
    }

    if (contextualStep === 'assign_nok') {
      setActiveSection('2');
    }

    if (contextualStep === 'create_messages') {
      setActiveSection('4');
    }
  }, [contextualStep]);

  useEffect(() => {
    console.log('NextKin loaded:', myNextKin);
  }, [myNextKin]);

  const manualSave = useCallback(async () => {
    try {
      setAutoSaving(true);

      const token = Cookies.get('auth_token');
      if (!token) return;

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
          await deleteUpload(token, public_id);
        } catch (err) {
          console.error('Cloudinary delete failed:', public_id, err);
        }
      }

      // 🔐 SAVE SECTION 1
      if (formData['1']) {
        await saveSection1(token, mapUIToSection1Payload(formData['1']));
      }

      // 🚗 SAVE SECTION 5 (Vehicles)
      if (formData['5']) {
        await saveSection5(token, formData['5']);
      }
      // 🚗 SAVE SECTION 5 (Vehicles)
      if (formData['6']?.['6A']) {
        await saveSection6(token, {
          '6A': formData['6']['6A'],
        });
      }
      // 🛡️ SAVE SECTION 7 (Insurance Policies)
      if (formData['7']?.['7A']) {
        await saveSection7(token, {
          '7A': formData['7']['7A'],
        });
      }
      // 🛡️ SAVE SECTION 8 (Insurance Policies)
      if (formData['8']?.['8A']) {
        await saveSection8(token, {
          '8A': formData['8']['8A'],
        });
      }
      // 🛡️ SAVE SECTION 9 (Insurance Policies)
      if (formData['9']?.['9A']) {
        await saveSection9(token, {
          '9A': formData['9']['9A'],
        });
      }
      // 🛡️ SAVE SECTION 10 (Insurance Policies)
      if (formData['10']?.['10A']) {
        await saveSection10(token, {
          '10A': formData['10']['10A'],
        });
      }
      // 🛡️ SAVE SECTION 11 (Insurance Policies)
      if (formData['11']?.['11A']) {
        await saveSection11(token, {
          '11A': formData['11']['11A'],
        });
      }
      // 🏦 SAVE SECTION 12 (Banking & Financial Accounts)
      if (formData['12']?.['12A'] || formData['12']?.['12B']) {
        await saveSection12(token, {
          ...(formData['12']['12A'] && { '12A': formData['12']['12A'] }),
          ...(formData['12']['12B'] && { '12B': formData['12']['12B'] }),
        });
      }
      // 🛡️ SAVE SECTION 13 (Insurance Policies)
      if (formData['13']?.['13A']) {
        await saveSection13(token, {
          '13A': formData['13']['13A'],
        });
      }
      // 🛡️ SAVE SECTION 14 (Insurance Policies)
      if (formData['14']?.['14A']) {
        await saveSection14(token, {
          '14A': formData['14']['14A'],
        });
      }
      // 🏥 SAVE SECTION 15 (Health Information)
      if (formData['15']?.['15A'] || formData['15']?.['15B']) {
        await saveSection15(token, {
          ...(formData['15']['15A'] && { '15A': formData['15']['15A'] }),
          ...(formData['15']['15B'] && { '15B': formData['15']['15B'] }),
        });
      }
      // 🏥 SAVE SECTION 16 (Health Information)
      if (formData['16']?.['16A'] || formData['16']?.['16B']) {
        await saveSection16(token, {
          ...(formData['16']['16A'] && { '16A': formData['16']['16A'] }),
          ...(formData['16']['16B'] && { '16B': formData['16']['16B'] }),
        });
      }
      // SAVE SECTION 17 (Family & Treasured Connections)
      if (formData['17']) {
        await saveSection17(token, formData['17']);
      }
      // SAVE SECTION 18 (Employment & Business)
      if (formData['18']) {
        await saveSection18(token, formData['18']);
      }
      // SAVE SECTION 19 (Employment & Business)
      if (formData['19']) {
        await saveSection19(token, formData['19']);
      }
      // SAVE SECTION 20 (Legal Documents)
      if (formData['20']) {
        await saveSection20(token, formData['20']);
      }
      // SAVE SECTION 21
      if (formData['21']) {
        await saveSection21(token, formData['21']);
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
      toast.success('Saved successfully!');
    } catch (error) {
      console.error('Manual save failed:', error);
      toast.error('Save failed. Please try again.');
    } finally {
      setAutoSaving(false);
    }
  }, [formData, disabledSections, disabledSubsections, collapsedSubsections]);

  const exportData = useCallback(() => {
    try {
      const exportData = {
        formData,
        disabledSections,
        disabledSubsections,
        exportDate: new Date().toISOString(),
      };
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'orderly-affairs-data.json';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    }
  }, [formData, disabledSections, disabledSubsections]);

  const clearSectionData = useCallback(
    (sectionId: string, subsectionId?: string) => {
      const confirmed = window.confirm(
        subsectionId
          ? `Are you sure you want to clear all data from subsection ${subsectionId}? This action cannot be undone.`
          : `Are you sure you want to clear all data from section ${sectionId}? This action cannot be undone.`,
      );

      if (confirmed) {
        // Clear from React state
        setFormData(prev => {
          const newData = { ...prev };

          if (subsectionId) {
            // Clear specific subsection
            if (newData[sectionId]) {
              const { [subsectionId]: _, ...rest } = newData[sectionId];
              if (Object.keys(rest).length === 0) {
                // If this was the only subsection, remove the entire section
                const { [sectionId]: __, ...sectionRest } = newData;
                return sectionRest;
              } else {
                newData[sectionId] = rest;
              }
            }
          } else {
            // Clear entire section
            const { [sectionId]: _, ...rest } = newData;
            return rest;
          }

          return newData;
        });

        // Clear from localStorage
        try {
          const currentData = JSON.parse(
            localStorage.getItem('orderlyAffairsData') || '{}',
          );
          if (subsectionId) {
            if (
              currentData[sectionId] &&
              currentData[sectionId][subsectionId]
            ) {
              delete currentData[sectionId][subsectionId];
              if (Object.keys(currentData[sectionId]).length === 0) {
                delete currentData[sectionId];
              }
            }
          } else {
            delete currentData[sectionId];
          }
          localStorage.setItem(
            'orderlyAffairsData',
            JSON.stringify(currentData),
          );
        } catch (error) {
          console.error('Error clearing localStorage:', error);
        }

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

  // Render NOK Login Page
  if (appMode === 'nok_login') {
    return (
      <>
        <NextOfKinLoginPage
          onLoginSuccess={handleNokLogin}
          onBackToOwner={handleBackToOwner}
          formData={formData}
        />
        {showRevocationModal && (
          <RevocationModal
            reason={revocationReason}
            onClose={handleNokLogout}
          />
        )}
      </>
    );
  }

  // Render NOK Dashboard
  if (appMode === 'nok_dashboard' && currentNOK) {
    return (
      <>
        <EnhancedNOKDashboard
          kit={{}}
          nokData={currentNOK}
          formData={formData}
          onViewSection={handleNokSectionView}
          onLogout={handleNokLogout}
          onOwnerLetterAccess={() => setShowOwnerLetter(true)}
          onDeliverMessages={() => setShowMessagesDelivery(true)}
          sessionTime={nokSessionTime}
        />

        {/* Owner Letter Modal */}
        {showOwnerLetter && (
          <OwnerLetterModal
            nokData={currentNOK}
            onClose={() => setShowOwnerLetter(false)}
          />
        )}

        {/* Messages Delivery Modal */}
        {showMessagesDelivery && (
          <MessagesDeliveryModal
            nokData={currentNOK}
            formData={formData}
            kit={{
              messages: formData?.['4']?.['4A']?.messages || [],
            }}
            onClose={() => setShowMessagesDelivery(false)}
          />
        )}

        {/* Revocation Modal */}
        {showRevocationModal && (
          <RevocationModal
            reason={revocationReason}
            onClose={handleNokLogout}
          />
        )}
      </>
    );
  }

  // Render NOK Section View
  if (appMode === 'nok_section_view' && currentNOK && nokActiveSection) {
    return (
      <>
        <EnhancedSectionView
          sectionId={nokActiveSection}
          nokData={currentNOK}
          formData={formData}
          kit={{
            sections: Object.entries(formData).map(([id, data]) => ({
              id,
              data,
              subsections:
                typeof data === 'object' && data !== null
                  ? Object.entries(data).map(([subId, subData]) => ({
                      id: subId,
                      data: subData,
                    }))
                  : [],
            })),
          }}
          onBack={handleNokBackToDashboard}
          onLogout={handleNokLogout}
          onOwnerLetterAccess={() => setShowOwnerLetter(true)}
          onDeliverMessages={() => setShowMessagesDelivery(true)}
          sessionTime={nokSessionTime}
        />

        {/* Owner Letter Modal */}
        {showOwnerLetter && (
          <OwnerLetterModal
            nokData={currentNOK}
            onClose={() => setShowOwnerLetter(false)}
          />
        )}

        {/* Messages Delivery Modal */}
        {showMessagesDelivery && (
          <MessagesDeliveryModal
            kit={{
              messages: formData?.['4']?.['4A']?.messages || [],
            }}
            nokData={currentNOK}
            formData={formData}
            onClose={() => setShowMessagesDelivery(false)}
          />
        )}

        {/* Revocation Modal */}
        {showRevocationModal && (
          <RevocationModal
            reason={revocationReason}
            onClose={handleNokLogout}
          />
        )}
      </>
    );
  }

  if (appMode === 'test_mfa') {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1>🔐 Multi-Factor Authentication Test</h1>
              <Button onClick={() => setAppMode('owner')} variant="outline">
                Back to App
              </Button>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6">
          <MFATestComponent />
        </div>
      </div>
    );
  }

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
          />
        );
      case '1':
        return (
          <Section1VitalInformation
            data={formData['1'] || {}}
            onChange={data => updateSectionData('1', data)}
            activeSubsection={activeSubsection as any}
          />
        );
      case '2':
        return (
          <Section2AccessManagement
            data={formData['2'] || {}}
            onChange={data => updateSectionData('2', data)}
          />
        );
      case '3':
        return (
          <Section3NextKinLetter
            data={formData['3'] || {}}
            onChange={data => updateSectionData('3', data)}
          />
        );
      case '4':
        return (
          <Section4NextKInMessages
            data={formData['4'] || {}}
            fullFormData={formData}
            onChange={data => updateSectionData('4', data)}
            isActive={!activeSubsection || activeSubsection === '4A'}
          />
        );

      case '5':
        return (
          <Section5Vehicles
            data={formData['5'] || {}}
            onChange={data => updateSectionData('5', data)}
            activeSubsection={activeSubsection}
          />
        );
      case '6':
        return (
          <Section6MainResidences
            data={formData['6'] || {}}
            onChange={data => updateSectionData('6', data)}
            activeSubsection={activeSubsection}
          />
        );
      case '7':
        return (
          <Section7InsurancePolicies
            data={formData['7'] || {}}
            onChange={data => updateSectionData('7', data)}
            activeSubsection={activeSubsection}
          />
        );
      case '8':
        return (
          <Section8CommunityMembership
            data={formData['8'] || {}}
            onChange={data => updateSectionData('8', data)}
            activeSubsection={activeSubsection}
          />
        );
      case '8':
        return (
          <Section8CommunityMembership
            data={formData['8'] || {}}
            onChange={data => updateSectionData('8', data)}
            activeSubsection={activeSubsection}
          />
        );
      case '9':
        return (
          <Section9CharitableGiving
            data={formData['9'] || {}}
            onChange={data => updateSectionData('9', data)}
            activeSubsection={activeSubsection}
          />
        );
      case '10':
        return (
          <Section10EducationAccomplishments
            data={formData['10'] || {}}
            onChange={data => updateSectionData('10', data)}
            activeSubsection={activeSubsection}
          />
        );
      case '11':
        return (
          <Section11MilitaryService
            data={formData['11'] || {}}
            onChange={data => updateSectionData('11', data)}
            activeSubsection={activeSubsection}
          />
        );
      case '12':
        return (
          <Section12BankingFinancialAccounts
            data={formData['12'] || {}}
            onChange={data => updateSectionData('12', data)}
            activeSubsection={activeSubsection}
          />
        );
      case '13':
        return (
          <Section13PasswordsOnlineAccounts
            data={formData['13'] || {}}
            onChange={data => updateSectionData('13', data)}
            activeSubsection={activeSubsection}
          />
        );
      case '14':
        return (
          <Section14InvestmentAccounts
            data={formData['14'] || {}}
            onChange={data => updateSectionData('14', data)}
            activeSubsection={activeSubsection}
          />
        );
      case '15':
        return (
          <Section15HealthInformation
            data={formData['15'] || {}}
            onChange={data => updateSectionData('15', data)}
            activeSubsection={activeSubsection}
          />
        );
      case '16':
        return (
          <Section16CreditCardsDebt
            data={formData['16'] || {}}
            onChange={data => updateSectionData('16', data)}
            activeSubsection={activeSubsection}
          />
        );
      case '17':
        return (
          <Section17FamilyTreasuredConnections
            data={formData['17'] || {}}
            onChange={data => updateSectionData('17', data)}
            activeSubsection={activeSubsection}
          />
        );
      case '18':
        return (
          <Section18EmploymentBusiness
            data={formData['18'] || {}}
            onChange={data => updateSectionData('18', data)}
            activeSubsection={activeSubsection}
          />
        );
      case '19':
        return (
          <Section19AssetsValuables
            data={formData['19'] || {}}
            onChange={data => updateSectionData('19', data)}
            activeSubsection={activeSubsection}
          />
        );
      case '20':
        return (
          <Section20LegalDocumentsRecords
            data={formData['20'] || {}}
            onChange={data => updateSectionData('20', data)}
            activeSubsection={activeSubsection}
          />
        );
      case '21':
        return (
          <Section21EstatePlanningFinalWishes
            data={formData['21'] || {}}
            onChange={data => updateSectionData('21', data)}
            activeSubsection={activeSubsection}
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

  const completedSectionsCount = allSections.filter(s =>
    getSectionCompletionStatus(s.id),
  ).length;

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
        return 'Document military service details, deployments, records, DD-214 documents, VA benefits, and service legacy information.';
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

  const goToDashboard = () => {
    setActiveSection('dashboard');
    setActiveSubsection(null);
    setSidebarOpen(false);
    setMobileMoreOpen(false);
  };

  const goToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setActiveSubsection(null);
    setSidebarOpen(false);
    setMobileMoreOpen(false);
  };

  const goToSubsection = (sectionId: string, subsectionId: string) => {
    setActiveSection(sectionId);
    setActiveSubsection(subsectionId);
    setSidebarOpen(false);
    setMobileMoreOpen(false);

    setTimeout(() => {
      const element = document.getElementById(`subsection-${subsectionId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <>
      <div className="min-h-screen bg-[#f6f8fb] text-slate-950 pb-24 md:pb-0">
        {/* Mobile header — matches the clean app-style screenshot */}
        <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl md:hidden">
          <div className="flex h-[74px] items-center justify-between px-4">
            <button
              type="button"
              onClick={goToDashboard}
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 active:scale-95"
              aria-label="Go to dashboard overview"
            >
              <Image
                src="/images/brand-logo.png"
                alt="Orderly Affairs Logo"
                width={42}
                height={42}
                className="h-9 w-9 object-contain"
                priority
              />
            </button>

            <div className="min-w-0 flex-1 px-3 text-center">
              <h1 className="truncate text-[14px] font-semibold leading-5 text-[#10213f]">
                {activeSection === 'dashboard'
                  ? 'Dashboard'
                  : currentSectionLabel}
              </h1>
              <p className="truncate text-[11px] font-medium text-slate-400">
                {activeSection === 'dashboard'
                  ? 'Overview'
                  : activeSubsection
                    ? 'Subsection'
                    : 'Section'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMobileMoreOpen(prev => !prev)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#10213f] shadow-sm ring-1 ring-slate-200/80 active:scale-95"
              aria-label="Open account menu"
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden border-b border-slate-200/80 bg-white/95 backdrop-blur-xl relative z-9999 md:block">
          <div className="flex h-[76px] items-center justify-between pl-[304px] pr-6 xl:pr-10">
            <div className="flex min-w-0 items-center gap-4">
              <div className="hidden items-center gap-3 xl:flex">
                <Image
                  src="/images/brand-logo.png"
                  alt="Orderly Affairs Logo"
                  width={120}
                  height={64}
                  className="h-14 w-auto object-contain"
                  priority
                />
                <div className="h-8 w-px bg-slate-200" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Current Area
                </p>
                <h1 className="mt-1 truncate text-[18px] font-semibold text-[#10213f]">
                  {currentSectionLabel}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-2 lg:flex">
                <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200">
                  <Progress value={progress} className="h-full w-full" />
                </div>
                <span className="text-xs font-semibold text-[#10213f]">
                  {progress}%
                </span>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await updateStatus({ manually_started: true });
                  startTour(derivedRole ?? 'owner');
                  setTourStarted(true);
                }}
                className="rounded-2xl bg-[#10213f] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
              >
                Run Tour
              </button>

              <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={manualSave}
                  className="owners-states-save flex h-9 items-center gap-2 rounded-xl px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600 transition hover:bg-slate-50 hover:text-[#10213f] active:scale-95"
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden xl:inline">
                    {autoSaving ? 'Saving...' : 'Save'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={exportData}
                  className="owners-states-export flex h-9 items-center gap-2 rounded-xl px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600 transition hover:bg-slate-50 hover:text-[#10213f] active:scale-95"
                >
                  <ExportIcon />
                  <span className="hidden xl:inline">Export</span>
                </button>
              </div>

              <div className="owner-state-information group relative">
                <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[#10213f] shadow-sm transition hover:ring-4 hover:ring-slate-100">
                  <User className="h-5 w-5" />
                </button>

                <div className="invisible absolute right-0 top-full z-[60] mt-3 translate-y-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="min-w-[230px] rounded-3xl border border-slate-100 bg-white p-2 shadow-2xl">
                    <div className="mb-1 border-b border-slate-100 px-4 py-3">
                      {currentUser && (
                        <p className="truncate text-[12px] font-semibold text-[#10213f]">
                          {currentUser.email}
                        </p>
                      )}
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Premium Member
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => goToSection('vault-settings')}
                      className="w-full rounded-2xl px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-600 transition hover:bg-slate-50 hover:text-[#10213f]"
                    >
                      Account Info
                    </button>

                    <button
                      type="button"
                      onClick={() => goToSection('vault-settings')}
                      className="w-full rounded-2xl px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-600 transition hover:bg-slate-50 hover:text-[#10213f]"
                    >
                      Security Keys
                    </button>

                    <button
                      type="button"
                      onClick={handleOwnerLogout}
                      className="w-full rounded-2xl px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-rose-500 transition hover:bg-rose-50"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex min-h-[calc(100vh-76px)]">
          {/* Sidebar drawer */}
          <aside
            className={`sidebar-navigation fixed inset-y-0 left-0 z-[70] w-[88vw] max-w-[330px] transform border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:w-72 lg:max-w-none lg:translate-x-0 lg:shadow-none ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Image
                      src="/images/brand-logo.png"
                      alt="Orderly Affairs Logo"
                      width={44}
                      height={44}
                      className="h-10 w-10 object-contain"
                    />
                    <div className="min-w-0">
                      <h2 className="truncate text-[14px] font-semibold text-[#10213f]">
                        Vault Navigation
                      </h2>
                      <p className="text-[11px] font-medium text-slate-400">
                        {completedSectionsCount} of {allSections.length}{' '}
                        completed
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 lg:hidden"
                    aria-label="Close navigation"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <Progress value={progress} className="h-full w-full" />
                  </div>
                  <span className="text-xs font-semibold text-[#10213f]">
                    {progress}%
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-4">
                <button
                  type="button"
                  onClick={goToDashboard}
                  className={`owner-dashboard-item mb-3 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${
                    activeSection === 'dashboard'
                      ? 'bg-[#10213f] text-white shadow-lg shadow-slate-900/10'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                      <Home className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold">
                      Dashboard Overview
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </button>

                <div className="space-y-2">
                  {allSections.map(section => {
                    const isSelected =
                      activeSection === section.id && !activeSubsection;
                    const isExpanded =
                      activeSection === section.id &&
                      !disabledSections[section.id];
                    const isComplete = getSectionCompletionStatus(section.id);

                    return (
                      <div
                        key={`main-section-${section.id}`}
                        className="space-y-1"
                      >
                        <button
                          type="button"
                          onClick={() => goToSection(section.id)}
                          className={`section-${section.id}-nav flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                            isSelected
                              ? 'bg-[#10213f] text-white shadow-lg shadow-slate-900/10'
                              : 'text-slate-700 hover:bg-slate-50'
                          } ${disabledSections[section.id] ? 'opacity-55' : ''}`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                              isSelected ? 'bg-white/15' : 'bg-slate-100'
                            }`}
                          >
                            {isComplete ? (
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {(obituarySections.has(section.id) ||
                                hasDoveTag(section.id)) && (
                                <span className="mr-1">🕊️</span>
                              )}
                              {section.id}. {section.title}
                            </span>
                            {disabledSections[section.id] && (
                              <span className="text-[10px] font-semibold text-slate-400">
                                Not Applicable
                              </span>
                            )}
                          </span>
                        </button>

                        {section.subsections && isExpanded && (
                          <div className="ml-4 space-y-1 border-l border-slate-100 pl-3">
                            {section.subsections.map((subsection: any) => (
                              <button
                                key={`section-${section.id}-subsection-${subsection.id}`}
                                type="button"
                                onClick={() =>
                                  goToSubsection(section.id, subsection.id)
                                }
                                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                                  activeSubsection === subsection.id
                                    ? 'bg-slate-100 font-semibold text-[#10213f]'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                } ${disabledSubsections[subsection.id] ? 'opacity-50' : ''}`}
                              >
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
                                <span className="min-w-0 flex-1 truncate">
                                  {(obituarySubsections.has(subsection.id) ||
                                    hasDoveTag(section.id, subsection.id)) && (
                                    <span className="mr-1">🕊️</span>
                                  )}
                                  {subsection.id}. {subsection.title}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Drawer overlay */}
          {sidebarOpen && (
            <button
              type="button"
              className="fixed inset-0 z-[60] bg-slate-950/55 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation overlay"
            />
          )}

          {/* Main content */}
          <main className="min-w-0 flex-1">
            <div className="mx-auto w-full max-w-[1480px] px-4 py-4 sm:px-5 md:px-6 md:py-6 lg:px-8 xl:px-10">
              {activeSection === 'dashboard' ? (
                <div className="owner-dashboard-overview-area space-y-5 md:space-y-6">
                  <div className="rounded-[28px] border border-white/70 bg-white p-4 shadow-sm sm:p-6 md:hidden">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Orderly Affairs
                        </p>
                        <h2 className="mt-1 text-[22px] font-semibold leading-tight text-[#10213f]">
                          Dashboard Overview
                        </h2>
                      </div>
                      {progress === 100 ? (
                        <Badge variant="default" className="bg-emerald-500">
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="outline">{progress}%</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                        <Progress value={progress} className="h-full w-full" />
                      </div>
                      <span className="text-xs font-semibold text-[#10213f]">
                        {completedSectionsCount}/{allSections.length}
                      </span>
                    </div>
                  </div>

                  <DataBindingDashboard
                    formData={formData}
                    nextKinList={myNextKin || []}
                    nokLetter={dashboardNokLetter || null}
                    nextTask={nextTask}
                    onNavigateToSection={sectionId => goToSection(sectionId)}
                  />
                </div>
              ) : activeSection === 'vault-settings' ? (
                <div className="space-y-5">
                  <div className="rounded-[28px] border border-white/70 bg-white p-5 shadow-sm sm:p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Secure Account
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-[#10213f] md:text-3xl">
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
                  <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-sm">
                    <div className="relative p-5 sm:p-6 md:p-7">
                      <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-[60px] bg-[#10213f]/5" />
                      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#10213f] px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white">
                              Section {currentSection.id}
                            </span>
                            {activeSubsection && (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
                                {activeSubsection}
                              </span>
                            )}
                          </div>

                          <h2 className="text-[24px] font-semibold leading-tight text-[#10213f] sm:text-[30px] md:text-[34px]">
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
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={manualSave}
                            className="rounded-2xl border-slate-200 bg-white px-4"
                          >
                            <Save className="mr-2 h-4 w-4" />
                            {autoSaving ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={exportData}
                            className="rounded-2xl border-slate-200 bg-white px-4"
                          >
                            <ExportIcon />
                            <span className="ml-2">Export</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div
                    className={`transition-all duration-300 ${
                      disabledSections[activeSection]
                        ? 'pointer-events-none select-none opacity-30'
                        : ''
                    }`}
                  >
                    {renderSection()}
                  </div>

                  {activeSection === '11' && (
                    <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-[#10213f]">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[#10213f]">
                            VA Burial Benefits Information
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Open official VA information in a new tab.
                          </p>
                        </div>
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
                        className="rounded-2xl"
                      >
                        Open VA Info
                      </Button>
                    </div>
                  )}

                  {activeSection === '11' && (
                    <label className="flex cursor-pointer items-start gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                      <input
                        type="checkbox"
                        id="military-service-opt-out"
                        checked={disabledSections['11'] || false}
                        onChange={e =>
                          toggleSectionDisabled('11', e.target.checked)
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-[#10213f]">
                          I have not served in the military.
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-slate-500">
                          Check this box if you have never served in any branch
                          of the military. This marks the section as not
                          applicable.
                        </span>
                      </span>
                    </label>
                  )}

                  {activeSection === '4' && formData['4']?.['4A'] && (
                    <div className="flex flex-col gap-3 rounded-[24px] border border-rose-100 bg-rose-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-rose-700">
                          Clear Personal Messages Data
                        </h3>
                        <p className="mt-1 text-sm text-rose-600/80">
                          Clear all personal messages data to start fresh.
                        </p>
                      </div>
                      <Button
                        onClick={() => clearSectionData('4', '4A')}
                        variant="destructive"
                        size="sm"
                        className="rounded-2xl"
                      >
                        Clear Messages
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
                  <p className="mt-1 truncate text-sm font-semibold text-[#10213f]">
                    {currentUser.email}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => goToSection('vault-settings')}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-[#10213f]"
                >
                  Vault Settings <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={manualSave}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-[#10213f]"
                >
                  Save Now <Save className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={exportData}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-[#10213f]"
                >
                  Export Data <ExportIcon />
                </button>
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
        <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[24px] border border-white/80 bg-white/95 px-3 py-2 shadow-[0_16px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl md:hidden">
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={goToDashboard}
              className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 transition active:scale-95 ${
                activeSection === 'dashboard'
                  ? 'text-[#10213f]'
                  : 'text-slate-400'
              }`}
            >
              <Home className="h-5 w-5" />
              <span className="mt-1 text-[10px] font-semibold">Home</span>
            </button>

            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-slate-500 transition active:scale-95"
            >
              <LayoutList className="h-5 w-5" />
              <span className="mt-1 text-[10px] font-semibold">Sections</span>
            </button>

            <button
              type="button"
              onClick={() => {
                goToDashboard();
                toast.info(
                  'Activity summary is shown on the dashboard overview.',
                );
              }}
              className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-slate-500 transition active:scale-95"
            >
              <Clock3 className="h-5 w-5" />
              <span className="mt-1 text-[10px] font-semibold">Activity</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMoreOpen(prev => !prev)}
              className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 transition active:scale-95 ${
                mobileMoreOpen ? 'text-[#10213f]' : 'text-slate-500'
              }`}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="mt-1 text-[10px] font-semibold">More</span>
            </button>
          </div>
        </nav>

        {/* Summary footer for desktop */}
        <footer className="hidden border-t border-slate-200 bg-white md:block">
          <div className="mx-auto flex max-w-[1480px] items-center justify-between px-6 py-4 lg:px-8 xl:px-10">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-slate-600">
                {completedSectionsCount} of {allSections.length} sections
                completed
              </span>
              <Progress value={progress} className="w-40" />
            </div>
            {progress === 100 && (
              <Badge variant="default" className="bg-emerald-500">
                All Complete!
              </Badge>
            )}
          </div>
        </footer>

        {showWelcome && (
          <WelcomeModal
            role={derivedRole ?? 'owner'}
            onStart={async () => {
              setShowWelcome(false);
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
      </div>
    </>
  );
}
