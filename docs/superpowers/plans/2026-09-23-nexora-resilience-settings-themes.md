# Nexora Resilience, Settings, and Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the map and place-detail failures, make live providers degrade cleanly, make Nexora AI conversational, and add editable account/app preferences with complete site-wide preset and custom themes.

**Architecture:** Normalize data at Laravel's API boundary, isolate external-provider resilience in services, and keep frontend rendering defensive. Store user-facing settings in the existing `preferences` JSON, apply appearance through semantic CSS variables, and expose editing through a dedicated Inertia settings page linked from the profile menu.

**Tech Stack:** PHP 8.3, Laravel, Pest, Inertia.js v3, React 19, TypeScript, Tailwind CSS v4, MapLibre GL JS 6, Wayfinder.

**Spec:** `docs/superpowers/specs/2026-09-22-nexora-resilience-settings-themes-design.md`

## Global Constraints

- Do not add or change dependencies.
- Keep all API/provider credentials server-side; remove the unused browser credential field.
- Search results remain place-only and never add organic article/blog results.
- Preferences are optional hints and never hidden search filters unless the user explicitly requests filtering.
- Raw upstream errors, response bodies, keys, and cURL messages never reach the browser.
- Preserve the existing dirty worktree and do not overwrite unrelated user changes.
- Use Wayfinder-generated controller functions for new frontend-to-backend calls.
- Run `vendor/bin/pint --dirty --format agent` after PHP edits.

---

### Task 1: Normalize location coordinates and contain detail-render failures

**Files:**
- Modify: `app/Models/Location.php`
- Modify: `resources/js/types/nexora.ts`
- Modify: `resources/js/components/PlaceDetailModal.tsx`
- Create: `resources/js/components/FeatureErrorBoundary.tsx`
- Modify: `resources/js/pages/Dashboard.tsx`
- Test: `tests/Feature/PlacesApiTest.php`

**Interfaces:**
- Produces: numeric JSON fields `latitude`, `longitude`, and nullable `distance_km`.
- Produces: `FeatureErrorBoundary` accepting `name`, `onReset`, and `children`.
- Consumes: existing `LocationItem` and `PlaceDetailModal` props.

- [ ] **Step 1: Add a failing location serialization test**

```php
it('serializes location coordinates as numbers', function () {
    $location = Location::factory()->create([
        'latitude' => 9.07650000,
        'longitude' => 7.39860000,
    ]);

    $this->getJson('/api/v1/places/'.$location->id)
        ->assertOk()
        ->assertJsonPath('data.latitude', fn (mixed $value): bool => is_float($value))
        ->assertJsonPath('data.longitude', fn (mixed $value): bool => is_float($value));
});
```

- [ ] **Step 2: Run the test and verify it fails because decimal casts serialize strings**

Run: `vendor/bin/pest tests/Feature/PlacesApiTest.php --filter="serializes location coordinates" --compact`

- [ ] **Step 3: Change the model coordinate casts to floats and make frontend formatting defensive**

```php
'latitude' => 'float',
'longitude' => 'float',
```

```tsx
const latitude = Number(place.latitude);
const longitude = Number(place.longitude);
const coordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
    ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    : 'Coordinates unavailable';
```

- [ ] **Step 4: Add `FeatureErrorBoundary` and wrap the detail modal**

The boundary must render a compact recovery panel, call `onReset` when dismissed, and use `getDerivedStateFromError` plus `componentDidCatch`. It must not intercept errors from the entire dashboard.

- [ ] **Step 5: Run focused verification**

Run: `vendor/bin/pest tests/Feature/PlacesApiTest.php --compact`
Run: `npm.cmd run types:check`

- [ ] **Step 6: Commit Task 1**

```bash
git add app/Models/Location.php resources/js/types/nexora.ts resources/js/components/PlaceDetailModal.tsx resources/js/components/FeatureErrorBoundary.tsx resources/js/pages/Dashboard.tsx tests/Feature/PlacesApiTest.php
git commit -m "fix: prevent place detail rendering crashes"
```

### Task 2: Make MapLibre observable, resize-safe, and recoverable

**Files:**
- Modify: `resources/js/lib/mapsApi.ts`
- Modify: `resources/js/components/InteractiveMap.tsx`
- Modify: `resources/css/app.css`

**Interfaces:**
- Produces: `RouteResult.geometry` typed as `GeoJSONSourceSpecification['data']`.
- Produces: `FALLBACK_MAP_STYLE` as an inline `StyleSpecification` using OpenStreetMap raster tiles.
- Produces: map states `'loading' | 'ready' | 'degraded' | 'unavailable'`.

- [ ] **Step 1: Replace the ambient GeoJSON type with a MapLibre-owned explicit type**

```ts
import type { GeoJSONSourceSpecification, StyleSpecification } from 'maplibre-gl';

export interface RouteResult {
    geometry: GeoJSONSourceSpecification['data'];
    // existing fields
}
```

- [ ] **Step 2: Add a raster fallback style without adding a dependency**

```ts
export const FALLBACK_MAP_STYLE: StyleSpecification = {
    version: 8,
    sources: {
        openstreetmap: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
        },
    },
    layers: [{ id: 'openstreetmap', type: 'raster', source: 'openstreetmap' }],
};
```

- [ ] **Step 3: Refactor `InteractiveMap` into explicit lifecycle states**

Register `load` and `error` listeners before adding markers. On the first primary-style error, call `map.setStyle(FALLBACK_MAP_STYLE)` and set `degraded`; on fallback failure set `unavailable`. Render loading/degraded/unavailable notices above the map and a retry button that increments a local attempt key.

- [ ] **Step 4: Add responsive map resizing and result bounds**

Create a `ResizeObserver` for the container, call `map.resize()` in its callback, and disconnect it during cleanup. After markers load, create `LngLatBounds`, extend it with every valid result, and call `fitBounds` when there are at least two distinct coordinates.

- [ ] **Step 5: Verify type and production builds**

Run: `npm.cmd run types:check`
Expected: no editor/global `GeoJSON` dependency remains.

Run: `npm.cmd run build`
Expected: build exits 0.

- [ ] **Step 6: Commit Task 2**

```bash
git add resources/js/lib/mapsApi.ts resources/js/components/InteractiveMap.tsx resources/css/app.css
git commit -m "fix: make MapLibre loading recoverable"
```

### Task 3: Make place search degrade through live, local, and stale sources

**Files:**
- Modify: `app/Services/SearchApiService.php`
- Modify: `app/Services/LocationSearchService.php`
- Modify: `app/Http/Controllers/Api/V1/SearchController.php`
- Modify: `resources/js/lib/api.ts`
- Modify: `resources/js/pages/Dashboard.tsx`
- Test: `tests/Feature/SearchApiTest.php`
- Test: `tests/Feature/SearchIntegrationTest.php`

**Interfaces:**
- Produces: search response fields `provider`, `status`, `message`, `results`, and `count`.
- `status` is one of `live`, `cached`, `degraded`.
- Raw provider exceptions stay in logs.

- [ ] **Step 1: Add failing tests for retryable failure and all-provider degradation**

```php
test('returns stored nearby places when live providers time out', function () {
    Location::factory()->create([
        'name' => 'Stored Cafe',
        'latitude' => 9.0765,
        'longitude' => 7.3986,
        'category' => 'cafe',
    ]);

    config()->set('services.searchapi.key', 'test-key');
    Http::fake([
        'www.searchapi.io/*' => Http::failedConnection(),
        'nominatim.openstreetmap.org/*' => Http::failedConnection(),
    ]);

    $this->getJson('/api/v1/search?query=cafe&latitude=9.0765&longitude=7.3986&radius=10000')
        ->assertOk()
        ->assertJsonPath('status', 'degraded')
        ->assertJsonPath('results.0.name', 'Stored Cafe')
        ->assertDontSee('cURL');
});
```

- [ ] **Step 2: Run both search test files and verify the new case fails**

Run: `vendor/bin/pest tests/Feature/SearchApiTest.php tests/Feature/SearchIntegrationTest.php --compact`

- [ ] **Step 3: Add bounded retry policy to safe provider GETs**

Use `connectTimeout(3)`, `timeout(12)`, and at most two attempts. Retry only `ConnectionException`, status 429, and server errors. Do not retry validation/authentication responses.

- [ ] **Step 4: Preserve stale normalized results and implement final degradation**

Cache the last successful normalized response under a stable query/coordinate key. In `LocationSearchService`, attempt SearchAPI, then local matching results, then OpenStreetMap, then stale cached results. If all are absent, return an empty degraded response with `message: 'Live place search is temporarily unavailable. Try again shortly.'`.

- [ ] **Step 5: Update frontend search types and show non-blocking degraded status**

Cards and map remain visible for cached/local results. The dashboard message must not expose exception text.

- [ ] **Step 6: Run focused search tests**

Run: `vendor/bin/pest tests/Feature/SearchApiTest.php tests/Feature/SearchIntegrationTest.php --compact`

- [ ] **Step 7: Commit Task 3**

```bash
git add app/Services/SearchApiService.php app/Services/LocationSearchService.php app/Http/Controllers/Api/V1/SearchController.php resources/js/lib/api.ts resources/js/pages/Dashboard.tsx tests/Feature/SearchApiTest.php tests/Feature/SearchIntegrationTest.php
git commit -m "fix: degrade place search gracefully"
```

### Task 4: Make Nexora AI conversational and resilient

**Files:**
- Modify: `config/ai.php`
- Modify: `app/Services/NvidiaAiService.php`
- Modify: `app/Http/Controllers/Api/V1/AIController.php`
- Modify: `resources/js/pages/Dashboard.tsx`
- Test: `tests/Feature/AiApiTest.php`

**Interfaces:**
- Produces: local greeting response with provider `nexora_local`.
- Produces: stable unavailable response `{ code: 'AI_TEMPORARILY_UNAVAILABLE', message: 'Nexora is taking a moment. Please try again shortly.' }`.
- Consumes: user message unchanged plus optional system context.

- [ ] **Step 1: Add failing tests for greetings and sanitized provider failure**

```php
test('greets users without calling the external provider', function () {
    Http::preventStrayRequests();

    $this->postJson('/api/v1/ai/chat', [
        'messages' => [['role' => 'user', 'content' => 'Hi']],
    ])->assertOk()
        ->assertJsonPath('provider', 'nexora_local')
        ->assertJsonPath('message.role', 'assistant');

    Http::assertNothingSent();
});

test('hides upstream capacity details from chat users', function () {
    Http::fake(['integrate.api.nvidia.com/*' => Http::response([
        'error' => ['message' => 'ResourceExhausted internal worker details'],
    ], 503)]);

    $this->postJson('/api/v1/ai/chat', [
        'messages' => [['role' => 'user', 'content' => 'Plan a weekend in Lagos']],
    ])->assertStatus(503)
        ->assertJsonPath('code', 'AI_TEMPORARILY_UNAVAILABLE')
        ->assertJsonMissingPath('error.message');
});
```

- [ ] **Step 2: Run AI tests and verify both cases fail**

Run: `vendor/bin/pest tests/Feature/AiApiTest.php --compact`

- [ ] **Step 3: Add greeting/product-help local intent handling**

Normalize the latest user message and respond locally to greeting-only phrases and capability questions. The response introduces Nexora and offers place search, comparison, routes, nearby discovery, and travel context.

- [ ] **Step 4: Add bounded transient retry and public exception rendering**

Retry NVIDIA once for connections, 429, and 503 with a short delay. Log full provider detail server-side, then throw/render an exception whose public JSON contains only the stable code and friendly message.

- [ ] **Step 5: Stop rewriting the user's message on the dashboard**

Send the user's text unchanged. Add current results and enabled soft preferences in a separate system-context message containing: `These are optional context. Do not treat preferences as filters and do not invent facts.`

- [ ] **Step 6: Replace the system prompt with friendly general behavior**

The prompt must identify the assistant as Nexora, support normal conversation, use supplied place facts when relevant, and treat all profile preferences as optional hints.

- [ ] **Step 7: Run focused AI tests**

Run: `vendor/bin/pest tests/Feature/AiApiTest.php --compact`

- [ ] **Step 8: Commit Task 4**

```bash
git add config/ai.php app/Services/NvidiaAiService.php app/Http/Controllers/Api/V1/AIController.php resources/js/pages/Dashboard.tsx tests/Feature/AiApiTest.php
git commit -m "feat: make Nexora chat friendly and resilient"
```

### Task 5: Validate and persist editable settings

**Files:**
- Create: `app/Http/Requests/UpdateProfileRequest.php`
- Modify: `app/Http/Controllers/Api/V1/ProfileController.php`
- Modify: `resources/js/types/auth.ts`
- Modify: `resources/js/lib/api.ts`
- Test: `tests/Feature/AuthApiTest.php`

**Interfaces:**
- Produces: `UpdateProfileRequest::validated()` with profile fields and named preference sections.
- Produces preference keys `search`, `ai`, and `theme` matching the design spec.
- `preferences.likes` and `preferences.dislikes` replace old arrays rather than recursively retaining removed indexes.

- [ ] **Step 1: Generate the form request**

Run: `php artisan make:request UpdateProfileRequest --no-interaction`

- [ ] **Step 2: Add failing tests for preference replacement and custom theme validation**

```php
test('authenticated users can replace discovery preferences and save a custom theme', function () {
    $user = User::factory()->create([
        'preferences' => ['likes' => ['work-friendly', 'cafes']],
    ]);

    $this->actingAs($user, 'sanctum')->patchJson('/api/v1/auth/profile', [
        'preferences' => [
            'likes' => ['museums'],
            'dislikes' => [],
            'ai' => ['use_preferences' => false],
            'theme' => [
                'preset' => 'custom',
                'custom' => [
                    'page' => '#0b1111',
                    'surface' => '#101a18',
                    'surfaceElevated' => '#172522',
                    'text' => '#edf5f1',
                    'textMuted' => '#a8b9b4',
                    'border' => '#29413c',
                    'brand' => '#087f6b',
                    'accent' => '#e8c36a',
                    'success' => '#16a34a',
                    'warning' => '#d97706',
                    'error' => '#dc2626',
                    'mapSurface' => '#101a18',
                    'mapText' => '#edf5f1',
                    'radius' => 'comfortable',
                    'density' => 'comfortable',
                ],
            ],
        ],
    ])->assertOk()->assertJsonPath('user.preferences.likes', ['museums']);

    expect($user->fresh()->preferences['likes'])->toBe(['museums']);
});
```

- [ ] **Step 3: Run the new profile tests and verify they fail**

Run: `vendor/bin/pest tests/Feature/AuthApiTest.php --filter="preferences|custom theme" --compact`

- [ ] **Step 4: Implement request authorization and validation**

Authorize only authenticated users. Validate supported profile fields, radius `5..50000`, view in `split,grid,list`, booleans, likes/dislikes arrays, preset in `system,nexora,light,dark,maps-light,maps-dark,custom`, every custom color using `/^#[0-9A-Fa-f]{6}$/`, radius in `compact,comfortable,rounded`, and density in `compact,comfortable,spacious`.

- [ ] **Step 5: Merge preference objects while replacing editable lists**

Merge the `search`, `ai`, and `theme` associative sections, but assign `likes` and `dislikes` directly when present. Never use `array_replace_recursive` for numeric preference lists.

- [ ] **Step 6: Type the API payload and use the generated profile update action**

Replace the hard-coded profile URL with `ProfileController.update.url()` from `@/actions/...` and define `UserPreferences`, `ThemePreference`, and `CustomThemePalette` in `auth.ts`.

- [ ] **Step 7: Run profile tests and regenerate Wayfinder if needed**

Run: `php artisan wayfinder:generate --with-form --no-interaction`
Run: `vendor/bin/pest tests/Feature/AuthApiTest.php --compact`

- [ ] **Step 8: Commit Task 5**

```bash
git add app/Http/Requests/UpdateProfileRequest.php app/Http/Controllers/Api/V1/ProfileController.php resources/js/types/auth.ts resources/js/lib/api.ts resources/js/actions tests/Feature/AuthApiTest.php
git commit -m "feat: persist editable user settings"
```

### Task 6: Build the site-wide theme engine

**Files:**
- Create: `resources/js/lib/themes.ts`
- Modify: `resources/js/app.tsx`
- Modify: `resources/css/app.css`
- Modify: `resources/js/pages/Landing.tsx`
- Modify: `resources/js/pages/Login.tsx`
- Modify: `resources/js/pages/Dashboard.tsx`
- Modify: `resources/js/components/*.tsx`

**Interfaces:**
- Produces: `THEME_PRESETS`, `applyTheme(theme)`, `readLocalTheme()`, `storeLocalTheme(theme)`, and `contrastRatio(foreground, background)`.
- Consumes: `ThemePreference` and `CustomThemePalette` from `resources/js/types/auth.ts`.

- [ ] **Step 1: Implement pure theme utilities and preset definitions**

Each preset must define all semantic variables from the spec. `applyTheme` sets `data-theme` and custom CSS variables on `document.documentElement`. `contrastRatio` implements WCAG relative luminance from six-digit hex colors.

- [ ] **Step 2: Add pre-paint theme initialization**

Before React renders, read `nexora_theme_v2`, map legacy `nexora_theme` light/dark values, and apply the chosen preset. System mode must follow `prefers-color-scheme`.

- [ ] **Step 3: Define semantic CSS variables and Tailwind theme aliases**

Create variables for page, surface, elevated surface, text, muted text, border, brand, accent, status colors, map chrome, radius, and density. Add `[data-theme]` preset blocks and custom-variable fallbacks.

- [ ] **Step 4: Replace hard-coded application palette usage**

Convert Landing, Login, Dashboard, Navbar, HeroSearch, cards, drawers, modals, map controls, onboarding, and AI chat to semantic theme classes/variables. Retain hard-coded colors only for provider imagery or universally meaningful data visualizations.

- [ ] **Step 5: Verify every preset changes the full UI contract**

Run: `npm.cmd run types:check`
Run: `npm.cmd run build`

Inspect generated CSS for selectors covering `system`, `nexora`, `light`, `dark`, `maps-light`, `maps-dark`, and `custom`.

- [ ] **Step 6: Commit Task 6**

```bash
git add resources/js/lib/themes.ts resources/js/app.tsx resources/css/app.css resources/js/pages resources/js/components
git commit -m "feat: add complete site theme engine"
```

### Task 7: Create and connect the settings page

**Files:**
- Create: `resources/js/pages/Settings.tsx`
- Modify: `resources/js/components/Navbar.tsx`
- Modify: `resources/js/pages/Dashboard.tsx`
- Modify: `routes/web.php`
- Delete: `resources/js/components/SettingsModal.tsx`
- Test: `tests/Feature/DashboardTest.php`

**Interfaces:**
- Produces: named web route `settings` rendering Inertia component `Settings`.
- Adds `onOpenSettings` to `NavbarProps` or uses the generated `settings` route directly.
- Consumes: `api.updateProfile`, theme utilities, authenticated user snapshot, and preference types.

- [ ] **Step 1: Add a failing route-render test**

```php
it('renders the settings page', function () {
    $this->get(route('settings'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Settings'));
});
```

- [ ] **Step 2: Run the route test and verify the missing route failure**

Run: `vendor/bin/pest tests/Feature/DashboardTest.php --filter="settings page" --compact`

- [ ] **Step 3: Add the named Inertia route and regenerate Wayfinder**

Render `Settings` without exposing credentials. The React page redirects to login when no stored token/user exists, matching the dashboard's current authentication convention.

Run: `php artisan wayfinder:generate --with-form --no-interaction`

- [ ] **Step 4: Build four focused settings sections**

Create Profile, Search & App, AI Preferences, and Theme sections. Use one typed draft state, inline validation errors, unsaved-change tracking, save feedback, reset buttons, and a live theme preview. The custom palette editor exposes every field from the specification plus radius and density.

- [ ] **Step 5: Connect save behavior**

Call `api.updateProfile`, replace the stored user snapshot, apply/store the returned theme immediately, and retain the form draft on validation errors.

- [ ] **Step 6: Add Settings to the profile dropdown**

Place it immediately above Sign Out and use the Wayfinder-generated named route URL. Convert the hover-only dropdown to explicit click/focus state so keyboard and touch users can reach Settings.

- [ ] **Step 7: Remove the insecure unused modal**

Delete `SettingsModal.tsx` and confirm no reference to `nexora_nvidia_api_key` remains.

- [ ] **Step 8: Run settings verification**

Run: `vendor/bin/pest tests/Feature/DashboardTest.php tests/Feature/AuthApiTest.php --compact`
Run: `npm.cmd run types:check`
Run: `npm.cmd run build`

- [ ] **Step 9: Commit Task 7**

```bash
git add routes/web.php resources/js/routes resources/js/pages/Settings.tsx resources/js/components/Navbar.tsx resources/js/pages/Dashboard.tsx resources/js/components/SettingsModal.tsx tests/Feature/DashboardTest.php
git commit -m "feat: add account and app settings page"
```

### Task 8: Complete regression and runtime verification

**Files:**
- Modify only files required by failures directly caused by Tasks 1-7.

**Interfaces:**
- Verifies every success criterion from the linked specification.

- [ ] **Step 1: Format PHP and inspect the scoped diff**

Run: `vendor/bin/pint --dirty --format agent`
Run: `git diff --check`

- [ ] **Step 2: Run the focused backend suite**

Run: `vendor/bin/pest tests/Feature/PlacesApiTest.php tests/Feature/SearchApiTest.php tests/Feature/SearchIntegrationTest.php tests/Feature/AiApiTest.php tests/Feature/AuthApiTest.php tests/Feature/DashboardTest.php --compact`

- [ ] **Step 3: Run the complete backend suite**

Run: `php artisan test --compact`

If the known admin telemetry clearing assertion remains the only failure, report it separately; do not alter unrelated telemetry behavior as part of this project.

- [ ] **Step 4: Run frontend verification**

Run: `npm.cmd run types:check`
Run: `npm.cmd run build`

- [ ] **Step 5: Perform interactive acceptance checks when a browser target is available**

Verify: dashboard map loads; fallback state is readable; selecting a card opens details without blanking; greeting returns a Nexora introduction; simulated provider failures show friendly messages; Settings is reachable from the profile menu; every preset transforms all major surfaces; Custom palette applies and survives reload.

- [ ] **Step 6: Audit secrets and legacy implementation text**

Run: `rg -n "nexora_nvidia_api_key|NVIDIA NIM returned|cURL error|GeoJSON\.GeoJSON|work-friendly places|SettingsModal" app config resources routes tests`

Expected: no browser-stored key, raw provider message, ambient GeoJSON type, forced work-friendly copy, or unused modal reference.
