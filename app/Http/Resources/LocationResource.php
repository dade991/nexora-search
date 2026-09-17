<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class LocationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'address' => $this->address,
            'coordinates' => [
                'latitude' => (float) $this->latitude,
                'longitude' => (float) $this->longitude,
            ],
            'place_id' => $this->place_id,
            'external_ids' => [
                $this->external_source => $this->external_id,
            ] ?? null,
            'category' => $this->category,
            'subcategory' => $this->subcategory,
            'contact' => [
                'phone' => $this->phone,
                'website' => $this->website,
            ],
            'rating' => $this->rating,
            'review_count' => $this->review_count,
            'metadata' => $this->data,
            'hours' => $this->hours,
            'photos' => $this->photos,
            'reviews' => $this->reviews,
            'distance' => $this->when($this->distance, (float) $this->distance),
            'is_favorited' => $this->when($this->isFavorited, $this->isFavorited),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}