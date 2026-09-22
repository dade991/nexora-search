<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $locations = [
            [
                'name' => 'Central Park',
                'address' => '59th to 110th St, New York, NY 10022, United States',
                'latitude' => 40.785091,
                'longitude' => -73.968285,
                'place_id' => 'nexora_place_central_park',
                'external_id' => 'ChIJ4zGFAZpYwokRGUGph3Oh3Sg',
                'external_source' => 'google',
                'category' => 'park',
                'subcategory' => 'Urban Park',
                'phone' => '+1 212-310-6600',
                'website' => 'https://www.centralparknyc.org',
                'rating' => '4.8',
                'review_count' => 142500,
                'hours' => [
                    'monday' => '06:00 - 01:00',
                    'tuesday' => '06:00 - 01:00',
                    'wednesday' => '06:00 - 01:00',
                    'thursday' => '06:00 - 01:00',
                    'friday' => '06:00 - 01:00',
                    'saturday' => '06:00 - 01:00',
                    'sunday' => '06:00 - 01:00',
                ],
                'photos' => [
                    'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?auto=format&fit=crop&w=800&q=80',
                ],
                'reviews' => [
                    [
                        'author_name' => 'Emma Watson',
                        'rating' => 5,
                        'text' => 'An iconic oasis right in the heart of Manhattan. Incredible paths, Bethesda Terrace, and lakes.',
                        'relative_time_description' => '3 days ago',
                    ],
                    [
                        'author_name' => 'David Miller',
                        'rating' => 5,
                        'text' => 'Great place for morning jogs, picnics, and boat rentals on the lake.',
                        'relative_time_description' => '2 weeks ago',
                    ],
                ],
            ],
            [
                'name' => 'Eiffel Tower',
                'address' => 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
                'latitude' => 48.858370,
                'longitude' => 2.294481,
                'place_id' => 'nexora_place_eiffel_tower',
                'external_id' => 'ChIJLU7jZClu5kcR4PcOOO6p3I0',
                'external_source' => 'google',
                'category' => 'landmark',
                'subcategory' => 'Monument',
                'phone' => '+33 892 70 12 39',
                'website' => 'https://www.toureiffel.paris',
                'rating' => '4.7',
                'review_count' => 320000,
                'hours' => [
                    'monday' => '09:00 - 23:45',
                    'tuesday' => '09:00 - 23:45',
                    'wednesday' => '09:00 - 23:45',
                    'thursday' => '09:00 - 23:45',
                    'friday' => '09:00 - 23:45',
                    'saturday' => '09:00 - 23:45',
                    'sunday' => '09:00 - 23:45',
                ],
                'photos' => [
                    'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
                ],
                'reviews' => [
                    [
                        'author_name' => 'Claire Dupont',
                        'rating' => 5,
                        'text' => 'Breathtaking 360-degree panorama of Paris from the summit. The hourly sparkle light show at night is unforgettable.',
                        'relative_time_description' => '1 day ago',
                    ],
                ],
            ],
            [
                'name' => 'Louvre Museum',
                'address' => 'Rue de Rivoli, 75001 Paris, France',
                'latitude' => 48.860611,
                'longitude' => 2.337644,
                'place_id' => 'nexora_place_louvre',
                'external_id' => 'ChIJD3uTd9hx5kcR1IQVIISy_A0',
                'external_source' => 'google',
                'category' => 'museum',
                'subcategory' => 'Art Museum',
                'phone' => '+33 1 40 20 50 50',
                'website' => 'https://www.louvre.fr',
                'rating' => '4.8',
                'review_count' => 258000,
                'hours' => [
                    'monday' => '09:00 - 18:00',
                    'tuesday' => 'Closed',
                    'wednesday' => '09:00 - 18:00',
                    'thursday' => '09:00 - 18:00',
                    'friday' => '09:00 - 21:45',
                    'saturday' => '09:00 - 18:00',
                    'sunday' => '09:00 - 18:00',
                ],
                'photos' => [
                    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80',
                ],
                'reviews' => [
                    [
                        'author_name' => 'Lucas Bernard',
                        'rating' => 5,
                        'text' => 'Home to Mona Lisa, Winged Victory, and Venus de Milo. Book advance tickets to skip the line.',
                        'relative_time_description' => '4 days ago',
                    ],
                ],
            ],
            [
                'name' => 'Tsukiji Outer Market',
                'address' => '4 Chome-16-2 Tsukiji, Chuo City, Tokyo 104-0045, Japan',
                'latitude' => 35.665486,
                'longitude' => 139.770667,
                'place_id' => 'nexora_place_tsukiji',
                'external_id' => 'ChIJ_zXWjV6LGGARc82G54yB5L0',
                'external_source' => 'google',
                'category' => 'restaurant',
                'subcategory' => 'Seafood & Street Food',
                'phone' => '+81 3-3541-9444',
                'website' => 'https://www.tsukiji.or.jp',
                'rating' => '4.6',
                'review_count' => 48200,
                'hours' => [
                    'monday' => '08:00 - 14:00',
                    'tuesday' => '08:00 - 14:00',
                    'wednesday' => '08:00 - 14:00',
                    'thursday' => '08:00 - 14:00',
                    'friday' => '08:00 - 14:00',
                    'saturday' => '08:00 - 14:00',
                    'sunday' => 'Closed',
                ],
                'photos' => [
                    'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&q=80',
                ],
                'reviews' => [
                    [
                        'author_name' => 'Kenji Sato',
                        'rating' => 5,
                        'text' => 'The freshest sashimi, wagyu skewers, and tamagoyaki in Tokyo. Come early around 8 AM.',
                        'relative_time_description' => '1 week ago',
                    ],
                ],
            ],
            [
                'name' => 'Sydney Opera House',
                'address' => 'Bennelong Point, Sydney NSW 2000, Australia',
                'latitude' => -33.856784,
                'longitude' => 151.215297,
                'place_id' => 'nexora_place_sydney_opera_house',
                'external_id' => 'ChIJ3S-JXmauEmsRUcIaWtf4MzE',
                'external_source' => 'mapbox',
                'category' => 'landmark',
                'subcategory' => 'Performing Arts Center',
                'phone' => '+61 2 9250 7111',
                'website' => 'https://www.sydneyoperahouse.com',
                'rating' => '4.8',
                'review_count' => 125000,
                'hours' => [
                    'monday' => '09:00 - 17:00',
                    'tuesday' => '09:00 - 17:00',
                    'wednesday' => '09:00 - 17:00',
                    'thursday' => '09:00 - 17:00',
                    'friday' => '09:00 - 17:00',
                    'saturday' => '09:00 - 17:00',
                    'sunday' => '09:00 - 17:00',
                ],
                'photos' => [
                    'https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?auto=format&fit=crop&w=1200&q=80',
                ],
                'reviews' => [
                    [
                        'author_name' => 'Liam O’Connor',
                        'rating' => 5,
                        'text' => 'Architectural masterpiece by Jørn Utzon right on the harbour. Opera Bar outside is spectacular at sunset.',
                        'relative_time_description' => '3 weeks ago',
                    ],
                ],
            ],
            [
                'name' => 'The British Museum',
                'address' => 'Great Russell St, London WC1B 3DG, United Kingdom',
                'latitude' => 51.519413,
                'longitude' => -0.126956,
                'place_id' => 'nexora_place_british_museum',
                'external_id' => 'ChIJd8BlQ2BxdkgRAFzTM9x_2iY',
                'external_source' => 'google',
                'category' => 'museum',
                'subcategory' => 'History Museum',
                'phone' => '+44 20 7323 8000',
                'website' => 'https://www.britishmuseum.org',
                'rating' => '4.7',
                'review_count' => 140000,
                'hours' => [
                    'monday' => '10:00 - 17:00',
                    'tuesday' => '10:00 - 17:00',
                    'wednesday' => '10:00 - 17:00',
                    'thursday' => '10:00 - 17:00',
                    'friday' => '10:00 - 20:30',
                    'saturday' => '10:00 - 17:00',
                    'sunday' => '10:00 - 17:00',
                ],
                'photos' => [
                    'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=1200&q=80',
                ],
                'reviews' => [
                    [
                        'author_name' => 'James Thornton',
                        'rating' => 5,
                        'text' => 'Remarkable collection covering human history, art, and culture. The Great Court glass ceiling is stunning.',
                        'relative_time_description' => '5 days ago',
                    ],
                ],
            ],
            [
                'name' => 'Caffè Florian',
                'address' => 'Piazza San Marco, 57, 30124 Venezia VE, Italy',
                'latitude' => 45.433917,
                'longitude' => 12.338575,
                'place_id' => 'nexora_place_caffe_florian',
                'external_id' => 'ChIJB6W19ZqxfkcRx7n7P8F0b2w',
                'external_source' => 'google',
                'category' => 'cafe',
                'subcategory' => 'Historic Coffee House',
                'phone' => '+39 041 520 5641',
                'website' => 'https://www.caffeflorian.com',
                'rating' => '4.5',
                'review_count' => 18500,
                'hours' => [
                    'monday' => '09:00 - 23:00',
                    'tuesday' => '09:00 - 23:00',
                    'wednesday' => '09:00 - 23:00',
                    'thursday' => '09:00 - 23:00',
                    'friday' => '09:00 - 23:00',
                    'saturday' => '09:00 - 23:00',
                    'sunday' => '09:00 - 23:00',
                ],
                'photos' => [
                    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
                ],
                'reviews' => [
                    [
                        'author_name' => 'Sofia Rossi',
                        'rating' => 5,
                        'text' => 'The oldest cafe in Italy (1720). Sipping espresso while listening to the live orchestra on St. Marks Square is magical.',
                        'relative_time_description' => '6 days ago',
                    ],
                ],
            ],
            [
                'name' => 'Marina Bay Sands',
                'address' => '10 Bayfront Ave, Singapore 018956',
                'latitude' => 1.283398,
                'longitude' => 103.860714,
                'place_id' => 'nexora_place_marina_bay_sands',
                'external_id' => 'ChIJPTt86LIZ2jERLzJ23iT4_hU',
                'external_source' => 'google',
                'category' => 'hotel',
                'subcategory' => 'Luxury Resort & SkyPark',
                'phone' => '+65 6688 8868',
                'website' => 'https://www.marinabaysands.com',
                'rating' => '4.7',
                'review_count' => 189000,
                'hours' => [
                    'monday' => 'Open 24 hours',
                    'tuesday' => 'Open 24 hours',
                    'wednesday' => 'Open 24 hours',
                    'thursday' => 'Open 24 hours',
                    'friday' => 'Open 24 hours',
                    'saturday' => 'Open 24 hours',
                    'sunday' => 'Open 24 hours',
                ],
                'photos' => [
                    'https://images.unsplash.com/photo-1506351421178-63788970eeea?auto=format&fit=crop&w=1200&q=80',
                ],
                'reviews' => [
                    [
                        'author_name' => 'Tan Wei Ming',
                        'rating' => 5,
                        'text' => 'World-famous infinity pool on top of the towers with mesmerizing views of the Singapore skyline and Gardens by the Bay.',
                        'relative_time_description' => '1 week ago',
                    ],
                ],
            ],
        ];

        foreach ($locations as $locData) {
            Location::updateOrCreate(
                ['place_id' => $locData['place_id']],
                $locData
            );
        }
    }
}
