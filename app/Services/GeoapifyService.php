<?php

namespace App\Services;

use App\ExternalServiceUnavailableException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class GeoapifyService
{
    private const NEARBY_CATEGORIES = 'accommodation,catering,commercial,entertainment,leisure,tourism';

    /** @return array<int, array<string, mixed>> */
    public function search(string $query, ?float $latitude, ?float $longitude, int $limit): array
    {
        $parameters = [
            'text' => $query,
            'format' => 'json',
            'limit' => min($limit, 20),
            'apiKey' => $this->key(),
        ];

        if ($latitude !== null && $longitude !== null) {
            $parameters['bias'] = "proximity:{$longitude},{$latitude}";
        }

        return $this->places('/v1/geocode/search', $parameters, 'geoapify_search_v1_');
    }

    /** @return array<int, array<string, mixed>> */
    public function suggestions(string $query, ?float $latitude, ?float $longitude, int $limit): array
    {
        $parameters = [
            'text' => $query,
            'format' => 'json',
            'limit' => min($limit, 10),
            'apiKey' => $this->key(),
        ];

        if ($latitude !== null && $longitude !== null) {
            $parameters['bias'] = "proximity:{$longitude},{$latitude}";
        }

        return $this->places('/v1/geocode/autocomplete', $parameters, 'geoapify_suggestions_v1_');
    }

    /** @return array<int, array<string, mixed>> */
    public function nearby(?float $latitude, ?float $longitude, int $radius, ?string $category, int $limit): array
    {
        if ($latitude === null || $longitude === null) {
            return [];
        }

        $parameters = [
            'categories' => $this->nearbyCategories($category),
            'filter' => "circle:{$longitude},{$latitude},{$radius}",
            'bias' => "proximity:{$longitude},{$latitude}",
            'limit' => min($limit, 20),
            'apiKey' => $this->key(),
        ];

        return $this->places('/v2/places', $parameters, 'geoapify_nearby_v1_', true);
    }

    /**
     * @param  array<string, mixed>  $parameters
     * @return array<int, array<string, mixed>>
     */
    private function places(string $endpoint, array $parameters, string $cachePrefix, bool $geoJson = false): array
    {
        $cacheKey = $cachePrefix.md5((string) json_encode($parameters));

        return Cache::remember($cacheKey, now()->addMinutes(30), function () use ($endpoint, $parameters, $geoJson): array {
            $startedAt = microtime(true);

            try {
                $response = Http::acceptJson()
                    ->connectTimeout(5)
                    ->timeout(12)
                    ->retry(
                        [200, 500],
                        0,
                        fn (Throwable $exception): bool => $exception instanceof ConnectionException
                            || ($exception instanceof RequestException
                                && ($exception->response->serverError() || $exception->response->status() === 429)),
                        false,
                    )
                    ->get(config('services.geoapify.base_url').$endpoint, $parameters);
            } catch (ConnectionException $exception) {
                ApiLoggerService::log('geoapify', $endpoint, 'GET', Arr::except($parameters, ['apiKey']), 503, null, microtime(true) - $startedAt, false, $exception->getMessage());

                throw new ExternalServiceUnavailableException('geoapify', 'Live place search is temporarily unreachable.', 503);
            }

            ApiLoggerService::log('geoapify', $endpoint, 'GET', Arr::except($parameters, ['apiKey']), $response->status(), null, microtime(true) - $startedAt, $response->successful());

            $results = $response->json($geoJson ? 'features' : 'results');
            if (! $response->successful() || ! is_array($results)) {
                throw new ExternalServiceUnavailableException('geoapify', 'Live place search is temporarily unavailable.', 503);
            }

            return collect($results)
                ->map(fn (array $result): ?array => $this->normalize($geoJson ? ($result['properties'] ?? []) : $result))
                ->filter()
                ->values()
                ->all();
        });
    }

    /**
     * @param  array<string, mixed>  $result
     * @return array<string, mixed>|null
     */
    private function normalize(array $result): ?array
    {
        if (blank($result['place_id'] ?? null) || ! is_numeric($result['lat'] ?? null) || ! is_numeric($result['lon'] ?? null)) {
            return null;
        }

        $raw = $result['datasource']['raw'] ?? [];
        $category = (string) ($result['category'] ?? data_get($result, 'categories.0') ?? $result['result_type'] ?? 'landmark');

        return [
            'place_id' => (string) $result['place_id'],
            'external_id' => (string) $result['place_id'],
            'name' => $result['name'] ?? $result['address_line1'] ?? $result['formatted'] ?? 'Unnamed place',
            'address' => $result['formatted'] ?? $result['address_line2'] ?? null,
            'latitude' => (float) $result['lat'],
            'longitude' => (float) $result['lon'],
            'category' => $this->category($category),
            'subcategory' => $category,
            'phone' => $raw['phone'] ?? $raw['contact:phone'] ?? null,
            'website' => $raw['website'] ?? $raw['contact:website'] ?? null,
            'rating' => null,
            'review_count' => 0,
            'hours' => filled($raw['opening_hours'] ?? null) ? ['display' => $raw['opening_hours']] : null,
            'photos' => [],
            'reviews' => [],
            'data' => [
                'country' => $result['country'] ?? null,
                'city' => $result['city'] ?? null,
                'timezone' => data_get($result, 'timezone.name'),
                'attribution' => data_get($result, 'datasource.attribution'),
                'popularity' => data_get($result, 'rank.popularity'),
            ],
        ];
    }

    private function category(string $category): string
    {
        return match (true) {
            Str::contains($category, ['cafe', 'coffee']) => 'cafe',
            Str::contains($category, ['restaurant', 'catering', 'food', 'bar', 'pub']) => 'restaurant',
            Str::contains($category, ['park', 'garden', 'forest', 'nature']) => 'park',
            Str::contains($category, ['museum', 'gallery', 'arts']) => 'museum',
            Str::contains($category, ['hotel', 'motel', 'accommodation', 'lodging']) => 'hotel',
            default => 'landmark',
        };
    }

    private function nearbyCategories(?string $category): string
    {
        return match ($category) {
            'restaurant' => 'catering.restaurant',
            'cafe' => 'catering.cafe',
            'park' => 'leisure.park',
            'museum' => 'entertainment.museum',
            'hotel' => 'accommodation.hotel',
            'landmark' => 'tourism.sights,building.historic',
            default => self::NEARBY_CATEGORIES,
        };
    }

    private function key(): string
    {
        $key = config('services.geoapify.key');
        if (blank($key)) {
            throw new ExternalServiceUnavailableException('geoapify', 'Geoapify is not configured.', 503);
        }

        return $key;
    }
}
