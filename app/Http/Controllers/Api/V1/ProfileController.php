<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Arr;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();
        $user->fill(Arr::except($validated, ['preferences']));

        if (array_key_exists('preferences', $validated)) {
            $storedPreferences = $user->preferences ?? [];
            $incomingPreferences = $validated['preferences'];

            foreach (['search', 'ai', 'theme'] as $section) {
                if (array_key_exists($section, $incomingPreferences)) {
                    $storedPreferences[$section] = array_replace_recursive(
                        $storedPreferences[$section] ?? [],
                        $incomingPreferences[$section],
                    );
                }
            }

            foreach (['likes', 'dislikes', 'onboarding_completed'] as $key) {
                if (array_key_exists($key, $incomingPreferences)) {
                    $storedPreferences[$key] = $incomingPreferences[$key];
                }
            }

            $user->preferences = $storedPreferences;
        }

        $user->save();

        return response()->json(['user' => $user->fresh()]);
    }
}
