<?php

namespace App\Http\Controllers\Api\V1\External;

use App\Http\Controllers\Controller;
use App\Services\GooglePlacesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoogleController extends Controller
{
    public function __construct(protected GooglePlacesService $googlePlacesService)
    {
    }

    /**
     * Search places via Google Places API.
     */
    public function searchPlaces(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'required|string|min:1',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'radius' => 'nullable|integer|min:100|max:50000',
        ]);

        $query = $request->input('query');
        $lat = $request->input('latitude') !== null ? (float) $request->input('latitude') : null;
        $lng = $request->input('longitude') !== null ? (float) $request->input('longitude') : null;
        $radius = (int) $request->input('radius', 5000);

        $results = $this->googlePlacesService->searchPlaces($query, $lat, $lng, $radius);

        return response()->json($results);
    }

    /**
     * Get detailed place information by place_id.
     */
    public function placeDetails(string $place_id): JsonResponse
    {
        $details = $this->googlePlacesService->getPlaceDetails($place_id);

        return response()->json($details);
    }
}