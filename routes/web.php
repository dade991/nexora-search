<?php

use App\Models\ApiRequest;
use App\Models\Location;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    try {
        $locations = Location::latest()->get();
        $categories = Location::select('category')->distinct()->pluck('category')->filter()->values();
        $stats = [
            'total_locations' => Location::count(),
            'total_categories' => $categories->count(),
            'total_requests' => ApiRequest::count(),
        ];
    } catch (\Throwable) {
        $locations = collect([]);
        $categories = collect(['landmark', 'restaurant', 'park', 'museum', 'cafe', 'hotel']);
        $stats = [
            'total_locations' => 0,
            'total_categories' => 6,
            'total_requests' => 0,
        ];
    }

    return Inertia::render('welcome', [
        'initialLocations' => $locations,
        'categories' => $categories,
        'stats' => $stats,
    ]);
})->name('home');
