<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\LocationResource;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LocationController extends Controller
{
    /**
     * Display a listing of locations.
     */
    public function index(Request $request)
    {
        $locations = Location::query();

        // Filter by category
        if ($request->has('category')) {
            $locations->where('category', $request->input('category'));
        }

        // Filter by external source
        if ($request->has('external_source')) {
            $locations->where('external_source', $request->input('external_source'));
        }

        // Search by name/address
        if ($request->has('search')) {
            $search = $request->input('search');
            $locations->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        // Paginate results
        $perPage = $request->input('per_page', 20);
        $locations = $locations->paginate($perPage);

        return LocationResource::collection($locations);
    }

    /**
     * Store a newly created location.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'address' => 'nullable|string|max:500',
            'place_id' => 'nullable|string',
            'external_id' => 'nullable|string',
            'external_source' => 'nullable|string|max:50',
            'category' => 'nullable|string|max:100',
            'subcategory' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'website' => 'nullable|url',
            'rating' => 'nullable|string|max:10',
            'review_count' => 'nullable|integer|min:0',
            'data' => 'nullable|json',
            'hours' => 'nullable|json',
            'photos' => 'nullable|json',
            'reviews' => 'nullable|json',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        $attributes = $validator->validated();
        $location = filled($attributes['place_id'] ?? null)
            ? Location::updateOrCreate(['place_id' => $attributes['place_id']], $attributes)
            : Location::create($attributes);

        return (new LocationResource($location))
            ->response()
            ->setStatusCode($location->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Display the specified location.
     */
    public function show(string $id)
    {
        $location = Location::findOrFail($id);

        return new LocationResource($location);
    }

    /**
     * Update the specified location.
     */
    public function update(Request $request, string $id)
    {
        $location = Location::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'latitude' => 'sometimes|required|numeric|between:-90,90',
            'longitude' => 'sometimes|required|numeric|between:-180,180',
            'address' => 'sometimes|nullable|string|max:500',
            'place_id' => 'sometimes|nullable|string|unique:locations,place_id,'.$id.',id',
            'external_id' => 'sometimes|nullable|string',
            'external_source' => 'sometimes|nullable|string|max:50',
            'category' => 'sometimes|nullable|string|max:100',
            'subcategory' => 'sometimes|nullable|string|max:100',
            'phone' => 'sometimes|nullable|string|max:20',
            'website' => 'sometimes|nullable|url',
            'rating' => 'sometimes|nullable|string|max:10',
            'review_count' => 'sometimes|nullable|integer|min:0',
            'data' => 'sometimes|nullable|json',
            'hours' => 'sometimes|nullable|json',
            'photos' => 'sometimes|nullable|json',
            'reviews' => 'sometimes|nullable|json',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        $location->update($request->all());

        return new LocationResource($location);
    }

    /**
     * Remove the specified location.
     */
    public function destroy(string $id)
    {
        $location = Location::findOrFail($id);
        $location->delete();

        return response()->json([
            'message' => 'Location deleted successfully',
        ]);
    }
}
