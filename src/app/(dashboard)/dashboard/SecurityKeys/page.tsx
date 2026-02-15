'use client'
import React from 'react';

const SecurityKeys: React.FC = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-[#1e293b] w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-300">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#1e293b] tracking-tight uppercase">
              Security Keys
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">
              Multi-Factor Hardware & Biometrics
            </p>
          </div>
        </div>
        <button className="px-8 py-4 bg-[#1e293b] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-3">
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Register New Device
        </button>
      </div>

      <div className="bg-[#fcfdfe]/50 rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div>
            <h3 className="text-sm font-black text-[#1e293b] uppercase tracking-wider">
              Registered Authentication Devices
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              3 ACTIVE KEYS SECURING VAULT
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-[#1e293b] uppercase tracking-widest">
              System Armed
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <KeyCard
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 21a10.003 10.003 0 008.384-4.51l.054.09m-4.285-9.571A10.025 10.025 0 0110.332 12m1.336-1.336a5.5 5.5 0 117.778 7.778M12 21a10.001 10.001 0 0010-10H12V21z"
                />
              </svg>
            }
            name="MacBook Pro Touch ID"
            added="Sep 12, 2025"
            lastUsed="2 hours ago"
            type="Biometric"
            primary
          />
          <KeyCard
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            }
            name="YubiKey 5C NFC - Main"
            added="Aug 04, 2025"
            lastUsed="Oct 01, 2025"
            type="Hardware Key"
          />
          <KeyCard
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            }
            name="Andrew's iPhone 16"
            added="Jan 10, 2026"
            lastUsed="Just now"
            type="Passkey / Mobile"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-indigo-50/50 border border-indigo-100 p-10 rounded-[3rem] space-y-6">
          <h3 className="text-base font-black text-[#1e293b] tracking-tight uppercase">
            Recovery Codes
          </h3>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            If you lose access to your security keys, these one-time codes are
            the only way to recover your vault. Download them and store them in
            a fireproof safe.
          </p>
          <div className="flex gap-4">
            <button className="flex-1 py-4 bg-white border border-indigo-200 text-[#1e293b] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-sm">
              Download PDF
            </button>
            <button className="flex-1 py-4 bg-white border border-indigo-200 text-[#1e293b] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-sm">
              View Online
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-10 rounded-[3rem] space-y-6 shadow-sm">
          <h3 className="text-base font-black text-[#1e293b] tracking-tight uppercase">
            Multi-Factor Status
          </h3>
          <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[10px] font-black text-[#1e293b] uppercase">
                MFA Protocol
              </p>
              <p className="text-[12px] font-bold text-slate-400 mt-1">
                Strict Enforcement
              </p>
            </div>
            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
              Enabled
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">
            Next security audit due in 42 days
          </p>
        </div>
      </div>
    </div>
  );
};

const KeyCard: React.FC<{
  icon: React.ReactNode;
  name: string;
  added: string;
  lastUsed: string;
  type: string;
  primary?: boolean;
}> = ({ icon, name, added, lastUsed, type, primary }) => (
  <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] flex items-center gap-8 group hover:shadow-2xl hover:border-indigo-100 transition-all shadow-sm">
    <div
      className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${primary ? 'bg-[#1e293b] text-white shadow-[#1e293b]/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-1">
        <h4 className="text-base font-black text-[#1e293b] tracking-tight">
          {name}
        </h4>
        {primary && (
          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
            Primary
          </span>
        )}
      </div>
      <div className="flex gap-6 items-center">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
            Type
          </span>
          <span className="text-[10px] font-bold text-slate-500">{type}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
            Last Used
          </span>
          <span className="text-[10px] font-bold text-slate-500">
            {lastUsed}
          </span>
        </div>
      </div>
    </div>
    <button className="p-4 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  </div>
);

export default SecurityKeys;
