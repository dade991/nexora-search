<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\LocationResource;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlaceController extends Controller
{
    /**
     * Display a listing of places.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Location::query();

        if ($request->has('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->has('search')) {
            $term = $request->input('search');
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('address', 'like', "%{$term}%");
            });
        }

        if ($request->has('min_rating')) {
            $query->where('rating', '>=', (float) $request->input('min_rating'));
        }

        $perPage = (int) $request->input('per_page', 15);
        $places = $query->latest()->paginate($perPage);

        return response()->json([
            'data' => LocationResource::collection($places->items()),
            'current_page' => $places->currentPage(),
            'last_page' => $places->lastPage(),
            'per_page' => $places->perPage(),
            'total' => $places->total(),
        ]);
    }

    /**
     * Display specific place details.
     */
    public function show(string $id): JsonResponse
    {
        $place = Location::where('id', $id)
            ->orWhere('place_id', $id)
            ->firstOrFail();

        return response()->json([
            'data' => new LocationResource($place),
        ]);
    }

    /**
     * Get places nearby given coordinates.
     */
    public function nearby(Request $request): JsonResponse
    {
        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius' => 'nullable|numeric|min:0.5|max:100', // radius in km
            'category' => 'nullable|string',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $lat = (float) $request->input('latitude');
        $lng = (float) $request->input('longitude');
        $radiusKm = (float) $request->input('radius', 10);
        $limit = (int) $request->input('limit', 20);

        $query = Location::query();

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        $places = $query->get()->filter(function ($place) use ($lat, $lng, $radiusKm) {
            $distance = 6371 * acos(
                cos(deg2rad($lat)) *
                cos(deg2rad((float) $place->latitude)) *
                cos(deg2rad((float) $place->longitude) - deg2rad($lng)) +
                sin(deg2rad($lat)) *
                sin(deg2rad((float) $place->latitude))
            );

            return $distance <= $radiusKm;
        })->values()->sortBy('distance_km')->take($limit)->values();

        $places = $places->map(function ($place) use ($lat, $lng) {
            $distance = 6371 * acos(
                cos(deg2rad($lat)) *
                cos(deg2rad((float) $place->latitude)) *
                cos(deg2rad((float) $place->longitude) - deg2rad($lng)) +
                sin(deg2rad($lat)) *
                sin(deg2rad((float) $place->latitude))
            );

            $place->distance_km = round($distance, 3);

            return $place;
        })->values();

        return response()->json([
            'center' => [
                'latitude' => $lat,
                'longitude' => $lng,
            ],
            'radius_km' => $radiusKm,
            'count' => $places->count(),
            'data' => $places,
        ]);
    }

    /**
     * Get reviews for a specific place.
     */
    public function reviews(string $id): JsonResponse
    {
        $place = Location::where('id', $id)
            ->orWhere('place_id', $id)
            ->firstOrFail();

        $reviews = $place->reviews ?? [];

        return response()->json([
            'place_id' => $place->id,
            'name' => $place->name,
            'rating' => $place->rating,
            'review_count' => count($reviews),
            'reviews' => $reviews,
        ]);
    }
}
