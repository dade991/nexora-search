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
        Schema::create('search_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('query'); // The search query string
            $table->string('location')->nullable(); // Location context for the search
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->integer('results_count')->default(0); // Number of results returned
            $table->json('filters')->nullable(); // Applied filters (category, price range, etc.)
            $table->json('results')->nullable(); // Store top results for quick access
            $table->timestamps();

            // Indexes for search analytics and user history
            $table->index(['user_id', 'created_at']);
            $table->index('query');
            $table->index(['latitude', 'longitude']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('search_history');
    }
};