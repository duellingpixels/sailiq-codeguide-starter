import { createClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/database.types';

export async function POST(req: NextRequest) {
  try {
    // Verify user authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      title,
      description,
      session_type,
      boat_class,
      location,
      date,
      duration_minutes,
      wind_speed_knots,
      wind_direction_degrees,
      weather_condition,
      air_temperature_celsius,
      water_temperature_celsius,
      video_file_path,
      video_file_size,
      video_duration_seconds,
      video_metadata,
      notes,
      tags,
      is_public = false
    } = body as Database['public']['Tables']['sailing_sessions']['Insert'];

    // Validate required fields
    if (!title || !session_type || !boat_class) {
      return NextResponse.json(
        { error: 'Missing required fields: title, session_type, boat_class' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = createClient();

    // Create sailing session
    const { data: session, error } = await supabase
      .from('sailing_sessions')
      .insert({
        user_id: userId,
        title,
        description,
        session_type,
        boat_class,
        location,
        date: date || new Date().toISOString(),
        duration_minutes,
        wind_speed_knots,
        wind_direction_degrees,
        weather_condition,
        air_temperature_celsius,
        water_temperature_celsius,
        video_file_path,
        video_file_size,
        video_duration_seconds,
        video_metadata,
        analysis_status: 'pending',
        notes,
        tags,
        is_public
      })
      .select()
      .single();

    if (error) {
      console.error('Session creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create session', details: error.message },
        { status: 500 }
      );
    }

    // If video file is provided, create analysis job
    if (video_file_path) {
      const { error: jobError } = await supabase
        .from('analysis_jobs')
        .insert({
          session_id: session.id,
          status: 'pending',
          priority: 1,
          retry_count: 0,
          max_retries: 3,
          progress_percentage: 0,
          current_step: 'queued'
        });

      if (jobError) {
        console.error('Analysis job creation error:', jobError);
        // Don't fail the request, but log the error
      }
    }

    return NextResponse.json({
      success: true,
      session: session
    });

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verify user authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const boatClass = searchParams.get('boat_class');
    const sessionType = searchParams.get('session_type');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    // Get Supabase client
    const supabase = createClient();

    // Build query
    let query = supabase
      .from('sailing_sessions')
      .select(`
        *,
        session_analytics (*),
        maneuvers (
          id,
          maneuver_type,
          duration_seconds,
          overall_score,
          efficiency_score
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (boatClass) {
      query = query.eq('boat_class', boatClass);
    }
    if (sessionType) {
      query = query.eq('session_type', sessionType);
    }
    if (status) {
      query = query.eq('analysis_status', status);
    }

    const { data: sessions, error, count } = await query;

    if (error) {
      console.error('Sessions fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessions: sessions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}