import React from 'react';
import { Card, CardHeader, CardContent } from '@common/ui/card';
import { Badge } from '@common/ui/badge';
import { Button } from '@common/ui/button';
import { Eye, EyeOff, Copy, Edit, Trash2, Shield, Phone, Mail, SettingsIcon, PhoneIcon } from 'lucide-react';
import { toast } from 'sonner';

// interface AccessPersonData {
//   _id?: string;
//   full_name: string;
//   relationship: string;
//   email: string;
//   phone_number: string;
//   access_level: string;
//   authorized_sections?: string[];
//   immediate_access?: boolean;
//   master_password: string;
//   password_card_generated: boolean;
//   card_storage_location: string;
//   special_instructions: string;
// }
interface AccessPersonData {
  _id?: string;
  full_name: string;
  relationship: string;
  email: string;
  phone_number: string;
  access_level: string;
  authorized_sections?: string[];
  immediate_access?: boolean;
}

interface AccessPersonCardProps {
  item: AccessPersonData;
  onEdit?: () => void;
  onDelete?: () => void;
  showSensitiveInfo?: boolean;
}

export function AccessPersonCard({ 
  item, 
  onEdit, 
  onDelete,
  showSensitiveInfo = false 
}: AccessPersonCardProps) {

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };


  const formatSections = (sections: string[]) => {
    if (!sections || sections.length === 0) return 'Full Kit Access';
    if (sections.length <= 5) return sections.join(', ');
    return `${sections.slice(0, 5).join(', ')} +${sections.length - 3} more`;
  };

  return (
    <>
      <div className="bg-white border border-slate-100 rounded-xl p-8 hover:shadow-[0_40px_80px_-20px_rgba(30,41,59,0.08)] transition-all group relative overflow-hidden flex flex-col gap-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div
              className={`w-14 h-14 rounded-md bg-slate-800  text-white flex items-center justify-center text-xl font-black shadow-xl group-hover:scale-105 transition-transform`}
            >
              {item.full_name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1e293b]">
                {item.full_name || 'Unnamed Person'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {item.relationship || 'No relationship specified'}
              </p>
            </div>
          </div>
          <div
            className={`px-4 py-1.5 flex items-center gap-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
              item.access_level === 'Full Kit Access'
                ? 'bg-[#1e293b] text-white border-[#1e293b]'
                : 'bg-slate-50 text-slate-400 border-slate-100'
            }`}
          >
            <Shield className="h-3 w-3 mr-1" />
            {item.access_level || 'No Access Level'}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50/50 rounded-2xl p-4 border justify-between border-slate-50 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-300" />
              <span className="text-[11px] font-bold text-slate-600 truncate">
                {item.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(item.email, 'Email')}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="bg-slate-50/50 rounded-2xl p-4 border justify-between border-slate-50 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <PhoneIcon className="w-4 h-4 text-slate-300" />
              <span className="text-[11px] font-bold text-slate-600">
                {item.phone_number}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(item.phone_number, 'Phone')}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="pt-0 border-t border-slate-50 flex items-center justify-between gap-6">
          <div className="space-y-1.5">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
              Authorized Areas
            </p>
            <div className="flex gap-2">
              {/* {item.authorized_sections.map(s => ( */}
              <span
                // key={s}
                className="text-[10px] font-black text-[#1e293b] bg-slate-100 px-3 py-1 rounded-lg uppercase tracking-tight"
              >
                {formatSections(item.authorized_sections ?? []) || 'Full Vault'}
                {/* {s === 'All' ? 'Full Vault' : s} */}
              </span>
              {/* ))} */}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-lg transition-all active:scale-95"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:shadow-lg transition-all active:scale-95"
            >
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
        </div>
      </div>
    </>
  );
}