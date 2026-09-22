<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FailedRequest extends Model
{
    use HasFactory;

    protected $table = 'failed_requests';

    protected $fillable = [
        'external_service',
        'endpoint',
        'parameters',
        'response_code',
        'error_message',
        'failed_at',
        'retry_count',
        'resolved',
    ];

    protected $casts = [
        'parameters' => 'array',
        'response_code' => 'integer',
        'failed_at' => 'datetime',
        'retry_count' => 'integer',
        'resolved' => 'boolean',
    ];
}
