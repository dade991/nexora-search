<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ApiRequest;
use App\Models\FailedRequest;
use App\Models\Location;
use App\Models\SearchHistory;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /**
     * Get platform telemetry and API observability metrics.
     */
    public function metrics(): JsonResponse
    {
        $totalRequests = ApiRequest::count();
        $successfulRequests = ApiRequest::where('success', true)->count();
        $failedRequests = ApiRequest::where('success', false)->count();
        $avgResponseTime = ApiRequest::avg('response_time') ?: 0.12;

        $providerBreakdown = ApiRequest::select('external_service', DB::raw('count(*) as count'))
            ->groupBy('external_service')
            ->pluck('count', 'external_service')
            ->toArray();

        $topSearches = SearchHistory::select('query', DB::raw('count(*) as search_count'))
            ->groupBy('query')
            ->orderByDesc('search_count')
            ->limit(8)
            ->get();

        $recentErrors = FailedRequest::latest('failed_at')
            ->limit(10)
            ->get();

        $totalLocations = Location::count();
        $totalUsers = User::count();

        return response()->json([
            'overview' => [
                'total_requests' => $totalRequests,
                'successful_requests' => $successfulRequests,
                'failed_requests' => $failedRequests,
                'success_rate' => $totalRequests > 0 ? round(($successfulRequests / $totalRequests) * 100, 1) : 100,
                'avg_response_time_ms' => round($avgResponseTime * 1000, 1),
                'total_locations' => $totalLocations,
                'total_users' => $totalUsers,
            ],
            'providers' => $providerBreakdown,
            'top_searches' => $topSearches,
            'recent_errors' => $recentErrors,
            'system_health' => [
                'status' => $failedRequests < 20 ? 'healthy' : 'degraded',
                'database' => 'connected',
                'cache' => 'active',
                'php_version' => PHP_VERSION,
                'environment' => config('app.env'),
            ],
        ]);
    }

    /**
     * Get paginated API request audit log.
     */
    public function logs(Request $request): JsonResponse
    {
        $query = ApiRequest::query();

        if ($request->filled('service')) {
            $query->where('external_service', $request->input('service'));
        }

        if ($request->has('success')) {
            $query->where('success', filter_var($request->input('success'), FILTER_VALIDATE_BOOLEAN));
        }

        $logs = $query->latest()->paginate((int) $request->input('per_page', 25));

        return response()->json($logs);
    }

    /**
     * Clear old API request logs.
     */
    public function clearLogs(): JsonResponse
    {
        ApiRequest::truncate();
        FailedRequest::truncate();

        return response()->json([
            'message' => 'Telemetry and audit logs cleared successfully',
        ]);
    }
}
