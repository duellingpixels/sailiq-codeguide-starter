import { createClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessionId = params.id;

    // Get Supabase client
    const supabase = createClient();

    // Fetch analysis job status
    const { data: job, error } = await supabase
      .from('analysis_jobs')
      .select(`
        *,
        sailing_sessions (
          id,
          title,
          analysis_status,
          user_id
        )
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Analysis job fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analysis status', details: error.message },
        { status: 500 }
      );
    }

    // Check if user owns the session
    if (job.sailing_sessions.user_id !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      progressPercentage: job.progress_percentage,
      currentStep: job.current_step,
      errorMessage: job.error_message,
      processingStartedAt: job.processing_started_at,
      processingCompletedAt: job.processing_completed_at,
      estimatedCompletion: job.estimated_completion,
      retryCount: job.retry_count,
      maxRetries: job.max_retries,
      sessionStatus: job.sailing_sessions.analysis_status
    });

  } catch (error) {
    console.error('Analysis status fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}