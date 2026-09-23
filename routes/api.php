<?php

use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\AIController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\External\GithubController;
use App\Http\Controllers\Api\V1\External\MapboxController;
use App\Http\Controllers\Api\V1\FavoriteController;
use App\Http\Controllers\Api\V1\HistoryController;
use App\Http\Controllers\Api\V1\LocationController;
use App\Http\Controllers\Api\V1\PlaceController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\WeatherController;
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
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/logout', [AuthController::class, 'logout'])
            ->middleware('auth:sanctum');
        Route::post('/refresh', [AuthController::class, 'refresh'])
            ->middleware('auth:sanctum');
        Route::get('/me', [AuthController::class, 'me'])
            ->middleware('auth:sanctum');
        Route::patch('/profile', [ProfileController::class, 'update'])
            ->middleware('auth:sanctum');
    });

    // Search Routes
    Route::prefix('search')->group(function () {
        Route::get('/', [SearchController::class, 'index']);
        Route::get('/suggestions', [SearchController::class, 'suggestions']);
        Route::get('/history', [SearchController::class, 'history'])
            ->middleware('auth:sanctum');
        Route::delete('/history', [SearchController::class, 'clearHistory'])
            ->middleware('auth:sanctum');
    });

    // Locations Routes
    Route::apiResource('locations', LocationController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy'])
        ->middleware('auth:sanctum');

    // Places Routes (detailed place information)
    Route::prefix('places')->group(function () {
        Route::get('/', [PlaceController::class, 'index']);
        Route::get('/nearby', [PlaceController::class, 'nearby']);
        Route::get('/{id}', [PlaceController::class, 'show']);
        Route::get('/{id}/reviews', [PlaceController::class, 'reviews']);
    });

    // Favorites Routes (saved places)
    Route::prefix('favorites')->group(function () {
        Route::get('/', [FavoriteController::class, 'index'])
            ->middleware('auth:sanctum');
        Route::post('/', [FavoriteController::class, 'store'])
            ->middleware('auth:sanctum');
        Route::delete('/{id}', [FavoriteController::class, 'destroy'])
            ->middleware('auth:sanctum');
    });

    // History Routes (search history)
    Route::prefix('history')->group(function () {
        Route::get('/', [HistoryController::class, 'index'])
            ->middleware('auth:sanctum');
        Route::delete('/{id}', [HistoryController::class, 'destroy'])
            ->middleware('auth:sanctum');
        Route::delete('/', [HistoryController::class, 'clear'])
            ->middleware('auth:sanctum');
    });

    // Weather Routes
    Route::prefix('weather')->group(function () {
        Route::get('/current', [WeatherController::class, 'current']);
        Route::get('/forecast', [WeatherController::class, 'forecast']);
        Route::get('/historical', [WeatherController::class, 'historical']);
    });

    // AI Routes
    Route::prefix('ai')->group(function () {
        Route::post('/search', [AIController::class, 'search']);
        Route::post('/recommendations', [AIController::class, 'recommendations']);
        Route::post('/chat', [AIController::class, 'chat']);
        Route::post('/summary', [AIController::class, 'summary']);
        Route::post('/vision', [AIController::class, 'vision']);
    });

    // External API Routes (for proxying/normalizing)
    Route::prefix('external')->group(function () {
        Route::prefix('mapbox')->group(function () {
            Route::get('/geocoding/{text}', [MapboxController::class, 'geocoding']);
            Route::get('/directions', [MapboxController::class, 'directions']);
        });

        Route::prefix('github')->group(function () {
            Route::get('/users/{username}', [GithubController::class, 'user']);
            Route::get('/repos/{owner}/{repo}', [GithubController::class, 'repo']);
        });

    });

    // Admin & Observability Routes
    Route::prefix('admin')->group(function () {
        Route::get('/metrics', [AdminController::class, 'metrics']);
        Route::get('/logs', [AdminController::class, 'logs']);
        Route::delete('/logs', [AdminController::class, 'clearLogs']);
    });
});
