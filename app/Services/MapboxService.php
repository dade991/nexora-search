<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class MapboxService
{
    protected ?string $accessToken;

    public function __construct()
    {
        $this->accessToken = config('services.mapbox.key') ?: env('MAPBOX_ACCESS_TOKEN');
    }

    /**
     * Perform forward geocoding for a text query.
     */
    public function geocode(string $query, ?int $limit = 5): array
    {
        $cacheKey = 'mapbox_geocode_' . md5(strtolower(trim($query)) . '_' . $limit);

        return Cache::remember($cacheKey, 3600, function () use ($query, $limit) {
            $startTime = microtime(true);
            $endpoint = '/geocoding/v5/mapbox.places/' . rawurlencode($query) . '.json';

            if ($this->accessToken) {
                try {
                    $url = 'https://api.mapbox.com' . $endpoint;
                    $params = [
                        'access_token' => $this->accessToken,
                        'limit' => $limit,
                    ];

                    $response = Http::timeout(5)->get($url, $params);
                    $duration = microtime(true) - $startTime;

                    if ($response->successful()) {
                        $data = $response->json();
                        $features = $data['features'] ?? [];
                        $results = [];

                        foreach ($features as $feature) {
                            $results[] = [
                                'id' => $feature['id'] ?? null,
                                'place_name' => $feature['place_name'] ?? '',
                                'text' => $feature['text'] ?? '',
                                'longitude' => $feature['center'][0] ?? null,
                                'latitude' => $feature['center'][1] ?? null,
                                'bbox' => $feature['bbox'] ?? null,
                                'relevance' => $feature['relevance'] ?? 1.0,
                            ];
                        }

                        ApiLoggerService::log('mapbox', $endpoint, 'GET', ['query' => $query], 200, $results, $duration, true);

                        return [
                            'provider' => 'mapbox',
                            'query' => $query,
                            'results' => $results,
                        ];
                    }

                    ApiLoggerService::log('mapbox', $endpoint, 'GET', ['query' => $query], $response->status(), null, $duration, false, $response->body());
                } catch (\Throwable $e) {
                    $duration = microtime(true) - $startTime;
                    ApiLoggerService::log('mapbox', $endpoint, 'GET', ['query' => $query], 500, null, $duration, false, $e->getMessage());
                }
            }

            // Resilient fallback using OpenStreetMap Nominatim
            return $this->nominatimGeocode($query, $limit);
        });
    }

    /**
     * Calculate directions / route between two coordinates.
     */
    public function directions(
        float $startLat,
        float $startLng,
        float $endLat,
        float $endLng,
        string $profile = 'driving'
    ): array {
        $cacheKey = "mapbox_dir_{$startLat}_{$startLng}_{$endLat}_{$endLng}_{$profile}";

        return Cache::remember($cacheKey, 1800, function () use ($startLat, $startLng, $endLat, $endLng, $profile) {
            $startTime = microtime(true);
            $coordinates = "{$startLng},{$startLat};{$endLng},{$endLat}";
            $endpoint = "/directions/v5/mapbox/{$profile}/{$coordinates}";

            if ($this->accessToken) {
                try {
                    $url = 'https://api.mapbox.com' . $endpoint;
                    $params = [
                        'access_token' => $this->accessToken,
                        'geometries' => 'geojson',
                        'overview' => 'full',
                        'steps' => 'true',
                    ];

                    $response = Http::timeout(6)->get($url, $params);
                    $duration = microtime(true) - $startTime;

                    if ($response->successful()) {
                        $data = $response->json();
                        $route = $data['routes'][0] ?? null;

                        $result = [
                            'provider' => 'mapbox',
                            'distance_meters' => $route['distance'] ?? null,
                            'duration_seconds' => $route['duration'] ?? null,
                            'geometry' => $route['geometry'] ?? null,
                            'legs' => $route['legs'] ?? [],
                        ];

                        ApiLoggerService::log('mapbox', $endpoint, 'GET', ['coordinates' => $coordinates], 200, $result, $duration, true);

                        return $result;
                    }

                    ApiLoggerService::log('mapbox', $endpoint, 'GET', ['coordinates' => $coordinates], $response->status(), null, $duration, false, $response->body());
                } catch (\Throwable $e) {
                    $duration = microtime(true) - $startTime;
                    ApiLoggerService::log('mapbox', $endpoint, 'GET', ['coordinates' => $coordinates], 500, null, $duration, false, $e->getMessage());
                }
            }

            // Synthetic route fallback calculation
            $distanceKm = $this->haversineDistance($startLat, $startLng, $endLat, $endLng);

            return [
                'provider' => 'simulated_routing',
                'distance_meters' => round($distanceKm * 1000),
                'duration_seconds' => round(($distanceKm / 50) * 3600), // average 50km/h
                'geometry' => [
                    'type' => 'LineString',
                    'coordinates' => [
                        [$startLng, $startLat],
                        [$endLng, $endLat],
                    ],
                ],
                'legs' => [
                    [
                        'summary' => 'Direct route',
                        'distance' => round($distanceKm * 1000),
                        'duration' => round(($distanceKm / 50) * 3600),
                    ],
                ],
            ];
        });
    }

    /**
     * Fallback geocoder using OpenStreetMap Nominatim.
     */
    protected function nominatimGeocode(string $query, int $limit): array
    {
        $startTime = microtime(true);
        $url = 'https://nominatim.openstreetmap.org/search';
        $params = [
            'q' => $query,
            'format' => 'json',
            'limit' => $limit,
            'addressdetails' => 1,
        ];

        try {
            $response = Http::withHeaders([
                'User-Agent' => 'NexoraSearch/1.0 (academic project)',
            ])->timeout(4)->get($url, $params);

            $duration = microtime(true) - $startTime;

            if ($response->successful()) {
                $items = $response->json();
                $results = [];

                foreach ($items as $item) {
                    $results[] = [
                        'id' => 'osm_' . ($item['place_id'] ?? uniqid()),
                        'place_name' => $item['display_name'] ?? '',
                        'text' => $item['name'] ?? ($item['display_name'] ?? ''),
                        'longitude' => (float) ($item['lon'] ?? 0),
                        'latitude' => (float) ($item['lat'] ?? 0),
                        'bbox' => isset($item['boundingbox']) ? [
                            (float) $item['boundingbox'][2],
                            (float) $item['boundingbox'][0],
                            (float) $item['boundingbox'][3],
                            (float) $item['boundingbox'][1],
                        ] : null,
                        'relevance' => (float) ($item['importance'] ?? 0.8),
                    ];
                }

                ApiLoggerService::log('osm_nominatim', '/search', 'GET', ['q' => $query], 200, $results, $duration, true);

                return [
                    'provider' => 'nominatim_fallback',
                    'query' => $query,
                    'results' => $results,
                ];
            }
        } catch (\Throwable $e) {
            // silent fallback to local estimation
        }

        return [
            'provider' => 'offline_fallback',
            'query' => $query,
            'results' => [],
        ];
    }

    protected function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // km
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
