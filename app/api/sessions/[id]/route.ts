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

    // Fetch session with related data
    const { data: session, error } = await supabase
      .from('sailing_sessions')
      .select(`
        *,
        session_analytics (*),
        maneuvers (
          id,
          maneuver_type,
          start_time_seconds,
          end_time_seconds,
          duration_seconds,
          speed_before_knots,
          speed_after_knots,
          speed_change_knots,
          max_roll_angle_degrees,
          avg_roll_angle_degrees,
          efficiency_score,
          technique_score,
          overall_score,
          ai_feedback,
          improvement_tips,
          video_clip_path,
          keyframes
        ),
        weather_data (
          timestamp,
          wind_speed_knots,
          wind_direction_degrees,
          wind_gusts_knots,
          temperature_celsius,
          humidity_percent,
          pressure_mb,
          source
        ),
        analysis_jobs (
          id,
          status,
          progress_percentage,
          current_step,
          error_message,
          processing_started_at,
          processing_completed_at,
          created_at,
          updated_at
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Session fetch error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch session', details: error.message },
        { status: 500 }
      );
    }

    // Check if user owns the session or it's public
    if (session.user_id !== userId && !session.is_public) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      session
    });

  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const body = await req.json();

    // Get Supabase client
    const supabase = createClient();

    // First check if user owns the session
    const { data: existingSession, error: fetchError } = await supabase
      .from('sailing_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (existingSession.user_id !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update session
    const { data: session, error } = await supabase
      .from('sailing_sessions')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Session update error:', error);
      return NextResponse.json(
        { error: 'Failed to update session', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session
    });

  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // First check if user owns the session
    const { data: existingSession, error: fetchError } = await supabase
      .from('sailing_sessions')
      .select('user_id, video_file_path')
      .eq('id', sessionId)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (existingSession.user_id !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete session (this will cascade delete related records)
    const { error } = await supabase
      .from('sailing_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Session deletion error:', error);
      return NextResponse.json(
        { error: 'Failed to delete session', details: error.message },
        { status: 500 }
      );
    }

    // If session had a video file, delete it from storage
    if (existingSession.video_file_path) {
      const { error: storageError } = await supabase.storage
        .from('sailing-videos')
        .remove([existingSession.video_file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Don't fail the request, but log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}