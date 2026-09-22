<?php

use App\Models\Location;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('can perform AI semantic search', function () {
    Location::create([
        'name' => 'Sunset Italian Bistro',
        'address' => 'Little Italy',
        'latitude' => 40.7190,
        'longitude' => -73.9973,
        'category' => 'restaurant',
        'rating' => '4.8',
    ]);

    $response = $this->postJson('/api/v1/ai/search', [
        'prompt' => 'romantic Italian restaurant',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'prompt',
            'count',
            'ai_reasoning',
            'results',
        ]);
});

test('can chat with AI discovery assistant', function () {
    $response = $this->postJson('/api/v1/ai/chat', [
        'messages' => [
            ['role' => 'user', 'content' => 'What are good places to visit for architectural photography?'],
        ],
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'provider',
            'message' => ['role', 'content'],
        ]);
});

test('can generate AI place summary', function () {
    $location = Location::create([
        'name' => 'Modern Art Gallery',
        'address' => 'Art District',
        'latitude' => 37.7749,
        'longitude' => -122.4194,
        'category' => 'museum',
        'rating' => '4.7',
    ]);

    $response = $this->postJson('/api/v1/ai/summary', [
        'location_id' => $location->id,
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'name',
            'summary',
            'highlights',
            'provider',
        ]);
});

test('can analyze image via AI vision endpoint', function () {
    $response = $this->postJson('/api/v1/ai/vision', [
        'image' => 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400',
        'prompt' => 'Identify this tower',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'provider',
            'analysis',
            'identified',
        ]);
});
