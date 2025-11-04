'use client';

import { useState, useEffect } from 'react';
import { SessionUploadForm } from '@/components/upload/SessionUploadForm';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, BarChart3, Play } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Upload Session | SailIQ',
  description: 'Upload your GoPro sailing footage for AI-powered analysis and coaching insights',
};

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedSessionId, setUploadedSessionId] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  const handleUploadComplete = (sessionData: any) => {
    setUploadedSessionId(sessionData.session.id);
    setActiveTab('progress');
    setShowProgress(true);
  };

  const handleViewSession = () => {
    // Navigate to session analysis page
    window.location.href = `/sessions/${uploadedSessionId}`;
  };

  useEffect(() => {
    // Reset state when tab changes
    if (activeTab === 'upload') {
      setUploadedSessionId(null);
      setShowProgress(false);
    }
  }, [activeTab]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Upload Sailing Session</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upload your GoPro footage to get AI-powered analysis and coaching insights
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Video
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2" disabled={!uploadedSessionId}>
            <BarChart3 className="h-4 w-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="examples" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Examples
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <SessionUploadForm onComplete={handleUploadComplete} />
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {showProgress && uploadedSessionId ? (
            <UploadProgress
              sessionId={uploadedSessionId}
              onComplete={handleViewSession}
              onViewSession={handleViewSession}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Progress</CardTitle>
                <CardDescription>
                  Upload a video session to see the analysis progress here
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No session is currently being analyzed
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Training Session</CardTitle>
                <CardDescription>
                  Learn from your practice sessions and track improvement
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                  <Play className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Race Analysis</CardTitle>
                <CardDescription>
                  Analyze your racing performance and strategy
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                  <Play className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regatta Review</CardTitle>
                <CardDescription>
                  Review multiple races and track overall performance
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                  <Play className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}