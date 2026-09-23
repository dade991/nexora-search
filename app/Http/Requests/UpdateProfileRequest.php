<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $hexColor = ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'];

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'occupation' => ['sometimes', 'nullable', 'string', 'max:120'],
            'age' => ['sometimes', 'nullable', 'integer', 'min:13', 'max:120'],
            'gender' => ['sometimes', 'nullable', 'string', 'max:80'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'preferences' => ['sometimes', 'array:likes,dislikes,onboarding_completed,search,ai,theme'],
            'preferences.likes' => ['sometimes', 'array', 'max:20'],
            'preferences.likes.*' => ['string', 'max:80'],
            'preferences.dislikes' => ['sometimes', 'array', 'max:20'],
            'preferences.dislikes.*' => ['string', 'max:80'],
            'preferences.onboarding_completed' => ['sometimes', 'boolean'],
            'preferences.search' => ['sometimes', 'array:radius,view,use_location,save_history,layout'],
            'preferences.search.radius' => ['sometimes', 'integer', 'min:5', 'max:50000'],
            'preferences.search.view' => ['sometimes', Rule::in(['split', 'grid', 'list'])],
            'preferences.search.use_location' => ['sometimes', 'boolean'],
            'preferences.search.save_history' => ['sometimes', 'boolean'],
            'preferences.search.layout' => ['sometimes', Rule::in(['compact', 'floating', 'hero'])],
            'preferences.ai' => ['sometimes', 'array:use_preferences'],
            'preferences.ai.use_preferences' => ['sometimes', 'boolean'],
            'preferences.theme' => ['sometimes', 'array:preset,custom'],
            'preferences.theme.preset' => ['sometimes', Rule::in(['system', 'nexora', 'light', 'dark', 'maps-light', 'maps-dark', 'custom'])],
            'preferences.theme.custom' => ['sometimes', 'array:page,surface,surfaceElevated,text,textMuted,border,brand,accent,success,warning,error,mapSurface,mapText,radius,density'],
            'preferences.theme.custom.page' => $hexColor,
            'preferences.theme.custom.surface' => $hexColor,
            'preferences.theme.custom.surfaceElevated' => $hexColor,
            'preferences.theme.custom.text' => $hexColor,
            'preferences.theme.custom.textMuted' => $hexColor,
            'preferences.theme.custom.border' => $hexColor,
            'preferences.theme.custom.brand' => $hexColor,
            'preferences.theme.custom.accent' => $hexColor,
            'preferences.theme.custom.success' => $hexColor,
            'preferences.theme.custom.warning' => $hexColor,
            'preferences.theme.custom.error' => $hexColor,
            'preferences.theme.custom.mapSurface' => $hexColor,
            'preferences.theme.custom.mapText' => $hexColor,
            'preferences.theme.custom.radius' => ['sometimes', Rule::in(['compact', 'comfortable', 'rounded'])],
            'preferences.theme.custom.density' => ['sometimes', Rule::in(['compact', 'comfortable', 'spacious'])],
        ];
    }
}
