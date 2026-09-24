<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\LocationSearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __construct(private LocationSearchService $search) {}

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'query' => 'required|string|min:1|max:200',
            'latitude' => 'nullable|required_with:longitude|numeric|between:-90,90',
            'longitude' => 'nullable|required_with:latitude|numeric|between:-180,180',
            'radius' => 'nullable|integer|min:1|max:50000',
            'category' => 'nullable|string|in:all,restaurant,cafe,park,museum,hotel,landmark',
            'limit' => 'nullable|integer|min:1|max:20',
        ]);
        $query = trim($data['query']);
        $latitude = isset($data['latitude']) ? (float) $data['latitude'] : null;
        $longitude = isset($data['longitude']) ? (float) $data['longitude'] : null;
        $category = ($data['category'] ?? 'all') === 'all' ? null : $data['category'];
        $result = $this->search->search($query, $latitude, $longitude, $data['radius'] ?? 10000, $category, $data['limit'] ?? 20);
        $user = $request->user('sanctum') ?? $request->user();
        if ($user && data_get($user->preferences, 'search.save_history', true) !== false) {
            $user->searchHistory()->create([
                'query' => $query, 'latitude' => $latitude, 'longitude' => $longitude,
                'results_count' => $result['count'],
                'filters' => array_intersect_key($data, array_flip(['category', 'radius'])),
            ]);
        }

        return response()->json(['query' => $query, ...$result]);
    }

    public function suggestions(Request $request): JsonResponse
    {
        $data = $request->validate([
            'query' => 'required|string|min:1|max:200',
            'latitude' => 'nullable|required_with:longitude|numeric|between:-90,90',
            'longitude' => 'nullable|required_with:latitude|numeric|between:-180,180',
            'limit' => 'nullable|integer|min:1|max:10',
        ]);
        $suggestions = $this->search->suggestions($data['query'],
            isset($data['latitude']) ? (float) $data['latitude'] : null,
            isset($data['longitude']) ? (float) $data['longitude'] : null,
            $data['limit'] ?? 10);

        return response()->json(['query' => $data['query'], 'suggestions' => $suggestions]);
    }

    public function history(Request $request): JsonResponse
    {
        return response()->json($request->user()->searchHistory()->latest()->paginate(20));
    }

    public function clearHistory(Request $request): JsonResponse
    {
        $request->user()->searchHistory()->delete();

        return response()->json(['message' => 'Search history cleared successfully']);
    }
}
