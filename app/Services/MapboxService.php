<?php

namespace App\Services;

use App\ExternalServiceUnavailableException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class MapboxService
{
    private ?string $accessToken;

    public function __construct()
    {
        $this->accessToken = config('services.mapbox.key');
    }

    public function geocode(string $query, int $limit = 5): array
    {
        $this->ensureConfigured();

        return Cache::remember('mapbox_geocode_'.md5(mb_strtolower(trim($query)).'_'.$limit), 3600, function () use ($query, $limit): array {
            $response = $this->request('/geocoding/v5/mapbox.places/'.rawurlencode($query).'.json', ['limit' => $limit]);
            $results = collect($response->json('features', []))->map(fn (array $feature): array => [
                'id' => $feature['id'] ?? null,
                'place_name' => $feature['place_name'] ?? '',
                'text' => $feature['text'] ?? '',
                'longitude' => $feature['center'][0] ?? null,
                'latitude' => $feature['center'][1] ?? null,
                'bbox' => $feature['bbox'] ?? null,
                'relevance' => $feature['relevance'] ?? null,
            ])->values()->all();

            return ['provider' => 'mapbox', 'query' => $query, 'results' => $results];
        });
    }

    public function directions(float $startLat, float $startLng, float $endLat, float $endLng, string $profile = 'driving'): array
    {
        $this->ensureConfigured();

        return Cache::remember("mapbox_directions_{$startLat}_{$startLng}_{$endLat}_{$endLng}_{$profile}", 1800, function () use ($startLat, $startLng, $endLat, $endLng, $profile): array {
            $coordinates = "{$startLng},{$startLat};{$endLng},{$endLat}";
            $route = $this->request("/directions/v5/mapbox/{$profile}/{$coordinates}", [
                'geometries' => 'geojson', 'overview' => 'full', 'steps' => 'true',
            ])->json('routes.0');

            if (! is_array($route)) {
                throw new ExternalServiceUnavailableException('mapbox', 'Mapbox did not return a route.', 503);
            }

            return [
                'provider' => 'mapbox',
                'distance_meters' => $route['distance'] ?? null,
                'duration_seconds' => $route['duration'] ?? null,
                'geometry' => $route['geometry'] ?? null,
                'legs' => $route['legs'] ?? [],
            ];
        });
    }

    private function request(string $endpoint, array $parameters): Response
    {
        $startedAt = microtime(true);

        try {
            $response = Http::acceptJson()->connectTimeout(3)->timeout(8)->get(
                'https://api.mapbox.com'.$endpoint,
                $parameters + ['access_token' => $this->accessToken],
            );
        } catch (\Throwable $e) {
            $duration = microtime(true) - $startedAt;
            ApiLoggerService::log('mapbox', $endpoint, 'GET', $parameters, 503, null, $duration, false, $e->getMessage());

            throw new ExternalServiceUnavailableException('mapbox', 'Mapbox could not complete the request.', 503);
        }

        $duration = microtime(true) - $startedAt;
        ApiLoggerService::log('mapbox', $endpoint, 'GET', $parameters, $response->status(), null, $duration, $response->successful(), $response->successful() ? null : $response->body());

        if (! $response->successful()) {
            throw new ExternalServiceUnavailableException('mapbox', 'Mapbox could not complete the request.', 503);
        }

        return $response;
    }

    private function ensureConfigured(): void
    {
        if (blank($this->accessToken)) {
            throw new ExternalServiceUnavailableException('mapbox', 'Mapbox is not configured.', 503);
        }
    }
}
