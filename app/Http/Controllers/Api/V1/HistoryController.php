<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SearchHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HistoryController extends Controller
{
    /**
     * Display a paginated listing of user's search history.
     */
    public function index(Request $request): JsonResponse
    {
        $history = SearchHistory::where('user_id', $request->user()->id)
            ->latest()
            ->paginate((int) $request->input('per_page', 20));

        return response()->json($history);
    }

    /**
     * Delete a single history record.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $record = SearchHistory::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        $record->delete();

        return response()->json([
            'message' => 'Search history item deleted successfully',
        ]);
    }

    /**
     * Clear all search history for authenticated user.
     */
    public function clear(Request $request): JsonResponse
    {
        SearchHistory::where('user_id', $request->user()->id)->delete();

        return response()->json([
            'message' => 'All search history cleared successfully',
        ]);
    }
}
