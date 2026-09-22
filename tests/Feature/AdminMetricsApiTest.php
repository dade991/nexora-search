<?php

use App\Models\ApiRequest;
use App\Models\Location;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('can retrieve admin observability metrics', function () {
    ApiRequest::create([
        'external_service' => 'weather_provider',
        'endpoint' => '/forecast',
        'method' => 'GET',
        'response_code' => 200,
        'response_time' => 0.085,
        'success' => true,
    ]);

    Location::create([
        'name' => 'Sample Spot',
        'address' => 'Sample Address',
        'latitude' => 12.9716,
        'longitude' => 77.5946,
        'category' => 'cafe',
    ]);

    $response = $this->getJson('/api/v1/admin/metrics');

    $response->assertOk()
        ->assertJsonStructure([
            'overview' => [
                'total_requests',
                'successful_requests',
                'failed_requests',
                'success_rate',
                'avg_response_time_ms',
                'total_locations',
                'total_users',
            ],
            'providers',
            'top_searches',
            'recent_errors',
            'system_health' => [
                'status',
                'database',
                'cache',
            ],
        ]);
});

test('can retrieve and clear admin telemetry logs', function () {
    ApiRequest::create([
        'external_service' => 'mapbox',
        'endpoint' => '/geocoding',
        'method' => 'GET',
        'response_code' => 200,
        'response_time' => 0.05,
        'success' => true,
    ]);

    $logsResponse = $this->getJson('/api/v1/admin/logs');
    $logsResponse->assertOk()
        ->assertJsonStructure(['data', 'total']);

    $clearResponse = $this->deleteJson('/api/v1/admin/logs');
    $clearResponse->assertOk()
        ->assertJson(['message' => 'Telemetry and audit logs cleared successfully']);

    expect(ApiRequest::count())->toBe(0);
});
