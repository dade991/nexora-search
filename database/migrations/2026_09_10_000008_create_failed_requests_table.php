<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('failed_requests', function (Blueprint $table) {
            $table->id();
            $table->string('external_service'); // e.g., 'google_places', 'mapbox', 'weather'
            $table->string('endpoint'); // The specific endpoint called
            $table->json('parameters')->nullable(); // Request parameters
            $table->integer('response_code')->nullable(); // HTTP response code
            $table->text('error_message'); // Error message
            $table->timestamp('failed_at'); // When the failure occurred
            $table->integer('retry_count')->default(0); // Number of retry attempts
            $table->boolean('resolved')->default(false); // Whether issue was resolved
            $table->timestamps();

            // Indexes for monitoring failed requests
            $table->index(['external_service', 'failed_at']);
            $table->index('resolved');
            $table->index(['external_service', 'endpoint']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('failed_requests');
    }
};