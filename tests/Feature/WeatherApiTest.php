<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

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

test('can retrieve historical weather', function () {
    $response = $this->getJson('/api/v1/weather/historical?latitude=48.8566&longitude=2.3522');

    $response->assertOk()
        ->assertJsonStructure([
            'source',
            'history',
        ]);
});
