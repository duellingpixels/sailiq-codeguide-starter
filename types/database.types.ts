export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    graphql_public: {
        Tables: {
            [_ in never]: never
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            graphql: {
                Args: {
                    operationName?: string
                    query?: string
                    variables?: Json
                    extensions?: Json
                }
                Returns: Json
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
    public: {
        Tables: {
            customers: {
                Row: {
                    id: string
                    stripe_customer_id: string | null
                }
                Insert: {
                    id: string
                    stripe_customer_id?: string | null
                }
                Update: {
                    id?: string
                    stripe_customer_id?: string | null
                }
                Relationships: []
            }
            prices: {
                Row: {
                    active: boolean | null
                    currency: string | null
                    description: string | null
                    id: string
                    interval: Database["public"]["Enums"]["pricing_plan_interval"] | null
                    interval_count: number | null
                    metadata: Json | null
                    product_id: string | null
                    trial_period_days: number | null
                    type: Database["public"]["Enums"]["pricing_type"] | null
                    unit_amount: number | null
                }
                Insert: {
                    active?: boolean | null
                    currency?: string | null
                    description?: string | null
                    id: string
                    interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
                    interval_count?: number | null
                    metadata?: Json | null
                    product_id?: string | null
                    trial_period_days?: number | null
                    type?: Database["public"]["Enums"]["pricing_type"] | null
                    unit_amount?: number | null
                }
                Update: {
                    active?: boolean | null
                    currency?: string | null
                    description?: string | null
                    id?: string
                    interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
                    interval_count?: number | null
                    metadata?: Json | null
                    product_id?: string | null
                    trial_period_days?: number | null
                    type?: Database["public"]["Enums"]["pricing_type"] | null
                    unit_amount?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "prices_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            products: {
                Row: {
                    active: boolean | null
                    description: string | null
                    id: string
                    image: string | null
                    live_mode: boolean | null
                    marketing_features: string[] | null
                    metadata: Json | null
                    name: string | null
                }
                Insert: {
                    active?: boolean | null
                    description?: string | null
                    id: string
                    image?: string | null
                    live_mode?: boolean | null
                    marketing_features?: string[] | null
                    metadata?: Json | null
                    name?: string | null
                }
                Update: {
                    active?: boolean | null
                    description?: string | null
                    id?: string
                    image?: string | null
                    live_mode?: boolean | null
                    marketing_features?: string[] | null
                    metadata?: Json | null
                    name?: string | null
                }
                Relationships: []
            }
            subscriptions: {
                Row: {
                    cancel_at: string | null
                    cancel_at_period_end: boolean | null
                    canceled_at: string | null
                    created: string
                    current_period_end: string
                    current_period_start: string
                    ended_at: string | null
                    id: string
                    metadata: Json | null
                    price_id: string | null
                    quantity: number | null
                    status: Database["public"]["Enums"]["subscription_status"] | null
                    trial_end: string | null
                    trial_start: string | null
                    user_id: string
                }
                Insert: {
                    cancel_at?: string | null
                    cancel_at_period_end?: boolean | null
                    canceled_at?: string | null
                    created?: string
                    current_period_end?: string
                    current_period_start?: string
                    ended_at?: string | null
                    id: string
                    metadata?: Json | null
                    price_id?: string | null
                    quantity?: number | null
                    status?: Database["public"]["Enums"]["subscription_status"] | null
                    trial_end?: string | null
                    trial_start?: string | null
                    user_id: string
                }
                Update: {
                    cancel_at?: string | null
                    cancel_at_period_end?: boolean | null
                    canceled_at?: string | null
                    created?: string
                    current_period_end?: string
                    current_period_start?: string
                    ended_at?: string | null
                    id?: string
                    metadata?: Json | null
                    price_id?: string | null
                    quantity?: number | null
                    status?: Database["public"]["Enums"]["subscription_status"] | null
                    trial_end?: string | null
                    trial_start?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "subscriptions_price_id_fkey"
                        columns: ["price_id"]
                        isOneToOne: false
                        referencedRelation: "prices"
                        referencedColumns: ["id"]
                    },
                ]
            }
            sailing_sessions: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    description: string | null
                    session_type: Database["public"]["Enums"]["session_type"]
                    boat_class: Database["public"]["Enums"]["boat_class"]
                    location: string | null
                    date: string
                    duration_minutes: number | null
                    wind_speed_knots: number | null
                    wind_direction_degrees: number | null
                    weather_condition: Database["public"]["Enums"]["weather_condition"] | null
                    air_temperature_celsius: number | null
                    water_temperature_celsius: number | null
                    video_file_path: string | null
                    video_file_size: number | null
                    video_duration_seconds: number | null
                    video_metadata: Json | null
                    analysis_status: Database["public"]["Enums"]["analysis_status"]
                    analysis_started_at: string | null
                    analysis_completed_at: string | null
                    analysis_error: string | null
                    notes: string | null
                    tags: string[] | null
                    is_public: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    description?: string | null
                    session_type?: Database["public"]["Enums"]["session_type"]
                    boat_class: Database["public"]["Enums"]["boat_class"]
                    location?: string | null
                    date?: string
                    duration_minutes?: number | null
                    wind_speed_knots?: number | null
                    wind_direction_degrees?: number | null
                    weather_condition?: Database["public"]["Enums"]["weather_condition"] | null
                    air_temperature_celsius?: number | null
                    water_temperature_celsius?: number | null
                    video_file_path?: string | null
                    video_file_size?: number | null
                    video_duration_seconds?: number | null
                    video_metadata?: Json | null
                    analysis_status?: Database["public"]["Enums"]["analysis_status"]
                    analysis_started_at?: string | null
                    analysis_completed_at?: string | null
                    analysis_error?: string | null
                    notes?: string | null
                    tags?: string[] | null
                    is_public?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    description?: string | null
                    session_type?: Database["public"]["Enums"]["session_type"]
                    boat_class?: Database["public"]["Enums"]["boat_class"]
                    location?: string | null
                    date?: string
                    duration_minutes?: number | null
                    wind_speed_knots?: number | null
                    wind_direction_degrees?: number | null
                    weather_condition?: Database["public"]["Enums"]["weather_condition"] | null
                    air_temperature_celsius?: number | null
                    water_temperature_celsius?: number | null
                    video_file_path?: string | null
                    video_file_size?: number | null
                    video_duration_seconds?: number | null
                    video_metadata?: Json | null
                    analysis_status?: Database["public"]["Enums"]["analysis_status"]
                    analysis_started_at?: string | null
                    analysis_completed_at?: string | null
                    analysis_error?: string | null
                    notes?: string | null
                    tags?: string[] | null
                    is_public?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            maneuvers: {
                Row: {
                    id: string
                    session_id: string
                    maneuver_type: Database["public"]["Enums"]["maneuver_type"]
                    start_time_seconds: number
                    end_time_seconds: number
                    duration_seconds: number
                    speed_before_knots: number | null
                    speed_after_knots: number | null
                    speed_change_knots: number | null
                    max_roll_angle_degrees: number | null
                    avg_roll_angle_degrees: number | null
                    heading_change_degrees: number | null
                    efficiency_score: number | null
                    technique_score: number | null
                    overall_score: number | null
                    ai_feedback: string | null
                    improvement_tips: string[] | null
                    video_clip_path: string | null
                    keyframes: string[] | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    session_id: string
                    maneuver_type: Database["public"]["Enums"]["maneuver_type"]
                    start_time_seconds: number
                    end_time_seconds: number
                    duration_seconds: number
                    speed_before_knots?: number | null
                    speed_after_knots?: number | null
                    speed_change_knots?: number | null
                    max_roll_angle_degrees?: number | null
                    avg_roll_angle_degrees?: number | null
                    heading_change_degrees?: number | null
                    efficiency_score?: number | null
                    technique_score?: number | null
                    overall_score?: number | null
                    ai_feedback?: string | null
                    improvement_tips?: string[] | null
                    video_clip_path?: string | null
                    keyframes?: string[] | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    session_id?: string
                    maneuver_type?: Database["public"]["Enums"]["maneuver_type"]
                    start_time_seconds?: number
                    end_time_seconds?: number
                    duration_seconds?: number
                    speed_before_knots?: number | null
                    speed_after_knots?: number | null
                    speed_change_knots?: number | null
                    max_roll_angle_degrees?: number | null
                    avg_roll_angle_degrees?: number | null
                    heading_change_degrees?: number | null
                    efficiency_score?: number | null
                    technique_score?: number | null
                    overall_score?: number | null
                    ai_feedback?: string | null
                    improvement_tips?: string[] | null
                    video_clip_path?: string | null
                    keyframes?: string[] | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "maneuvers_session_id_fkey"
                        columns: ["session_id"]
                        isOneToOne: false
                        referencedRelation: "sailing_sessions"
                        referencedColumns: ["id"]
                    }
                ]
            }
            session_analytics: {
                Row: {
                    id: string
                    session_id: string
                    total_distance_nm: number | null
                    avg_speed_knots: number | null
                    max_speed_knots: number | null
                    avg_vmg_knots: number | null
                    total_tacks: number
                    total_gybes: number
                    total_mark_roundings: number
                    avg_tack_time_seconds: number | null
                    avg_gybe_time_seconds: number | null
                    avg_tack_speed_loss_percent: number | null
                    avg_gybe_speed_loss_percent: number | null
                    overall_session_score: number | null
                    technique_score: number | null
                    strategy_score: number | null
                    percentile_vs_class: number | null
                    areas_for_improvement: string[] | null
                    strengths: string[] | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    session_id: string
                    total_distance_nm?: number | null
                    avg_speed_knots?: number | null
                    max_speed_knots?: number | null
                    avg_vmg_knots?: number | null
                    total_tacks?: number
                    total_gybes?: number
                    total_mark_roundings?: number
                    avg_tack_time_seconds?: number | null
                    avg_gybe_time_seconds?: number | null
                    avg_tack_speed_loss_percent?: number | null
                    avg_gybe_speed_loss_percent?: number | null
                    overall_session_score?: number | null
                    technique_score?: number | null
                    strategy_score?: number | null
                    percentile_vs_class?: number | null
                    areas_for_improvement?: string[] | null
                    strengths?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    session_id?: string
                    total_distance_nm?: number | null
                    avg_speed_knots?: number | null
                    max_speed_knots?: number | null
                    avg_vmg_knots?: number | null
                    total_tacks?: number
                    total_gybes?: number
                    total_mark_roundings?: number
                    avg_tack_time_seconds?: number | null
                    avg_gybe_time_seconds?: number | null
                    avg_tack_speed_loss_percent?: number | null
                    avg_gybe_speed_loss_percent?: number | null
                    overall_session_score?: number | null
                    technique_score?: number | null
                    strategy_score?: number | null
                    percentile_vs_class?: number | null
                    areas_for_improvement?: string[] | null
                    strengths?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "session_analytics_session_id_fkey"
                        columns: ["session_id"]
                        isOneToOne: true
                        referencedRelation: "sailing_sessions"
                        referencedColumns: ["id"]
                    }
                ]
            }
            weather_data: {
                Row: {
                    id: string
                    session_id: string
                    timestamp: string
                    wind_speed_knots: number
                    wind_direction_degrees: number
                    wind_gusts_knots: number | null
                    temperature_celsius: number | null
                    humidity_percent: number | null
                    pressure_mb: number | null
                    source: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    session_id: string
                    timestamp: string
                    wind_speed_knots: number
                    wind_direction_degrees: number
                    wind_gusts_knots?: number | null
                    temperature_celsius?: number | null
                    humidity_percent?: number | null
                    pressure_mb?: number | null
                    source?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    session_id?: string
                    timestamp?: string
                    wind_speed_knots?: number
                    wind_direction_degrees?: number
                    wind_gusts_knots?: number | null
                    temperature_celsius?: number | null
                    humidity_percent?: number | null
                    pressure_mb?: number | null
                    source?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "weather_data_session_id_fkey"
                        columns: ["session_id"]
                        isOneToOne: false
                        referencedRelation: "sailing_sessions"
                        referencedColumns: ["id"]
                    }
                ]
            }
            class_benchmarks: {
                Row: {
                    id: string
                    boat_class: Database["public"]["Enums"]["boat_class"]
                    maneuver_type: Database["public"]["Enums"]["maneuver_type"]
                    metric_name: string
                    metric_value: number
                    sample_size: number
                    percentile_25: number | null
                    percentile_50: number | null
                    percentile_75: number | null
                    percentile_90: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    boat_class: Database["public"]["Enums"]["boat_class"]
                    maneuver_type: Database["public"]["Enums"]["maneuver_type"]
                    metric_name: string
                    metric_value: number
                    sample_size: number
                    percentile_25?: number | null
                    percentile_50?: number | null
                    percentile_75?: number | null
                    percentile_90?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    boat_class?: Database["public"]["Enums"]["boat_class"]
                    maneuver_type?: Database["public"]["Enums"]["maneuver_type"]
                    metric_name?: string
                    metric_value?: number
                    sample_size?: number
                    percentile_25?: number | null
                    percentile_50?: number | null
                    percentile_75?: number | null
                    percentile_90?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            analysis_jobs: {
                Row: {
                    id: string
                    session_id: string
                    status: Database["public"]["Enums"]["analysis_status"]
                    priority: number
                    retry_count: number
                    max_retries: number
                    error_message: string | null
                    processing_started_at: string | null
                    processing_completed_at: string | null
                    estimated_completion: string | null
                    progress_percentage: number
                    current_step: string | null
                    worker_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    session_id: string
                    status?: Database["public"]["Enums"]["analysis_status"]
                    priority?: number
                    retry_count?: number
                    max_retries?: number
                    error_message?: string | null
                    processing_started_at?: string | null
                    processing_completed_at?: string | null
                    estimated_completion?: string | null
                    progress_percentage?: number
                    current_step?: string | null
                    worker_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    session_id?: string
                    status?: Database["public"]["Enums"]["analysis_status"]
                    priority?: number
                    retry_count?: number
                    max_retries?: number
                    error_message?: string | null
                    processing_started_at?: string | null
                    processing_completed_at?: string | null
                    estimated_completion?: string | null
                    progress_percentage?: number
                    current_step?: string | null
                    worker_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "analysis_jobs_session_id_fkey"
                        columns: ["session_id"]
                        isOneToOne: false
                        referencedRelation: "sailing_sessions"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            requesting_user_id: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
        }
        Enums: {
            pricing_plan_interval: "day" | "week" | "month" | "year"
            pricing_type: "one_time" | "recurring"
            subscription_status:
            | "trialing"
            | "active"
            | "canceled"
            | "incomplete"
            | "incomplete_expired"
            | "past_due"
            | "unpaid"
            | "paused"
            session_type: "training" | "race" | "regatta" | "practice"
            boat_class: "cadet" | "ilca_4" | "ilca_6" | "ilca_7" | "tasar" | "29er" | "420" | "other"
            maneuver_type: "tack" | "gybe" | "start" | "mark_rounding" | "sail_change" | "other"
            analysis_status: "pending" | "processing" | "completed" | "failed" | "retrying"
            weather_condition: "light" | "moderate" | "fresh" | "strong" | "extreme"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

