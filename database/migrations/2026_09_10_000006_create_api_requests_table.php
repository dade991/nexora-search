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
        Schema::create('api_requests', function (Blueprint $table) {
            $table->id();
            $table->string('external_service'); // e.g., 'google_places', 'mapbox', 'weather'
            $table->string('endpoint'); // The specific endpoint called
            $table->string('method')->default('GET'); // HTTP method
            $table->json('parameters')->nullable(); // Request parameters
            $table->integer('response_code')->nullable(); // HTTP response code
            $table->json('response_data')->nullable(); // Response data (may be truncated)
            $table->float('response_time')->nullable(); // Response time in seconds
            $table->boolean('success')->default(true); // Whether request was successful
            $table->text('error_message')->nullable(); // Error message if failed
            $table->timestamps();

            // Indexes for monitoring and debugging
            $table->index(['external_service', 'created_at']);
            $table->index('success');
            $table->index('response_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_requests');
    }
};