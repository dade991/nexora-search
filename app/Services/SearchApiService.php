<?php

namespace App\Services;

use App\ExternalServiceUnavailableException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class SearchApiService
{
    public function searchPlaces(string $query, ?float $latitude = null, ?float $longitude = null, int $radius = 5000, ?string $category = null, int $limit = 20): array
    {
        $parameters = $this->parameters($query, $latitude, $longitude, $radius, $category, $limit);
        $freshKey = $this->cacheKey('searchapi_places_v2_', $parameters);

        if (Cache::has($freshKey)) {
            return [...Cache::get($freshKey), 'status' => 'cached'];
        }

        $data = $this->request($parameters);
        $results = array_map($this->normalizePlaceData(...), array_slice($data['local_results'] ?? [], 0, $parameters['num']));
        $normalized = ['provider' => 'searchapi_google_maps', 'query' => $query, 'count' => count($results), 'results' => $results];

        Cache::put($freshKey, $normalized, 1800);
        Cache::put($this->cacheKey('searchapi_places_stale_v2_', $parameters), $normalized, now()->addDays(7));

        return [...$normalized, 'status' => 'live'];
    }

    public function stalePlaces(string $query, ?float $latitude = null, ?float $longitude = null, int $radius = 5000, ?string $category = null, int $limit = 20): ?array
    {
        $parameters = $this->parameters($query, $latitude, $longitude, $radius, $category, $limit);

        return Cache::get($this->cacheKey('searchapi_places_stale_v2_', $parameters));
    }

    private function request(array $parameters): array
    {
        $key = config('services.searchapi.key');
        if (blank($key)) {
            throw new ExternalServiceUnavailableException('searchapi', 'SearchApi is not configured.', 503);
        }

        $start = microtime(true);
        try {
            $response = Http::acceptJson()
                ->withOptions(['connect_timeout' => 0, 'timeout' => 0])
                ->get(config('services.searchapi.base_url').'/search', [...$parameters, 'api_key' => $key]);
        } catch (ConnectionException $exception) {
            ApiLoggerService::log(
                'searchapi',
                '/search',
                'GET',
                $parameters,
                503,
                null,
                microtime(true) - $start,
                false,
                $exception->getMessage(),
            );
            throw new ExternalServiceUnavailableException('searchapi', 'SearchApi is temporarily unreachable. Please try again.', 503);
        }

        ApiLoggerService::log('searchapi', '/search', 'GET', $parameters, $response->status(), null, microtime(true) - $start, $response->successful());

        if (! $response->successful() || ! is_array($response->json())) {
            throw new ExternalServiceUnavailableException('searchapi', 'SearchApi could not complete the places search. Please try again later.', 503);
        }

        return $response->json();
    }

    private function placeQuery(string $query, ?string $category): string
    {
        return $category === null ? $query : $query.' '.$category;
    }

    private function parameters(string $query, ?float $latitude, ?float $longitude, int $radius, ?string $category, int $limit): array
    {
        $parameters = [
            'engine' => 'google_maps',
            'q' => $this->placeQuery($query, $category),
            'num' => min($limit, 20),
            'hl' => 'en',
        ];

        if ($latitude !== null && $longitude !== null) {
            $radius = min(max($radius, 62), 18636559);
            $parameters['ll'] = '@'.$latitude.','.$longitude.','.$radius.'m';
        }

        return $parameters;
    }

    private function cacheKey(string $prefix, array $parameters): string
    {
        return $prefix.md5((string) json_encode($parameters));
    }

    private function normalizePlaceData(array $place): array
    {
        $coordinates = $place['gps_coordinates'] ?? [];
        $photos = collect($place['images'] ?? [])
            ->map(fn (array|string $image): ?string => is_array($image) ? ($image['thumbnail'] ?? $image['image'] ?? null) : $image)
            ->when(filled($place['thumbnail'] ?? null), fn ($items) => $items->prepend($place['thumbnail']))
            ->filter()
            ->unique()
            ->values()
            ->all();

        return [
            'place_id' => $place['place_id'] ?? 'searchapi_'.md5(($place['title'] ?? '').($place['address'] ?? '')),
            'formatted_address' => $place['address'] ?? null,
            'formatted_phone_number' => $place['phone'] ?? null,
            'website' => $place['website'] ?? null,
            'name' => $place['title'] ?? null,
            'geometry' => [
                'location' => [
                    'lat' => $coordinates['latitude'] ?? null,
                    'lng' => $coordinates['longitude'] ?? null,
                ],
            ],
            'rating' => $place['rating'] ?? null,
            'user_ratings_total' => $place['reviews'] ?? 0,
            'types' => filled($place['type'] ?? null) ? [$place['type']] : [],
            'photos' => $photos,
            'reviews' => [],
            'opening_hours' => null,
        ];
    }
}
