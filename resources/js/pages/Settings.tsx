import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { dashboard, login } from '@/routes';
import { api, getAuthToken, getStoredUser, setStoredUser } from '@/lib/api';
import {
    applyTheme,
    contrastRatio,
    DEFAULT_CUSTOM_PALETTE,
    readLocalTheme,
    storeLocalTheme,
    THEME_PRESETS,
} from '@/lib/themes';
import type {
    CustomThemePalette,
    ThemePreference,
    ThemePreset,
    User,
    UserPreferences,
} from '@/types/auth';

type SettingsDraft = {
    name: string;
    occupation: string;
    age: string;
    gender: string;
    location: string;
    likes: string;
    dislikes: string;
    search: NonNullable<UserPreferences['search']>;
    ai: NonNullable<UserPreferences['ai']>;
    theme: ThemePreference;
};

const themeOptions: Array<{
    value: ThemePreset;
    label: string;
    description: string;
}> = [
    { value: 'system', label: 'System', description: 'Follows this device.' },
    {
        value: 'nexora',
        label: 'Nexora',
        description: 'Botanical green and warm gold.',
    },
    { value: 'light', label: 'Light', description: 'Bright cobalt workspace.' },
    { value: 'dark', label: 'Dark', description: 'Deep violet night mode.' },
    {
        value: 'maps-light',
        label: 'Maps Light',
        description: 'Crisp map-first controls.',
    },
    {
        value: 'maps-dark',
        label: 'Maps Dark',
        description: 'Low-glare navigation view.',
    },
    {
        value: 'custom',
        label: 'Custom',
        description: 'Every color, radius, and density.',
    },
];

const colorFields: Array<{ key: keyof CustomThemePalette; label: string }> = [
    { key: 'page', label: 'Page background' },
    { key: 'surface', label: 'Surface' },
    { key: 'surfaceElevated', label: 'Elevated surface' },
    { key: 'text', label: 'Primary text' },
    { key: 'textMuted', label: 'Secondary text' },
    { key: 'border', label: 'Borders' },
    { key: 'brand', label: 'Brand' },
    { key: 'accent', label: 'Accent' },
    { key: 'success', label: 'Success' },
    { key: 'warning', label: 'Warning' },
    { key: 'error', label: 'Error' },
    { key: 'mapSurface', label: 'Map controls' },
    { key: 'mapText', label: 'Map text' },
];

const buildDraft = (user: User): SettingsDraft => ({
    name: user.name ?? '',
    occupation: user.occupation ?? '',
    age: user.age ? String(user.age) : '',
    gender: user.gender ?? '',
    location: user.location ?? '',
    likes: user.preferences?.likes?.join(', ') ?? '',
    dislikes: user.preferences?.dislikes?.join(', ') ?? '',
    search: {
        radius: user.preferences?.search?.radius ?? 10000,
        view: user.preferences?.search?.view ?? 'split',
        layout: user.preferences?.search?.layout ?? 'compact',
        use_location: user.preferences?.search?.use_location ?? true,
        save_history: user.preferences?.search?.save_history ?? true,
    },
    ai: { use_preferences: user.preferences?.ai?.use_preferences ?? true },
    theme: user.preferences?.theme ?? readLocalTheme(),
});

const splitList = (value: string): string[] =>
    value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

export default function Settings() {
    const [user, setUser] = useState<User | null>(() => getStoredUser());
    const [draft, setDraft] = useState<SettingsDraft | null>(() => {
        const stored = getStoredUser();
        return stored ? buildDraft(stored) : null;
    });
    const [savedSnapshot, setSavedSnapshot] = useState(() =>
        draft ? JSON.stringify(draft) : '',
    );
    const [errors, setErrors] = useState<Record<string, string[] | string>>({});
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!getAuthToken() || !user || !draft) {
            window.location.assign(login.url());
        }
    }, [draft, user]);

    useEffect(() => {
        if (draft) applyTheme(draft.theme);
    }, [draft?.theme]);

    const isDirty = draft ? JSON.stringify(draft) !== savedSnapshot : false;
    const custom = useMemo(
        () => ({ ...DEFAULT_CUSTOM_PALETTE, ...draft?.theme.custom }),
        [draft?.theme.custom],
    );
    const textContrast = contrastRatio(custom.text, custom.page);

    if (!user || !draft) {
        return (
            <div className="theme-page flex min-h-screen items-center justify-center text-sm">
                Opening settings…
            </div>
        );
    }

    const updateCustom = (
        key: keyof CustomThemePalette,
        value: string,
    ): void => {
        setDraft((current) =>
            current
                ? {
                      ...current,
                      theme: {
                          preset: 'custom',
                          custom: {
                              ...DEFAULT_CUSTOM_PALETTE,
                              ...current.theme.custom,
                              [key]: value,
                          },
                      },
                  }
                : current,
        );
    };

    const save = async (): Promise<void> => {
        setIsSaving(true);
        setFeedback(null);
        setErrors({});
        try {
            const response = await api.updateProfile({
                name: draft.name,
                occupation: draft.occupation || null,
                age: draft.age ? Number(draft.age) : null,
                gender: draft.gender || null,
                location: draft.location || null,
                preferences: {
                    likes: splitList(draft.likes),
                    dislikes: splitList(draft.dislikes),
                    search: draft.search,
                    ai: draft.ai,
                    theme: draft.theme,
                },
            });
            setUser(response.user);
            setStoredUser(response.user);
            storeLocalTheme(draft.theme);
            applyTheme(draft.theme);
            setSavedSnapshot(JSON.stringify(draft));
            setFeedback('Settings saved.');
        } catch (error: any) {
            setErrors(error?.data?.errors ?? {});
            setFeedback(error?.message || 'Settings could not be saved.');
        } finally {
            setIsSaving(false);
        }
    };

    const fieldError = (key: string): string | null => {
        const value = errors[key];
        return Array.isArray(value) ? value[0] : (value ?? null);
    };
    const inputClass =
        'mt-2 w-full rounded-xl border theme-border theme-elevated px-3.5 py-3 text-sm outline-none focus:ring-4 focus:ring-[color:var(--nx-brand)]/15';

    return (
        <div className="theme-page min-h-screen">
            <Head title="Settings — Nexora Search" />
            <header className="theme-surface theme-border sticky top-0 z-30 border-b backdrop-blur-xl">
                <div className="mx-auto flex h-17 max-w-7xl items-center justify-between px-5 sm:px-8">
                    <Link
                        href={dashboard.url()}
                        className="flex items-center gap-3 font-semibold"
                    >
                        <span className="theme-brand flex h-9 w-9 items-center justify-center rounded-xl">
                            N
                        </span>
                        <span>Nexora settings</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        {isDirty && (
                            <span className="theme-muted hidden text-xs sm:inline">
                                Unsaved changes
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => void save()}
                            disabled={isSaving || !isDirty}
                            className="theme-brand rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
                        >
                            {isSaving ? 'Saving…' : 'Save changes'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)]">
                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <p className="theme-muted text-sm leading-6">
                        Personalize discovery without limiting what Nexora can
                        find.
                    </p>
                    <nav
                        className="mt-5 flex gap-2 overflow-x-auto pb-2 lg:flex-col"
                        aria-label="Settings sections"
                    >
                        {[
                            'Profile',
                            'Search & app',
                            'AI preferences',
                            'Theme studio',
                        ].map((label) => (
                            <a
                                key={label}
                                href={`#${label.toLowerCase().replaceAll(' ', '-').replace('&-', '')}`}
                                className="theme-surface theme-border rounded-xl border px-3 py-2.5 text-sm font-medium whitespace-nowrap hover:border-[var(--nx-brand)]"
                            >
                                {label}
                            </a>
                        ))}
                    </nav>
                    <Link
                        href={dashboard.url()}
                        className="theme-muted mt-6 inline-block text-sm font-semibold hover:text-[var(--nx-brand)]"
                    >
                        ← Back to search
                    </Link>
                </aside>

                <div className="space-y-8">
                    {feedback && (
                        <div
                            role="status"
                            className="theme-surface theme-border rounded-2xl border p-4 text-sm"
                        >
                            {feedback}
                        </div>
                    )}

                    <section
                        id="profile"
                        className="theme-surface theme-border scroll-mt-28 rounded-[var(--nx-radius)] border p-6 sm:p-8"
                    >
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Profile
                        </h1>
                        <p className="theme-muted mt-2 text-sm">
                            Your account details and general home location.
                        </p>
                        <div className="mt-7 grid gap-5 sm:grid-cols-2">
                            <label className="text-sm font-medium">
                                Name
                                <input
                                    className={inputClass}
                                    value={draft.name}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            name: event.target.value,
                                        })
                                    }
                                />
                                {fieldError('name') && (
                                    <span className="text-xs text-[var(--nx-error)]">
                                        {fieldError('name')}
                                    </span>
                                )}
                            </label>
                            <label className="text-sm font-medium">
                                Email
                                <input
                                    className={`${inputClass} opacity-65`}
                                    value={user.email}
                                    disabled
                                />
                                <span className="theme-muted mt-1 block text-xs">
                                    Email changes are managed by account
                                    support.
                                </span>
                            </label>
                            <label className="text-sm font-medium">
                                Location
                                <input
                                    className={inputClass}
                                    value={draft.location}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            location: event.target.value,
                                        })
                                    }
                                    placeholder="Lagos, Nigeria"
                                />
                            </label>
                            <label className="text-sm font-medium">
                                Occupation
                                <input
                                    className={inputClass}
                                    value={draft.occupation}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            occupation: event.target.value,
                                        })
                                    }
                                />
                            </label>
                            <label className="text-sm font-medium">
                                Age
                                <input
                                    className={inputClass}
                                    type="number"
                                    min="13"
                                    max="120"
                                    value={draft.age}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            age: event.target.value,
                                        })
                                    }
                                />
                            </label>
                            <label className="text-sm font-medium">
                                Gender
                                <input
                                    className={inputClass}
                                    value={draft.gender}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            gender: event.target.value,
                                        })
                                    }
                                />
                            </label>
                        </div>
                    </section>

                    <section
                        id="search-app"
                        className="theme-surface theme-border scroll-mt-28 rounded-[var(--nx-radius)] border p-6 sm:p-8"
                    >
                        <h2 className="text-2xl font-semibold">Search & app</h2>
                        <p className="theme-muted mt-2 text-sm">
                            Choose defaults; every search can still override
                            them.
                        </p>
                        <div className="mt-7 grid gap-5 sm:grid-cols-2">
                            <label className="text-sm font-medium">
                                Nearby radius
                                <select
                                    className={inputClass}
                                    value={draft.search.radius}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            search: {
                                                ...draft.search,
                                                radius: Number(
                                                    event.target.value,
                                                ),
                                            },
                                        })
                                    }
                                >
                                    <option value={5000}>5 km</option>
                                    <option value={10000}>10 km</option>
                                    <option value={25000}>25 km</option>
                                    <option value={50000}>50 km</option>
                                </select>
                            </label>
                            <label className="text-sm font-medium">
                                Default results view
                                <select
                                    className={inputClass}
                                    value={draft.search.view}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            search: {
                                                ...draft.search,
                                                view: event.target.value as
                                                    | 'split'
                                                    | 'grid'
                                                    | 'list',
                                            },
                                        })
                                    }
                                >
                                    <option value="split">Map + cards</option>
                                    <option value="grid">Card grid</option>
                                    <option value="list">List</option>
                                </select>
                            </label>
                            <label className="text-sm font-medium">
                                Search layout
                                <select
                                    className={inputClass}
                                    value={draft.search.layout}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            search: {
                                                ...draft.search,
                                                layout: event.target.value as
                                                    | 'compact'
                                                    | 'floating'
                                                    | 'hero',
                                            },
                                        })
                                    }
                                >
                                    <option value="compact">
                                        Compact toolbar
                                    </option>
                                    <option value="floating">
                                        Floating over map
                                    </option>
                                    <option value="hero">
                                        Large discovery hero
                                    </option>
                                </select>
                                <span className="theme-muted mt-1.5 block text-xs leading-5">
                                    Changes how search sits beside the map
                                    without changing the map itself.
                                </span>
                            </label>
                        </div>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <Toggle
                                checked={draft.search.use_location ?? true}
                                onChange={(checked) =>
                                    setDraft({
                                        ...draft,
                                        search: {
                                            ...draft.search,
                                            use_location: checked,
                                        },
                                    })
                                }
                                label="Location-assisted discovery"
                            />
                            <Toggle
                                checked={draft.search.save_history ?? true}
                                onChange={(checked) =>
                                    setDraft({
                                        ...draft,
                                        search: {
                                            ...draft.search,
                                            save_history: checked,
                                        },
                                    })
                                }
                                label="Save search history"
                            />
                        </div>
                    </section>

                    <section
                        id="ai-preferences"
                        className="theme-surface theme-border scroll-mt-28 rounded-[var(--nx-radius)] border p-6 sm:p-8"
                    >
                        <h2 className="text-2xl font-semibold">
                            AI preferences
                        </h2>
                        <p className="theme-muted mt-2 text-sm">
                            These are optional hints. They never hide other
                            places unless you explicitly ask Nexora to filter.
                        </p>
                        <div className="mt-7 grid gap-5 sm:grid-cols-2">
                            <label className="text-sm font-medium">
                                Interests, separated by commas
                                <textarea
                                    className={inputClass}
                                    rows={4}
                                    value={draft.likes}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            likes: event.target.value,
                                        })
                                    }
                                    placeholder="Museums, beaches, cafes"
                                />
                            </label>
                            <label className="text-sm font-medium">
                                Things to avoid, separated by commas
                                <textarea
                                    className={inputClass}
                                    rows={4}
                                    value={draft.dislikes}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            dislikes: event.target.value,
                                        })
                                    }
                                    placeholder="Crowded venues"
                                />
                            </label>
                        </div>
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                            <Toggle
                                checked={draft.ai.use_preferences ?? true}
                                onChange={(checked) =>
                                    setDraft({
                                        ...draft,
                                        ai: { use_preferences: checked },
                                    })
                                }
                                label="Use these hints in AI recommendations"
                            />
                            <button
                                type="button"
                                className="text-sm font-semibold text-[var(--nx-error)]"
                                onClick={() =>
                                    setDraft({
                                        ...draft,
                                        likes: '',
                                        dislikes: '',
                                        ai: { use_preferences: false },
                                    })
                                }
                            >
                                Reset discovery preferences
                            </button>
                        </div>
                    </section>

                    <section
                        id="theme-studio"
                        className="theme-surface theme-border scroll-mt-28 rounded-[var(--nx-radius)] border p-6 sm:p-8"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-semibold">
                                    Theme studio
                                </h2>
                                <p className="theme-muted mt-2 text-sm">
                                    Presets reshape the entire interface. Custom
                                    gives you the complete palette.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="theme-muted text-sm font-semibold"
                                onClick={() =>
                                    setDraft({
                                        ...draft,
                                        theme: { preset: 'system' },
                                    })
                                }
                            >
                                Reset theme
                            </button>
                        </div>
                        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {themeOptions.map((option) => {
                                const palette =
                                    option.value === 'custom'
                                        ? custom
                                        : option.value === 'system'
                                          ? THEME_PRESETS.light
                                          : THEME_PRESETS[option.value];
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() =>
                                            setDraft({
                                                ...draft,
                                                theme:
                                                    option.value === 'custom'
                                                        ? {
                                                              preset: 'custom',
                                                              custom,
                                                          }
                                                        : {
                                                              preset: option.value,
                                                          },
                                            })
                                        }
                                        className={`theme-border rounded-2xl border p-4 text-left transition ${draft.theme.preset === option.value ? 'ring-2 ring-[var(--nx-brand)]' : ''}`}
                                    >
                                        <span className="flex gap-1.5">
                                            {[
                                                palette.page,
                                                palette.surface,
                                                palette.brand,
                                                palette.accent,
                                            ].map((color) => (
                                                <span
                                                    key={color}
                                                    className="h-7 flex-1 rounded-md border border-black/10"
                                                    style={{
                                                        backgroundColor: color,
                                                    }}
                                                />
                                            ))}
                                        </span>
                                        <span className="mt-3 block text-sm font-semibold">
                                            {option.label}
                                        </span>
                                        <span className="theme-muted mt-1 block text-xs">
                                            {option.description}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {draft.theme.preset === 'custom' && (
                            <div className="theme-border mt-8 border-t pt-7">
                                <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {colorFields.map((field) => (
                                            <label
                                                key={field.key}
                                                className="text-sm font-medium"
                                            >
                                                <span>{field.label}</span>
                                                <span className="mt-2 flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        className="theme-border h-11 w-14 cursor-pointer rounded-lg border bg-transparent p-1"
                                                        value={String(
                                                            custom[field.key],
                                                        )}
                                                        onChange={(event) =>
                                                            updateCustom(
                                                                field.key,
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                    <input
                                                        className="theme-elevated theme-border w-full rounded-xl border px-3 py-2.5 font-mono text-xs"
                                                        value={String(
                                                            custom[field.key],
                                                        )}
                                                        onChange={(event) =>
                                                            updateCustom(
                                                                field.key,
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </span>
                                                {fieldError(
                                                    `preferences.theme.custom.${field.key}`,
                                                ) && (
                                                    <span className="text-xs text-[var(--nx-error)]">
                                                        {fieldError(
                                                            `preferences.theme.custom.${field.key}`,
                                                        )}
                                                    </span>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                    <div className="theme-elevated theme-border self-start rounded-2xl border p-5 xl:sticky xl:top-26">
                                        <p className="theme-muted text-xs font-semibold">
                                            Live preview
                                        </p>
                                        <div className="theme-border mt-4 rounded-[var(--nx-radius)] border bg-[var(--nx-surface)] p-4">
                                            <div className="h-2 w-20 rounded-full bg-[var(--nx-brand)]" />
                                            <h3 className="mt-5 text-xl font-semibold">
                                                A place to explore
                                            </h3>
                                            <p className="theme-muted mt-2 text-sm">
                                                Cards, controls, chat, and map
                                                chrome follow this palette.
                                            </p>
                                            <button className="theme-brand mt-5 rounded-xl px-4 py-2 text-xs font-semibold">
                                                Primary action
                                            </button>
                                        </div>
                                        <p
                                            className={`mt-4 text-xs ${textContrast < 4.5 ? 'text-[var(--nx-warning)]' : 'text-[var(--nx-success)]'}`}
                                        >
                                            Text contrast:{' '}
                                            {textContrast.toFixed(2)}:1{' '}
                                            {textContrast < 4.5
                                                ? '— consider stronger contrast'
                                                : '— readable'}
                                        </p>
                                        <label className="mt-5 block text-sm font-medium">
                                            Corner style
                                            <select
                                                className={inputClass}
                                                value={custom.radius}
                                                onChange={(event) =>
                                                    updateCustom(
                                                        'radius',
                                                        event.target.value,
                                                    )
                                                }
                                            >
                                                <option value="compact">
                                                    Compact
                                                </option>
                                                <option value="comfortable">
                                                    Comfortable
                                                </option>
                                                <option value="rounded">
                                                    Rounded
                                                </option>
                                            </select>
                                        </label>
                                        <label className="mt-4 block text-sm font-medium">
                                            Interface density
                                            <select
                                                className={inputClass}
                                                value={custom.density}
                                                onChange={(event) =>
                                                    updateCustom(
                                                        'density',
                                                        event.target.value,
                                                    )
                                                }
                                            >
                                                <option value="compact">
                                                    Compact
                                                </option>
                                                <option value="comfortable">
                                                    Comfortable
                                                </option>
                                                <option value="spacious">
                                                    Spacious
                                                </option>
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}

function Toggle({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
}) {
    return (
        <label className="theme-elevated theme-border flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm font-medium">
            <span>{label}</span>
            <input
                type="checkbox"
                className="h-5 w-5 accent-[var(--nx-brand)]"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
            />
        </label>
    );
}
