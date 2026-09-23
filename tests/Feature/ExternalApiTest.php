<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    Http::preventStrayRequests();
    Http::fake(['api.github.com/*' => Http::failedConnection()]);
});

test('returns real data or a clean unavailable response for mapbox', function () {
    config()->set('services.mapbox.key', null);

    $response = $this->getJson('/api/v1/external/mapbox/geocoding/Paris');

    $this->assertTrue(in_array($response->status(), [200, 503], true));

    if ($response->status() === 503) {
        $response->assertJsonStructure([
            'message',
            'provider',
        ]);

        return;
    }

    $response->assertJsonStructure([
        'provider',
        'query',
        'results',
    ]);
});

test('returns real data or a clean unavailable response for mapbox directions', function () {
    config()->set('services.mapbox.key', null);

    $response = $this->getJson('/api/v1/external/mapbox/directions?start_lat=40.7128&start_lng=-74.0060&end_lat=40.7580&end_lng=-73.9855');

    $this->assertTrue(in_array($response->status(), [200, 503], true));

    if ($response->status() === 503) {
        $response->assertJsonStructure([
            'message',
            'provider',
        ]);

        return;
    }

    $response->assertJsonStructure([
        'provider',
        'distance_meters',
        'duration_seconds',
    ]);
});

test('returns real data or a clean unavailable response for github', function () {
    config()->set('services.github.token', null);

    $userResponse = $this->getJson('/api/v1/external/github/users/taylorotwell');
    $this->assertTrue(in_array($userResponse->status(), [200, 503], true));

    if ($userResponse->status() === 503) {
        $userResponse->assertJsonStructure([
            'message',
            'provider',
        ]);
    } else {
        $userResponse->assertJsonStructure([
            'provider',
            'user' => ['username', 'name'],
        ]);
    }

    $repoResponse = $this->getJson('/api/v1/external/github/repos/laravel/laravel');
    $this->assertTrue(in_array($repoResponse->status(), [200, 503], true));

    if ($repoResponse->status() === 503) {
        $repoResponse->assertJsonStructure([
            'message',
            'provider',
        ]);

        return;
    }

    $repoResponse->assertJsonStructure([
        'provider',
        'repo' => ['name', 'full_name'],
    ]);
});
