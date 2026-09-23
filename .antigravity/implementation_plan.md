# Implementation Plan - Nexora Search Redesign & Nex AI Agent Integration

Redesign the landing page to feature a clean, search-focused experience without cluttering all location cards on the main landing view, connect live geocoding/places APIs, remove dummy code and AI Vision clutter, build a sleek bottom-right floating **Nex AI** site agent widget, and configure the NVIDIA API integration.

## User Review Required

> [!IMPORTANT]
> - **Landing Page Layout**: The main landing page will focus on a clean hero search interface. Location cards will only be displayed when a search is executed or when switching to the "Explore Places" view/results area, rather than dumping all default cards on the initial page load.
> - **NVIDIA API Key Configuration**: The backend will use `NVIDIA_API_KEY` set in `.env` (pointing to `https://integrate.api.nvidia.com/v1`). Additionally, the Nex AI chat widget will allow users to optionally paste or override their NVIDIA API key directly in the UI if desired.
> - **Removal of AI Vision**: AI Vision image upload/analysis modal and related triggers will be removed from the UI to streamline the experience into a single, focused **Nex AI** agent.

## Open Questions

None. The requirements are clear.

## Proposed Changes

### Config & Backend API

#### [MODIFY] [config/services.php](file:///c:/laragon/www/nexora-search/config/services.php)
- Add configuration block for `nvidia` (`key`, `base_url`, `model`).

#### [MODIFY] [.env.example](file:///c:/laragon/www/nexora-search/.env.example)
- Add `NVIDIA_API_KEY=`, `NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1`, `NVIDIA_MODEL=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`.

#### [MODIFY] [app/Services/NvidiaAiService.php](file:///c:/laragon/www/nexora-search/app/Services/NvidiaAiService.php)
- Remove AI Vision method and focus on chat completion, site query recommendation, and search telemetry logging.
- Support receiving client-provided NVIDIA API key in request header or configuration.

#### [MODIFY] [app/Http/Controllers/Api/V1/SearchController.php](file:///c:/laragon/www/nexora-search/app/Http/Controllers/Api/V1/SearchController.php)
- Enhance live location search using OpenStreetMap Nominatim geocoding API to fetch real real-time location data, coordinates, addresses, and bounding boxes instead of returning static dummy fallback data.

---

### Frontend Components & Page Layout

#### [MODIFY] [resources/js/pages/welcome.tsx](file:///c:/laragon/www/nexora-search/resources/js/pages/welcome.tsx)
- Redesign landing page:
  - Clean hero search section at top.
  - Search results section shown ONLY when the user performs a search or toggles the Explore section.
  - Remove all inline card dumping on the initial landing view.
  - Integrate the floating bottom-right **Nex AI** widget.

#### [NEW] [resources/js/components/NexAiWidget.tsx](file:///c:/laragon/www/nexora-search/resources/js/components/NexAiWidget.tsx)
- Create a floating, expandable bottom-right chatbot widget labeled **"Nex AI"**.
- Features:
  - Chat interface connected to NVIDIA API / backend AI service.
  - Logs user searches and displays contextual page recommendations & suggestions based on recent activity.
  - Includes an API Key configuration field for inserting/updating NVIDIA API key.

#### [DELETE] [resources/js/components/AIAssistantModal.tsx](file:///c:/laragon/www/nexora-search/resources/js/components/AIAssistantModal.tsx)
- Remove old multi-tab AI Vision / AI Assistant modal in favor of the clean floating **Nex AI** widget.

#### [MODIFY] [resources/js/components/Navbar.tsx](file:///c:/laragon/www/nexora-search/resources/js/components/Navbar.tsx)
- Update navigation items to clean up AI Vision links and reflect the streamlined landing page layout.

## Verification Plan

### Automated Tests
- Run Pest tests for search API and AI controller:
  - `php artisan test --filter=SearchController`
  - `php artisan test --filter=AIController`

### Manual Verification
- Run `npm run build` to compile assets.
- Verify landing page presents clean hero search without dumping all location cards on initial load.
- Perform a search and verify real location cards render dynamically.
- Test the bottom-right floating **Nex AI** widget: open chat, test suggestions, and check NVIDIA API key entry.
