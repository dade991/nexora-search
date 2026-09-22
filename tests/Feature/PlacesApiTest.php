<?php

use App\Models\Location;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('can list places with pagination', function () {
    Location::create([
        'name' => 'Place Alpha',
        'address' => '123 Main St',
        'latitude' => 40.7128,
        'longitude' => -74.0060,
        'category' => 'restaurant',
        'rating' => '4.5',
    ]);

    $response = $this->getJson('/api/v1/places');

    $response->assertOk()
        ->assertJsonStructure([
            'data',
            'current_page',
            'last_page',
            'total',
        ]);
});

test('can view place details and reviews', function () {
    $place = Location::create([
        'name' => 'Historic Castle',
        'address' => 'Highland Road',
        'latitude' => 55.9486,
        'longitude' => -3.1999,
        'category' => 'landmark',
        'rating' => '4.9',
        'reviews' => [
            ['author_name' => 'Alice', 'rating' => 5, 'text' => 'Magnificent!'],
        ],
    ]);

    $detailResponse = $this->getJson("/api/v1/places/{$place->id}");
    $detailResponse->assertOk()
        ->assertJsonPath('data.name', 'Historic Castle');

    $reviewsResponse = $this->getJson("/api/v1/places/{$place->id}/reviews");
    $reviewsResponse->assertOk()
        ->assertJsonStructure([
            'place_id',
            'rating',
            'reviews',
        ]);
});

test('can find nearby places by coordinates', function () {
    Location::create([
        'name' => 'Near Spot',
        'address' => 'Nearby',
        'latitude' => 40.7130,
        'longitude' => -74.0062,
        'category' => 'cafe',
    ]);

    $response = $this->getJson('/api/v1/places/nearby?latitude=40.7128&longitude=-74.0060&radius=5');

    $response->assertOk()
        ->assertJsonStructure([
            'center',
            'radius_km',
            'count',
            'data',
        ]);
});
