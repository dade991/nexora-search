<?php

namespace App\Models;

/**
 * Class Favorite
 *
 * Represents a saved/favorited place by a user.
 * Maps to the saved_places table.
 */
class Favorite extends SavedPlace
{
    // Inherits table, fillable, casts, and relations from SavedPlace
}
