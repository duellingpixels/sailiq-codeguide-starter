'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  Download,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  duration?: number;
}

interface UploadProgressProps {
  sessionId: string;
  onComplete?: () => void;
  onViewSession?: () => void;
}

const ANALYSIS_STEPS: Omit<AnalysisStep, 'status' | 'duration'>[] = [
  {
    id: 'upload',
    title: 'Video Upload',
    description: 'Uploading video file to secure storage',
  },
  {
    id: 'validation',
    title: 'File Validation',
    description: 'Checking video format and integrity',
  },
  {
    id: 'telemetry',
    title: 'Telemetry Extraction',
    description: 'Extracting GPS and sensor data',
  },
  {
    id: 'maneuver',
    title: 'Maneuver Detection',
    description: 'Identifying tacks, gybes, and mark roundings',
  },
  {
    id: 'analysis',
    title: 'Performance Analysis',
    description: 'Calculating metrics and generating insights',
  },
  {
    id: 'coaching',
    title: 'AI Coaching',
    description: 'Generating personalized feedback',
  },
];

export function UploadProgress({ sessionId, onComplete, onViewSession }: UploadProgressProps) {
  const [currentStep, setCurrentStep] = useState<string>('upload');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<AnalysisStep[]>([]);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Initialize steps
  useEffect(() => {
    const initializedSteps = ANALYSIS_STEPS.map((step, index) => ({
      ...step,
      status: index === 0 ? 'running' : 'pending' as const,
    }));
    setSteps(initializedSteps);
    setStartTime(new Date());
  }, []);

  // Poll for status updates
  useEffect(() => {
    if (!sessionId || status === 'completed') return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/analysis/jobs/${sessionId}/status`);
        if (!response.ok) {
          throw new Error('Failed to fetch analysis status');
        }

        const data = await response.json();

        // Update progress
        setProgress(data.progressPercentage || 0);
        setCurrentStep(data.currentStep || 'upload');
        setStatus(data.status);
        setError(data.errorMessage || null);

        // Update step status
        updateStepStatus(data.currentStep, data.status);

        // Update estimated time
        if (data.estimatedCompletion) {
          const estimated = new Date(data.estimatedCompletion);
          const now = new Date();
          const remaining = Math.max(0, estimated.getTime() - now.getTime());
          setEstimatedTime(Math.ceil(remaining / 1000 / 60)); // minutes
        }

        // Check if completed
        if (data.status === 'completed') {
          setStatus('completed');
          setProgress(100);
          markAllStepsCompleted();
          onComplete?.();
        }

      } catch (err) {
        console.error('Error polling analysis status:', err);
        setError('Failed to get analysis status');
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [sessionId, status, onComplete]);

  const updateStepStatus = (currentStepId: string, jobStatus: string) => {
    setSteps(prev => {
      const newSteps = [...prev];
      const currentStepIndex = newSteps.findIndex(s => s.id === currentStepId);

      if (currentStepIndex === -1) return prev;

      // Update all steps based on current progress
      for (let i = 0; i < newSteps.length; i++) {
        if (i < currentStepIndex) {
          newSteps[i].status = 'completed';
        } else if (i === currentStepIndex) {
          newSteps[i].status = jobStatus === 'failed' ? 'error' : 'running';
        } else {
          newSteps[i].status = 'pending';
        }
      }

      return newSteps;
    });
  };

  const markAllStepsCompleted = () => {
    setSteps(prev => prev.map(step => ({ ...step, status: 'completed' as const })));
  };

  const getStatusColor = (stepStatus: AnalysisStep['status']) => {
    switch (stepStatus) {
      case 'completed': return 'text-green-600';
      case 'running': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (stepStatus: AnalysisStep['status']) => {
    switch (stepStatus) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'running': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getElapsedTime = () => {
    if (!startTime) return '';
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    return formatDuration(elapsed);
  };

  const handleRetry = async () => {
    try {
      setStatus('processing');
      setError(null);
      // Trigger retry logic - this would call the analysis service
      const response = await fetch(`/api/sessions/${sessionId}/retry`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to retry analysis');
      }
    } catch (err) {
      setError('Failed to retry analysis');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'completed' ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : status === 'error' ? (
              <AlertCircle className="h-5 w-5 text-red-600" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            )}
            Analysis Progress
          </CardTitle>
          <CardDescription>
            {status === 'pending' && 'Preparing to analyze your sailing session...'}
            {status === 'processing' && 'Analyzing your sailing performance...'}
            {status === 'completed' && 'Analysis complete! Ready to view your insights.'}
            {status === 'error' && 'Something went wrong during analysis.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Current: {steps.find(s => s.id === currentStep)?.title || 'Initializing...'}</span>
              <span>Elapsed: {getElapsedTime()}</span>
            </div>
            {estimatedTime && status === 'processing' && (
              <p className="text-xs text-muted-foreground">
                Estimated time remaining: {estimatedTime} minutes
              </p>
            )}
          </div>

          {/* Error Display */}
          {error && status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Analysis Failed</AlertTitle>
              <AlertDescription>
                {error}
                <div className="mt-2">
                  <Button size="sm" variant="outline" onClick={handleRetry}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Analysis
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Step-by-step Progress */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Analysis Steps</h4>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    step.status === 'running' && "border-blue-200 bg-blue-50/50",
                    step.status === 'completed' && "border-green-200 bg-green-50/50",
                    step.status === 'error' && "border-red-200 bg-red-50/50"
                  )}
                >
                  <div className={cn("flex-shrink-0", getStatusColor(step.status))}>
                    {getStatusIcon(step.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                    {step.duration && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Duration: {formatDuration(step.duration)}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <Badge
                      variant={step.status === 'completed' ? 'default' : 'secondary'}
                      className={cn(
                        step.status === 'running' && 'bg-blue-100 text-blue-800',
                        step.status === 'error' && 'bg-red-100 text-red-800'
                      )}
                    >
                      {step.status === 'pending' && 'Pending'}
                      {step.status === 'running' && 'Running'}
                      {step.status === 'completed' && 'Complete'}
                      {step.status === 'error' && 'Failed'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          {status === 'completed' && (
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button onClick={onViewSession} className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                View Session Analysis
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}