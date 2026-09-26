<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

test('generates secure URLs behind the hosting proxy', function () {
    Route::get('/proxy-url', fn (Request $request): array => [
        'secure' => $request->secure(),
        'url' => url('/'),
    ]);

    $response = $this
        ->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
        ->withHeaders([
            'X-Forwarded-Host' => 'nexora-search-zg91.onrender.com',
            'X-Forwarded-Proto' => 'https',
        ])
        ->getJson('/proxy-url');

    $response->assertExactJson([
        'secure' => true,
        'url' => 'https://nexora-search-zg91.onrender.com',
    ]);
});
