<?php

namespace App\Services;

use App\Models\ApiRequest;
use App\Models\FailedRequest;
use Illuminate\Support\Facades\Log;

class ApiLoggerService
{
    /**
     * Log an API request and its performance telemetry.
     */
    public static function log(
        string $externalService,
        string $endpoint,
        string $method = 'GET',
        ?array $parameters = null,
        ?int $responseCode = 200,
        mixed $responseData = null,
        ?float $responseTimeSeconds = null,
        bool $success = true,
        ?string $errorMessage = null
    ): ApiRequest {
        try {
            // Normalize response data if array or string
            $safeResponseData = null;
            if ($responseData !== null) {
                if (is_array($responseData)) {
                    $safeResponseData = $responseData;
                } elseif (is_string($responseData)) {
                    $decoded = json_decode($responseData, true);
                    $safeResponseData = $decoded ?: ['raw' => substr($responseData, 0, 1000)];
                } else {
                    $safeResponseData = ['value' => (string) $responseData];
                }
            }

            $apiRequest = ApiRequest::create([
                'external_service' => $externalService,
                'endpoint' => $endpoint,
                'method' => strtoupper($method),
                'parameters' => $parameters,
                'response_code' => $responseCode,
                'response_data' => $safeResponseData,
                'response_time' => $responseTimeSeconds !== null ? round($responseTimeSeconds, 4) : null,
                'success' => $success,
                'error_message' => $errorMessage,
            ]);

            // If unsuccessful or HTTP error code >= 400, also track in failed_requests
            if (! $success || ($responseCode !== null && $responseCode >= 400)) {
                FailedRequest::create([
                    'external_service' => $externalService,
                    'endpoint' => $endpoint,
                    'parameters' => $parameters,
                    'response_code' => $responseCode,
                    'error_message' => $errorMessage ?? "HTTP Error {$responseCode}",
                    'failed_at' => now(),
                    'retry_count' => 0,
                    'resolved' => false,
                ]);
            }

            return $apiRequest;
        } catch (\Throwable $e) {
            Log::error('ApiLoggerService failure: '.$e->getMessage());

            // Return an unpersisted model instance so callers never crash
            return new ApiRequest([
                'external_service' => $externalService,
                'endpoint' => $endpoint,
                'success' => $success,
            ]);
        }
    }
}
