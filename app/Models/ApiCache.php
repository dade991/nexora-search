<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApiCache extends Model
{
    use HasFactory;

    protected $table = 'api_cache';

    protected $fillable = [
        'external_service',
        'endpoint',
        'parameters',
        'response_data',
        'response_code',
        'expires_at',
    ];

    protected $casts = [
        'parameters' => 'array',
        'response_data' => 'array',
        'response_code' => 'integer',
        'expires_at' => 'datetime',
    ];
}
