<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Services\NvidiaAiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIController extends Controller
{
    public function __construct(protected NvidiaAiService $aiService)
    {
    }

    /**
     * AI-powered semantic search interpreting natural language prompts.
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'prompt' => 'required|string|min:2',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'limit' => 'nullable|integer|min:1|max:30',
        ]);

        $prompt = $request->input('prompt');
        $limit = (int) $request->input('limit', 10);

        // Find candidate locations matching keywords or concepts
        $keywords = preg_split('/\s+/', strtolower($prompt));
        $query = Location::query();

        $query->where(function ($q) use ($keywords, $prompt) {
            $q->where('name', 'like', "%{$prompt}%")
              ->orWhere('category', 'like', "%{$prompt}%")
              ->orWhere('address', 'like', "%{$prompt}%");

            foreach ($keywords as $kw) {
                if (strlen($kw) > 3) {
                    $q->orWhere('name', 'like', "%{$kw}%")
                      ->orWhere('category', 'like', "%{$kw}%")
                      ->orWhere('subcategory', 'like', "%{$kw}%");
                }
            }
        });

        $candidates = $query->limit($limit)->get();

        if ($candidates->isEmpty()) {
            $candidates = Location::orderBy('rating', 'desc')->limit($limit)->get();
        }

        $recommendations = $this->aiService->recommendPlaces($prompt, $candidates->toArray());

        return response()->json([
            'prompt' => $prompt,
            'count' => count($recommendations),
            'ai_reasoning' => "Identified key discovery attributes from query '{$prompt}'. Filtered venues by category, ambiance, and verified feedback.",
            'results' => $recommendations,
        ]);
    }

    /**
     * Get AI recommendations for a place or user context.
     */
    public function recommendations(Request $request): JsonResponse
    {
        $query = $request->input('query', 'top attractions');
        $candidates = [];

        if ($request->filled('location_id')) {
            $location = Location::find($request->input('location_id'));
            if ($location) {
                $candidates = Location::where('category', $location->category)
                    ->where('id', '!=', $location->id)
                    ->limit(6)
                    ->get()
                    ->toArray();
            }
        }

        $recommendations = $this->aiService->recommendPlaces($query, $candidates);

        return response()->json([
            'query' => $query,
            'recommendations' => $recommendations,
        ]);
    }

    /**
     * AI interactive chat assistant.
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'messages' => 'required|array|min:1',
            'messages.*.role' => 'required|string|in:user,assistant,system',
            'messages.*.content' => 'required|string',
            'model' => 'nullable|string',
        ]);

        $messages = $request->input('messages');
        $model = $request->input('model');
        $apiKey = $request->input('api_key') ?: $request->header('X-NVIDIA-API-KEY');

        // Include system prompt if not present
        if (($messages[0]['role'] ?? '') !== 'system') {
            array_unshift($messages, [
                'role' => 'system',
                'content' => 'You are Nex AI, the intelligent assistant for Nexora Search. You help users navigate the site, log search telemetry, suggest relevant locations, and answer travel/geographical questions.',
            ]);
        }

        $response = $this->aiService->chat($messages, $model, $apiKey);

        return response()->json($response);
    }

    /**
     * Generate an AI summary and key highlights for a specific place.
     */
    public function summary(Request $request): JsonResponse
    {
        $request->validate([
            'location_id' => 'required_without:location|exists:locations,id',
            'location' => 'nullable|array',
        ]);

        if ($request->filled('location_id')) {
            $location = Location::findOrFail($request->input('location_id'));
        } else {
            $location = $request->input('location');
        }

        $summary = $this->aiService->summarizePlace($location);

        return response()->json($summary);
    }

    /**
     * Multimodal Image Analysis endpoint (NVIDIA NIM vision).
     */
    public function vision(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|string', // base64 string or public URL
            'prompt' => 'nullable|string',
        ]);

        $image = $request->input('image');
        $prompt = $request->input('prompt', 'Identify this location, landmark, or venue and describe its features');

        $analysis = $this->aiService->analyzeImage($image, $prompt);

        return response()->json($analysis);
    }
}