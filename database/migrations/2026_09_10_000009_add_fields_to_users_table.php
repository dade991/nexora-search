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
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar')->nullable(); // User avatar URL
            $table->string('bio')->nullable(); // User bio/description
            $table->string('location')->nullable(); // User's current location
            $table->decimal('latitude', 10, 8)->nullable(); // User's latitude
            $table->decimal('longitude', 11, 8)->nullable(); // User's longitude
            $table->json('preferences')->nullable(); // User preferences/settings
            $table->json('notification_settings')->nullable(); // Notification preferences
            $table->timestamp('last_seen_at')->nullable(); // When user was last active
            $table->boolean('is_public')->default(true); // Whether profile is public
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['avatar', 'bio', 'location', 'latitude', 'longitude', 'preferences', 'notification_settings', 'last_seen_at', 'is_public']);
        });
    }
};