<?php

use App\Models\Location;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config()->set('services.searchapi.key', null);
    Cache::forget('provider_circuit:searchapi');
    Cache::forget('provider_circuit:openstreetmap');
    Http::preventStrayRequests();
});

uses(RefreshDatabase::class);

test('can search locations by query string', function () {
    Location::create([
        'name' => 'Central Park West',
        'address' => 'New York, NY',
        'latitude' => 40.785091,
        'longitude' => -73.968285,
        'category' => 'park',
        'rating' => '4.8',
    ]);

    Location::create([
        'name' => 'Eiffel Tower',
        'address' => 'Paris, France',
        'latitude' => 48.858370,
        'longitude' => 2.294481,
        'category' => 'landmark',
        'rating' => '4.7',
    ]);

    $response = $this->getJson('/api/v1/search?query=Central');

    $response->assertOk()
        ->assertJsonPath('query', 'Central')
        ->assertJsonPath('count', 1);
});

test('can get search suggestions', function () {
    Location::create([
        'name' => 'Times Square',
        'address' => 'Broadway, New York',
        'latitude' => 40.758896,
        'longitude' => -73.985130,
        'category' => 'landmark',
    ]);

    $response = $this->getJson('/api/v1/search/suggestions?query=Times');

    $response->assertOk()
        ->assertJsonStructure([
            'query',
            'suggestions' => [
                '*' => ['id', 'name', 'address', 'latitude', 'longitude'],
            ],
        ]);
});

test('records search history for authenticated users', function () {
    Http::preventStrayRequests();
    Http::fake(['nominatim.openstreetmap.org/*' => Http::response([])]);
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/search?query=Museums')->assertOk();

    $this->assertDatabaseHas('search_history', [
        'user_id' => $user->id,
        'query' => 'Museums',
    ]);
});

test('does not record search history when the user disables it', function () {
    $user = User::factory()->create([
        'preferences' => ['search' => ['save_history' => false]],
    ]);
    Location::create([
        'name' => 'Private Search Cafe',
        'address' => 'Lagos',
        'latitude' => 6.5244,
        'longitude' => 3.3792,
        'category' => 'cafe',
    ]);

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/search?query=Private%20Search')->assertOk();

    $this->assertDatabaseMissing('search_history', [
        'user_id' => $user->id,
        'query' => 'Private Search',
    ]);
});

test('uses SearchApi Google Maps results and keeps only places within the requested radius', function () {
    config()->set('services.searchapi.key', 'searchapi-test-key');
    Http::fake([
        'https://www.searchapi.io/api/v1/search*' => Http::response([
            'local_results' => [
                [
                    'place_id' => 'nearby-cafe',
                    'title' => 'Nearby Cafe',
                    'address' => 'Central Abuja',
                    'type' => 'Coffee shop',
                    'rating' => 4.6,
                    'reviews' => 120,
                    'thumbnail' => 'https://example.com/nearby.jpg',
                    'gps_coordinates' => ['latitude' => 9.08, 'longitude' => 7.40],
                ],
                [
                    'place_id' => 'far-cafe',
                    'title' => 'Far Cafe',
                    'address' => 'Outside Abuja',
                    'type' => 'Coffee shop',
                    'gps_coordinates' => ['latitude' => 9.30, 'longitude' => 7.60],
                ],
            ],
        ]),
    ]);

    $response = $this->getJson('/api/v1/search?query=cafe&latitude=9.0765&longitude=7.3986&radius=10000');

    $response->assertOk()
        ->assertJsonPath('provider', 'searchapi_google_maps')
        ->assertJsonPath('count', 1)
        ->assertJsonPath('results.0.name', 'Nearby Cafe')
        ->assertJsonPath('results.0.photos.0', 'https://example.com/nearby.jpg')
        ->assertJsonPath('results.0.distance_km', fn (float|int $distance): bool => $distance < 1);

    Http::assertSent(fn ($request): bool => parse_url($request->url(), PHP_URL_PATH) === '/api/v1/search'
        && $request['engine'] === 'google_maps'
        && $request['q'] === 'cafe'
        && $request['ll'] === '@9.0765,7.3986,10000m'
        && $request['api_key'] === 'searchapi-test-key');
});

test('falls back when SearchApi returns no places', function () {
    config()->set('services.searchapi.key', 'searchapi-test-key');
    Http::fake([
        'https://www.searchapi.io/api/v1/search*' => Http::response(['local_results' => []]),
        'https://nominatim.openstreetmap.org/*' => Http::response([[
            'osm_type' => 'node',
            'osm_id' => 456,
            'display_name' => 'Freedom Park, Lagos, Nigeria',
            'lat' => '6.4499',
            'lon' => '3.3958',
            'type' => 'park',
        ]]),
    ]);

    $this->getJson('/api/v1/search?query=Freedom%20Park')
        ->assertOk()
        ->assertJsonPath('provider', 'openstreetmap')
        ->assertJsonPath('results.0.name', 'Freedom Park');
});

test('falls back to OpenStreetMap when SearchApi returns no matches', function () {
    config()->set('services.searchapi.key', 'configured');
    Http::fake([
        'https://www.searchapi.io/api/v1/search*' => Http::response(['local_results' => []]),
        'https://nominatim.openstreetmap.org/*' => Http::response([[
            'osm_type' => 'node',
            'osm_id' => 123,
            'display_name' => 'Museum Island, Berlin, Germany',
            'lat' => '52.5169',
            'lon' => '13.4010',
            'type' => 'museum',
        ]]),
    ]);

    $response = $this->getJson('/api/v1/search?query=Museum');

    $response->assertOk()
        ->assertJsonPath('provider', 'openstreetmap')
        ->assertJsonPath('results.0.name', 'Museum Island');
});

test('returns stored matching places without waiting for the primary provider', function () {
    config()->set('services.searchapi.key', 'configured-but-unavailable');
    Location::create([
        'name' => 'Stored Cafe',
        'address' => 'Central Abuja',
        'latitude' => 9.0765,
        'longitude' => 7.3986,
        'category' => 'cafe',
    ]);
    Http::fake([
        'https://www.searchapi.io/api/v1/search*' => Http::failedConnection(),
    ]);

    $response = $this->getJson('/api/v1/search?query=cafe&latitude=9.0765&longitude=7.3986&radius=10000');

    $response->assertOk()
        ->assertJsonPath('status', 'cached')
        ->assertJsonPath('results.0.name', 'Stored Cafe')
        ->assertDontSee('cURL');

    Http::assertNothingSent();
});

test('temporarily skips providers after connection failures', function () {
    config()->set('services.searchapi.key', 'configured-but-unavailable');
    Http::fake([
        'https://www.searchapi.io/api/v1/search*' => Http::failedConnection(),
        'https://nominatim.openstreetmap.org/*' => Http::failedConnection(),
    ]);

    $this->getJson('/api/v1/search?query=first-unavailable')->assertOk();
    Http::assertSentCount(2);

    $this->getJson('/api/v1/search?query=second-unavailable')->assertOk()
        ->assertJsonPath('provider', 'unavailable');
    Http::assertSentCount(2);
});

test('returns a friendly degraded response when all place providers are unavailable', function () {
    config()->set('services.searchapi.key', 'configured-but-unavailable');
    Http::fake([
        'https://www.searchapi.io/api/v1/search*' => Http::failedConnection(),
        'https://nominatim.openstreetmap.org/*' => Http::failedConnection(),
    ]);

    $response = $this->getJson('/api/v1/search?query=nowhere-unique');

    $response->assertOk()
        ->assertJsonPath('status', 'degraded')
        ->assertJsonPath('results', [])
        ->assertJsonPath('message', 'Live place search is temporarily unavailable. Try again shortly.')
        ->assertDontSee('cURL');
});

test('records SearchApi connection failures for troubleshooting', function () {
    config()->set('services.searchapi.key', 'configured-but-unavailable');
    Http::fake([
        'https://www.searchapi.io/api/v1/search*' => Http::failedConnection('SearchApi connection timed out'),
    ]);

    $this->getJson('/api/v1/search?query=connection-failure')
        ->assertOk()
        ->assertJsonPath('provider', 'unavailable');

    $this->assertDatabaseHas('api_requests', [
        'external_service' => 'searchapi',
        'endpoint' => '/search',
        'response_code' => 503,
        'success' => false,
        'error_message' => 'SearchApi connection timed out',
    ]);
    $this->assertDatabaseHas('failed_requests', [
        'external_service' => 'searchapi',
        'endpoint' => '/search',
        'response_code' => 503,
        'error_message' => 'SearchApi connection timed out',
    ]);
});

test('recovers from a transient SearchApi server failure', function () {
    config()->set('services.searchapi.key', 'test-key');
    $attempts = 0;
    Http::fake(function ($request) use (&$attempts) {
        if (str_contains($request->url(), 'searchapi.io')) {
            $attempts++;

            return $attempts === 1
                ? Http::response(['error' => 'busy'], 503)
                : Http::response(['local_results' => [[
                    'place_id' => 'recovered-cafe',
                    'title' => 'Recovered Cafe',
                    'address' => 'Lagos',
                    'type' => 'Coffee shop',
                    'gps_coordinates' => ['latitude' => 6.5244, 'longitude' => 3.3792],
                ]]]);
        }

        return Http::response([]);
    });

    $response = $this->getJson('/api/v1/search?query=retry-cafe');

    $response->assertOk()
        ->assertJsonPath('status', 'live')
        ->assertJsonPath('provider', 'searchapi_google_maps')
        ->assertJsonPath('results.0.name', 'Recovered Cafe');
    expect($attempts)->toBe(2);
});
