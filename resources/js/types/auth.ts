export type ThemePreset =
    | 'system'
    | 'nexora'
    | 'light'
    | 'dark'
    | 'maps-light'
    | 'maps-dark'
    | 'custom';

export interface CustomThemePalette {
    page: string;
    surface: string;
    surfaceElevated: string;
    text: string;
    textMuted: string;
    border: string;
    brand: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    mapSurface: string;
    mapText: string;
    radius: 'compact' | 'comfortable' | 'rounded';
    density: 'compact' | 'comfortable' | 'spacious';
}

export interface ThemePreference {
    preset: ThemePreset;
    custom?: CustomThemePalette;
}

export interface UserPreferences {
    likes?: string[];
    dislikes?: string[];
    onboarding_completed?: boolean;
    search?: {
        radius?: number;
        view?: 'split' | 'grid' | 'list';
        layout?: SearchLayout;
        use_location?: boolean;
        save_history?: boolean;
    };
    ai?: { use_preferences?: boolean };
    theme?: ThemePreference;
}

export type SearchLayout = 'compact' | 'floating' | 'hero';

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    occupation?: string | null;
    age?: number | null;
    gender?: string | null;
    bio?: string | null;
    location?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    preferences?: UserPreferences | null;
    [key: string]: unknown; // This allows for additional properties...
}

export type Auth = {
    user: User;
};
