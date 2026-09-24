<?php

use App\Models\Location;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config()->set('services.pexels.key', 'pexels-test-key');
    config()->set('services.pexels.base_url', 'https://api.pexels.com');
    config()->set('services.wikipedia.api_url', 'https://en.wikipedia.org/w/api.php');
    config()->set('services.wikimedia.api_url', 'https://commons.wikimedia.org/w/api.php');
    Http::preventStrayRequests();
});

it('enriches a selected place with descriptions photos and videos', function () {
    $place = Location::create([
        'place_id' => 'geoapify-eiffel', 'name' => 'Eiffel Tower', 'address' => 'Paris, France',
        'latitude' => 48.85837, 'longitude' => 2.294481, 'category' => 'landmark',
        'external_source' => 'geoapify',
    ]);
    Http::fake([
        'en.wikipedia.org/w/api.php*' => Http::response(['query' => ['pages' => [[
            'pageid' => 123, 'title' => 'Eiffel Tower',
            'extract' => 'The Eiffel Tower is a wrought-iron landmark in Paris.',
            'fullurl' => 'https://en.wikipedia.org/wiki/Eiffel_Tower',
            'original' => ['source' => 'https://upload.wikimedia.org/eiffel.jpg'],
        ]]]]),
        'commons.wikimedia.org/w/api.php*' => Http::response(['query' => ['pages' => [[
            'pageid' => 456, 'title' => 'File:Eiffel Tower at night.jpg',
            'imageinfo' => [[
                'thumburl' => 'https://upload.wikimedia.org/eiffel-night-thumb.jpg',
                'descriptionurl' => 'https://commons.wikimedia.org/wiki/File:Eiffel_Tower_at_night.jpg',
                'extmetadata' => ['Artist' => ['value' => 'Example Photographer']],
            ]],
        ]]]]),
        'api.pexels.com/v1/search*' => Http::response(['photos' => [[
            'id' => 10, 'url' => 'https://www.pexels.com/photo/eiffel-10/',
            'alt' => 'Eiffel Tower from the river', 'photographer' => 'Jane Example',
            'photographer_url' => 'https://www.pexels.com/@jane-example',
            'src' => ['large' => 'https://images.pexels.com/eiffel-large.jpg'],
        ]]]),
        'api.pexels.com/v1/videos/search*' => Http::response(['videos' => [[
            'id' => 20, 'url' => 'https://www.pexels.com/video/eiffel-20/',
            'image' => 'https://images.pexels.com/eiffel-video.jpg', 'duration' => 12,
            'user' => ['name' => 'John Example', 'url' => 'https://www.pexels.com/@john-example'],
            'video_files' => [[
                'quality' => 'hd', 'file_type' => 'video/mp4', 'width' => 1280, 'height' => 720,
                'link' => 'https://videos.pexels.com/eiffel-hd.mp4',
            ]],
        ]]]),
    ]);

    $response = $this->getJson("/api/v1/places/{$place->id}");

    $response->assertOk()
        ->assertJsonPath('data.content.description', 'The Eiffel Tower is a wrought-iron landmark in Paris.')
        ->assertJsonPath('data.content.photos.0.source', 'wikipedia')
        ->assertJsonPath('data.content.photos.1.source', 'wikimedia')
        ->assertJsonPath('data.content.photos.2.source', 'pexels')
        ->assertJsonPath('data.content.videos.0.source', 'pexels')
        ->assertJsonPath('data.content.videos.0.video_url', 'https://videos.pexels.com/eiffel-hd.mp4');
    Http::assertSent(fn ($request): bool => $request->url() === 'https://api.pexels.com/v1/search?query=Eiffel%20Tower%20Paris%2C%20France&orientation=landscape&per_page=6'
        && $request->hasHeader('Authorization', 'pexels-test-key'));
});

it('still returns stored details when optional content providers are unavailable', function () {
    $place = Location::create([
        'place_id' => 'geoapify-local-cafe', 'name' => 'Local Cafe', 'address' => 'Lagos, Nigeria',
        'latitude' => 6.5244, 'longitude' => 3.3792, 'category' => 'cafe',
    ]);
    Http::fake(fn () => Http::response(['error' => 'unavailable'], 503));

    $this->getJson("/api/v1/places/{$place->id}")
        ->assertOk()
        ->assertJsonPath('data.name', 'Local Cafe')
        ->assertJsonPath('data.content.photos', [])
        ->assertJsonPath('data.content.videos', []);
});
