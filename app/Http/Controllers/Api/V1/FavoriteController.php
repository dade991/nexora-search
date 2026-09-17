<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Favorite;
use App\Models\Location;

class FavoriteController extends Controller
{
    /**
     * Display a listing of user's favorite locations.
     */
    public function index(Request $request)
    {
        $favorites = $request->user()->favorites()
            ->with('location')
            ->latest()
            ->paginate(20);

        return response()->json($favorites);
    }

    /**
     * Store a newly favorite location.
     */
    public function store(Request $request)
    {
        $request->validate([
            'location_id' => 'required|exists:locations,id',
            'notes' => 'nullable|string|max:1000',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ]);

        // Check if already favorited
        $existing = $request->user()->favorites()
            ->where('location_id', $request->input('location_id'))
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Location is already in favorites',
                'favorite' => $existing,
            ], 409);
        }

        $favorite = $request->user()->favorites()->create($request->all());

        return response()->json($favorite, 201);
    }

    /**
     * Remove a favorite location.
     */
    public function destroy(string $id)
    {
        $favorite = $request->user()->favorites()->findOrFail($id);
        $favorite->delete();

        return response()->json([
            'message' => 'Favorite removed successfully',
        ]);
    }
}