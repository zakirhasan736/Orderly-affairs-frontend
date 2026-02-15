import React, { useState, useEffect } from 'react';
import { Button } from '@common/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@common/ui/card';
import { CheckCircle, XCircle, AlertCircle, Video, Mic } from 'lucide-react';

interface PermissionCheckerProps {
  type: 'video' | 'audio';
  onPermissionGranted: () => void;
  onClose: () => void;
}

export function PermissionChecker({ type, onPermissionGranted, onClose }: PermissionCheckerProps) {
  const [permissionStatus, setPermissionStatus] = useState<'checking' | 'granted' | 'denied' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    checkPermissions();
  }, [type]);

  const checkPermissions = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionStatus('denied');
        setErrorMessage('Your browser does not support camera/microphone access. Please use file upload instead.');
        return;
      }

      const constraints = type === 'video' 
        ? { video: true, audio: true }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Test successful, clean up stream
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionStatus('granted');
    } catch (error: any) {
      console.error('Permission check failed:', error);
      setPermissionStatus('denied');
      
      if (error.name === 'NotAllowedError') {
        setErrorMessage('Camera/microphone access was denied. Please allow access and try again, or use the file upload option instead.');
      } else if (error.name === 'NotFoundError') {
        setErrorMessage('No camera or microphone found on your device. Please use the file upload option instead.');
      } else if (error.name === 'NotReadableError') {
        setErrorMessage('Camera/microphone is already in use by another application. Please close other apps using your camera/microphone and try again.');
      } else if (error.name === 'OverconstrainedError') {
        setErrorMessage('Your camera/microphone does not meet the required specifications. Please use the file upload option instead.');
      } else {
        setErrorMessage('Unable to access camera/microphone. Please check your device settings or use the file upload option instead.');
      }
    }
  };

  const handleTryAgain = () => {
    setPermissionStatus('checking');
    setErrorMessage('');
    checkPermissions();
  };

  const getIcon = () => {
    if (type === 'video') {
      return <Video className="w-8 h-8" />;
    }
    return <Mic className="w-8 h-8" />;
  };

  const getTitle = () => {
    return type === 'video' ? 'Camera & Microphone Access' : 'Microphone Access';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {permissionStatus === 'checking' && (
            <div className="text-center py-6">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-yellow-500 animate-spin" />
              <p>Checking device permissions...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please allow access when prompted by your browser.
              </p>
            </div>
          )}

          {permissionStatus === 'granted' && (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="font-medium">Access Granted!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your {type === 'video' ? 'camera and microphone are' : 'microphone is'} ready to use.
              </p>
            </div>
          )}

          {permissionStatus === 'denied' && (
            <div className="text-center py-6">
              <XCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
              <p className="font-medium">Access Denied</p>
              <p className="text-sm text-muted-foreground mt-2">
                {errorMessage}
              </p>
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-2">To enable access:</p>
                <ol className="text-left list-decimal list-inside space-y-1">
                  <li>Look for the camera/microphone icon in your browser's address bar</li>
                  <li>Click it and select "Allow"</li>
                  <li>Refresh the page if needed</li>
                </ol>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {permissionStatus === 'granted' && (
              <Button onClick={onPermissionGranted} className="flex-1">
                Continue to Record
              </Button>
            )}
            
            {permissionStatus === 'denied' && (
              <Button onClick={handleTryAgain} variant="outline" className="flex-1">
                Try Again
              </Button>
            )}
            
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}