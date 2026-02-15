// import React from 'react';
// import { Card, CardHeader, CardContent } from '@common/ui/card';
// import { Badge } from '@common/ui/badge';
// import { Button } from '@common/ui/button';
// import { Mail, Phone, MapPin, FileText, Calendar, Edit, Trash2, User } from 'lucide-react';

// interface NOKLetterData {
//   letter_to: string;
//   nok_email: string;
//   nok_phone: string;
//   password_card_location: string;
//   accessible_sections: string;
//   letter_date?: string;
//   letter_greeting?: string;
// }

// interface NOKLetterCardProps {
//   obj: NOKLetterData;
//   onEdit?: () => void;
//   onDelete?: () => void;
//   onView?: () => void;
// }

// export function NOKLetterCard({ 
//   obj, 
//   onEdit, 
//   onDelete,
//   onView 
// }: NOKLetterCardProps) {
//   const formatDate = (dateString?: string) => {
//     if (!dateString) return 'No date set';
//     try {
//       return new Date(dateString).toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//       });
//     } catch {
//       return dateString;
//     }
//   };

//   const truncateText = (text: string, maxLength: number = 120) => {
//     if (!text) return 'No content specified';
//     if (text.length <= maxLength) return text;
//     return text.substring(0, maxLength) + '...';
//   };

//   return (
//     <Card className="glass-card">
//       <CardHeader className="pb-3">
//         <div className="flex items-start justify-between">
//           <div className="space-y-1">
//             <div className="flex items-center gap-2">
//               <FileText className="h-5 w-5 text-primary" />
//               <h3 className="font-semibold text-lg text-brand-primary">
//                 Letter to {obj.letter_to || 'Next of Kin'}
//               </h3>
//             </div>
//             {obj.letter_date && (
//               <div className="flex items-center gap-1 text-text-secondary text-sm">
//                 <Calendar className="h-4 w-4" />
//                 {formatDate(obj.letter_date)}
//               </div>
//             )}
//           </div>
          
//           <Badge variant="outline" className="border-primary text-primary">
//             NOK Letter
//           </Badge>
//         </div>
//       </CardHeader>

//       <CardContent className="space-y-4">
//         {/* Recipient Contact Information */}
//         <div className="space-y-3">
//           <h4 className="text-sm font-medium text-brand-primary">Recipient Information</h4>
          
//           <div className="grid grid-cols-1 gap-3">
//             {obj.nok_email && (
//               <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
//                 <Mail className="h-4 w-4 text-muted-foreground" />
//                 <div className="flex-1 min-w-0">
//                   <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
//                   <p className="text-sm truncate">{obj.nok_email}</p>
//                 </div>
//               </div>
//             )}

//             {obj.nok_phone && (
//               <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
//                 <Phone className="h-4 w-4 text-muted-foreground" />
//                 <div className="flex-1 min-w-0">
//                   <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
//                   <p className="text-sm truncate">{obj.nok_phone}</p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Password Card Location */}
//         {obj.password_card_location && (
//           <div className="space-y-2">
//             <h4 className="text-sm font-medium text-brand-primary">Password Card Location</h4>
//             <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
//               <MapPin className="h-4 w-4 text-muted-foreground" />
//               <p className="text-sm">{obj.password_card_location}</p>
//             </div>
//           </div>
//         )}

//         {/* Accessible Sections */}
//         {obj.accessible_sections && (
//           <div className="space-y-2">
//             <h4 className="text-sm font-medium text-brand-primary">Accessible Sections</h4>
//             <div className="bg-muted/50 rounded-lg p-3">
//               <p className="text-sm whitespace-pre-wrap">
//                 {truncateText(obj.accessible_sections, 200)}
//               </p>
//             </div>
//           </div>
//         )}

//         {/* Letter Greeting Preview */}
//         {obj.letter_greeting && (
//           <div className="space-y-2">
//             <h4 className="text-sm font-medium text-brand-primary">Letter Preview</h4>
//             <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
//               <p className="text-sm italic text-blue-800 dark:text-blue-200">
//                 "{truncateText(obj.letter_greeting, 150)}"
//               </p>
//             </div>
//           </div>
//         )}

//         {/* Action Buttons */}
//         <div className="flex gap-2 pt-2 border-t">
//           {onView && (
//             <Button variant="default" size="sm" onClick={onView} className="flex-1">
//               <FileText className="h-4 w-4 mr-2" />
//               View Letter
//             </Button>
//           )}
//           {onEdit && (
//             <Button variant="outline" size="sm" onClick={onEdit}>
//               <Edit className="h-4 w-4 mr-2" />
//               Edit
//             </Button>
//           )}
//           {onDelete && (
//             <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-800">
//               <Trash2 className="h-4 w-4" />
//             </Button>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
import React from 'react';
import { Card, CardHeader, CardContent } from '@common/ui/card';
import { Badge } from '@common/ui/badge';
import { Button } from '@common/ui/button';
import {
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  Edit,
  Trash2,
  EditIcon,
} from 'lucide-react';

interface NOKLetterData {
  letter_to: string;
  nok_email: string;
  nok_phone: string;
  password_card_location: string;
  accessible_sections: string;
  letter_date?: string;
  letter_greeting?: string;
}

interface NOKLetterCardProps {
  obj: NOKLetterData;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export function NOKLetterCard({
  obj,
  onEdit,
  onDelete,
  onView,
}: NOKLetterCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date set';
    const d = new Date(dateString);
    return isNaN(d.valueOf())
      ? dateString
      : d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
  };

  const truncateText = (text?: string, maxLength: number = 120) => {
    if (!text) return 'No content specified';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '…';
  };

  return (
    <>
      <div className="bg-white border border-slate-100 rounded-xl py-7 px-6 hover:shadow-[0_40px_80px_-20px_rgba(30,41,59,0.1)] transition-all group flex flex-col h-full relative overflow-hidden shadow-sm">
        {/* Type Marker Line */}
        {/* <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500/10 group-hover:bg-rose-500 transition-colors" /> */}
        <div className="flex items-start justify-between mb-7">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1e293b] tracking-tight">
                Letter to Next of Kin
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                {formatDate(obj.letter_date)}
              </p>
            </div>
          </div>
          <span className="px-4 py-1.5 bg-slate-50 border border-primary rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500">
            NOK Letter
          </span>
        </div>

        <div className="space-y-8 mb-7">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              Recipient Information
            </p>
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-50 group-hover:bg-white group-hover:border-slate-200 transition-all">
              <p className="text-[14px] font-black text-[#1e293b]">
                {obj.letter_to}
              </p>
              <p className="text-[12px] font-bold text-slate-400 truncate mt-0.5">
                {obj.nok_email}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              Letter Preview
            </p>
            <div className="p-4 rounded-2xl border border-[#eff6ff] bg-[#f8fbff] group-hover:bg-white transition-all shadow-inner">
              <p className="text-[13px] text-slate-600 font-medium italic leading-relaxed line-clamp-2">
                "{truncateText(obj.letter_greeting, 150)}"
              </p>
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center gap-4">
          <button
            onClick={onView}
            className="flex-[4] py-3 cursor-pointer bg-[#1e293b] text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View Letter
          </button>
          <button
            onClick={onEdit}
            className="flex-1 max-w-16 py-3 bg-white cursor-pointer border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all flex items-center justify-center active:scale-[0.98] shadow-sm"
          >
            <EditIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            className="flex-1 max-w-16 py-3 bg-white cursor-pointer border border-slate-200 rounded-xl text-red-600 hover:text-red-800 hover:border-red-800 hover:bg-indigo-50/30 transition-all flex items-center justify-center active:scale-[0.98] shadow-sm"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
