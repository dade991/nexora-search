<?php

namespace App\Http\Controllers\Api\V1\External;

use App\Http\Controllers\Controller;
use App\Services\MapboxService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MapboxController extends Controller
{
    public function __construct(protected MapboxService $mapboxService)
    {
    }

    /**
     * Forward geocoding query.
     */
    public function geocoding(Request $request, string $text): JsonResponse
    {
        $limit = (int) $request->input('limit', 5);
        $results = $this->mapboxService->geocode($text, $limit);

        return response()->json($results);
    }

    /**
     * Directions calculation between coordinates.
     */
    public function directions(Request $request): JsonResponse
    {
        $request->validate([
            'start_lat' => 'required|numeric|between:-90,90',
            'start_lng' => 'required|numeric|between:-180,180',
            'end_lat' => 'required|numeric|between:-90,90',
            'end_lng' => 'required|numeric|between:-180,180',
            'profile' => 'nullable|string|in:driving,walking,cycling',
        ]);

        $profile = $request->input('profile', 'driving');
        $result = $this->mapboxService->directions(
            (float) $request->input('start_lat'),
            (float) $request->input('start_lng'),
            (float) $request->input('end_lat'),
            (float) $request->input('end_lng'),
            $profile
        );

        return response()->json($result);
    }
}