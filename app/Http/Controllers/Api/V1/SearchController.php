<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Location;
use App\Models\SearchHistory;
use Illuminate\Support\Facades\DB;

class SearchController extends Controller
{
    /**
     * Search for locations/places.
     */
    public function index(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'radius' => 'nullable|integer|min:1|max:50000', // meters
            'category' => 'nullable|string',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $query = $request->input('query');
        $latitude = $request->input('latitude');
        $longitude = $request->input('longitude');
        $radius = $request->input('radius', 10000); // default 10km
        $category = $request->input('category');
        $limit = $request->input('limit', 20);

        // Start building the query
        $locationsQuery = Location::query();

        // Text search on name and address
        if ($query) {
            $locationsQuery->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('address', 'like', "%{$query}%");
            });
        }

        // Category filter
        if ($category) {
            $locationsQuery->where('category', $category);
        }

        // Location-based search (if coordinates provided)
        if ($latitude && $longitude) {
            // Using Haversine formula for distance calculation
            // This is a simplified version - in production you might want to use PostGIS or similar
            $locationsQuery->selectRaw("*, (
                6371 * acos(
                    cos(radians(?)) *
                    cos(radians(latitude)) *
                    cos(radians(longitude) - radians(?)) +
                    sin(radians(?)) *
                    sin(radians(latitude))
                )
            ) AS distance", [$latitude, $longitude, $latitude])
            ->having('distance', '<', $radius / 1000) // convert meters to kilometers
            ->orderBy('distance');
        } else {
            $locationsQuery->orderBy('created_at', 'desc');
        }

        $locations = $locationsQuery->limit($limit)->get();

        // Save to search history if user is authenticated
        if ($request->user()) {
            SearchHistory::create([
                'user_id' => $request->user()->id,
                'query' => $query,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'results_count' => $locations->count(),
            ]);
        }

        return response()->json([
            'query' => $query,
            'results' => $locations,
            'count' => $locations->count(),
        ]);
    }

    /**
     * Get search suggestions.
     */
    public function suggestions(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'limit' => 'nullable|integer|min:1|max:10',
        ]);

        $query = $request->input('query');
        $latitude = $request->input('latitude');
        $longitude = $request->input('longitude');
        $limit = $request->input('limit', 10);

        $locationsQuery = Location::query()
            ->where('name', 'like', "%{$query}%")
            ->orWhere('address', 'like', "%{$query}%");

        if ($latitude && $longitude) {
            $locationsQuery->selectRaw("*, (
                6371 * acos(
                    cos(radians(?)) *
                    cos(radians(latitude)) *
                    cos(radians(longitude) - radians(?)) +
                    sin(radians(?)) *
                    sin(radians(latitude))
                )
            ) AS distance", [$latitude, $longitude, $latitude])
            ->having('distance', '<', 50) // within 50km for suggestions
            ->orderBy('distance');
        }

        $suggestions = $locationsQuery->limit($limit)->get(['id', 'name', 'address', 'latitude', 'longitude']);

        return response()->json([
            'query' => $query,
            'suggestions' => $suggestions,
        ]);
    }

    /**
     * Get user's search history.
     */
    public function history(Request $request)
    {
        $history = $request->user()->searchHistory()
            ->withCount('results') // if we had a results relationship
            ->latest()
            ->paginate(20);

        return response()->json($history);
    }

    /**
     * Clear user's search history.
     */
    public function clearHistory(Request $request)
    {
        $request->user()->searchHistory()->delete();

        return response()->json([
            'message' => 'Search history cleared successfully',
        ]);
    }
}