<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user can register and receive an api token', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'password' => 'secretPassword123!',
        'password_confirmation' => 'secretPassword123!',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'user' => ['id', 'name', 'email'],
            'token',
        ]);

    $this->assertDatabaseHas('users', [
        'email' => 'jane@example.com',
    ]);
});

test('user can login with valid credentials', function () {
    $user = User::factory()->create([
        'email' => 'jane@example.com',
        'password' => bcrypt('secretPassword123!'),
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'jane@example.com',
        'password' => 'secretPassword123!',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'user' => ['id', 'name', 'email'],
            'token',
        ]);
});

test('user cannot login with invalid credentials', function () {
    $user = User::factory()->create([
        'email' => 'jane@example.com',
        'password' => bcrypt('secretPassword123!'),
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'jane@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(401)
        ->assertJson([
            'message' => 'Invalid credentials',
        ]);
});

test('authenticated user can view their profile and logout', function () {
    $user = User::factory()->create();
    $token = $user->createToken('test-token')->plainTextToken;

    $meResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/auth/me');

    $meResponse->assertOk()
        ->assertJson([
            'id' => $user->id,
            'email' => $user->email,
        ]);

    $logoutResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/auth/logout');

    $logoutResponse->assertOk()
        ->assertJson([
            'message' => 'Successfully logged out',
        ]);
});

test('authenticated user can save onboarding preferences and location', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')->patchJson('/api/v1/auth/profile', [
        'occupation' => 'Designer',
        'age' => 28,
        'gender' => 'Prefer not to say',
        'location' => 'Lagos',
        'latitude' => 6.5244,
        'longitude' => 3.3792,
        'preferences' => [
            'likes' => ['Food and coffee', 'Arts and culture'],
            'onboarding_completed' => true,
        ],
    ]);

    $response->assertOk()
        ->assertJsonPath('user.preferences.likes.0', 'Food and coffee')
        ->assertJsonPath('user.preferences.onboarding_completed', true);

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'occupation' => 'Designer',
        'location' => 'Lagos',
    ]);
});

test('authenticated users can replace discovery preferences and save a custom theme', function () {
    $user = User::factory()->create([
        'preferences' => ['likes' => ['work-friendly', 'cafes']],
    ]);

    $response = $this->actingAs($user, 'sanctum')->patchJson('/api/v1/auth/profile', [
        'preferences' => [
            'likes' => ['museums'],
            'dislikes' => [],
            'search' => [
                'radius' => 10000,
                'view' => 'split',
                'use_location' => true,
                'save_history' => true,
            ],
            'ai' => ['use_preferences' => false],
            'theme' => [
                'preset' => 'custom',
                'custom' => [
                    'page' => '#0b1111',
                    'surface' => '#101a18',
                    'surfaceElevated' => '#172522',
                    'text' => '#edf5f1',
                    'textMuted' => '#a8b9b4',
                    'border' => '#29413c',
                    'brand' => '#087f6b',
                    'accent' => '#e8c36a',
                    'success' => '#16a34a',
                    'warning' => '#d97706',
                    'error' => '#dc2626',
                    'mapSurface' => '#101a18',
                    'mapText' => '#edf5f1',
                    'radius' => 'comfortable',
                    'density' => 'comfortable',
                ],
            ],
        ],
    ]);

    $response->assertOk()
        ->assertJsonPath('user.preferences.likes', ['museums'])
        ->assertJsonPath('user.preferences.theme.preset', 'custom');

    expect($user->fresh()->preferences['likes'])->toBe(['museums']);
});

test('profile settings reject invalid custom theme colors', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')->patchJson('/api/v1/auth/profile', [
        'preferences' => [
            'theme' => [
                'preset' => 'custom',
                'custom' => ['page' => 'transparent'],
            ],
        ],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['preferences.theme.custom.page']);
});

test('authenticated users can save a search layout preference', function (string $layout) {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')->patchJson('/api/v1/auth/profile', [
        'preferences' => [
            'search' => ['layout' => $layout],
        ],
    ]);

    $response->assertOk()
        ->assertJsonPath('user.preferences.search.layout', $layout);

    expect($user->fresh()->preferences['search']['layout'])->toBe($layout);
})->with(['compact', 'floating', 'hero']);

test('profile settings reject an unknown search layout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')->patchJson('/api/v1/auth/profile', [
        'preferences' => [
            'search' => ['layout' => 'fullscreen'],
        ],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['preferences.search.layout']);
});
