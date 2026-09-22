<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('can query mapbox geocoding', function () {
    $response = $this->getJson('/api/v1/external/mapbox/geocoding/Paris');

    $response->assertOk()
        ->assertJsonStructure([
            'provider',
            'query',
            'results',
        ]);
});

test('can query mapbox directions', function () {
    $response = $this->getJson('/api/v1/external/mapbox/directions?start_lat=40.7128&start_lng=-74.0060&end_lat=40.7580&end_lng=-73.9855');

    $response->assertOk()
        ->assertJsonStructure([
            'provider',
            'distance_meters',
            'duration_seconds',
        ]);
});

test('can query google places search proxy', function () {
    $response = $this->getJson('/api/v1/external/google/places/search?query=cafe');

    $response->assertOk()
        ->assertJsonStructure([
            'provider',
            'query',
            'results',
        ]);
});

test('can query github developer profile and repo', function () {
    $userResponse = $this->getJson('/api/v1/external/github/users/taylorotwell');
    $userResponse->assertOk()
        ->assertJsonStructure([
            'provider',
            'user' => ['username', 'name'],
        ]);

    $repoResponse = $this->getJson('/api/v1/external/github/repos/laravel/laravel');
    $repoResponse->assertOk()
        ->assertJsonStructure([
            'provider',
            'repo' => ['name', 'full_name'],
        ]);
});

test('can query social endpoints', function () {
    $fbResponse = $this->getJson('/api/v1/external/social/facebook/centralpark');
    $fbResponse->assertOk()->assertJsonPath('provider', 'facebook');

    $igResponse = $this->getJson('/api/v1/external/social/instagram/centralpark');
    $igResponse->assertOk()->assertJsonPath('provider', 'instagram');

    $twResponse = $this->getJson('/api/v1/external/social/twitter/centralpark');
    $twResponse->assertOk()->assertJsonPath('provider', 'twitter');
});
