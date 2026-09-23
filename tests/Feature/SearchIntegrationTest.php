<?php

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Cache::forget('provider_circuit:searchapi');
    Cache::forget('provider_circuit:openstreetmap');
});

test('SearchApi Google Maps results have database ids that can be saved and opened', function () {
    config()->set('services.searchapi.key', 'test-key');
    Http::preventStrayRequests();
    Http::fake(['www.searchapi.io/api/v1/search*' => Http::response([
        'local_results' => [[
            'place_id' => 'searchapi-museum', 'title' => 'City Museum',
            'address' => 'Museum Road', 'gps_coordinates' => ['latitude' => 6.45, 'longitude' => 3.4],
            'type' => 'museum',
        ]],
    ])]);
    $user = User::factory()->create();
    $token = $user->createToken('search-test')->plainTextToken;

    $response = $this->withToken($token)->getJson('/api/v1/search?query=museum&category=museum');

    $response->assertOk()->assertJsonPath('provider', 'searchapi_google_maps')->assertJsonPath('count', 1)
        ->assertJsonPath('results.0.name', 'City Museum')->assertJsonPath('results.0.rating', null);
    $id = $response->json('results.0.id');
    $this->assertDatabaseHas('locations', ['id' => $id, 'external_source' => 'searchapi_google_maps', 'place_id' => 'searchapi-museum']);
    $this->assertDatabaseHas('search_history', ['user_id' => $user->id, 'query' => 'museum', 'results_count' => 1]);
    $this->postJson('/api/v1/favorites', ['location_id' => $id])->assertCreated();
    $this->getJson('/api/v1/places/'.$id)->assertOk()->assertJsonPath('data.name', 'City Museum');
    Http::assertSent(fn ($request) => $request['engine'] === 'google_maps' && $request['q'] === 'museum museum');
});

test('SearchApi empty local results use the backup provider', function () {
    config()->set('services.searchapi.key', 'test-key');
    Http::preventStrayRequests();
    Http::fake([
        'www.searchapi.io/api/v1/search*' => Http::response([]),
        'nominatim.openstreetmap.org/*' => Http::response([]),
    ]);
    $this->getJson('/api/v1/search?query=unmatched')->assertOk()
        ->assertJsonPath('provider', 'openstreetmap')
        ->assertJsonPath('count', 0)
        ->assertJsonPath('results', []);
    Http::assertSentCount(2);
});

test('SearchApi rejection degrades without a second network wait or exposing credentials', function () {
    config()->set('services.searchapi.key', 'test-key');
    Http::preventStrayRequests();
    Http::fake([
        'www.searchapi.io/api/v1/search*' => Http::response(['error' => ['message' => 'test-key denied']], 403),
    ]);
    $this->getJson('/api/v1/search?query=museum')->assertOk()->assertJsonPath('provider', 'unavailable')
        ->assertDontSee('test-key');
    Http::assertSentCount(1);
});

test('coordinate filtering accepts zero coordinates and works on sqlite', function () {
    config()->set('services.searchapi.key', null);
    Http::preventStrayRequests();
    Http::fake(['nominatim.openstreetmap.org/*' => Http::response([
        ['place_id' => 99, 'osm_id' => 10, 'osm_type' => 'node', 'display_name' => 'Equator Park', 'lat' => '0', 'lon' => '0.001', 'type' => 'park'],
        ['place_id' => 100, 'osm_id' => 11, 'osm_type' => 'node', 'display_name' => 'Distant Park', 'lat' => '20', 'lon' => '20', 'type' => 'park'],
    ])]);
    $this->getJson('/api/v1/search?query=park&latitude=0&longitude=0&radius=1000')->assertOk()
        ->assertJsonPath('count', 1)->assertJsonPath('results.0.name', 'Equator Park');
    Http::assertSentCount(1);
});

test('search rejects incomplete or invalid coordinates', function () {
    Http::preventStrayRequests();
    $this->getJson('/api/v1/search?query=park&latitude=91')->assertUnprocessable()->assertJsonValidationErrors(['latitude', 'longitude']);
    Http::assertNothingSent();
});

test('both history endpoints return only the authenticated users records', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $user->searchHistory()->create(['query' => 'My search']);
    $other->searchHistory()->create(['query' => 'Private search']);
    $this->actingAs($user, 'sanctum');
    foreach (['/api/v1/history', '/api/v1/search/history'] as $endpoint) {
        $this->getJson($endpoint)->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.query', 'My search');
    }
});
