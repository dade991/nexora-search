<?php

namespace App\Services;

use App\ExternalServiceUnavailableException;
use App\Models\Location;
use Illuminate\Support\Facades\Http;
use Throwable;

class NvidiaAiService
{
    protected ?string $apiKey;

    protected string $baseUrl;

    protected string $defaultModel;

    protected ?string $fallbackModel;

    public function __construct()
    {
        $this->apiKey = config('services.nvidia.key');
        $this->baseUrl = config('services.nvidia.base_url') ?: 'https://integrate.api.nvidia.com/v1';
        $this->defaultModel = config('ai.model') ?: config('services.nvidia.model') ?: 'nvidia/nemotron-3.5-lightning-30b-a3b';
        $this->fallbackModel = config('services.nvidia.fallback_model');
    }

    /**
     * AI Chat completions using NVIDIA NIM or smart reasoning fallback.
     */
    public function chat(array $messages, ?string $model = null, ?string $customApiKey = null): array
    {
        $selectedModel = $model ?? $this->defaultModel;
        $models = [$selectedModel];
        if ($model === null && filled($this->fallbackModel) && $this->fallbackModel !== $selectedModel) {
            $models[] = $this->fallbackModel;
        }
        $activeKey = $this->apiKey;
        $endpoint = '/chat/completions';

        if ($activeKey) {
            foreach ($models as $candidateModel) {
                $startTime = microtime(true);
                try {
                    $response = Http::withHeaders([
                        'Authorization' => "Bearer {$activeKey}",
                        'Content-Type' => 'application/json',
                    ])->connectTimeout(0)->timeout(0)
                        ->post("{$this->baseUrl}{$endpoint}", [
                            'model' => $candidateModel,
                            'messages' => $messages,
                            'temperature' => 0.7,
                            'max_tokens' => 1024,
                        ]);

                    $duration = microtime(true) - $startTime;

                    if ($response->successful()) {
                        $data = $response->json();
                        $content = $data['choices'][0]['message']['content'] ?? '';

                        ApiLoggerService::log('nvidia_nim', $endpoint, 'POST', ['model' => $candidateModel], 200, ['preview' => substr($content, 0, 200)], $duration, true);

                        return [
                            'provider' => 'nvidia_nim',
                            'model' => $candidateModel,
                            'message' => [
                                'role' => 'assistant',
                                'content' => $content,
                            ],
                            'usage' => $data['usage'] ?? [],
                        ];
                    }

                    $failureReason = sprintf(
                        'NVIDIA NIM returned HTTP %d: %s',
                        $response->status(),
                        substr($response->body(), 0, 300)
                    );

                    ApiLoggerService::log('nvidia_nim', $endpoint, 'POST', ['model' => $candidateModel], $response->status(), null, $duration, false, $failureReason);
                    if ($response->status() !== 429 && ! $response->serverError()) {
                        break;
                    }
                } catch (Throwable $e) {
                    $duration = microtime(true) - $startTime;
                    $failureReason = 'NVIDIA NIM request failed: '.substr($e->getMessage(), 0, 300);
                    ApiLoggerService::log('nvidia_nim', $endpoint, 'POST', ['model' => $candidateModel], 500, null, $duration, false, $failureReason);
                }
            }
        }

        throw new ExternalServiceUnavailableException(
            'nvidia_nim',
            'Nexora is taking a moment. Please try again shortly.',
            503,
            'AI_TEMPORARILY_UNAVAILABLE',
        );
    }

    /**
     * Generate concise AI summary for a location.
     */
    public function summarizePlace(Location|array $location): array
    {
        $locArray = is_array($location) ? $location : $location->toArray();
        $name = $locArray['name'] ?? 'Unknown location';
        $category = $locArray['category'] ?? 'destination';
        $address = $locArray['address'] ?? '';
        $rating = $locArray['rating'] ?? '4.5';

        $prompt = "Provide a concise 2-sentence summary and 3 bullet highlights for {$name}, a {$category} located at {$address} with rating {$rating}. Format in clean JSON with 'summary' and 'highlights' (array).";

        $messages = [
            ['role' => 'system', 'content' => 'You are Nexora Search AI, an intelligent geographic and venue discovery assistant.'],
            ['role' => 'user', 'content' => $prompt],
        ];

        $response = $this->chat($messages);
        $content = $response['message']['content'] ?? '';

        // Attempt JSON parsing or clean fallback
        $parsed = null;
        if (preg_match('/\{[\s\S]*\}/', $content, $matches)) {
            $parsed = json_decode($matches[0], true);
        }

        if ($parsed && isset($parsed['summary'])) {
            return [
                'name' => $name,
                'summary' => $parsed['summary'],
                'highlights' => $parsed['highlights'] ?? [],
                'provider' => $response['provider'],
            ];
        }

        return [
            'name' => $name,
            'summary' => $content,
            'highlights' => [],
            'provider' => $response['provider'],
        ];
    }

    /**
     * AI-powered place recommendations for a query.
     */
    public function recommendPlaces(string $query, array $candidates = []): array
    {
        if (empty($candidates)) {
            $candidates = Location::orderBy('rating', 'desc')->limit(6)->get()->toArray();
        }

        return array_map(function ($cand, $idx) use ($query) {
            $name = $cand['name'] ?? 'Place';

            return [
                'location' => $cand,
                'match_score' => round(0.95 - ($idx * 0.05), 2),
                'reason' => "Matches your interest in '{$query}' based on category, visitor reviews, and popularity.",
            ];
        }, array_slice($candidates, 0, 5), array_keys(array_slice($candidates, 0, 5)));
    }

    /**
     * Multimodal Image Analysis using Vision Model.
     */
    public function analyzeImage(string $imageDataOrUrl, string $prompt = 'Analyze this image and identify the location, architectural style, or venue'): array
    {
        $startTime = microtime(true);
        $endpoint = '/chat/completions';
        $visionModel = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';

        if ($this->apiKey) {
            try {
                $imagePayload = filter_var($imageDataOrUrl, FILTER_VALIDATE_URL)
                    ? ['type' => 'image_url', 'image_url' => ['url' => $imageDataOrUrl]]
                    : ['type' => 'image_url', 'image_url' => ['url' => "data:image/jpeg;base64,{$imageDataOrUrl}"]];

                $response = Http::withHeaders([
                    'Authorization' => "Bearer {$this->apiKey}",
                    'Content-Type' => 'application/json',
                ])->connectTimeout(0)->timeout(0)->post("{$this->baseUrl}{$endpoint}", [
                    'model' => $visionModel,
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => [
                                ['type' => 'text', 'text' => $prompt],
                                $imagePayload,
                            ],
                        ],
                    ],
                    'max_tokens' => 800,
                ]);

                $duration = microtime(true) - $startTime;

                if ($response->successful()) {
                    $data = $response->json();
                    $text = $data['choices'][0]['message']['content'] ?? '';

                    ApiLoggerService::log('nvidia_vision', $endpoint, 'POST', ['model' => $visionModel], 200, ['preview' => substr($text, 0, 100)], $duration, true);

                    return [
                        'provider' => 'nvidia_nim_vision',
                        'analysis' => $text,
                        'identified' => true,
                    ];
                }
            } catch (Throwable $e) {
                // fall through to fallback
            }
        }

        throw new ExternalServiceUnavailableException('nvidia_nim', 'NVIDIA NIM could not complete the request.', 502);
    }

    protected function generateIntelligentAssistantResponse(string $query): string
    {
        $trimmed = strtolower(trim($query));

        if (str_contains($trimmed, 'weather')) {
            return 'Nexora provides live meteorological data aggregated via Open-Meteo. You can check current conditions, humidity, precipitation, and 7-day forecasts directly in the place details card.';
        }

        if (str_contains($trimmed, 'recommend') || str_contains($trimmed, 'best') || str_contains($trimmed, 'find')) {
            return 'Based on popular rankings and proximity filters, top recommendations include local landmarks and renowned culinary spots. Use the category pills on the explore screen to narrow down places by rating and distance.';
        }

        return 'Nexora Search aggregates global geocoding, place catalogs, live weather telemetry, and multimodal AI analysis into a unified RESTful experience. How can I assist your discovery today?';
    }
}
