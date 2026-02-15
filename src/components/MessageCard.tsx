import React from 'react';
import { Card, CardHeader, CardContent } from '@common/ui/card';
import { Badge } from '@common/ui/badge';
import { Button } from '@common/ui/button';
import { 
  Mail, 
  Phone, 
  FileText, 
  Video, 
  Mic, 
  Calendar, 
  Clock, 
  Send, 
  Edit, 
  Trash2, 
  User,
  CheckCircle,
  AlertCircle,
  Play,
  ViewIcon,
  EditIcon
} from 'lucide-react';

interface MessageData {
  id: string;
  title: string;
  recipient: string;
  recipientEmail: string;
  content: string;
  lastModified: string;
  messageType: 'letter' | 'video' | 'audio';
  deliveryTrigger: string;
  isDelivered: boolean;
  deliveryDate?: string;
  deliveryOccasion?: string;
  audioFile?: { name: string; type: string; };
  videoFile?: { name: string; type: string; };
  subject?: string;
}

interface MessageCardProps {
  item: MessageData;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onPlay?: () => void;
}

export function MessageCard({ 
  item, 
  onEdit, 
  onDelete,
  onView,
  onPlay 
}: MessageCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'audio':
        return <Mic className="h-5 w-5" />;
      case 'letter':
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-purple-500';
      case 'audio':
        return 'bg-green-500';
      case 'letter':
      default:
        return 'bg-blue-500';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const truncateContent = (text: string, maxLength: number = 120) => {
    if (!text) return 'No content';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // const getDeliveryStatusIcon = () => {
  //   if (item.isDelivered) {
  //     return <CheckCircle className="h-4 w-4 text-green-600" />;
  //   }
  //   return <AlertCircle className="h-4 w-4 text-yellow-600" />;
  // };

  const getDeliveryStatusText = () => {
    if (item.isDelivered) {
      return `Delivered ${item.deliveryDate ? formatDate(item.deliveryDate) : ''}`;
    }
    return `Pending: ${item.deliveryTrigger}`;
  };

  return (
    <>

      <div className="bg-white border border-slate-100 rounded-xl px-7 py-8 hover:shadow-[0_40px_80px_-20px_rgba(30,41,59,0.12)] transition-all group flex flex-col h-full relative overflow-hidden shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-5">
            <div
              className={`${getTypeColor(item.messageType)} w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm`}
            >
              {getTypeIcon(item.messageType)}
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1e293b] tracking-tight">
                {item.title || 'Untitled Message'}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                Subject: {item.subject}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`${getTypeColor(item.messageType)} px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100`}
            >
              {item.messageType.charAt(0).toUpperCase() +
                item.messageType.slice(1)}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span
                className={`${
                  item.isDelivered ? 'text-green-600' : 'text-yellow-600'
                } text-[10px] font-black text-amber-500 uppercase tracking-widest`}
              >
                {item.isDelivered ? 'Delivered' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-5 mb-3">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-1 h-3 bg-indigo-500 rounded-full" />
              Recipient
            </p>
            <div className="pl-4">
              <p className="text-[15px] font-black text-[#1e293b] tracking-tight">
                {item.recipient || 'No recipient'}
              </p>
              <p className="text-[12px] font-bold text-slate-400 truncate mt-0.5">
                {item.recipientEmail}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-1 h-3 bg-indigo-500 rounded-full" />
              Content Preview
            </p>
            <div className="pl-4 italic">
              <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
                "{truncateContent(item.content, 150)}"
              </p>
            </div>
          </div>
          {(item.audioFile || item.videoFile) && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-1 h-3 bg-indigo-500 rounded-full" />
                Media Files
              </p>
              <div className="pl-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {item.audioFile && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <Mic className="h-4 w-4 text-green-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 truncate">
                        {item.audioFile.name}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {item.audioFile.type}
                      </p>
                    </div>
                    {onPlay && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onPlay}
                        className="h-6 w-6 p-0"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}

                {item.videoFile && (
                  <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <Video className="h-4 w-4 text-purple-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-purple-800 dark:text-purple-200 truncate">
                        {item.videoFile.name}
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        {item.videoFile.type}
                      </p>
                    </div>
                    {onPlay && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onPlay}
                        className="h-6 w-6 p-0"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-1 h-3 bg-indigo-500 rounded-full" />
              Delivery Information
            </p>
            <div className="pl-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[12px] font-black text-[#1e293b] uppercase tracking-tight">
                {getDeliveryStatusText()}
              </p>
            </div>
          </div>
          {item.deliveryOccasion && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-1 h-3 bg-indigo-500 rounded-full" />
                Delivery Schedule
              </p>
              <div className="pl-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[12px] font-black text-[#1e293b] uppercase tracking-tight">
                  {item.deliveryOccasion}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto pt-0 border-t border-slate-50 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-slate-300">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tight">
              Updated: {formatDateTime(item.lastModified)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onView}
              className="px-6 py-3 bg-[#1e293b] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center gap-3"
            >
              {item.messageType === 'letter' ? (
                <ViewIcon className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {item.messageType === 'letter' ? 'View' : 'Play'}
            </button>
            <button
              onClick={onEdit}
              className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all flex items-center justify-center active:scale-[0.98] shadow-sm"
            >
              <EditIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all flex items-center justify-center active:scale-[0.98] shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}