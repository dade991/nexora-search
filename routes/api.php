<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Version 1 API Routes
Route::prefix('v1')->group(function () {
    // Authentication Routes
    Route::prefix('auth')->group(function () {
        Route::post('/register', [App\Http\Controllers\Api\V1\AuthController::class, 'register']);
        Route::post('/login', [App\Http\Controllers\Api\V1\AuthController::class, 'login']);
        Route::post('/logout', [App\Http\Controllers\Api\V1\AuthController::class, 'logout'])
            ->middleware('auth:sanctum');
        Route::post('/refresh', [App\Http\Controllers\Api\V1\AuthController::class, 'refresh'])
            ->middleware('auth:sanctum');
        Route::get('/me', [App\Http\Controllers\Api\V1\AuthController::class, 'me'])
            ->middleware('auth:sanctum');
    });

    // Search Routes
    Route::prefix('search')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\V1\SearchController::class, 'index']);
        Route::get('/suggestions', [App\Http\Controllers\Api\V1\SearchController::class, 'suggestions']);
        Route::get('/history', [App\Http\Controllers\Api\V1\SearchController::class, 'history'])
            ->middleware('auth:sanctum');
        Route::delete('/history', [App\Http\Controllers\Api\V1\SearchController::class, 'clearHistory'])
            ->middleware('auth:sanctum');
    });

    // Locations Routes
    Route::apiResource('locations', App\Http\Controllers\Api\V1\LocationController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy'])
        ->middleware('auth:sanctum');

    // Places Routes (detailed place information)
    Route::prefix('places')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\V1\PlaceController::class, 'index']);
        Route::get('/{id}', [App\Http\Controllers\Api\V1\PlaceController::class, 'show']);
        Route::get('/nearby', [App\Http\Controllers\Api\V1\PlaceController::class, 'nearby']);
        Route::get('/{id}/reviews', [App\Http\Controllers\Api\V1\PlaceController::class, 'reviews']);
    });

    // Favorites Routes (saved places)
    Route::prefix('favorites')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\V1\FavoriteController::class, 'index'])
            ->middleware('auth:sanctum');
        Route::post('/', [App\Http\Controllers\Api\V1\FavoriteController::class, 'store'])
            ->middleware('auth:sanctum');
        Route::delete('/{id}', [App\Http\Controllers\Api\V1\FavoriteController::class, 'destroy'])
            ->middleware('auth:sanctum');
    });

    // History Routes (search history)
    Route::prefix('history')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\V1\HistoryController::class, 'index'])
            ->middleware('auth:sanctum');
        Route::delete('/{id}', [App\Http\Controllers\Api\V1\HistoryController::class, 'destroy'])
            ->middleware('auth:sanctum');
        Route::delete('/', [App\Http\Controllers\Api\V1\HistoryController::class, 'clear'])
            ->middleware('auth:sanctum');
    });

    // Weather Routes
    Route::prefix('weather')->group(function () {
        Route::get('/current', [App\Http\Controllers\Api\V1\WeatherController::class, 'current']);
        Route::get('/forecast', [App\Http\Controllers\Api\V1\WeatherController::class, 'forecast']);
        Route::get('/historical', [App\Http\Controllers\Api\V1\WeatherController::class, 'historical']);
    });

    // AI Routes
    Route::prefix('ai')->group(function () {
        Route::post('/search', [App\Http\Controllers\Api\V1\AIController::class, 'search']);
        Route::post('/recommendations', [App\Http\Controllers\Api\V1\AIController::class, 'recommendations']);
        Route::post('/chat', [App\Http\Controllers\Api\V1\AIController::class, 'chat']);
        Route::post('/summary', [App\Http\Controllers\Api\V1\AIController::class, 'summary']);
        Route::post('/vision', [App\Http\Controllers\Api\V1\AIController::class, 'vision']);
    });

    // External API Routes (for proxying/normalizing)
    Route::prefix('external')->group(function () {
        Route::prefix('google')->group(function () {
            Route::get('/places/{place_id}', [App\Http\Controllers\Api\V1\External\GoogleController::class, 'placeDetails']);
            Route::get('/places/search', [App\Http\Controllers\Api\V1\External\GoogleController::class, 'searchPlaces']);
        });

        Route::prefix('mapbox')->group(function () {
            Route::get('/geocoding/{text}', [App\Http\Controllers\Api\V1\External\MapboxController::class, 'geocoding']);
            Route::get('/directions', [App\Http\Controllers\Api\V1\External\MapboxController::class, 'directions']);
        });

        Route::prefix('github')->group(function () {
            Route::get('/users/{username}', [App\Http\Controllers\Api\V1\External\GithubController::class, 'user']);
            Route::get('/repos/{owner}/{repo}', [App\Http\Controllers\Api\V1\External\GithubController::class, 'repo']);
        });

        Route::prefix('social')->group(function () {
            Route::get('/facebook/{id}', [App\Http\Controllers\Api\V1\External\SocialController::class, 'facebook']);
            Route::get('/instagram/{id}', [App\Http\Controllers\Api\V1\External\SocialController::class, 'instagram']);
            Route::get('/twitter/{id}', [App\Http\Controllers\Api\V1\External\SocialController::class, 'twitter']);
        });
    });

    // Admin & Observability Routes
    Route::prefix('admin')->group(function () {
        Route::get('/metrics', [App\Http\Controllers\Api\V1\AdminController::class, 'metrics']);
        Route::get('/logs', [App\Http\Controllers\Api\V1\AdminController::class, 'logs']);
        Route::delete('/logs', [App\Http\Controllers\Api\V1\AdminController::class, 'clearLogs']);
    });
});