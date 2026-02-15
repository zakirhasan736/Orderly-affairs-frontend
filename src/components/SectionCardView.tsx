import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Button } from '@common/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@common/ui/tabs';
import { AccessPersonCard } from './AccessPersonCard';
import { NOKLetterCard } from './NOKLetterCard';
import { MessageCard } from './MessageCard';
import { Users, FileText, MessageSquare } from 'lucide-react';

interface SectionCardViewProps {
  sectionId: string;
  formData: any;
  onEditItem?: (index?: number) => void;
  onDeleteItem?: (index?: number) => void;
  onViewItem?: (index?: number) => void;
}

export function SectionCardView({ 
  sectionId, 
  formData, 
  onEditItem, 
  onDeleteItem,
  onViewItem 
}: SectionCardViewProps) {
  
  // Section 2A - Access Management
  if (sectionId === '2A') {
    const accessData = formData?.['2']?.['2A']?.access_management_data || [];
    
    if (accessData.length === 0) {
      return (
        <Card className="glass-card">
          <CardContent className="pt-6 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-brand-primary mb-2">No Authorized People</h3>
            <p className="text-text-secondary text-sm mb-4">
              Add people who can access your Orderly Affairs Kit after your passing.
            </p>
            <Button onClick={() => onEditItem?.()} variant="default">
              Add First Person
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-brand-primary">
            Authorized People ({accessData.length})
          </h3>
          <Button onClick={() => onEditItem?.()} variant="outline">
            Add Person
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {accessData.map((item: any, index: number) => (
            <AccessPersonCard
              key={`access-${index}`}
              item={item}
              onEdit={() => onEditItem?.(index)}
              onDelete={() => onDeleteItem?.(index)}
              showSensitiveInfo={true}
            />
          ))}
        </div>
      </div>
    );
  }

  // Section 3A - Next of Kin Letter
  if (sectionId === '3A') {
    const letterData = formData?.['3']?.['3A']?.next_of_kin_letter_data;
    
    if (!letterData) {
      return (
        <Card className="glass-card">
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-brand-primary mb-2">No Letter Created</h3>
            <p className="text-text-secondary text-sm mb-4">
              Create an important introductory letter for your designated next of kin.
            </p>
            <Button onClick={() => onEditItem?.()} variant="default">
              Create Letter
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-brand-primary">
            Next of Kin Letter
          </h3>
          <Button onClick={() => onEditItem?.()} variant="outline">
            Edit Letter
          </Button>
        </div>
        
        <NOKLetterCard
          obj={letterData}
          onEdit={() => onEditItem?.()}
          onDelete={() => onDeleteItem?.()}
          onView={() => onViewItem?.()}
        />
      </div>
    );
  }

  // Section 4A - Messages/Letters
  if (sectionId === '4A') {
    const lettersData = formData?.['4']?.['4A']?.letters_data || [];
    
    if (lettersData.length === 0) {
      return (
        <Card className="glass-card">
          <CardContent className="pt-6 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-brand-primary mb-2">No Messages Created</h3>
            <p className="text-text-secondary text-sm mb-4">
              Create heartfelt personal messages for your loved ones.
            </p>
            <Button onClick={() => onEditItem?.()} variant="default">
              Create First Message
            </Button>
          </CardContent>
        </Card>
      );
    }

    // Group messages by type for tabs
    const audioMessages = lettersData.filter((item: any) => item.messageType === 'audio');
    const videoMessages = lettersData.filter((item: any) => item.messageType === 'video');
    const letterMessages = lettersData.filter((item: any) => item.messageType === 'letter');

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-brand-primary">
            Personal Messages ({lettersData.length})
          </h3>
          <Button onClick={() => onEditItem?.()} variant="outline">
            Create Message
          </Button>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All ({lettersData.length})</TabsTrigger>
            <TabsTrigger value="letter">Letters ({letterMessages.length})</TabsTrigger>
            <TabsTrigger value="audio">Audio ({audioMessages.length})</TabsTrigger>
            <TabsTrigger value="video">Video ({videoMessages.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {lettersData.map((item: any, index: number) => (
                <MessageCard
                  key={`message-${item.id || index}`}
                  item={item}
                  onEdit={() => onEditItem?.(index)}
                  onDelete={() => onDeleteItem?.(index)}
                  onView={() => onViewItem?.(index)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="letter" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {letterMessages.map((item: any, index: number) => (
                <MessageCard
                  key={`letter-${item.id || index}`}
                  item={item}
                  onEdit={() => onEditItem?.(lettersData.indexOf(item))}
                  onDelete={() => onDeleteItem?.(lettersData.indexOf(item))}
                  onView={() => onViewItem?.(lettersData.indexOf(item))}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="audio" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {audioMessages.map((item: any, index: number) => (
                <MessageCard
                  key={`audio-${item.id || index}`}
                  item={item}
                  onEdit={() => onEditItem?.(lettersData.indexOf(item))}
                  onDelete={() => onDeleteItem?.(lettersData.indexOf(item))}
                  onView={() => onViewItem?.(lettersData.indexOf(item))}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="video" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {videoMessages.map((item: any, index: number) => (
                <MessageCard
                  key={`video-${item.id || index}`}
                  item={item}
                  onEdit={() => onEditItem?.(lettersData.indexOf(item))}
                  onDelete={() => onDeleteItem?.(lettersData.indexOf(item))}
                  onView={() => onViewItem?.(lettersData.indexOf(item))}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return null;
}