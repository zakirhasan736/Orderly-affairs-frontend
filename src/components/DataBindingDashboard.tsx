import React, { useState, useMemo, useEffect } from 'react';
import { getMessages } from '@/libs/api/lettersOfNaxtKinMessage';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Button } from '@common/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@common/ui/tabs';
import { Badge } from '@common/ui/badge';
import { Progress } from '@common/ui/progress';
import { Input } from '@common/ui/input';
import Cookies from 'js-cookie';
import {
  Users,
  FileText,
  MessageSquare,
  Search,
  Filter,
  ChevronRight,
  Shield,
  Video,
  Mic,
  Mail,
} from 'lucide-react';
import { AccessPersonCard } from './AccessPersonCard';
import { NOKLetterCard } from './NOKLetterCard';
import { MessageCard } from './MessageCard';

interface DataBindingDashboardProps {
  formData: any;
  nextKinList: any[];
  nokLetter: any;
  isNextOfKin?: boolean;
  nextTask: { id: string; title: string } | null;
  onNavigateToSection: (sectionId: string) => void;
}
interface ApiMessage {
  _id: string;
  title: string;
  recipient: string;
  recipient_email: string;
  content: string;
  message_type: 'letter' | 'video' | 'audio';
  delivery_trigger: string;
  delivery_date?: string;
  delivery_occasion?: string;
  status: string;
  updated_at: string;
  media?: any;
  subject?: string;
}

export function DataBindingDashboard({
  formData,
  nextKinList,
  nokLetter,
  onNavigateToSection,
  isNextOfKin = false,
  nextTask,
}: DataBindingDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [messageFilter, setMessageFilter] = useState<
    'all' | 'audio' | 'video' | 'letter'
  >('all');
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const token = isNextOfKin
    ? Cookies.get('nok_auth_token')
    : Cookies.get('auth_token');
  useEffect(() => {
    const fetchMessages = async () => {
      if (!token) return;

      try {
        setLoadingMessages(true);
        const response = await getMessages(token);
        console.log('FULL API RESPONSE:', response);
        setMessages(response || []);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [token]);

  // Computed progress function from JSON spec
  const computedProgress = useMemo(() => {
    try {
      const sections = [
        'formData.2.2A.access_management_data',
        'formData.3.3A.next_of_kin_letter_data',
        'formData.4.4A.letters_data',
      ];
      let done = 0;
      const total = sections.length;

      sections.forEach(path => {
        const value = path
          .split('.')
          .reduce((a: any, k: string) => a && a[k], { formData });
        if (
          value &&
          ((Array.isArray(value) && value.length > 0) ||
            (typeof value === 'object' && Object.keys(value).length > 0))
        ) {
          done++;
        }
      });

      return Math.round((done / total) * 100);
    } catch (e) {
      return 72; // fallback
    }
  }, [formData]);

  // Data extraction based on JSON spec paths
  const accessManagementData = useMemo(() => {
    return nextKinList || [];
  }, [nextKinList]);

  // const nextOfKinLetterData = useMemo(() => {
  //   return formData?.['3']?.['3A']?.next_of_kin_letter_data || null;
  // }, [formData]);
  console.log('NOK Letter from API:', nokLetter);
  const nextOfKinLetterData = nokLetter;
  console.log('Next of Kin Letter Data:', nextOfKinLetterData);

  const pendingMessages = useMemo(() => {
    return messages
      .map((item: ApiMessage) => ({
        id: item._id,
        title: item.title,
        recipient: item.recipient,
        recipientEmail: item.recipient_email,
        content: item.content || '', // ✅ REQUIRED
        lastModified: item.updated_at,
        messageType: item.message_type as 'letter' | 'video' | 'audio',
        deliveryTrigger: item.delivery_trigger,
        isDelivered: item.status === 'sent', // ✅ REQUIRED
        deliveryDate: item.delivery_date,
        deliveryOccasion: item.delivery_occasion,
        subject: item.subject,

        // Optional media mapping
        audioFile:
          item.message_type === 'audio' && item.media
            ? { name: 'Audio Message', type: 'audio' }
            : undefined,

        videoFile:
          item.message_type === 'video' && item.media
            ? { name: 'Video Message', type: 'video' }
            : undefined,
      }))
      .filter(msg => !msg.isDelivered) // ✅ ONLY PENDING
      .filter(msg =>
        messageFilter === 'all' ? true : msg.messageType === messageFilter,
      ) // ✅ TYPE FILTER
      .filter(msg => {
        if (!searchTerm) return true;

        const search = searchTerm.toLowerCase();
        return (
          msg.title.toLowerCase().includes(search) ||
          msg.recipient.toLowerCase().includes(search) ||
          msg.content.toLowerCase().includes(search)
        );
      }); // ✅ SEARCH FILTER
  }, [messages, messageFilter, searchTerm]);

  // Filter access management data based on search
  const filteredAccessData = useMemo(() => {
    if (!searchTerm) return accessManagementData;

    return accessManagementData.filter(
      (item: any) =>
        item.person_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.relationship?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email_address?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [accessManagementData, searchTerm]);

  const getMessageTypeCount = (type: string) => {
    return pendingMessages.filter((item: any) => item.messageType === type)
      .length;
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Progress Section */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white p-8 rounded-2xl border border-slate-200  flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-[#1e293b]">
              {' '}
              {computedProgress}% organized
            </h1>
            <p className="text-slate-500 mt-2 text-sm max-w-sm">
              You are on the right track. Secure your final wishes by completing
              the remaining 67% of your legacy plan.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Button
                onClick={() => {
                  // Find next incomplete section starting with instructions
                  const sections = [
                    { id: '0', name: 'Instructions', data: true }, // Always complete since it's just instructions
                    {
                      id: '2',
                      name: 'Access & Next of Kin',
                      data: accessManagementData,
                    },
                    {
                      id: '3',
                      name: 'Next of Kin Letters',
                      data: nextOfKinLetterData,
                    },
                    { id: '4', name: 'Messages', data: pendingMessages },
                  ];

                  const incomplete = sections.find(
                    section =>
                      !section.data ||
                      (Array.isArray(section.data) &&
                        section.data.length === 0) ||
                      (typeof section.data === 'object' &&
                        Object.keys(section.data).length === 0),
                  );

                  if (incomplete) {
                    onNavigateToSection(incomplete.id);
                  } else {
                    onNavigateToSection('0');
                  }
                }}
                className="px-8 py-3  text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                Continue organizing
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Button>
              <div className="block">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Overall Progress
                </span>
                <Progress value={computedProgress} className="w-32" />
              </div>
            </div>
          </div>
          {/* Subtle background abstract shape */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-20 -mt-20 group-hover:bg-indigo-50/50 transition-colors duration-500" />
        </div>

        <div className="lg:max-w-90 w-full grid grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="bg-[#1e293b] dashboard-next-task p-6 rounded-2xl text-white  flex flex-col justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Next Task
            </h3>
            {nextTask ? (
              <>
                <p className="font-bold text-sm mt-2">
                  Complete {nextTask.title}
                </p>

                <button
                  onClick={() => onNavigateToSection(nextTask.id)}
                  className="text-[10px] font-bold text-indigo-400 mt-4 hover:text-indigo-300"
                >
                  Go to Section →
                </button>
              </>
            ) : (
              <>
                <p className="font-bold text-sm mt-2">
                  🎉 All Sections Completed!
                </p>
                <p className="text-[10px] text-slate-400 mt-4">
                  Your vault is fully organized.
                </p>
              </>
            )}
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200  flex flex-col justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Vault Status
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="font-bold text-sm text-slate-800">
                Fully Encrypted
              </p>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              256-bit AES Protection
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className="glass-card dashboard-instructions-card cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onNavigateToSection('0')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-primary">
                  Instructions
                </h3>
                <p className="text-text-secondary text-sm">
                  Getting started guide
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="glass-card dashboard-access-card cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onNavigateToSection('2')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-primary">
                  Access Management
                </h3>
                <p className="text-text-secondary text-sm">
                  {accessManagementData.length} authorized{' '}
                  {accessManagementData.length === 1 ? 'person' : 'people'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="glass-card dashboard-nok-card cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onNavigateToSection('3')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-lg">
                <FileText className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-primary">
                  NOK Letters
                </h3>
                <p className="text-text-secondary text-sm">
                  {nextOfKinLetterData ? 'Letter configured' : 'No letter yet'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className="glass-card dashboard-messages-card cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onNavigateToSection('4')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-primary">Messages</h3>
                <p className="text-text-secondary text-sm">
                  {pendingMessages.length} personal{' '}
                  {pendingMessages.length === 1 ? 'message' : 'messages'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dashboard-filter-and-search p-4 rounded-2xl border border-slate-200 justify-between shadow-sm flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 relative max-w-full w-full">
          <svg
            className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search across all sections..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs focus:ring-2 ring-slate-200 transition-all outline-none text-slate-600 font-medium"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <Button
            variant={messageFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMessageFilter('all')}
          >
            All Messages
          </Button>
          <Button
            variant={messageFilter === 'letter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMessageFilter('letter')}
          >
            <Mail className="h-4 w-4 mr-1" />
            Letters ({getMessageTypeCount('letter')})
          </Button>
          <Button
            variant={messageFilter === 'audio' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMessageFilter('audio')}
          >
            <Mic className="h-4 w-4 mr-1" />
            Audio ({getMessageTypeCount('audio')})
          </Button>
          <Button
            variant={messageFilter === 'video' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMessageFilter('video')}
          >
            <Video className="h-4 w-4 mr-1" />
            Video ({getMessageTypeCount('video')})
          </Button>
        </div>
      </div>
      {/* Data Sections */}
      <Tabs defaultValue="access" className="w-full dashboard-tabs-section">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Access Management
            {accessManagementData.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {accessManagementData.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="nok-letters" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            NOK Letters
            {nextOfKinLetterData && (
              <Badge variant="secondary" className="ml-1">
                1
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
            {pendingMessages.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingMessages.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="space-y-4 mt-6">
          {filteredAccessData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAccessData.map((item: any, index: number) => (
                <AccessPersonCard
                  key={`access-${index}`}
                  item={item}
                  onEdit={() => onNavigateToSection('2')}
                  showSensitiveInfo={false}
                />
              ))}
            </div>
          ) : (
            <Card className="glass-card">
              <CardContent className="pt-6 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="w-24 h-24 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-8 border border-slate-100">
                  <svg
                    className="w-12 h-12 text-slate-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-brand-primary mb-2">
                  No Access Management Data
                </h3>
                <p className="text-text-secondary text-sm mb-4">
                  {searchTerm
                    ? 'No results found for your search.'
                    : 'Start by adding authorized people who can access your kit.'}
                </p>
                <Button onClick={() => onNavigateToSection('2')}>
                  {searchTerm ? 'Clear Search' : 'Set Up Access Management'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="nok-letters" className="space-y-4 mt-6">
          {nextOfKinLetterData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NOKLetterCard
                obj={nextOfKinLetterData}
                onEdit={() => onNavigateToSection('3')}
                onView={() => onNavigateToSection('3')}
              />
            </div>
          ) : (
            <Card className="glass-card">
              <CardContent className="pt-6 text-center">
                <div className="w-24 h-24  mx-auto rounded-full bg-rose-50 flex items-center justify-center mb-8 border border-rose-100">
                  <span className="text-4xl">✉️</span>
                </div>

                <h3 className="font-semibold text-brand-primary mb-2">
                  No Next of Kin Letter
                </h3>
                <p className="text-text-secondary text-sm mb-4">
                  Create an important introductory letter for your designated
                  next of kin.
                </p>
                <Button onClick={() => onNavigateToSection('3')}>
                  Create NOK Letter
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="messages" className="space-y-4 mt-6">
          {loadingMessages ? (
            <div className="text-center py-10 text-muted-foreground">
              {' '}
              Loading messages...{' '}
            </div>
          ) : pendingMessages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingMessages.map((item, index) => (
                <MessageCard
                  key={item.id || index}
                  item={item}
                  onEdit={() => onNavigateToSection('4')}
                  onView={() => onNavigateToSection('4')}
                  onDelete={() => onNavigateToSection('4')}
                />
              ))}
            </div>
          ) : (
            <Card className="glass-card">
              <CardContent className="pt-6 text-center">
                <div className="w-24 h-24  mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-8 border border-blue-100">
                  <span className="text-4xl">🎬</span>
                </div>
                <h3 className="font-semibold text-brand-primary mb-2">
                  No Messages
                </h3>
                <p className="text-text-secondary text-sm mb-4">
                  {searchTerm || messageFilter !== 'all'
                    ? 'No messages match your current filters.'
                    : 'Create heartfelt personal messages for your loved ones.'}
                </p>
                <Button onClick={() => onNavigateToSection('4')}>
                  {searchTerm || messageFilter !== 'all'
                    ? 'Clear Filters'
                    : 'Create Messages'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
