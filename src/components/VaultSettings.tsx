// 'use client'
// import React, { useState } from 'react';

// type AuthMethod = 'email' | 'app' | 'sms';

// const VaultSettings: React.FC = () => {
//   const [currentMfa, setCurrentMfa] = useState<AuthMethod>('email');
//   const [isChangingMfa, setIsChangingMfa] = useState(false);

//   const mfaOptions = [
//     {
//       id: 'app' as AuthMethod,
//       title: 'Authenticator App',
//       desc: 'Use Google Authenticator or Authy for maximum security.',
//       badge: 'Highly Recommended',
//       icon: (
//         <svg
//           className="w-5 h-5"
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2.5}
//             d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
//           />
//         </svg>
//       ),
//     },
//     {
//       id: 'email' as AuthMethod,
//       title: 'Email Verification',
//       desc: 'Receive codes via your primary executive email address.',
//       badge: 'Standard',
//       icon: (
//         <svg
//           className="w-5 h-5"
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2.5}
//             d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
//           />
//         </svg>
//       ),
//     },
//     {
//       id: 'sms' as AuthMethod,
//       title: 'SMS / Text OTP',
//       desc: 'Receive temporary codes via your registered mobile number.',
//       badge: 'Convenient',
//       icon: (
//         <svg
//           className="w-5 h-5"
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2.5}
//             d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
//           />
//         </svg>
//       ),
//     },
//   ];

//   return (
//     <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-10 pb-20">
//       <div className="flex items-center gap-5">
//         <div className="bg-[#1e293b] w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-300">
//           <svg
//             className="w-6 h-6 text-white"
//             fill="none"
//             stroke="currentColor"
//             viewBox="0 0 24 24"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2.5}
//               d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
//             />
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2.5}
//               d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//             />
//           </svg>
//         </div>
//         <div>
//           <h2 className="text-2xl font-black text-[#1e293b] tracking-tight uppercase">
//             Vault Settings
//           </h2>
//           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">
//             Global Security & Preferences
//           </p>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
//         <div className="lg:col-span-8 space-y-12">
//           {/* Two-Factor Authentication Section */}
//           <SettingsSection
//             title="Two-Factor Authentication (2FA)"
//             desc="Change your primary method for identity verification."
//           >
//             {isChangingMfa ? (
//               <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-8 md:p-10 space-y-6 animate-in slide-in-from-top-4 duration-500 shadow-xl shadow-slate-200/50">
//                 <div className="flex items-center justify-between mb-2">
//                   <h4 className="text-sm font-black text-[#1e293b] uppercase tracking-widest">
//                     Select New Protocol
//                   </h4>
//                   <button
//                     onClick={() => setIsChangingMfa(false)}
//                     className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors underline underline-offset-4"
//                   >
//                     Cancel
//                   </button>
//                 </div>

//                 <div className="grid grid-cols-1 gap-4">
//                   {mfaOptions.map(opt => (
//                     <button
//                       key={opt.id}
//                       onClick={() => {
//                         setCurrentMfa(opt.id);
//                         setIsChangingMfa(false);
//                       }}
//                       className={`w-full p-6 rounded-[2rem] border-2 text-left transition-all flex items-center gap-6 group ${
//                         currentMfa === opt.id
//                           ? 'border-[#1e293b] bg-slate-50/50'
//                           : 'border-slate-50 bg-white hover:border-slate-200'
//                       }`}
//                     >
//                       <div
//                         className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
//                           currentMfa === opt.id
//                             ? 'bg-[#1e293b] text-white shadow-xl shadow-slate-300'
//                             : 'bg-slate-50 text-slate-300 group-hover:text-slate-500'
//                         }`}
//                       >
//                         {opt.icon}
//                       </div>
//                       <div className="flex-1">
//                         <div className="flex items-center gap-3">
//                           <p className="text-sm font-black text-[#1e293b]">
//                             {opt.title}
//                           </p>
//                           <span
//                             className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
//                               opt.badge === 'Highly Recommended'
//                                 ? 'bg-emerald-50 text-emerald-600'
//                                 : 'bg-slate-100 text-slate-400'
//                             }`}
//                           >
//                             {opt.badge}
//                           </span>
//                         </div>
//                         <p className="text-[11px] font-medium text-slate-400 mt-0.5">
//                           {opt.desc}
//                         </p>
//                       </div>
//                       <div
//                         className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
//                           currentMfa === opt.id
//                             ? 'border-[#1e293b] bg-[#1e293b]'
//                             : 'border-slate-100'
//                         }`}
//                       >
//                         {currentMfa === opt.id && (
//                           <div className="w-2 h-2 bg-white rounded-full" />
//                         )}
//                       </div>
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             ) : (
//               <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group hover:shadow-xl transition-all">
//                 <div className="flex items-center gap-6">
//                   <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
//                     {mfaOptions.find(o => o.id === currentMfa)?.icon}
//                   </div>
//                   <div>
//                     <div className="flex items-center gap-3">
//                       <h4 className="text-base font-black text-[#1e293b]">
//                         {mfaOptions.find(o => o.id === currentMfa)?.title}
//                       </h4>
//                       <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100">
//                         Active
//                       </span>
//                     </div>
//                     <p className="text-[11px] font-medium text-slate-400 mt-1 max-w-xs">
//                       Primary MFA method used for all session re-authorizations
//                       and sensitive data triggers.
//                     </p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => setIsChangingMfa(true)}
//                   className="w-full md:w-auto px-10 py-4 bg-[#1e293b] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
//                 >
//                   Switch Method
//                 </button>
//               </div>
//             )}
//           </SettingsSection>

//           <SettingsSection
//             title="Encryption Protocol"
//             desc="Manage how your data is shielded."
//           >
//             <div className="space-y-4">
//               <ToggleCard
//                 title="AES-256 Military Grade"
//                 desc="Currently active standard for all sectors."
//                 active
//               />
//               <ToggleCard
//                 title="Zero-Knowledge Architecture"
//                 desc="Only you hold the primary decryption keys."
//                 active
//               />
//             </div>
//           </SettingsSection>

//           <SettingsSection
//             title="Auto-Vault Locking"
//             desc="Configure session timeout durations."
//           >
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               <button className="p-6 bg-white border-2 border-[#1e293b] rounded-[2rem] text-left">
//                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
//                   Active Choice
//                 </p>
//                 <p className="text-xl font-black text-[#1e293b] mt-2">
//                   15 Minutes
//                 </p>
//               </button>
//               <button className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-left hover:bg-white transition-colors">
//                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
//                   Extended Session
//                 </p>
//                 <p className="text-xl font-black text-slate-300 mt-2">
//                   60 Minutes
//                 </p>
//               </button>
//             </div>
//           </SettingsSection>

//           <SettingsSection
//             title="Legacy Release Speed"
//             desc="Timing for trigger verification."
//           >
//             <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
//               <div className="flex justify-between items-center">
//                 <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">
//                   Instant
//                 </span>
//                 <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">
//                   30 Days
//                 </span>
//               </div>
//               <div className="relative h-2 bg-slate-100 rounded-full">
//                 <div className="absolute left-0 top-0 h-full w-1/3 bg-[#1e293b] rounded-full" />
//                 <div className="absolute left-1/3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-4 border-[#1e293b] rounded-full shadow-xl" />
//               </div>
//               <p className="text-[10px] font-bold text-slate-400 leading-relaxed text-center">
//                 Current:{' '}
//                 <span className="text-[#1e293b]">
//                   7 Day Verification Window.
//                 </span>{' '}
//                 Verified legal event required before release.
//               </p>
//             </div>
//           </SettingsSection>
//         </div>

//         <div className="lg:col-span-4 space-y-8">
//           <div className="bg-rose-50 border border-rose-100 p-8 rounded-[3rem] space-y-6">
//             <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-rose-500 shadow-sm">
//               <svg
//                 className="w-6 h-6"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2.5}
//                   d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
//                 />
//               </svg>
//             </div>
//             <div>
//               <h3 className="text-lg font-black text-rose-900 tracking-tight">
//                 Master Recovery
//               </h3>
//               <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-1">
//                 Emergency Protocol
//               </p>
//             </div>
//             <p className="text-[11px] text-rose-700 leading-relaxed font-medium">
//               Generating a new Master Recovery Seed will invalidate all previous
//               backup keys. This process should be handled in a private physical
//               location.
//             </p>
//             <button className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-200">
//               Regenerate Master Seed
//             </button>
//           </div>

//           <div className="bg-[#1e293b] p-8 rounded-[3rem] text-white space-y-6 shadow-2xl">
//             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
//               Plan Details
//             </p>
//             <div className="space-y-1">
//               <p className="text-xl font-black">Executive Vault</p>
//               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
//                 Next billing: Oct 12, 2026
//               </p>
//             </div>
//             <button className="w-full py-4 bg-white/10 text-white border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">
//               Manage Billing
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const SettingsSection: React.FC<{
//   title: string;
//   desc: string;
//   children: React.ReactNode;
// }> = ({ title, desc, children }) => (
//   <div className="space-y-4">
//     <div className="pl-4">
//       <h3 className="text-sm font-black text-[#1e293b] uppercase tracking-wider">
//         {title}
//       </h3>
//       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
//         {desc}
//       </p>
//     </div>
//     {children}
//   </div>
// );

// const ToggleCard: React.FC<{
//   title: string;
//   desc: string;
//   active?: boolean;
// }> = ({ title, desc, active }) => (
//   <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:shadow-xl transition-all shadow-sm">
//     <div>
//       <h4 className="text-sm font-black text-[#1e293b]">{title}</h4>
//       <p className="text-[11px] font-medium text-slate-400">{desc}</p>
//     </div>
//     <div
//       className={`w-14 h-8 rounded-full p-1 transition-colors ${active ? 'bg-emerald-500' : 'bg-slate-100'}`}
//     >
//       <div
//         className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${active ? 'translate-x-6' : 'translate-x-0'}`}
//       />
//     </div>
//   </div>
// );

// export default VaultSettings;
'use client';
import React, { useState } from 'react';
import {
  useGetStatusQuery,
  useGetInvoicesQuery,
  useCreateCustomerMutation,
  // useStartSubscriptionMutation,
  useChangePlanMutation,
  usePauseSubscriptionMutation,
  useResumeSubscriptionMutation,
  usePortalMutation,
} from '@/services/billingApi';
import { StripePaymentForm } from './StripePaymentForm';
interface InvoiceLine {
  description: string;
  amount: number;
  proration?: boolean;
}

interface Invoice {
  id: string;
  created: number;
  amount_due: number;
  status: string;
  pdf?: string;
  lines?: InvoiceLine[];
}

/* ---------------- Skeleton ---------------- */
const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

/* ---------------- Helpers ---------------- */
const daysBetween = (end: string) =>
  Math.max(
    0,
    Math.ceil((new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

const formatDate = (unix: number) =>
  new Date(unix * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

/* ---------------- Component ---------------- */
const VaultSettings = () => {
  const {
    data: status,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useGetStatusQuery();
  const { data: invoices, isLoading: invoicesLoading } = useGetInvoicesQuery();

  const [createCustomer] = useCreateCustomerMutation();
  // const [startSubscription] = useStartSubscriptionMutation();
  const [changePlan] = useChangePlanMutation();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>(
    'yearly',
  );
  const [isProcessing, setIsProcessing] = useState(false);
const [pauseSub] = usePauseSubscriptionMutation();
const [resumeSub] = useResumeSubscriptionMutation();
const [openPortal] = usePortalMutation();

const pauseSubscription = async () => {
  await pauseSub();
  await refetchStatus();
};

const resumeSubscription = async () => {
  await resumeSub().unwrap();
  await refetchStatus();
};

const openBillingPortal = async () => {
  const { url } = await openPortal().unwrap();
  window.location.href = url;
};

  /* ---------------- Guards ---------------- */
  if (statusLoading) {
    return (
      <div className="p-12 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

if (!status) return null;

const billing = status;

  const isTrial = billing.is_trial;
  const trialDaysLeft = billing.trial_end ? daysBetween(billing.trial_end) : 0;

const disableActions =
  statusLoading ||
  invoicesLoading ||
  isProcessing ||
  (!billing.has_payment_method && !isTrial);


  /* ---------------- Actions ---------------- */
const handleProcessPayment = async () => {
  try {
    setIsProcessing(true);

    await createCustomer().unwrap();

    /**
     * 🔥 KEY FIX:
     * Trial users ALREADY have a subscription
     * → just end trial + activate billing
     */
    await changePlan({ plan: selectedPlan }).unwrap();

    await refetchStatus();
    setShowUpgradeModal(false);
  } catch (err: any) {
    console.error(err);
    alert(err?.data?.detail ?? 'Billing failed. Please try again.');
  } finally {
    setIsProcessing(false);
  }
};
const canChangePlan =
  billing.status === 'active' || billing.status === 'trialing';



  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-12 pb-32 vault-settings-section">
      {/* PLAN CARD */}
      <div className="bg-white p-10 rounded-3xl border shadow-sm">
        <h2 className="text-xl font-black uppercase">
          {isTrial ? 'Free Trial Phase' : 'Subscription Active'}
        </h2>

        <p className="mt-2 text-xs uppercase text-slate-500">
          {isTrial
            ? `${trialDaysLeft} days remaining`
            : `Plan: ${billing.plan?.toUpperCase()}`}
        </p>
        {isTrial && trialDaysLeft <= 3 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-6 py-4 rounded-xl text-sm font-bold">
            ⏰ Your free trial ends in {trialDaysLeft} days. Add a payment
            method to avoid interruption.
          </div>
        )}
        <div className="flex mt-6 items-center gap-4">
          <button
            disabled={!canChangePlan || disableActions}
            onClick={() => setShowUpgradeModal(true)}
            className={`px-10 py-4 cursor-pointer rounded-xl text-xs font-black uppercase ${
              disableActions
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-[#1e293b] text-white'
            }`}
          >
            {!billing.has_payment_method
              ? 'Add Payment Method'
              : isTrial
                ? 'Upgrade Now'
                : 'Change Plan'}
          </button>
          {billing.status === 'active' && (
            <button
              onClick={pauseSubscription}
              className="px-6 py-3 cursor-pointer bg-amber-600 text-white rounded-xl text-xs font-black"
            >
              Pause Subscription
            </button>
          )}

          {billing.status === 'paused' && (
            <button
              onClick={resumeSubscription}
              className="px-6 py-3 cursor-pointer bg-amber-600 text-white rounded-xl text-xs font-black"
            >
              Resume Subscription
            </button>
          )}
          <button
            onClick={openBillingPortal}
            className="px-6 py-3 bg-slate-800 text-white rounded-xl text-xs font-black"
          >
            Manage Billing
          </button>
        </div>
      </div>

      {/* INVOICES */}
      <div className="bg-white rounded-3xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-left">Invoice</th>
              <th className="p-4">Date</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {invoicesLoading && (
              <tr>
                <td colSpan={4} className="p-8">
                  <Skeleton className="h-6 w-full" />
                </td>
              </tr>
            )}

            {!invoicesLoading &&
              invoices?.map(inv => (
                <>
                  <tr key={inv.id} className="border-t">
                    <td className="p-4 font-mono">{inv.id}</td>
                    <td className="p-4">{formatDate(inv.created)}</td>
                    <td className="p-4">${inv.amount_due.toFixed(2)}</td>
                    <td className="p-4 capitalize">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {inv.pdf && (
                        <a
                          href={inv.pdf}
                          target="_blank"
                          className="text-indigo-600 font-bold text-xs"
                        >
                          PDF
                        </a>
                      )}
                    </td>
                  </tr>
                  <tr>
                    {inv.lines?.map((line: InvoiceLine) => (
                      <div
                        key={line.description}
                        className="text-xs text-slate-500 pl-6"
                      >
                        {line.proration && '🔁 '}
                        {line.description}: ${line.amount.toFixed(2)}
                      </div>
                    ))}
                  </tr>
                </>
              ))}

            {!invoicesLoading && invoices?.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">
                  No invoices yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md">
            <h3 className="font-black uppercase mb-6">Choose Plan</h3>

            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`w-full p-4 mb-3 rounded ${
                selectedPlan === 'monthly' ? 'bg-slate-100 font-black' : ''
              }`}
            >
              Monthly
            </button>

            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`w-full p-4 rounded ${
                selectedPlan === 'yearly' ? 'bg-slate-100 font-black' : ''
              }`}
            >
              Yearly
            </button>

            <StripePaymentForm onSuccess={handleProcessPayment} />
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultSettings;
