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
        Schema::create('api_cache', function (Blueprint $table) {
            $table->id();
            $table->string('external_service'); // e.g., 'google_places', 'mapbox', 'weather'
            $table->string('endpoint'); // The specific endpoint called
            $table->json('parameters')->nullable(); // Request parameters used for caching
            $table->json('response_data'); // Cached response data
            $table->integer('response_code'); // HTTP response code
            $table->timestamp('expires_at'); // When cache expires
            $table->timestamps();

            // Indexes for cache lookup and cleanup
            $table->unique(['external_service', 'endpoint', 'parameters'], 'cache_unique_lookup');
            $table->index('expires_at'); // For cleaning expired cache entries
            $table->index(['external_service', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_cache');
    }
};