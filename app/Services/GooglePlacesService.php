<?php

namespace App\Services;

use App\Models\Location;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class GooglePlacesService
{
    protected ?string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.google.places_key') ?: env('GOOGLE_PLACES_API_KEY');
    }

    /**
     * Search places by query or location.
     */
    public function searchPlaces(string $query, ?float $latitude = null, ?float $longitude = null, int $radius = 5000): array
    {
        $cacheKey = 'gplaces_search_' . md5("{$query}_{$latitude}_{$longitude}_{$radius}");

        return Cache::remember($cacheKey, 1800, function () use ($query, $latitude, $longitude, $radius) {
            $startTime = microtime(true);
            $endpoint = '/maps/api/place/textsearch/json';

            if ($this->apiKey) {
                try {
                    $url = 'https://maps.googleapis.com' . $endpoint;
                    $params = [
                        'query' => $query,
                        'key' => $this->apiKey,
                    ];

                    if ($latitude && $longitude) {
                        $params['location'] = "{$latitude},{$longitude}";
                        $params['radius'] = $radius;
                    }

                    $response = Http::timeout(5)->get($url, $params);
                    $duration = microtime(true) - $startTime;

                    if ($response->successful()) {
                        $data = $response->json();
                        $results = [];

                        foreach ($data['results'] ?? [] as $place) {
                            $results[] = $this->normalizePlaceData($place);
                        }

                        ApiLoggerService::log('google_places', $endpoint, 'GET', ['query' => $query], 200, $results, $duration, true);

                        return [
                            'provider' => 'google_places',
                            'query' => $query,
                            'count' => count($results),
                            'results' => $results,
                        ];
                    }

                    ApiLoggerService::log('google_places', $endpoint, 'GET', ['query' => $query], $response->status(), null, $duration, false, $response->body());
                } catch (\Throwable $e) {
                    $duration = microtime(true) - $startTime;
                    ApiLoggerService::log('google_places', $endpoint, 'GET', ['query' => $query], 500, null, $duration, false, $e->getMessage());
                }
            }

            // Fallback: search our local locations database and normalize
            $dbLocations = Location::where('name', 'like', "%{$query}%")
                ->orWhere('address', 'like', "%{$query}%")
                ->limit(10)
                ->get();

            $fallbackResults = $dbLocations->map(fn ($loc) => [
                'id' => (string) $loc->id,
                'place_id' => $loc->place_id ?? 'local_' . $loc->id,
                'name' => $loc->name,
                'formatted_address' => $loc->address,
                'geometry' => [
                    'location' => [
                        'lat' => (float) $loc->latitude,
                        'lng' => (float) $loc->longitude,
                    ],
                ],
                'rating' => (float) ($loc->rating ?? 4.5),
                'user_ratings_total' => $loc->review_count,
                'types' => array_filter([$loc->category, $loc->subcategory]),
                'photos' => $loc->photos ?? [],
                'source' => 'local_catalog',
            ])->toArray();

            return [
                'provider' => 'local_fallback',
                'query' => $query,
                'count' => count($fallbackResults),
                'results' => $fallbackResults,
            ];
        });
    }

    /**
     * Get detailed place information by place_id.
     */
    public function getPlaceDetails(string $placeId): array
    {
        $cacheKey = 'gplaces_details_' . $placeId;

        return Cache::remember($cacheKey, 3600, function () use ($placeId) {
            $startTime = microtime(true);
            $endpoint = '/maps/api/place/details/json';

            if ($this->apiKey) {
                try {
                    $url = 'https://maps.googleapis.com' . $endpoint;
                    $params = [
                        'place_id' => $placeId,
                        'fields' => 'name,rating,formatted_phone_number,formatted_address,geometry,photos,reviews,opening_hours,website,types',
                        'key' => $this->apiKey,
                    ];

                    $response = Http::timeout(5)->get($url, $params);
                    $duration = microtime(true) - $startTime;

                    if ($response->successful()) {
                        $data = $response->json();
                        $result = $this->normalizePlaceData($data['result'] ?? []);

                        ApiLoggerService::log('google_places', $endpoint, 'GET', ['place_id' => $placeId], 200, $result, $duration, true);

                        return [
                            'provider' => 'google_places',
                            'place' => $result,
                        ];
                    }

                    ApiLoggerService::log('google_places', $endpoint, 'GET', ['place_id' => $placeId], $response->status(), null, $duration, false, $response->body());
                } catch (\Throwable $e) {
                    $duration = microtime(true) - $startTime;
                    ApiLoggerService::log('google_places', $endpoint, 'GET', ['place_id' => $placeId], 500, null, $duration, false, $e->getMessage());
                }
            }

            // Fallback: check our local database by place_id or id
            $local = Location::where('place_id', $placeId)
                ->orWhere('id', $placeId)
                ->first();

            if ($local) {
                return [
                    'provider' => 'local_catalog',
                    'place' => [
                        'id' => (string) $local->id,
                        'place_id' => $local->place_id ?? 'local_' . $local->id,
                        'name' => $local->name,
                        'formatted_address' => $local->address,
                        'formatted_phone_number' => $local->phone,
                        'website' => $local->website,
                        'geometry' => [
                            'location' => [
                                'lat' => (float) $local->latitude,
                                'lng' => (float) $local->longitude,
                            ],
                        ],
                        'rating' => (float) ($local->rating ?? 4.5),
                        'user_ratings_total' => $local->review_count,
                        'types' => array_filter([$local->category, $local->subcategory]),
                        'opening_hours' => $local->hours,
                        'photos' => $local->photos ?? [],
                        'reviews' => $local->reviews ?? [],
                    ],
                ];
            }

            return [
                'provider' => 'not_found',
                'place' => null,
            ];
        });
    }

    protected function normalizePlaceData(array $place): array
    {
        return [
            'place_id' => $place['place_id'] ?? null,
            'name' => $place['name'] ?? 'Unknown Place',
            'formatted_address' => $place['formatted_address'] ?? ($place['vicinity'] ?? null),
            'formatted_phone_number' => $place['formatted_phone_number'] ?? null,
            'website' => $place['website'] ?? null,
            'geometry' => [
                'location' => [
                    'lat' => $place['geometry']['location']['lat'] ?? null,
                    'lng' => $place['geometry']['location']['lng'] ?? null,
                ],
            ],
            'rating' => (float) ($place['rating'] ?? 0),
            'user_ratings_total' => $place['user_ratings_total'] ?? 0,
            'types' => $place['types'] ?? [],
            'opening_hours' => $place['opening_hours'] ?? null,
            'photos' => $place['photos'] ?? [],
            'reviews' => $place['reviews'] ?? [],
        ];
    }
}
