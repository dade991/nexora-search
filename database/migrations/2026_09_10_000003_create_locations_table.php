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
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('address')->nullable();
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->string('place_id')->unique()->nullable(); // Google Places ID or similar
            $table->string('external_id')->nullable(); // ID from external APIs
            $table->string('external_source')->nullable(); // e.g., 'google', 'mapbox', 'foursquare'
            $table->json('data')->nullable(); // Store raw API response data
            $table->string('category')->nullable(); // Type of place (restaurant, park, etc.)
            $table->string('subcategory')->nullable(); // More specific type
            $table->string('phone')->nullable();
            $table->string('website')->nullable();
            $table->string('rating')->nullable(); // Store as string to handle various formats
            $table->integer('review_count')->default(0);
            $table->json('hours')->nullable(); // Opening hours in JSON format
            $table->json('photos')->nullable(); // Photo references/URLs
            $table->json('reviews')->nullable(); // Recent reviews
            $table->timestamps();
            $table->softDeletes(); // For soft deletes

            // Indexes for common search queries
            $table->index(['latitude', 'longitude']);
            $table->index('category');
            $table->index('external_source');
            $table->index('external_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};