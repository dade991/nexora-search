<?php

use App\Models\Location;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config()->set('services.searchapi.key', null);
    config()->set('services.geoapify.key', null);
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
