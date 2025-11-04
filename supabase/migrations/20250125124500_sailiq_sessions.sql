-- SailIQ Sailing Sessions Database Schema
-- This migration adds tables for sailing sessions, video analysis, maneuvers, and performance metrics

-- Enums for sailing-specific data
create type "public"."session_type" as enum ('training', 'race', 'regatta', 'practice');
create type "public"."boat_class" as enum ('cadet', 'ilca_4', 'ilca_6', 'ilca_7', 'tasar', '29er', '420', 'other');
create type "public"."maneuver_type" as enum ('tack', 'gybe', 'start', 'mark_rounding', 'sail_change', 'other');
create type "public"."analysis_status" as enum ('pending', 'processing', 'completed', 'failed', 'retrying');
create type "public"."weather_condition" as enum ('light', 'moderate', 'fresh', 'strong', 'extreme');

-- Sailing sessions table - main session records
create table "public"."sailing_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" text not null,
    "title" text not null,
    "description" text,
    "session_type" session_type not null default 'training',
    "boat_class" boat_class not null,
    "location" text,
    "date" timestamp with time zone not null default timezone('utc'::text, now()),
    "duration_minutes" integer,

    -- Weather conditions
    "wind_speed_knots" numeric(5,2),
    "wind_direction_degrees" integer,
    "weather_condition" weather_condition,
    "air_temperature_celsius" numeric(5,2),
    "water_temperature_celsius" numeric(5,2),

    -- Video file information
    "video_file_path" text,
    "video_file_size" bigint,
    "video_duration_seconds" numeric(10,2),
    "video_metadata" jsonb,

    -- Processing status
    "analysis_status" analysis_status not null default 'pending',
    "analysis_started_at" timestamp with time zone,
    "analysis_completed_at" timestamp with time zone,
    "analysis_error" text,

    -- Metadata
    "notes" text,
    "tags" text[],
    "is_public" boolean default false,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);

-- Maneuver analysis results
create table "public"."maneuvers" (
    "id" uuid not null default gen_random_uuid(),
    "session_id" uuid not null,
    "maneuver_type" maneuver_type not null,
    "start_time_seconds" numeric(10,2) not null,
    "end_time_seconds" numeric(10,2) not null,
    "duration_seconds" numeric(5,2) not null,

    -- Performance metrics
    "speed_before_knots" numeric(5,2),
    "speed_after_knots" numeric(5,2),
    "speed_change_knots" numeric(5,2),
    "max_roll_angle_degrees" numeric(5,2),
    "avg_roll_angle_degrees" numeric(5,2),
    "heading_change_degrees" numeric(5,2),

    -- Quality scores (0-100)
    "efficiency_score" numeric(3,1),
    "technique_score" numeric(3,1),
    "overall_score" numeric(3,1),

    -- AI feedback
    "ai_feedback" text,
    "improvement_tips" text[],

    -- Video segment data
    "video_clip_path" text,
    "keyframes" text[],

    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);

-- Session analytics and summary data
create table "public"."session_analytics" (
    "id" uuid not null default gen_random_uuid(),
    "session_id" uuid not null unique,

    -- Summary statistics
    "total_distance_nm" numeric(8,4),
    "avg_speed_knots" numeric(5,2),
    "max_speed_knots" numeric(5,2),
    "avg_vmg_knots" numeric(5,2),

    -- Maneuver counts
    "total_tacks" integer default 0,
    "total_gybes" integer default 0,
    "total_mark_roundings" integer default 0,

    -- Performance averages
    "avg_tack_time_seconds" numeric(5,2),
    "avg_gybe_time_seconds" numeric(5,2),
    "avg_tack_speed_loss_percent" numeric(5,2),
    "avg_gybe_speed_loss_percent" numeric(5,2),

    -- Quality scores
    "overall_session_score" numeric(3,1),
    "technique_score" numeric(3,1),
    "strategy_score" numeric(3,1),

    -- Benchmark comparisons
    "percentile_vs_class" numeric(3,1),
    "areas_for_improvement" text[],
    "strengths" text[],

    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);

-- Weather data integration (can be extended with external API data)
create table "public"."weather_data" (
    "id" uuid not null default gen_random_uuid(),
    "session_id" uuid not null,
    "timestamp" timestamp with time zone not null,
    "wind_speed_knots" numeric(5,2) not null,
    "wind_direction_degrees" integer not null,
    "wind_gusts_knots" numeric(5,2),
    "temperature_celsius" numeric(5,2),
    "humidity_percent" numeric(5,2),
    "pressure_mb" numeric(7,2),
    "source" text default 'manual', -- 'manual', 'openweather', 'station'
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);

-- Benchmark data for class comparisons (anonymized)
create table "public"."class_benchmarks" (
    "id" uuid not null default gen_random_uuid(),
    "boat_class" boat_class not null,
    "maneuver_type" maneuver_type not null,
    "metric_name" text not null, -- e.g., 'avg_tack_time', 'speed_loss_percent'
    "metric_value" numeric(8,4) not null,
    "sample_size" integer not null,
    "percentile_25" numeric(8,4),
    "percentile_50" numeric(8,4), -- median
    "percentile_75" numeric(8,4),
    "percentile_90" numeric(8,4),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);

-- Analysis jobs queue for tracking processing status
create table "public"."analysis_jobs" (
    "id" uuid not null default gen_random_uuid(),
    "session_id" uuid not null,
    "status" analysis_status not null default 'pending',
    "priority" integer default 1, -- 1=low, 5=high
    "retry_count" integer default 0,
    "max_retries" integer default 3,
    "error_message" text,
    "processing_started_at" timestamp with time zone,
    "processing_completed_at" timestamp with time zone,
    "estimated_completion" timestamp with time zone,
    "progress_percentage" integer default 0,
    "current_step" text,
    "worker_id" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);

-- Create indexes for performance
CREATE INDEX sailing_sessions_user_id_idx ON public.sailing_sessions USING btree (user_id);
CREATE INDEX sailing_sessions_date_idx ON public.sailing_sessions USING btree (date DESC);
CREATE INDEX sailing_sessions_boat_class_idx ON public.sailing_sessions USING btree (boat_class);
CREATE INDEX sailing_sessions_status_idx ON public.sailing_sessions USING btree (analysis_status);
CREATE INDEX maneuvers_session_id_idx ON public.maneuvers USING btree (session_id);
CREATE INDEX maneuvers_type_idx ON public.maneuvers USING btree (maneuver_type);
CREATE INDEX maneuvers_time_idx ON public.maneuvers USING btree (start_time_seconds);
CREATE INDEX session_analytics_session_id_idx ON public.session_analytics USING btree (session_id);
CREATE INDEX weather_data_session_id_idx ON public.weather_data USING btree (session_id);
CREATE INDEX weather_data_timestamp_idx ON public.weather_data USING btree (timestamp);
CREATE INDEX class_benchmarks_class_idx ON public.class_benchmarks USING btree (boat_class, maneuver_type);
CREATE INDEX analysis_jobs_status_idx ON public.analysis_jobs USING btree (status, priority DESC);
CREATE INDEX analysis_jobs_session_id_idx ON public.analysis_jobs USING btree (session_id);

-- Add primary key constraints
alter table "public"."sailing_sessions" add constraint "sailing_sessions_pkey" PRIMARY KEY using index "sailing_sessions_pkey";
alter table "public"."maneuvers" add constraint "maneuvers_pkey" PRIMARY KEY using index "maneuvers_pkey";
alter table "public"."session_analytics" add constraint "session_analytics_pkey" PRIMARY KEY using index "session_analytics_pkey";
alter table "public"."weather_data" add constraint "weather_data_pkey" PRIMARY KEY using index "weather_data_pkey";
alter table "public"."class_benchmarks" add constraint "class_benchmarks_pkey" PRIMARY KEY using index "class_benchmarks_pkey";
alter table "public"."analysis_jobs" add constraint "analysis_jobs_pkey" PRIMARY KEY using index "analysis_jobs_pkey";

-- Add foreign key constraints
alter table "public"."maneuvers" add constraint "maneuvers_session_id_fkey"
    FOREIGN KEY (session_id) REFERENCES sailing_sessions(id) ON DELETE CASCADE not valid;
alter table "public"."maneuvers" validate constraint "maneuvers_session_id_fkey";

alter table "public"."session_analytics" add constraint "session_analytics_session_id_fkey"
    FOREIGN KEY (session_id) REFERENCES sailing_sessions(id) ON DELETE CASCADE not valid;
alter table "public"."session_analytics" validate constraint "session_analytics_session_id_fkey";

alter table "public"."weather_data" add constraint "weather_data_session_id_fkey"
    FOREIGN KEY (session_id) REFERENCES sailing_sessions(id) ON DELETE CASCADE not valid;
alter table "public"."weather_data" validate constraint "weather_data_session_id_fkey";

alter table "public"."analysis_jobs" add constraint "analysis_jobs_session_id_fkey"
    FOREIGN KEY (session_id) REFERENCES sailing_sessions(id) ON DELETE CASCADE not valid;
alter table "public"."analysis_jobs" validate constraint "analysis_jobs_session_id_fkey";

-- Enable Row Level Security
alter table "public"."sailing_sessions" enable row level security;
alter table "public"."maneuvers" enable row level security;
alter table "public"."session_analytics" enable row level security;
alter table "public"."weather_data" enable row level security;
alter table "public"."class_benchmarks" enable row level security;
alter table "public"."analysis_jobs" enable row level security;

-- RLS Policies
-- Users can view and manage their own sessions
create policy "Users can view own sailing sessions"
    on "public"."sailing_sessions" as permissive
    for select to authenticated
    using (requesting_user_id() = user_id);

create policy "Users can insert own sailing sessions"
    on "public"."sailing_sessions" as permissive
    for insert to authenticated
    with check (requesting_user_id() = user_id);

create policy "Users can update own sailing sessions"
    on "public"."sailing_sessions" as permissive
    for update to authenticated
    using (requesting_user_id() = user_id);

create policy "Users can delete own sailing sessions"
    on "public"."sailing_sessions" as permissive
    for delete to authenticated
    using (requesting_user_id() = user_id);

-- Public sessions can be viewed by anyone
create policy "Public sessions are viewable by all"
    on "public"."sailing_sessions" as permissive
    for select to authenticated
    using (is_public = true);

-- Maneuvers inherit permissions from their session
create policy "Users can view maneuvers of own sessions"
    on "public"."maneuvers" as permissive
    for select to authenticated
    using (EXISTS (
        SELECT 1 FROM sailing_sessions
        WHERE sailing_sessions.id = maneuvers.session_id
        AND sailing_sessions.user_id = requesting_user_id()
    ));

create policy "Users can view maneuvers of public sessions"
    on "public"."maneuvers" as permissive
    for select to authenticated
    using (EXISTS (
        SELECT 1 FROM sailing_sessions
        WHERE sailing_sessions.id = maneuvers.session_id
        AND sailing_sessions.is_public = true
    ));

-- Session analytics inherit permissions from their session
create policy "Users can view analytics of own sessions"
    on "public"."session_analytics" as permissive
    for select to authenticated
    using (EXISTS (
        SELECT 1 FROM sailing_sessions
        WHERE sailing_sessions.id = session_analytics.session_id
        AND sailing_sessions.user_id = requesting_user_id()
    ));

create policy "Users can view analytics of public sessions"
    on "public"."session_analytics" as permissive
    for select to authenticated
    using (EXISTS (
        SELECT 1 FROM sailing_sessions
        WHERE sailing_sessions.id = session_analytics.session_id
        AND sailing_sessions.is_public = true
    ));

-- Weather data inherits permissions from their session
create policy "Users can view weather data of own sessions"
    on "public"."weather_data" as permissive
    for select to authenticated
    using (EXISTS (
        SELECT 1 FROM sailing_sessions
        WHERE sailing_sessions.id = weather_data.session_id
        AND sailing_sessions.user_id = requesting_user_id()
    ));

create policy "Users can insert weather data for own sessions"
    on "public"."weather_data" as permissive
    for insert to authenticated
    with check (EXISTS (
        SELECT 1 FROM sailing_sessions
        WHERE sailing_sessions.id = weather_data.session_id
        AND sailing_sessions.user_id = requesting_user_id()
    ));

-- Class benchmarks are public for reference
create policy "Class benchmarks are publicly readable"
    on "public"."class_benchmarks" as permissive
    for select to authenticated
    using (true);

-- Analysis jobs inherit permissions from their session
create policy "Users can view jobs for own sessions"
    on "public"."analysis_jobs" as permissive
    for select to authenticated
    using (EXISTS (
        SELECT 1 FROM sailing_sessions
        WHERE sailing_sessions.id = analysis_jobs.session_id
        AND sailing_sessions.user_id = requesting_user_id()
    ));

create policy "Service role can manage analysis jobs"
    on "public"."analysis_jobs" as permissive
    for all to service_role
    using (true);

-- Grant necessary permissions
grant all on "public"."sailing_sessions" to "service_role";
grant all on "public"."maneuvers" to "service_role";
grant all on "public"."session_analytics" to "service_role";
grant all on "public"."weather_data" to "service_role";
grant all on "public"."class_benchmarks" to "service_role";
grant all on "public"."analysis_jobs" to "service_role";

-- Updated function to handle session updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update timestamps
CREATE TRIGGER update_sailing_sessions_updated_at
    BEFORE UPDATE ON "public"."sailing_sessions"
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_session_analytics_updated_at
    BEFORE UPDATE ON "public"."session_analytics"
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analysis_jobs_updated_at
    BEFORE UPDATE ON "public"."analysis_jobs"
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_class_benchmarks_updated_at
    BEFORE UPDATE ON "public"."class_benchmarks"
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();