export const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('nexora_token');
};

export const setAuthToken = (token: string | null): void => {
    if (typeof window === 'undefined') return;
    if (token) {
        localStorage.setItem('nexora_token', token);
    } else {
        localStorage.removeItem('nexora_token');
    }
};

export const getStoredUser = (): any | null => {
    if (typeof window === 'undefined') return null;
    try {
        const item = localStorage.getItem('nexora_user');
        return item ? JSON.parse(item) : null;
    } catch {
        return null;
    }
};

export const setStoredUser = (user: any | null): void => {
    if (typeof window === 'undefined') return;
    if (user) {
        localStorage.setItem('nexora_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('nexora_user');
    }
};

async function fetchClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getAuthToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
        ...options,
        headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = data.message || `Request failed with status ${response.status}`;
        const error = new Error(message);
        (error as any).status = response.status;
        (error as any).data = data;
        throw error;
    }

    return data as T;
}

export const api = {
    // Auth
    login: (credentials: { email: string; password: string }) =>
        fetchClient<{ user: any; token: string }>('/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        }),

    register: (payload: { name: string; email: string; password: string; password_confirmation: string }) =>
        fetchClient<{ user: any; token: string }>('/api/v1/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    me: () => fetchClient<any>('/api/v1/auth/me'),

    logout: () => fetchClient<{ message: string }>('/api/v1/auth/logout', { method: 'POST' }),

    // Search & Places
    search: (query: string, params: Record<string, any> = {}) => {
        const qParams = new URLSearchParams({ query, ...params }).toString();
        return fetchClient<{ query: string; results: any[]; count: number }>(`/api/v1/search?${qParams}`);
    },

    suggestions: (query: string) =>
        fetchClient<{ query: string; suggestions: any[] }>(`/api/v1/search/suggestions?query=${encodeURIComponent(query)}`),

    places: (params: Record<string, any> = {}) => {
        const qParams = new URLSearchParams(params).toString();
        return fetchClient<any>(`/api/v1/places${qParams ? `?${qParams}` : ''}`);
    },

    placeDetails: (id: string | number) => fetchClient<{ data: any }>(`/api/v1/places/${id}`),

    nearby: (latitude: number, longitude: number, radius = 10, category?: string) => {
        const qParams = new URLSearchParams({
            latitude: String(latitude),
            longitude: String(longitude),
            radius: String(radius),
            ...(category && category !== 'all' ? { category } : {}),
        }).toString();
        return fetchClient<{ center: any; count: number; data: any[] }>(`/api/v1/places/nearby?${qParams}`);
    },

    reviews: (placeId: string | number) => fetchClient<any>(`/api/v1/places/${placeId}/reviews`),

    // Weather
    weatherCurrent: (latitude: number, longitude: number, name?: string) => {
        const qParams = new URLSearchParams({
            latitude: String(latitude),
            longitude: String(longitude),
            ...(name ? { name } : {}),
        }).toString();
        return fetchClient<any>(`/api/v1/weather/current?${qParams}`);
    },

    weatherForecast: (latitude: number, longitude: number, days = 7) => {
        const qParams = new URLSearchParams({
            latitude: String(latitude),
            longitude: String(longitude),
            days: String(days),
        }).toString();
        return fetchClient<any>(`/api/v1/weather/forecast?${qParams}`);
    },

    // AI
    aiSearch: (prompt: string, limit = 10) =>
        fetchClient<any>('/api/v1/ai/search', {
            method: 'POST',
            body: JSON.stringify({ prompt, limit }),
        }),

    aiChat: (messages: Array<{ role: string; content: string }>, model?: string) =>
        fetchClient<any>('/api/v1/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ messages, model }),
        }),

    aiSummary: (locationId?: string | number, location?: any) =>
        fetchClient<any>('/api/v1/ai/summary', {
            method: 'POST',
            body: JSON.stringify({
                ...(locationId ? { location_id: locationId } : {}),
                ...(location ? { location } : {}),
            }),
        }),

    aiVision: (image: string, prompt?: string) =>
        fetchClient<any>('/api/v1/ai/vision', {
            method: 'POST',
            body: JSON.stringify({ image, prompt }),
        }),

    // Favorites
    favorites: () => fetchClient<any>('/api/v1/favorites'),

    addFavorite: (locationId: number | string, notes?: string, tags?: string[]) =>
        fetchClient<any>('/api/v1/favorites', {
            method: 'POST',
            body: JSON.stringify({ location_id: locationId, notes, tags }),
        }),

    removeFavorite: (id: number | string) =>
        fetchClient<any>(`/api/v1/favorites/${id}`, { method: 'DELETE' }),

    // History
    history: () => fetchClient<any>('/api/v1/history'),

    clearHistory: () => fetchClient<any>('/api/v1/history', { method: 'DELETE' }),

    // Admin & Observability
    adminMetrics: () => fetchClient<any>('/api/v1/admin/metrics'),

    adminLogs: (params: Record<string, any> = {}) => {
        const qParams = new URLSearchParams(params).toString();
        return fetchClient<any>(`/api/v1/admin/logs${qParams ? `?${qParams}` : ''}`);
    },

    clearAdminLogs: () => fetchClient<any>('/api/v1/admin/logs', { method: 'DELETE' }),
};
