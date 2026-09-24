<?php

use App\Models\Location;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config()->set('services.geoapify.key', 'geoapify-test-key');
    config()->set('services.geoapify.base_url', 'https://api.geoapify.com');
    Http::preventStrayRequests();
});

it('returns fresh global place results from Geoapify instead of stale local matches', function () {
    Location::create([
        'place_id' => 'stale-local-place', 'name' => 'National Museum', 'address' => 'Old address',
        'latitude' => 6.4, 'longitude' => 3.3, 'category' => 'museum',
    ]);
    Http::fake([
        'api.geoapify.com/v1/geocode/search*' => Http::response(['results' => [[
            'place_id' => 'geoapify-museum-place', 'name' => 'National Museum Lagos',
            'formatted' => 'Onikan Road, Lagos, Nigeria', 'lat' => 6.4441, 'lon' => 3.4032,
            'category' => 'entertainment.museum',
            'datasource' => ['sourcename' => 'openstreetmap', 'attribution' => '© OpenStreetMap contributors', 'raw' => [
                'phone' => '+234 1 234 5678', 'website' => 'https://museum.example',
                'opening_hours' => 'Mo-Fr 09:00-17:00',
            ]],
            'rank' => ['popularity' => 6.8],
        ]]]),
    ]);

    $response = $this->getJson('/api/v1/search?query=National%20Museum');

    $response->assertOk()
        ->assertJsonPath('provider', 'geoapify')
        ->assertJsonPath('status', 'live')
        ->assertJsonPath('results.0.name', 'National Museum Lagos')
        ->assertJsonPath('results.0.category', 'museum')
        ->assertJsonPath('results.0.phone', '+234 1 234 5678')
        ->assertJsonPath('results.0.hours.display', 'Mo-Fr 09:00-17:00');
    $this->assertDatabaseHas('locations', ['place_id' => 'geoapify-museum-place', 'external_source' => 'geoapify']);
    Http::assertSent(fn ($request): bool => $request->url() === 'https://api.geoapify.com/v1/geocode/search?text=National%20Museum&format=json&limit=20&apiKey=geoapify-test-key');
});

it('retries a transient Geoapify connection timeout before degrading', function () {
    Http::fake([
        'api.geoapify.com/v1/geocode/search*' => Http::sequence()
            ->pushFailedConnection('Geoapify timed out')
            ->push(['results' => [[
                'place_id' => 'jamaica-country', 'name' => 'Jamaica',
                'formatted' => 'Jamaica', 'lat' => 18.1096, 'lon' => -77.2975,
                'category' => 'administrative.country', 'datasource' => ['raw' => []],
            ]]]),
    ]);

    $this->getJson('/api/v1/search?query=Jamaica')
        ->assertOk()
        ->assertJsonPath('provider', 'geoapify')
        ->assertJsonPath('status', 'live')
        ->assertJsonPath('results.0.name', 'Jamaica');

    Http::assertSentCount(2);
});

it('biases Geoapify searches toward supplied coordinates and filters the response radius', function () {
    Http::fake([
        'api.geoapify.com/v1/geocode/search*' => Http::response(['results' => [
            ['place_id' => 'nearby-cafe', 'name' => 'Nearby Cafe', 'formatted' => 'Central Abuja', 'lat' => 9.08, 'lon' => 7.40, 'category' => 'catering.cafe', 'datasource' => ['raw' => []]],
            ['place_id' => 'far-cafe', 'name' => 'Far Cafe', 'formatted' => 'Outside Abuja', 'lat' => 9.30, 'lon' => 7.60, 'category' => 'catering.cafe', 'datasource' => ['raw' => []]],
        ]]),
    ]);

    $response = $this->getJson('/api/v1/search?query=cafe&latitude=9.0765&longitude=7.3986&radius=10000');

    $response->assertOk()
        ->assertJsonPath('count', 1)
        ->assertJsonPath('results.0.name', 'Nearby Cafe')
        ->assertJsonPath('results.0.distance_km', fn (float|int $distance): bool => $distance < 1);
    Http::assertSent(fn ($request): bool => $request['bias'] === 'proximity:7.3986,9.0765');
});

it('returns live Geoapify autocomplete suggestions', function () {
    Http::fake([
        'api.geoapify.com/v1/geocode/autocomplete*' => Http::response(['results' => [[
            'place_id' => 'eiffel-tower', 'name' => 'Eiffel Tower',
            'formatted' => '5 Avenue Anatole France, Paris, France',
            'lat' => 48.85837, 'lon' => 2.294481, 'category' => 'tourism.sights',
            'datasource' => ['raw' => []],
        ]]]),
    ]);

    $this->getJson('/api/v1/search/suggestions?query=Eiffel')
        ->assertOk()
        ->assertJsonPath('suggestions.0.name', 'Eiffel Tower')
        ->assertJsonPath('suggestions.0.latitude', 48.85837);
});

it('returns cached local results when Geoapify is unavailable', function () {
    Location::create([
        'place_id' => 'cached-park', 'name' => 'Freedom Park', 'address' => 'Lagos, Nigeria',
        'latitude' => 6.4499, 'longitude' => 3.3958, 'category' => 'park',
    ]);
    Http::fake(['api.geoapify.com/*' => Http::failedConnection('Geoapify timed out')]);

    $this->getJson('/api/v1/search?query=Freedom%20Park')
        ->assertOk()
        ->assertJsonPath('provider', 'database')
        ->assertJsonPath('status', 'degraded')
        ->assertJsonPath('results.0.name', 'Freedom Park');
});
