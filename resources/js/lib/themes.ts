import type {
    CustomThemePalette,
    ThemePreference,
    ThemePreset,
} from '@/types/auth';

export const THEME_STORAGE_KEY = 'nexora_theme_v2';

export const DEFAULT_CUSTOM_PALETTE: CustomThemePalette = {
    page: '#0b1111',
    surface: '#101a18',
    surfaceElevated: '#172522',
    text: '#edf5f1',
    textMuted: '#a8b9b4',
    border: '#29413c',
    brand: '#087f6b',
    accent: '#e8c36a',
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
    mapSurface: '#101a18',
    mapText: '#edf5f1',
    radius: 'comfortable',
    density: 'comfortable',
};

type Palette = Omit<CustomThemePalette, 'radius' | 'density'> & {
    radius: CustomThemePalette['radius'];
    density: CustomThemePalette['density'];
};

export const THEME_PRESETS: Record<
    Exclude<ThemePreset, 'system' | 'custom'>,
    Palette
> = {
    nexora: {
        page: '#f7f8f5',
        surface: '#ffffff',
        surfaceElevated: '#edf3ef',
        text: '#10201e',
        textMuted: '#687873',
        border: '#d5ded9',
        brand: '#087f6b',
        accent: '#e8c36a',
        success: '#16845b',
        warning: '#c45d18',
        error: '#c24156',
        mapSurface: '#10201e',
        mapText: '#edf5f1',
        radius: 'comfortable',
        density: 'comfortable',
    },
    light: {
        page: '#f4f7fb',
        surface: '#ffffff',
        surfaceElevated: '#e9eef7',
        text: '#172033',
        textMuted: '#63708a',
        border: '#d7deea',
        brand: '#3457d5',
        accent: '#f0a33a',
        success: '#16845b',
        warning: '#c66b13',
        error: '#c43f57',
        mapSurface: '#ffffff',
        mapText: '#172033',
        radius: 'rounded',
        density: 'comfortable',
    },
    dark: {
        page: '#0d0d16',
        surface: '#171724',
        surfaceElevated: '#222235',
        text: '#f4f2ff',
        textMuted: '#aaa6c4',
        border: '#35334b',
        brand: '#9b87f5',
        accent: '#f5a8c5',
        success: '#45c58a',
        warning: '#efb458',
        error: '#ff708a',
        mapSurface: '#171724',
        mapText: '#f4f2ff',
        radius: 'rounded',
        density: 'comfortable',
    },
    'maps-light': {
        page: '#eef2f4',
        surface: '#ffffff',
        surfaceElevated: '#e4e9ed',
        text: '#202124',
        textMuted: '#5f6368',
        border: '#d2d7dc',
        brand: '#1a73e8',
        accent: '#ea4335',
        success: '#188038',
        warning: '#f9ab00',
        error: '#d93025',
        mapSurface: '#ffffff',
        mapText: '#202124',
        radius: 'compact',
        density: 'compact',
    },
    'maps-dark': {
        page: '#0f1419',
        surface: '#182028',
        surfaceElevated: '#222d37',
        text: '#e8eaed',
        textMuted: '#9aa0a6',
        border: '#34424e',
        brand: '#8ab4f8',
        accent: '#fdd663',
        success: '#81c995',
        warning: '#fdd663',
        error: '#f28b82',
        mapSurface: '#182028',
        mapText: '#e8eaed',
        radius: 'compact',
        density: 'compact',
    },
};

const radiusValues: Record<CustomThemePalette['radius'], string> = {
    compact: '0.55rem',
    comfortable: '1rem',
    rounded: '1.5rem',
};
const densityValues: Record<CustomThemePalette['density'], string> = {
    compact: '0.94',
    comfortable: '1',
    spacious: '1.06',
};

const hexToRgb = (hex: string): [number, number, number] => {
    const value = hex.replace('#', '');
    return [0, 2, 4].map((offset) =>
        Number.parseInt(value.slice(offset, offset + 2), 16),
    ) as [number, number, number];
};

const relativeLuminance = (hex: string): number => {
    const channels = hexToRgb(hex).map((channel) => {
        const value = channel / 255;
        return value <= 0.03928
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

export const contrastRatio = (
    foreground: string,
    background: string,
): number => {
    const lighter = Math.max(
        relativeLuminance(foreground),
        relativeLuminance(background),
    );
    const darker = Math.min(
        relativeLuminance(foreground),
        relativeLuminance(background),
    );
    return (lighter + 0.05) / (darker + 0.05);
};

const readableText = (background: string): string =>
    contrastRatio('#ffffff', background) >= contrastRatio('#081512', background)
        ? '#ffffff'
        : '#081512';

const resolvePalette = (theme: ThemePreference): Palette => {
    if (theme.preset === 'custom') {
        return { ...DEFAULT_CUSTOM_PALETTE, ...theme.custom };
    }
    if (theme.preset === 'system') {
        const systemPreset = window.matchMedia('(prefers-color-scheme: dark)')
            .matches
            ? 'dark'
            : 'light';
        return THEME_PRESETS[systemPreset];
    }
    return THEME_PRESETS[theme.preset];
};

export const applyTheme = (theme: ThemePreference): void => {
    if (typeof document === 'undefined') return;
    const palette = resolvePalette(theme);
    const root = document.documentElement;
    const variables: Record<string, string> = {
        '--nx-page': palette.page,
        '--nx-surface': palette.surface,
        '--nx-surface-elevated': palette.surfaceElevated,
        '--nx-text': palette.text,
        '--nx-text-muted': palette.textMuted,
        '--nx-border': palette.border,
        '--nx-brand': palette.brand,
        '--nx-accent': palette.accent,
        '--nx-success': palette.success,
        '--nx-warning': palette.warning,
        '--nx-error': palette.error,
        '--nx-map-surface': palette.mapSurface,
        '--nx-map-text': palette.mapText,
        '--nx-radius': radiusValues[palette.radius],
        '--nx-density': densityValues[palette.density],
        '--nx-on-brand': readableText(palette.brand),
        '--nx-on-accent': readableText(palette.accent),
    };
    root.dataset.theme = theme.preset;
    Object.entries(variables).forEach(([name, value]) =>
        root.style.setProperty(name, value),
    );
    root.classList.toggle(
        'dark',
        ['dark', 'maps-dark'].includes(theme.preset) ||
            (theme.preset === 'system' &&
                window.matchMedia('(prefers-color-scheme: dark)').matches) ||
            (theme.preset === 'custom' &&
                relativeLuminance(palette.page) < 0.25),
    );
};

export const readLocalTheme = (): ThemePreference => {
    if (typeof window === 'undefined') return { preset: 'system' };
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored) return JSON.parse(stored) as ThemePreference;
    } catch {
        localStorage.removeItem(THEME_STORAGE_KEY);
    }
    const legacy = localStorage.getItem('nexora_theme');
    return legacy === 'dark' || legacy === 'light'
        ? { preset: legacy }
        : { preset: 'system' };
};

export const storeLocalTheme = (theme: ThemePreference): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
};

export const initializeTheme = (): void => {
    if (typeof window === 'undefined') return;
    applyTheme(readLocalTheme());
    window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', () => {
            const theme = readLocalTheme();
            if (theme.preset === 'system') applyTheme(theme);
        });
};
