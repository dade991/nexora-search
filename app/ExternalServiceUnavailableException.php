<?php

namespace App;

use RuntimeException;

class ExternalServiceUnavailableException extends RuntimeException
{
    public function __construct(
        public readonly string $provider,
        string $message = 'The external service is currently unavailable.',
        public readonly int $status = 503,
        public readonly ?string $publicCode = null,
    ) {
        parent::__construct($message);
    }
}
