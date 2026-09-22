<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SavedPlace;
use App\Models\Location;

class FavoriteController extends Controller
{
    /**
     * Display a listing of user's favorite locations.
     */
    public function index(Request $request)
    {
        $favorites = SavedPlace::where('user_id', $request->user()->id)
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
        $existing = SavedPlace::where('user_id', $request->user()->id)
            ->where('location_id', $request->input('location_id'))
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Location is already in favorites',
                'favorite' => $existing->load('location'),
            ], 409);
        }

        $favorite = SavedPlace::create([
            'user_id' => $request->user()->id,
            'location_id' => $request->input('location_id'),
            'notes' => $request->input('notes'),
            'tags' => $request->input('tags'),
        ]);

        return response()->json($favorite->load('location'), 201);
    }

    /**
     * Remove a favorite location.
     */
    public function destroy(Request $request, string $id)
    {
        $favorite = SavedPlace::where('user_id', $request->user()->id)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)
                  ->orWhere('location_id', $id);
            })
            ->firstOrFail();

        $favorite->delete();

        return response()->json([
            'message' => 'Favorite removed successfully',
        ]);
    }
}