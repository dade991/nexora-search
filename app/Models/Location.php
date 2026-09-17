<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Location extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'address',
        'latitude',
        'longitude',
        'place_id',
        'external_id',
        'external_source',
        'category',
        'subcategory',
        'phone',
        'website',
        'rating',
        'review_count',
        'data',
        'hours',
        'photos',
        'reviews',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'data' => 'array',
        'hours' => 'array',
        'photos' => 'array',
        'reviews' => 'array',
    ];

    /**
     * Get the users who have favorited this location.
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'saved_places')
            ->withTimestamps()
            ->withPivot('notes', 'tags', 'visited_at');
    }

    /**
     * Check if a user has favorited this location.
     */
    public function isFavoritedBy(User $user): bool
    {
        return $this->users()->where('user_id', $user->id)->exists();
    }
}