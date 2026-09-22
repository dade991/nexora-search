# Nexora Resilience, Settings, and Theme System Design

## Goal

Make Nexora Search dependable and personal without narrowing discovery around onboarding answers. The work fixes the map and place-detail failures, makes external-service outages graceful, turns Nexora AI into a friendly general assistant with optional search context, and introduces a full settings experience with site-wide themes and fully custom palettes.

## Scope

This change includes:

- A reliable MapLibre map with visible loading, failure, and fallback states.
- A fix for the place-card selection crash.
- Resilient SearchAPI and NVIDIA NIM behavior.
- General conversational AI behavior plus optional location context.
- Editable profile and discovery preferences.
- A dedicated authenticated settings page linked from the profile menu.
- Site-wide preset and custom theme support.
- Regression tests for backend contracts and build/type verification for the frontend.

It does not add a new paid provider, expose provider credentials to the browser, or treat onboarding choices as permanent filters.

## Confirmed Root Causes

### Place selection crash

Laravel decimal casts serialize location coordinates as strings. The detail modal currently calls `toFixed()` directly on those values. Selecting a card therefore throws a browser runtime exception and React renders a blank page.

### Blank map

The OpenFreeMap style endpoint is correct and reachable, and the MapLibre package exports are present. The component currently provides no loading indicator, map error listener, retry path, or fallback style. It also does not resize the map when its responsive container changes. Any WebGL, worker, style, or layout failure is therefore presented as an unexplained empty panel.

### AI failures and unfriendly responses

NVIDIA NIM is returning real upstream capacity errors and 15-second timeouts. The integration immediately exposes those technical errors to the user. Separately, the dashboard rewrites every message into a strict recommendation request based only on current results and saved preferences. That prompt turns greetings into irrelevant “no matching places” responses and treats preferences as restrictions.

### Search failures

SearchAPI failures fall through to OpenStreetMap, but when OpenStreetMap also times out the request fails even when the local catalogue may contain usable results. Transient provider failures have no bounded retry or stale-data fallback.

### Settings gap

An unused settings modal exists but is not mounted. It stores a provider key in `localStorage`, which is inappropriate for secrets, and it cannot edit the onboarding data already stored on the user record. The profile menu exposes only sign-out.

### GeoJSON editor error

`GeoJSON.GeoJSON` depends on an ambient namespace supplied transitively by MapLibre dependencies. The command-line compiler currently sees it, but editor project resolution can flag it. Route geometry should use an explicitly imported or MapLibre-owned type.

## Architecture

### 1. Normalized location boundary

All API location responses will expose numeric `latitude`, `longitude`, and `distance_km` values. The frontend will still defensively normalize external or previously stored values before formatting them. This fixes the crash at its source and protects older database rows.

The detail modal will live beneath an application error boundary so an unexpected detail rendering error cannot blank the entire dashboard.

### 2. Resilient MapLibre component

`InteractiveMap` will own an explicit state machine:

- `loading`: map shell and progress message are visible.
- `ready`: controls and markers are interactive.
- `degraded`: a human-readable message is shown and a raster OpenStreetMap style is attempted.
- `unavailable`: place cards remain usable and the map offers a retry button.

The component will:

- Listen for MapLibre `load` and `error` events.
- Use a `ResizeObserver` and call `map.resize()` after layout changes.
- Keep marker creation separate from map creation.
- Fit result bounds when multiple valid coordinates are present.
- Use an inline raster fallback style if the primary vector style cannot load.
- Preserve street/satellite controls, user location, routes, and airport markers.
- Never allow one malformed place to stop other markers from rendering.

The route geometry type will use an explicit GeoJSON data type rather than the global namespace.

### 3. Provider resilience

#### Search

SearchAPI and OpenStreetMap requests will use explicit connection and response timeouts. Safe GET requests may retry a small number of times only for connection failures, HTTP 429, and HTTP 5xx responses, with short backoff.

The fallback order will be:

1. SearchAPI Google Maps place results.
2. Matching local database results, including recently normalized results.
3. OpenStreetMap results.
4. Stale cached results for the same query and location, when available.
5. A successful empty/degraded response with a friendly provider-status message instead of a raw exception.

Only place results remain in scope; organic articles and blogs will not be introduced.

#### AI

NVIDIA calls will retry only transient connection, 429, and 503 failures. Retry count and timeout remain bounded so a chat request cannot hang indefinitely. The API will return a stable public error code and friendly message while detailed provider errors remain in server logs.

Simple greetings and basic product-help questions will have a deterministic local response path, so “hi” and “what can you do?” do not depend on provider capacity. More complex prompts still use NVIDIA.

## AI Conversation Design

Nexora AI will identify itself as Nexora and respond naturally to greetings, thanks, follow-up questions, and general discovery questions.

The client will send the user’s actual message unchanged. Optional context will be supplied separately:

- Current search query.
- Up to a small bounded set of current place results.
- Current map destination and route summary when present.
- User preferences marked as soft hints.

The system prompt will explicitly state:

- Preferences must never exclude other valid choices unless the user asks for filtering.
- Onboarding answers are suggestions, not permanent identity labels.
- Do not invent place facts.
- Say when current result data is insufficient.
- Greet naturally and explain capabilities when appropriate.

Changing preferences in Settings updates future AI context immediately.

## Settings Information Architecture

The authenticated route `/settings` will render a dedicated Inertia page. The profile dropdown will contain `Settings` above `Sign Out`.

The page will use four sections:

### Profile

- Name.
- General location.
- Optional occupation, age, and gender fields already supported by the user record.
- Account email displayed according to the existing account-editing policy.

### Search and App Personalization

- Default nearby radius.
- Preferred default view: map split, grid, or list.
- Location-assisted discovery toggle.
- Search history preference where supported by current persistence.

### AI Preferences

- Editable interests/likes.
- Editable dislikes.
- A clear explanation that these are optional hints.
- Toggle for using preferences in AI recommendations.
- Reset discovery preferences action.

### Theme

- System.
- Nexora.
- Light.
- Dark.
- Maps Light.
- Maps Dark.
- Custom.

Each preset changes the complete visual system: page surfaces, elevated surfaces, text, muted text, borders, brand color, accent color, success/warning/error colors, controls, cards, overlays, chat, and map chrome.

Custom mode exposes the full palette:

- Page background.
- Surface and elevated-surface colors.
- Primary and secondary text.
- Border color.
- Brand and accent colors.
- Success, warning, and error colors.
- Map-control surface and text.
- Border radius scale.
- Interface density.

A live preview shows the current palette before saving. The browser will calculate contrast and warn when a foreground/background pair is below the readable threshold. Unsafe values may be saved only after the interface substitutes a readable foreground for essential controls; users cannot make navigation, form labels, or destructive-action text invisible.

## Theme Implementation

Theme values will be expressed as semantic CSS custom properties on the document root, selected through `data-theme`. Components will consume semantic utilities or variables rather than hard-coded slate/blue/green values.

The stored user preference will contain:

```json
{
    "theme": {
        "preset": "maps-dark",
        "custom": {
            "page": "#0b1111",
            "surface": "#101a18",
            "surfaceElevated": "#172522",
            "text": "#edf5f1",
            "textMuted": "#a8b9b4",
            "border": "#29413c",
            "brand": "#087f6b",
            "accent": "#e8c36a",
            "success": "#16a34a",
            "warning": "#d97706",
            "error": "#dc2626",
            "mapSurface": "#101a18",
            "mapText": "#edf5f1",
            "radius": "comfortable",
            "density": "comfortable"
        }
    }
}
```

Theme initialization occurs before React paints where practical, preventing a flash of the wrong theme. Anonymous users retain their theme locally. Authenticated users persist it to their profile and receive it on subsequent devices; local state updates immediately for responsive feedback.

No service credential will be accepted or stored by the settings UI.

## Data and API Changes

The existing profile endpoint remains the single settings write boundary. Validation will be extended for:

- Name and supported profile fields.
- Search defaults.
- AI preference behavior.
- Theme preset and custom palette fields.

Preferences remain within the existing JSON column unless schema evidence shows that a dedicated column is necessary. Updates will merge at named preference sections without unintentionally retaining deleted list items.

Frontend calls to the settings endpoint will continue to use generated Wayfinder routes. Successful updates replace both the in-memory user and the stored authenticated-user snapshot.

## Error Handling

- Raw cURL messages, upstream response bodies, tokens, and provider internals never reach the browser.
- Search and AI responses include stable public error identifiers where the frontend needs to distinguish retryable failure from validation failure.
- The map shows its own error state without affecting the rest of the dashboard.
- The place-detail error boundary offers a close/retry action and leaves the dashboard usable.
- Settings validation errors appear beside the relevant field and do not discard unsaved form data.

## Testing

Backend feature tests will cover:

- Numeric coordinate serialization.
- Search retry eligibility and provider fallback order.
- Search degradation when all live providers fail.
- AI greeting behavior without a provider request.
- Friendly AI failure contracts for timeout and 503 responses.
- Preference updates replacing editable lists correctly.
- Theme palette validation and persistence.
- Authentication for settings updates.

Frontend verification will cover:

- TypeScript compilation, including explicit route geometry typing.
- Production build.
- Map loading, fallback, resize, marker selection, and map-independent detail behavior where the available test tooling permits.
- Settings route rendering and profile-menu navigation.
- Theme application and persistence.
- AI chat greeting and degraded-service presentation.

The focused suites run first, followed by the full Laravel suite, formatter, TypeScript check, production build, and an interactive browser pass when a browser target is available.

## Migration and Compatibility

- Existing `dark`/`light` local preference values map into the new preset names.
- Existing onboarding preferences remain editable and become soft hints.
- Existing location rows with string coordinates remain valid because the API normalizes them.
- Existing users without new preference keys receive documented defaults.
- The unused settings modal is removed after the route-based settings page is connected.

## Success Criteria

- Selecting any valid result never blanks the dashboard.
- A map or an explicit recoverable map error is always visible in map areas.
- “Hi” receives a friendly Nexora introduction without requiring live place results.
- NVIDIA and search-provider outages never expose raw technical messages.
- Search remains useful from stored or cached data during transient provider outages where such data exists.
- Onboarding choices do not exclude unrelated searches or dominate AI answers.
- Users can revisit and edit profile, search, AI, and theme preferences.
- Every preset visibly changes the complete application, and Custom controls the full supported palette.
- The GeoJSON editor error is removed with an explicit type.
