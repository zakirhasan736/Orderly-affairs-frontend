import React, { useState } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Alert, AlertDescription } from '@common/ui/alert';
import { Badge } from '@common/ui/badge';
import Cookies from 'js-cookie';
import { Checkbox } from '@common/ui/checkbox';
import {
  X,
  MessageSquare,
  Mail,
  Phone,
  Video,
  Send,
  Heart,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

type DeliveryMessage = {
  id: string;
  recipient: string;
  relationship: string;
  type: 'video' | 'email' | 'letter' | 'voicemail';
  subject: string;
  preview: string;
  deliveryMethod: string;
};

interface MessagesDeliveryModalProps {
  nokData: any;
  formData: Record<string, any>;
  kit: {
    messages: Array<{
      id: string;
      recipient: string;
      recipient_email?: string;
      message_type: 'email' | 'voicemail' | 'video' | 'letter';
      delivery_trigger?: string;
      delivery_date?: string;
      delivery_occasion?: string;
      status?: string;
      created_at?: string;
      sent_at?: string;
    }>;
  };
  onClose: () => void;
}

export const MessagesDeliveryModal: React.FC<MessagesDeliveryModalProps> = ({
  nokData,
  formData,
  kit,
  onClose,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const messages = React.useMemo(() => {
    if (!kit?.messages) return [];

    return kit.messages
      .filter(m => m.status === 'pending')
      .map(m => {
        const id = (m as any).id ?? (m as any)._id;
        if (!id) return null;
        return {
          id,
          recipient: m.recipient,
          relationship: '',
          type: m.message_type,
          subject: m.delivery_occasion || 'Personal Message',
          preview: 'This message will be delivered without preview.',
          deliveryMethod:
            m.delivery_trigger === 'date'
              ? `Scheduled: ${new Date(m.delivery_date!).toLocaleString()}`
              : m.delivery_trigger === 'death'
                ? 'Triggered upon death confirmation'
                : 'Manual',
        };
      })
      .filter((m): m is DeliveryMessage => m !== null);
  }, [kit?.messages]);

  const [isDelivering, setIsDelivering] = useState(false);
  const [deliveryComplete, setDeliveryComplete] = useState(false);

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'voicemail':
        return <Phone className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'letter':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getMessageTypeBadge = (type: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      email: {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        label: 'Email',
      },
      voicemail: {
        color:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        label: 'Voice Message',
      },
      video: {
        color:
          'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        label: 'Video Message',
      },
      letter: {
        color:
          'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
        label: 'Letter',
      },
    };

    const variant = variants[type] || variants.email;
    return (
      <Badge className={variant.color}>
        {getMessageIcon(type)}
        <span className="ml-1">{variant.label}</span>
      </Badge>
    );
  };

  const handleToggleMessage = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === messages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(messages.map(m => m.id));
    }
  };

  const handleDeliverMessages = async () => {
    console.log('🚀 Deliver clicked, selectedIds:', selectedIds);
    if (selectedIds.length === 0) {
      toast.error('Please select at least one message to deliver.');
      return;
    }

    setIsDelivering(true);

    try {
      for (const id of selectedIds) {
        console.log('📤 Sending deliver request for ID:', id);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/kit/deliver/${id}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${Cookies.get('nok_auth_token')}`,
            },
          },
        );

        console.log('📬 Response status:', res.status);

        if (!res.ok) {
          const txt = await res.text();
          console.error('❌ Backend error:', txt);
          throw new Error(txt);
        }
      }

      toast.success(`${selectedIds.length} message(s) delivered`);
      setDeliveryComplete(true);
    } catch (err) {
      toast.error('Failed to deliver messages');
    } finally {
      setIsDelivering(false);
    }
  };

  const selectedCount = selectedIds.length;

  if (deliveryComplete) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md mx-auto  bg-white">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-lg text-green-800 dark:text-green-200">
              Messages Delivered Successfully
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              The Kit Owner's messages have been delivered to the designated
              recipients. This action has been logged for record-keeping.
            </p>

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                Recipients will receive their messages within the next few
                minutes. Physical letters will be processed for mailing within
                24 hours.
              </p>
            </div>

            <Button onClick={onClose} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl mx-auto max-h-[90vh] flex flex-col bg-white">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  Deliver Messages to Loved Ones
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Send the Kit Owner's pre-recorded messages to designated
                  recipients
                </p>
              </div>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-4">
          <Alert>
            <Heart className="h-4 w-4" />
            <AlertDescription>
              The Kit Owner has prepared personal messages for family members
              and loved ones. As the authorized Next of Kin, you can trigger the
              delivery of these messages. You cannot view or edit the content -
              only deliver them.
            </AlertDescription>
          </Alert>

          {/* Selection Controls */}
          {messages.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={
                    messages.length > 0 &&
                    selectedIds.length === messages.length
                  }
                  onCheckedChange={handleSelectAll}
                />

                <span className="text-sm font-medium">Select All Messages</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedCount} of {messages.length} messages selected
              </div>
            </div>
          )}

          {/* Messages List */}
          <div className="space-y-3">
            {messages.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-muted-foreground mb-2">
                    No Messages Available
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    The Kit Owner has not created any personal messages for
                    delivery. Messages that were previously deleted by the owner
                    will not appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              messages.map(message => (
                <Card
                  key={message.id}
                  className={`transition-all ${
                    selectedIds.includes(message.id)
                      ? 'ring-2 ring-primary'
                      : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedIds.includes(message.id)}
                        onCheckedChange={() => handleToggleMessage(message.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-medium text-sm">
                              {message.subject}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              For: {message.recipient} ({message.relationship})
                            </p>
                          </div>
                          {getMessageTypeBadge(message.type)}
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {message.preview}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Delivery: {message.deliveryMethod}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Delivery Button */}
          {messages.length > 0 && (
            <div className="sticky bottom-0 bg-background pt-4 border-t">
              <Button
                onClick={handleDeliverMessages}
                disabled={selectedCount === 0 || isDelivering}
                className="w-full"
                size="lg"
              >
                {isDelivering ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Delivering Messages...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Deliver {selectedCount} Selected Message
                    {selectedCount !== 1 ? 's' : ''}
                  </div>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};