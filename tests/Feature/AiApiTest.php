<?php

use App\Models\Location;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    config()->set('services.nvidia.key', 'test-key');
    config()->set('services.nvidia.base_url', 'https://integrate.api.nvidia.com/v1');
    Http::preventStrayRequests();
});

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
    Http::fake(['integrate.api.nvidia.com/v1/chat/completions' => Http::response([
        'choices' => [['message' => ['role' => 'assistant', 'content' => 'Try the city museum.']]],
    ])]);

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

test('greets users without calling the external provider', function () {
    $response = $this->postJson('/api/v1/ai/chat', [
        'messages' => [
            ['role' => 'user', 'content' => 'Hi'],
        ],
    ]);

    $response->assertOk()
        ->assertJsonPath('provider', 'nexora_local')
        ->assertJsonPath('message.role', 'assistant');

    Http::assertNothingSent();
});

test('falls back locally and hides upstream capacity details from chat users', function () {
    Http::fake(['integrate.api.nvidia.com/v1/chat/completions' => Http::response([
        'error' => ['message' => 'ResourceExhausted internal worker details'],
    ], 503)]);

    $response = $this->postJson('/api/v1/ai/chat', [
        'messages' => [
            ['role' => 'user', 'content' => 'Plan a weekend in Lagos'],
        ],
    ]);

    $response->assertOk()
        ->assertJsonPath('provider', 'nexora_local_fallback')
        ->assertJsonPath('status', 'degraded')
        ->assertJsonPath('message.role', 'assistant')
        ->assertDontSee('ResourceExhausted');

    Http::assertSentCount(1);
});

test('can generate AI place summary', function () {
    Http::fake(['integrate.api.nvidia.com/v1/chat/completions' => Http::response([
        'choices' => [['message' => ['role' => 'assistant', 'content' => '{"summary":"A gallery in the Art District.","highlights":["Art District"]}']]],
    ])]);

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
    Http::fake(['integrate.api.nvidia.com/v1/chat/completions' => Http::response([
        'choices' => [['message' => ['role' => 'assistant', 'content' => 'A tower.']]],
    ])]);

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
