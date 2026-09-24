<?php

namespace App\Services;

use App\ExternalServiceUnavailableException;
use App\Models\Location;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class LocationSearchService
{
    public function __construct(private GeoapifyService $geoapify) {}

    /** @return array<string, mixed> */
    public function search(string $query, ?float $latitude, ?float $longitude, int $radius, ?string $category, int $limit): array
    {
        try {
            $provider = 'geoapify';
            $status = 'live';
            $message = null;
            $items = collect($this->geoapify->search($this->placeQuery($query, $category), $latitude, $longitude, $limit));
        } catch (ExternalServiceUnavailableException) {
            $local = $this->local($query, $latitude, $longitude, $radius, $category, $limit);
            if ($local->isNotEmpty()) {
                return $this->degradedResponse('database', $local);
            }

            try {
                $provider = 'openstreetmap';
                $status = 'degraded';
                $message = 'Geoapify is unavailable, so Nexora is showing backup OpenStreetMap results.';
                $items = $this->mapOpenStreetMapResults($query, $limit);
            } catch (ExternalServiceUnavailableException) {
                return $this->degradedResponse('unavailable', collect());
            }
        }

        if ($items->isEmpty()) {
            $local = $this->local($query, $latitude, $longitude, $radius, $category, $limit);
            if ($local->isNotEmpty()) {
                return $this->degradedResponse('database', $local);
            }

            try {
                $provider = 'openstreetmap';
                $status = 'degraded';
                $message = 'No Geoapify matches were found, so Nexora is showing backup OpenStreetMap results.';
                $items = $this->mapOpenStreetMapResults($query, $limit);
            } catch (ExternalServiceUnavailableException) {
                return $this->degradedResponse('unavailable', collect());
            }
        }
        $items = $items->filter(fn (array $place): bool => filled($place['name']) && filled($place['place_id'])
            && is_numeric($place['latitude']) && is_numeric($place['longitude']));
        if ($category !== null) {
            $items = $items->where('category', $category);
        }
        $items = $this->withinRadius($items, $latitude, $longitude, $radius)->take($limit);
        $results = $items->map(function (array $place) use ($provider): array {
            $distance = $place['distance_km'] ?? null;
            unset($place['distance_km']);
            $location = Location::updateOrCreate(
                ['place_id' => $place['place_id']],
                [...$place, 'external_source' => $provider],
            );

            return [...$location->toArray(), 'distance_km' => $distance];
        })->values();

        return [
            'provider' => $provider,
            'status' => $status,
            'message' => $message,
            'results' => $results,
            'count' => $results->count(),
        ];
    }

    /** @return Collection<int, array<string, mixed>> */
    public function suggestions(string $query, ?float $latitude, ?float $longitude, int $limit): Collection
    {
        try {
            return collect($this->geoapify->suggestions($query, $latitude, $longitude, $limit));
        } catch (ExternalServiceUnavailableException) {
            return $this->local($query, $latitude, $longitude, 50000, null, $limit);
        }
    }

    /** @return Collection<int, array<string, mixed>> */
    public function local(string $query, ?float $latitude, ?float $longitude, int $radius, ?string $category, int $limit): Collection
    {
        $locations = Location::query()->where(function ($builder) use ($query) {
            $builder->where('name', 'like', '%'.$query.'%')->orWhere('address', 'like', '%'.$query.'%');
        })->when($category, fn ($builder) => $builder->where('category', $category));
        if ($latitude !== null) {
            $delta = $radius / 111000;
            $locations->whereBetween('latitude', [$latitude - $delta, $latitude + $delta]);
        }

        return $this->withinRadius($locations->latest()->get()->map->toArray(), $latitude, $longitude, $radius)->take($limit)->values();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $places
     * @return Collection<int, array<string, mixed>>
     */
    private function withinRadius(Collection $places, ?float $latitude, ?float $longitude, int $radius): Collection
    {
        if ($latitude === null || $longitude === null) {
            return $places;
        }

        return $places->map(function (array $place) use ($latitude, $longitude): array {
            $a = sin(deg2rad($place['latitude'] - $latitude) / 2) ** 2
                + cos(deg2rad($latitude)) * cos(deg2rad($place['latitude']))
                * sin(deg2rad($place['longitude'] - $longitude) / 2) ** 2;
            $place['distance_km'] = 6371 * 2 * asin(sqrt(min(1, max(0, $a))));

            return $place;
        })->filter(fn (array $place): bool => $place['distance_km'] <= $radius / 1000)->sortBy('distance_km');
    }

    /** @return list<array<string, mixed>> */
    private function openStreetMap(string $query, int $limit): array
    {
        return Cache::remember('osm_search_v2_'.md5($query.'_'.$limit), 1800, function () use ($query, $limit): array {
            try {
                $response = Http::withHeaders(['User-Agent' => 'NexoraSearch/1.0', 'Accept-Language' => 'en'])
                    ->withOptions(['connect_timeout' => 0, 'timeout' => 0])
                    ->get('https://nominatim.openstreetmap.org/search', [
                        'q' => $query, 'format' => 'json', 'extratags' => 1, 'limit' => $limit,
                    ]);
            } catch (ConnectionException) {
                throw new ExternalServiceUnavailableException('openstreetmap', 'Location search is temporarily unreachable. Please try again.', 503);
            }
            if (! $response->successful() || ! is_array($response->json())) {
                throw new ExternalServiceUnavailableException('openstreetmap', 'Location search is temporarily unavailable.', 503);
            }

            return $response->json();
        });
    }

    /** @return Collection<int, array<string, mixed>> */
    private function mapOpenStreetMapResults(string $query, int $limit): Collection
    {
        return collect($this->openStreetMap($query, $limit))->map(fn (array $place): array => [
            'place_id' => 'osm_'.($place['osm_type'] ?? 'place').'_'.($place['osm_id'] ?? $place['place_id']),
            'external_id' => (string) ($place['osm_id'] ?? $place['place_id']),
            'name' => trim(explode(',', $place['display_name'] ?? '')[0]),
            'address' => $place['display_name'] ?? null,
            'latitude' => $place['lat'] ?? null, 'longitude' => $place['lon'] ?? null,
            'category' => $this->category([$place['type'] ?? $place['class'] ?? 'landmark']),
            'phone' => $place['extratags']['phone'] ?? null, 'website' => $place['extratags']['website'] ?? null,
            'rating' => null,
        ]);
    }

    private function placeQuery(string $query, ?string $category): string
    {
        return $category === null ? $query : $query.' '.$category;
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $results
     * @return array<string, mixed>
     */
    private function degradedResponse(string $provider, Collection $results): array
    {
        return [
            'provider' => $provider,
            'status' => 'degraded',
            'message' => 'Live place search is temporarily unavailable. Try again shortly.',
            'results' => $results->values(),
            'count' => $results->count(),
        ];
    }

    /** @param list<string> $types */
    private function category(array $types): string
    {
        foreach ($types as $type) {
            $category = match (strtolower(str_replace(' ', '_', $type))) {
                'restaurant', 'fast_food', 'bakery', 'pub', 'bar' => 'restaurant',
                'park', 'garden', 'forest', 'nature_reserve' => 'park',
                'museum', 'gallery', 'art_gallery', 'arts_centre' => 'museum',
                'cafe', 'coffee_shop' => 'cafe',
                'hotel', 'motel', 'guest_house', 'lodging' => 'hotel',
                default => null,
            };
            if ($category !== null) {
                return $category;
            }
        }

        return 'landmark';
    }
}
