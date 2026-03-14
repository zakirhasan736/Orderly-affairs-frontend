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
import { CheckCircle, Circle, Save, FileText, Menu, User } from 'lucide-react';
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
import { useGetTourStatusQuery, useUpdateTourStatusMutation } from '@/services/onboardingApi';

type AppMode = 'owner_login' | 'owner' | 'nok_login' | 'nok_pending_approval' | 'nok_dashboard' | 'nok_section_view' | 'test_access_management' | 'test_mfa';
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

const sectionSaveMap: Record<string, (token: string, data: any) => Promise<any>> = {
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
  type DashboardFormData = Record<string, any>;

  const [formData, setFormData] = useState<DashboardFormData>({});
const contextualStep = useMemo(() => {
  if (appMode !== 'owner') return null;
  return shouldTriggerContextualTour(formData, myNextKin || []);
}, [formData, myNextKin, appMode]);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    []
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
    getSection12(token)
      .then(res => {
        if (res?.data) {
          setFormData(prev => ({
            ...prev,
            '12': res.data,
          }));
        }
      })
      getSection13(token)
        .then(res => {
          if (res?.data) {
            setFormData(prev => ({
              ...prev,
              '13': res.data,
            }));
          }
        })
        getSection14(token)
          .then(res => {
            if (res?.data) {
              setFormData(prev => ({
                ...prev,
                '14': res.data,
              }));
            }
          })
          getSection15(token)
            .then(res => {
              if (res?.data) {
                setFormData(prev => ({
                  ...prev,
                  '15': res.data,
                }));
              }
           })
          getSection16(token)
            .then(res => {
              if (res?.data) {
                setFormData(prev => ({
                  ...prev,
                  '16': res.data,
                }));
              }
            })
            getSection17(token)
              .then(res => {
                if (res?.data) {
                  setFormData(prev => ({
                    ...prev,
                    '17': res.data,
                  }));
                }
              })
              getSection18(token)
                .then(res => {
                  if (res?.data) {
                    setFormData(prev => ({
                      ...prev,
                      '18': res.data,
                    }));
                  }
                })
                getSection19(token)
                  .then(res => {
                    if (res?.data) {
                      setFormData(prev => ({
                        ...prev,
                        '19': res.data,
                      }));
                    }
                  })
                  getSection20(token)
                    .then(res => {
                      if (res?.data) {
                        setFormData(prev => ({
                          ...prev,
                          '20': res.data,
                        }));
                      }
                    })
                   getSection21(
                     token,
                  )
                    .then(
                      res => {
                        if (
                          res?.data
                        ) {
                          setFormData(
                            prev => ({
                              ...prev,
                              '21': res.data,
                            }),
                          );
                        }
                      },
                    )
                    .catch(
                      err => {
                        console.error(
                          'Failed to load Section 12',
                          err,
                        );
                      },
                    );
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




  // Debounced auto-save with cleanup - only trigger on actual data changes
  // useEffect(() => {
  //   if (appMode !== 'owner') return; // Only auto-save for owner mode

  //   if (autoSaveRef.current) {
  //     clearTimeout(autoSaveRef.current);
  //   }
  //   autoSaveRef.current = setTimeout(autoSave, 2000);

  //   return () => {
  //     if (autoSaveRef.current) {
  //       clearTimeout(autoSaveRef.current);
  //     }
  //   };
  // }, [
  //   formData,
  //   disabledSections,
  //   disabledSubsections,
  //   collapsedSubsections,
  //   appMode,
  // ]);
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
        'orderlyAffairsDisabledSections'
      );
      const savedDisabledSubsections = localStorage.getItem(
        'orderlyAffairsDisabledSubsections'
      );
      const savedCollapsedSubsections = localStorage.getItem(
        'orderlyAffairsCollapsedSubsections'
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
            savedDisabledSubsections
          );
          setDisabledSubsections(parsedDisabledSubsections);
        } catch (error) {
          console.error('Error loading disabled subsections:', error);
        }
      }
      if (savedCollapsedSubsections) {
        try {
          const parsedCollapsedSubsections = JSON.parse(
            savedCollapsedSubsections
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
    []
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
          error?.data?.message || 'Login failed. Please check your credentials.'
        );
      }
    },
    [nextkinLogin, router]
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
  if (!contextualStep) return;

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
          : `Are you sure you want to clear all data from section ${sectionId}? This action cannot be undone.`
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
            localStorage.getItem('orderlyAffairsData') || '{}'
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
            JSON.stringify(currentData)
          );
        } catch (error) {
          console.error('Error clearing localStorage:', error);
        }

        toast.success(
          subsectionId
            ? `Subsection ${subsectionId} data cleared!`
            : `Section ${sectionId} data cleared!`
        );
      }
    },
    []
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
          activeSubsection={activeSubsection}
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
            <p className="text-muted-foreground">Section under construction</p>
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


  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b flex flex-col md:flex-row bg-card">
          <div className="max-w-72 w-full"></div>
          <div className="container max-w-full ml-auto px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Image
                    src={'/images/brand-logo.png'}
                    alt="Orderly Affairs Logo"
                    className="h-16 w-auto"
                    width={120}
                    height={64}
                  />
                  <div>
                    <div className="hidden md:block">
                      <h1 className="text-[12px] md:text-[14px] font-black text-[#1e293b] uppercase tracking-[0.15em] leading-tight">
                        Orderly
                      </h1>
                      <p className="text-[9px] md:text-[12px] text-slate-400 font-bold uppercase tracking-widest leading-tight mt-0.5">
                        Affairs
                      </p>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:block h-5 md:h-6 w-px bg-slate-200 mx-1 md:mx-2" />

                <div className="flex items-center gap-2 max-w-35 md:max-w-none">
                  <span className="hidden xl:inline text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    Sector
                  </span>
                  <span className="px-3 py-1 bg-slate-100/50 border border-slate-200/50 rounded-lg text-[9px] md:text-[10px] font-black text-[#1e293b] uppercase tracking-tight truncate">
                    {currentSectionLabel}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="hidden md:flex header-progress-indicator items-center gap-3 px-4 py-1.5 bg-slate-50/50 rounded-xl border border-slate-100/50">
                    <div className="flex items-center gap-2">
                      <div className="w-16 lg:w-24 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <Progress value={progress} className="w-40" />
                      </div>
                      <span className="text-[10px] font-black text-[#1e293b]">
                        {progress}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-50/80 p-1 rounded-xl border border-slate-100">
                    {/* {status?.has_completed && (
                      <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                        Tour Completed ✔
                      </span>
                    )} */}

                    <button
                      onClick={async () => {
                        await updateStatus({ manually_started: true });
                        startTour(derivedRole ?? 'owner');
                        setTourStarted(true);
                      }}
                      className="text-sm px-4 py-2 bg-neutral-800 text-white rounded-md"
                    >
                      Run Tour
                    </button>

                    <button
                      onClick={manualSave}
                      className={`flex cursor-pointer owners-states-save items-center gap-2 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-[#1e293b] hover:bg-white rounded-lg transition-all active:scale-95`}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {autoSaving ? (
                        <span className="text-xs text-gray-500 ml-2">
                          Saving...
                        </span>
                      ) : (
                        <span className="hidden xl:inline">Save</span>
                      )}
                    </button>
                    <button
                      onClick={exportData}
                      className={`flex cursor-pointer owners-states-export items-center gap-2 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-[#1e293b] hover:bg-white rounded-lg transition-all active:scale-95`}
                    >
                      <ExportIcon />
                      <span className="hidden xl:inline">Export</span>
                    </button>
                  </div>

                  <div className="relative group owner-state-information">
                    <button className="w-9 h-9  md:w-11 md:h-11 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden hover:ring-4 ring-slate-100 transition-all shrink-0">
                      <User className="h-4 w-4" />
                    </button>

                    <div className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-[60]">
                      <div className="bg-white shadow-2xl rounded-2xl border border-slate-100 p-1.5 min-w-[200px]">
                        <div className="px-4 py-3 border-b border-slate-50 mb-1">
                          {currentUser && (
                            <p className="text-[11px] font-black text-[#1e293b]">
                              {currentUser.email}
                            </p>
                          )}
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                            Premium Member
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setActiveSection('vault-settings');
                            setActiveSubsection(null);
                          }}
                          className="w-full cursor-pointer text-left px-4 py-2.5 text-[10px] font-black text-slate-600 hover:text-[#1e293b] hover:bg-slate-50 rounded-lg transition-all uppercase tracking-widest"
                        >
                          Account info
                        </button>

                        <button
                          onClick={() => 'security-keys'}
                          className="w-full cursor-pointer text-left px-4 py-2.5 text-[10px] font-black text-slate-600 hover:text-[#1e293b] hover:bg-slate-50 rounded-lg transition-all uppercase tracking-widest"
                        >
                          Security Keys
                        </button>
                        <div className="h-px bg-slate-50 my-1" />
                        <button
                          onClick={handleOwnerLogout}
                          className="w-full cursor-pointer text-left px-4 py-2.5 text-[10px] font-black text-rose-500 hover:bg-rose-50 rounded-lg transition-all uppercase tracking-widest"
                        >
                          Log Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex">
          {/* Sidebar */}
          <div
            className={`fixed inset-y-0 sidebar-navigation left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg transform transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <h2>Vault Navigation</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {/* Dashboard Section */}
                  <button
                    onClick={() => {
                      setActiveSection('dashboard');
                      setActiveSubsection(null);
                      setSidebarOpen(false);
                    }}
                    className={`w-full owner-dashboard-item text-left p-3 rounded-lg transition-colors ${
                      activeSection === 'dashboard'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Dashboard Overview</span>
                    </div>
                  </button>

                  {allSections.map(section => (
                    <div
                      key={`main-section-${section.id}`}
                      className="space-y-1"
                    >
                      {/* Main Section Button */}
                      <button
                        onClick={() => {
                          setActiveSection(section.id);
                          setActiveSubsection(null);
                          setSidebarOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-lg transition-colors section-${section.id}-nav ${
                          activeSection === section.id && !activeSubsection
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        } ${disabledSections[section.id] ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          {getSectionCompletionStatus(section.id) ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                          <span className="font-medium">
                            {(obituarySections.has(section.id) ||
                              hasDoveTag(section.id)) && (
                              <span className="mr-1">🕊️</span>
                            )}
                            {section.id}. {section.title}
                          </span>
                          {disabledSections[section.id] && (
                            <span className="text-xs text-muted-foreground ml-auto">
                              Not Applicable
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Subsections */}
                      {section.subsections &&
                        activeSection === section.id &&
                        !disabledSections[section.id] && (
                          <div
                            key={`subsections-container-${section.id}`}
                            className="ml-6 space-y-1"
                          >
                            {section.subsections.map((subsection: any) => (
                              <div
                                key={`section-${section.id}-subsection-${subsection.id}`}
                              >
                                <button
                                  onClick={() => {
                                    setActiveSection(section.id);
                                    setActiveSubsection(subsection.id);
                                    setSidebarOpen(false);
                                    // Scroll to subsection
                                    setTimeout(() => {
                                      const element = document.getElementById(
                                        `subsection-${subsection.id}`,
                                      );
                                      if (element) {
                                        element.scrollIntoView({
                                          behavior: 'smooth',
                                          block: 'start',
                                        });
                                      }
                                    }, 100);
                                  }}
                                  className={`w-full text-left p-2 rounded-md transition-colors text-sm ${
                                    activeSubsection === subsection.id
                                      ? 'bg-secondary text-secondary-foreground font-medium'
                                      : 'hover:bg-muted/50 text-muted-foreground'
                                  } ${
                                    disabledSubsections[subsection.id]
                                      ? 'opacity-50'
                                      : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                                    <span>
                                      {(obituarySubsections.has(
                                        subsection.id,
                                      ) ||
                                        hasDoveTag(
                                          section.id,
                                          subsection.id,
                                        )) && <span className="mr-1">🕊️</span>}
                                      {subsection.id}. {subsection.title}
                                    </span>
                                    {disabledSubsections[subsection.id] && (
                                      <span className="text-xs text-muted-foreground ml-auto">
                                        Not Applicable
                                      </span>
                                    )}
                                  </div>
                                </button>

                                {/* Simplified sidebar items - removed complex rendering to improve performance */}
                                {activeSection === section.id &&
                                  formData[section.id]?.[subsection.id] && (
                                    <div className="ml-4 mt-1">
                                      <div className="w-full text-left p-2 rounded-md text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                          <span className="truncate">
                                            Has data
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/95 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Floating Menu Button for Mobile - Persistent Access */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed bottom-6 right-6 z-50 lg:hidden w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center backdrop-blur-lg border border-border"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="container mx-auto px-4 py-6">
              {/* Dashboard View */}
              {activeSection === 'dashboard' ? (
                <div className="space-y-6 owner-dashboard-overview-area">
                  <div className="hidden">
                    <h1>Dashboard Overview</h1>
                    <p className="text-text-secondary mt-1">
                      Monitor your progress and manage your important
                      information efficiently using the comprehensive data
                      binding system.
                    </p>
                  </div>

                  <DataBindingDashboard
                    formData={formData}
                    nextKinList={myNextKin || []}
                    nokLetter={dashboardNokLetter || null}
                    nextTask={nextTask}
                    onNavigateToSection={sectionId => {
                      setActiveSection(sectionId);
                      setActiveSubsection(null);
                      setSidebarOpen(false);
                    }}
                  />
                </div>
              ) : activeSection === 'vault-settings' ? (
                <VaultSettings />
              ) : currentSection ? (
                <>
                  <div className="space-y-6">
                    <div>
                      <h1>
                        {(obituarySections.has(currentSection.id) ||
                          hasDoveTag(currentSection.id)) && (
                          <span className="mr-2">🕊️</span>
                        )}
                        {currentSection.id}. {currentSection.title}
                      </h1>
                      <p className="text-text-secondary mt-1">
                        {activeSection === '0'
                          ? 'Important legal information and instructions for using the Orderly Affairs Kit effectively.'
                          : activeSection === '2'
                            ? 'This section manages who can access your Orderly Affairs Kit after your passing. You must designate at least one person as your Primary Next of Kin with full access, and can optionally add additional trusted people with either full or limited access to specific sections. Each person receives unique login credentials and a master access password for secure entry. The system notifies you whenever someone logs in and allows you to revoke access at any time.'
                            : activeSection === '3'
                              ? 'Create an important introductory letter for your designated next of kin that explains how to access and use your Orderly Affairs Kit.'
                              : activeSection === '4'
                                ? 'Create heartfelt personal messages for your loved ones that can be delivered when they need them most. Write letters, record video messages, or create audio recordings that provide comfort, guidance, and your final words. Set delivery triggers for specific dates (like anniversaries or birthdays) or upon your passing. These messages serve as a lasting gift of love and wisdom for those who matter most to you.'
                                : activeSection === '5'
                                  ? 'Document your current vehicles, including cars, trucks, motorcycles, boats, or other motorized vehicles. Include important details like registration, insurance, and financing information to help your loved ones manage these assets.'
                                  : activeSection === '6'
                                    ? 'Document comprehensive information about your primary residence to help your loved ones manage your home and related accounts. This includes ownership details, mortgage information, utility accounts, insurance policies, and important service provider contacts. Whether you own or rent, this section ensures your family has all the essential information needed to maintain or transition your living situation. Include emergency information like shutoff locations and security details.'
                                    : activeSection === '7'
                                      ? 'Keep this section updated with your current insurance policies —replace the old documents each year when you receive your new policy statements. No need to write out long numbers; upload the updated paperwork (policy information) or take a picture of a current policy in here and discard the previous version.'
                                      : activeSection === '8'
                                        ? 'This section helps your loved ones learn about the groups and communities that have played a meaningful role in your life. Whether personal or professional, these may include churches, volunteer organizations, clubs, professional associations, or social groups that are important to you. If you manage any online profiles or memberships related to these groups, include those here as well, so your next of kin can easily access or close accounts if needed. For social media and other online accounts, please refer to the Passwords & Online Accounts section.'
                                        : activeSection === '9'
                                          ? 'This section is dedicated to tracking any charitable contributions you currently make or intend to make in the future. Keeping this information organized will help your next of kin manage or discontinue donations appropriately. Note any ongoing contributions to charities or causes. Be sure to list the charities you plan to include in your will or trust. Record any charities from which you make automatic withdrawals so that these can be canceled after your passing.'
                                          : activeSection === '10'
                                            ? 'These details can provide valuable context for your next of kin and assist in writing an obituary or preserving your legacy. Use this section to document your educational background and accomplishments.'
                                            : activeSection === '11'
                                              ? "Military service is a significant part of your personal history that should be documented for your next of kin. This information can be valuable for accessing veterans benefits, burial arrangements, and preserving your service legacy. Include all branches of service, deployments, and important military documents. If you have completed your military service, be sure to file separation papers (DD-214) and any other critical military records in this section. You may also include a VA Form 40-1330 if you wish to Claim for Standard Government Headstone or Marker, used by veterans, their families, or representatives to request a government-furnished headstone, marker, or medallion for an eligible veteran's grave."
                                              : activeSection === '12'
                                                ? 'To organize your financial accounts clearly, please fill in the details for each bank account. Attach copies of statements where applicable.'
                                                : activeSection === '13'
                                                  ? "Securely document all your important digital accounts, passwords, and instructions so your next of kin can manage or close them as needed. Fill out the details for each digital account you hold. Include usernames, passwords, recovery options, and any special instructions regarding the account's handling after your passing."
                                                  : activeSection === '14'
                                                    ? "Note: Physical real estate or property investments should be filed separately under the Assets section.\nNotes on Investments\nMany investments include a designated beneficiary. Upon your passing, these funds typically transfer directly to the beneficiary, bypassing the probate process. Your trust may also serve as a beneficiary in many cases.\n• If a beneficiary is a minor, additional legal steps may be necessary to manage the funds on their behalf, including the appointment of a conservator. We've provided a checklist for you.\n• Consult with an attorney to ensure your beneficiaries are correctly designated and updated."
                                                    : activeSection === '15'
                                                      ? 'Document your health information, medical providers, and insurance details so your next of kin can manage your healthcare needs and make informed decisions. This section is critical for medical emergencies and ongoing healthcare management. Include current medications, allergies, medical conditions, and contact information for all healthcare providers. Keep insurance information up to date and ensure your healthcare directives are properly documented and accessible.\n\nNote: You will be able to store living wills, and medical powers of attorney, in the Estate Documents section.'
                                                      : activeSection === '16'
                                                        ? 'Document your credit cards and debt information so your next of kin can properly manage or close these accounts. This includes credit cards, loans, and any other forms of debt. Upload relevant documents and statements to help with account management.'
                                                        : activeSection === '17'
                                                          ? 'This section helps preserve the important relationships and treasured connections in your life. Document family members, close friends, and meaningful relationships so your loved ones can understand the people who matter most to you. Include contact information for those who should be notified, special memories, and details about your connections that your family might not know. This section serves as both a relationship directory and a way to preserve your social legacy and treasured bonds.'
                                                          : activeSection ===
                                                              '18'
                                                            ? 'Document your employment history, business ownership, and all sources of income including salaries, retirement income, Social Security, and freelance work. This section helps your next of kin understand your financial situation and manage employment-related benefits and obligations. Include current employer contacts, business succession plans, and beneficiary information for retirement accounts.'
                                                            : activeSection ===
                                                                '19'
                                                              ? 'Record your valuable items (jewelry, artwork, collectibles, antiques, electronics, etc.). Note estimated values, insurance details, and care instructions to ensure they are properly identified, protected, and distributed. Complete this worksheet for all non-financial assets to help your next of kin locate and manage them.'
                                                              : activeSection ===
                                                                  '20'
                                                                ? "To help your executors and trustees efficiently settle your estate, it's essential to keep organized records of your legal documents. This section is dedicated to storing copies of essential paperwork related to your personal and financial affairs. Consider storing the originals in your fireproof document bag.\n\nWhen managing an estate or trust, executors or trustees are required to file annual tax returns until the estate is fully settled. Keeping tax documents well-organized will make this process much smoother and less stressful for your loved ones."
                                                                : activeSection ===
                                                                    '21'
                                                                  ? 'Document your estate planning documents and end-of-life wishes to ensure your loved ones can honor your intentions and manage your affairs properly. This section helps organize critical legal documents including wills, trusts, powers of attorney, and healthcare directives, along with your personal wishes for ceremonies and final arrangements. Having this information organized will provide peace of mind and clear guidance for your family during difficult times.'
                                                                  : 'Complete the sections below with your information'}
                      </p>
                    </div>
                    {renderSection()}
                    {/* VA Information Button for Military Service */}
                    {activeSection === '11' && (
                      <div className="flex justify-start">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              'https://www.va.gov/burials-memorials/veterans-burial-allowance/',
                              '_blank',
                            )
                          }
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          VA Burial Benefits Information
                        </Button>
                      </div>
                    )}

                    {/* Military Service Opt-out Checkbox */}
                    {activeSection === '11' && (
                      <div className="bg-card border rounded-lg p-4 relative z-10">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="military-service-opt-out"
                            checked={disabledSections['11'] || false}
                            onChange={e =>
                              toggleSectionDisabled('11', e.target.checked)
                            }
                            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-2 focus:ring-offset-2"
                          />
                          <label
                            htmlFor="military-service-opt-out"
                            className="text-sm cursor-pointer"
                          >
                            <span className="font-medium">
                              I have not served in the military.
                            </span>
                            <p className="text-muted-foreground mt-1">
                              Check this box if you have never served in any
                              branch of the military. This will mark this
                              section as not applicable and remove it from your
                              form.
                            </p>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Personal Messages Clear Button - Simplified */}
                    {activeSection === '4' && formData['4']?.['4A'] && (
                      <div className="bg-card border rounded-lg p-4 relative z-10">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <span className="font-medium text-sm">
                              Clear Personal Messages Data
                            </span>
                            <p className="text-muted-foreground text-sm mt-1">
                              Clear all personal messages data to start fresh.
                            </p>
                          </div>
                          <Button
                            onClick={() => clearSectionData('4', '4A')}
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            Clear Messages
                          </Button>
                        </div>
                      </div>
                    )}

                    <div
                      className={`transition-all duration-500 ${
                        disabledSections[activeSection]
                          ? 'opacity-30 pointer-events-none select-none'
                          : ''
                      }`}
                    ></div>

                    {disabledSections[activeSection] && (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground text-sm">
                          This section has been marked as not applicable.
                          Uncheck the box above to enable it.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : activeSection === 'dashboard' ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Select a section to begin
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Summary Footer */}
        <div className="border-t bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm">
                  {
                    allSections.filter(s => getSectionCompletionStatus(s.id))
                      .length
                  }{' '}
                  of {allSections.length} sections completed
                </span>
                <Progress value={progress} className="w-32" />
              </div>
              {progress === 100 && (
                <Badge variant="default" className="bg-green-500">
                  All Complete!
                </Badge>
              )}
            </div>
          </div>
        </div>
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

        {/* Owner Notification Modal */}
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