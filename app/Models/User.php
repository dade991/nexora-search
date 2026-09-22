<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $avatar
 * @property string|null $bio
 * @property string|null $location
 * @property float|null $latitude
 * @property float|null $longitude
 * @property array|null $preferences
 * @property array|null $notification_settings
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property Carbon|null $last_seen_at
 * @property bool $is_public
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'avatar', 'bio', 'location', 'latitude', 'longitude', 'preferences', 'notification_settings', 'is_public'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'preferences' => 'array',
            'notification_settings' => 'array',
            'last_seen_at' => 'datetime',
            'is_public' => 'boolean',
        ];
    }

    /**
     * Get the locations favorited by the user.
     */
    public function favorites()
    {
        return $this->belongsToMany(Location::class, 'saved_places')
            ->withTimestamps()
            ->withPivot('notes', 'tags', 'visited_at');
    }

    /**
     * Get the user's search history.
     */
    public function searchHistory()
    {
        return $this->hasMany(SearchHistory::class);
    }
}
