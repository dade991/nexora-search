<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApiRequest extends Model
{
    use HasFactory;

    protected $table = 'api_requests';

    protected $fillable = [
        'external_service',
        'endpoint',
        'method',
        'parameters',
        'response_code',
        'response_data',
        'response_time',
        'success',
        'error_message',
    ];

    protected $casts = [
        'parameters' => 'array',
        'response_data' => 'array',
        'response_time' => 'float',
        'success' => 'boolean',
        'response_code' => 'integer',
    ];
}
