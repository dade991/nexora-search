<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SavedPlace extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'saved_places';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'location_id',
        'notes',
        'tags',
        'visited_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'tags' => 'array',
        'visited_at' => 'datetime',
    ];

    /**
     * Get the user that saved the place.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the location that was saved.
     */
    public function location()
    {
        return $this->belongsTo(Location::class);
    }
}