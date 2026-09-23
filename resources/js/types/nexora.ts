export interface PlaceReview {
    author_name: string;
    rating: number;
    text: string;
    relative_time_description?: string;
    author_url?: string;
    profile_photo_url?: string;
}

export interface PlaceHours {
    [day: string]: string;
}

export interface LocationItem {
    id: number | string;
    name: string;
    address?: string | null;
    latitude: number;
    longitude: number;
    place_id?: string | null;
    external_id?: string | null;
    external_source?: string | null;
    category: string;
    subcategory?: string | null;
    phone?: string | null;
    website?: string | null;
    rating?: string | number | null;
    review_count?: number;
    hours?: PlaceHours | null;
    photos?: string[] | null;
    reviews?: PlaceReview[] | null;
    distance_km?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface WeatherCondition {
    label: string;
    icon: string;
}

export interface DailyForecast {
    date: string;
    max_temp: number | null;
    min_temp: number | null;
    precipitation: number;
    max_wind: number | null;
    condition: WeatherCondition;
}

export interface WeatherReport {
    source: string;
    status?: 'live' | 'cached' | 'degraded';
    message?: string;
    location?: {
        name?: string;
        latitude: number;
        longitude: number;
        timezone?: string;
    };
    temperature?: number | null;
    feels_like?: number | null;
    humidity?: number | null;
    precipitation?: number;
    wind_speed?: number | null;
    condition?: WeatherCondition;
    forecasts?: DailyForecast[];
    updated_at?: string;
}

export interface SavedPlaceItem {
    id: number | string;
    user_id: number;
    location_id: number | string;
    notes?: string | null;
    tags?: string[] | null;
    visited_at?: string | null;
    location?: LocationItem;
    created_at?: string;
}

export interface SearchHistoryItem {
    id: number | string;
    query: string;
    location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    results_count?: number;
    created_at: string;
}

export interface ApiTelemetryOverview {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    success_rate: number;
    avg_response_time_ms: number;
    total_locations: number;
    total_users: number;
}

export interface ApiRequestLog {
    id: number;
    external_service: string;
    endpoint: string;
    method: string;
    response_code: number | null;
    response_time: number | null;
    success: boolean;
    error_message?: string | null;
    created_at: string;
}

export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'offline';
    database: string;
    cache: string;
    php_version: string;
    environment: string;
}

export interface AdminMetricsData {
    overview: ApiTelemetryOverview;
    providers: Record<string, number>;
    top_searches: Array<{ query: string; search_count: number }>;
    recent_errors: Array<{
        id: number;
        external_service: string;
        endpoint: string;
        response_code: number;
        error_message: string;
        failed_at: string;
    }>;
    system_health: SystemHealth;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    suggestedPlaces?: LocationItem[];
}
