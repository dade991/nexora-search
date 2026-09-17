<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SearchHistory extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'query',
        'location',
        'latitude',
        'longitude',
        'results_count',
        'filters',
        'results',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'filters' => 'array',
        'results' => 'array',
    ];

    /**
     * Get the user who performed the search.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}