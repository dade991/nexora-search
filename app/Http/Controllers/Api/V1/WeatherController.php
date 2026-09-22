<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Services\WeatherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WeatherController extends Controller
{
    public function __construct(protected WeatherService $weatherService)
    {
    }

    /**
     * Get current weather for coordinates or location_id.
     */
    public function current(Request $request): JsonResponse
    {
        $coords = $this->resolveCoordinates($request);
        if ($coords instanceof JsonResponse) {
            return $coords;
        }

        $weather = $this->weatherService->getCurrentWeather(
            $coords['latitude'],
            $coords['longitude'],
            $coords['name'] ?? null
        );

        return response()->json($weather);
    }

    /**
     * Get weather forecast for coordinates or location_id.
     */
    public function forecast(Request $request): JsonResponse
    {
        $coords = $this->resolveCoordinates($request);
        if ($coords instanceof JsonResponse) {
            return $coords;
        }

        $days = (int) $request->input('days', 7);
        $forecast = $this->weatherService->getForecast(
            $coords['latitude'],
            $coords['longitude'],
            $days
        );

        return response()->json($forecast);
    }

    /**
     * Get historical weather data.
     */
    public function historical(Request $request): JsonResponse
    {
        $coords = $this->resolveCoordinates($request);
        if ($coords instanceof JsonResponse) {
            return $coords;
        }

        $historical = $this->weatherService->getHistorical(
            $coords['latitude'],
            $coords['longitude'],
            $request->input('start_date'),
            $request->input('end_date')
        );

        return response()->json($historical);
    }

    /**
     * Helper to resolve coordinates from location_id or explicit latitude/longitude.
     */
    protected function resolveCoordinates(Request $request): array|JsonResponse
    {
        if ($request->filled('location_id')) {
            $location = Location::find($request->input('location_id'));
            if ($location) {
                return [
                    'latitude' => (float) $location->latitude,
                    'longitude' => (float) $location->longitude,
                    'name' => $location->name,
                ];
            }
        }

        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        return [
            'latitude' => (float) $request->input('latitude'),
            'longitude' => (float) $request->input('longitude'),
            'name' => $request->input('name'),
        ];
    }
}