<?php

namespace App\Http\Middleware;

use App\Models\ApiRequest;
use App\Models\FailedRequest;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequests
{
    /**
     * Handle an incoming request and record API telemetry.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        $response = $next($request);

        $duration = microtime(true) - $startTime;

        // Only log API endpoints
        if ($request->is('api/*')) {
            try {
                $statusCode = $response->getStatusCode();
                $isSuccess = $statusCode >= 200 && $statusCode < 400;

                // Determine service group from path
                $path = $request->path();
                $segments = explode('/', $path);
                $serviceName = $segments[2] ?? 'api_core';

                ApiRequest::create([
                    'external_service' => $serviceName,
                    'endpoint' => '/'.$path,
                    'method' => $request->method(),
                    'parameters' => $request->except(['password', 'password_confirmation', 'token']),
                    'response_code' => $statusCode,
                    'response_data' => null,
                    'response_time' => round($duration, 4),
                    'success' => $isSuccess,
                    'error_message' => $isSuccess ? null : "HTTP Error {$statusCode}",
                ]);

                if (! $isSuccess && $statusCode >= 400) {
                    FailedRequest::create([
                        'external_service' => $serviceName,
                        'endpoint' => '/'.$path,
                        'parameters' => $request->except(['password', 'password_confirmation', 'token']),
                        'response_code' => $statusCode,
                        'error_message' => "Client/Server error with status {$statusCode}",
                        'failed_at' => now(),
                        'retry_count' => 0,
                        'resolved' => false,
                    ]);
                }
            } catch (\Throwable) {
                // Silently ignore telemetry persistence errors so client requests are never blocked
            }
        }

        return $response;
    }
}
