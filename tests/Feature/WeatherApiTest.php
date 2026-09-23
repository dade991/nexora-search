<?php

use App\ExternalServiceUnavailableException;
use App\Services\WeatherService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    Http::preventStrayRequests();
    Http::fake([
        'api.open-meteo.com/*' => Http::response([
            'timezone' => 'UTC',
            'current' => ['temperature_2m' => 21, 'weather_code' => 3],
            'daily' => ['time' => ['2026-09-22'], 'temperature_2m_max' => [24], 'temperature_2m_min' => [18], 'weather_code' => [3]],
        ]),
        'archive-api.open-meteo.com/*' => Http::response([
            'daily' => ['time' => ['2026-09-21'], 'temperature_2m_mean' => [20]],
        ]),
    ]);
});

test('can retrieve current weather for coordinates', function () {
    $response = $this->getJson('/api/v1/weather/current?latitude=40.7128&longitude=-74.0060');

    $response->assertOk()
        ->assertJsonStructure([
            'source',
            'location' => ['latitude', 'longitude'],
            'temperature',
            'condition',
        ]);
});

test('can retrieve weather forecast', function () {
    $response = $this->getJson('/api/v1/weather/forecast?latitude=51.5074&longitude=-0.1278&days=5');

    $response->assertOk()
        ->assertJsonStructure([
            'source',
            'forecasts',
        ]);
});

test('returns a successful degraded forecast when the weather provider is unavailable', function () {
    $this->mock(WeatherService::class)
        ->shouldReceive('getForecast')
        ->once()
        ->andThrow(new ExternalServiceUnavailableException('open_meteo', 'upstream unavailable', 502));

    $this->getJson('/api/v1/weather/forecast?latitude=8.8483332&longitude=7.9081207&days=5')
        ->assertOk()
        ->assertJsonPath('source', 'unavailable')
        ->assertJsonPath('status', 'degraded')
        ->assertJsonPath('forecasts', [])
        ->assertDontSee('upstream unavailable');
});

test('can retrieve historical weather', function () {
    $response = $this->getJson('/api/v1/weather/historical?latitude=48.8566&longitude=2.3522');

    $response->assertOk()
        ->assertJsonStructure([
            'source',
            'history',
        ]);
});
