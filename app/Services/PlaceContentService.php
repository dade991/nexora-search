<?php

namespace App\Services;

use App\Models\Location;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

class PlaceContentService
{
    /** @return array<string, mixed> */
    public function for(Location $place): array
    {
        $cacheKey = 'place_content_v1_'.md5($place->name.'|'.$place->address);

        return Cache::remember($cacheKey, now()->addDay(), fn (): array => $this->fetch($place));
    }

    /** @return array<string, mixed> */
    private function fetch(Location $place): array
    {
        $query = trim($place->name.' '.$place->address);

        try {
            $responses = Http::pool(function (Pool $pool) use ($query): array {
                $requests = [
                    $pool->as('wikipedia')->acceptJson()->connectTimeout(3)->timeout(8)
                        ->get(config('services.wikipedia.api_url'), $this->wikipediaParameters($query)),
                    $pool->as('wikimedia')->acceptJson()->connectTimeout(3)->timeout(8)
                        ->get(config('services.wikimedia.api_url'), $this->wikimediaParameters($query)),
                ];

                if (filled(config('services.pexels.key'))) {
                    $requests[] = $pool->as('pexels_photos')->acceptJson()
                        ->withHeader('Authorization', config('services.pexels.key'))
                        ->connectTimeout(3)->timeout(8)
                        ->get(config('services.pexels.base_url').'/v1/search', [
                            'query' => $query, 'orientation' => 'landscape', 'per_page' => 6,
                        ]);
                    $requests[] = $pool->as('pexels_videos')->acceptJson()
                        ->withHeader('Authorization', config('services.pexels.key'))
                        ->connectTimeout(3)->timeout(8)
                        ->get(config('services.pexels.base_url').'/v1/videos/search', [
                            'query' => $query, 'orientation' => 'landscape', 'per_page' => 4,
                        ]);
                }

                return $requests;
            });
        } catch (Throwable) {
            return $this->emptyContent();
        }

        $wikipedia = $this->successful($responses['wikipedia'] ?? null);
        $wikimedia = $this->successful($responses['wikimedia'] ?? null);
        $pexelsPhotos = $this->successful($responses['pexels_photos'] ?? null);
        $pexelsVideos = $this->successful($responses['pexels_videos'] ?? null);
        $wikipediaPages = $wikipedia?->json('query.pages', []);
        $wikipediaPage = collect(is_array($wikipediaPages) ? $wikipediaPages : [])->first();

        $photos = collect();
        if (filled(data_get($wikipediaPage, 'original.source'))) {
            $photos->push([
                'id' => 'wikipedia-'.data_get($wikipediaPage, 'pageid'),
                'source' => 'wikipedia',
                'image_url' => data_get($wikipediaPage, 'original.source'),
                'page_url' => data_get($wikipediaPage, 'fullurl'),
                'caption' => data_get($wikipediaPage, 'title'),
                'creator' => null,
            ]);
        }

        $photos->push(...$this->wikimediaPhotos($wikimedia));
        $photos->push(...$this->pexelsPhotos($pexelsPhotos));

        return [
            'description' => data_get($wikipediaPage, 'extract'),
            'article_url' => data_get($wikipediaPage, 'fullurl'),
            'photos' => $photos->filter(fn (array $photo): bool => filled($photo['image_url']))->unique('image_url')->values()->all(),
            'videos' => $this->pexelsVideos($pexelsVideos),
            'attribution' => [
                'Place data © OpenStreetMap contributors via Geoapify',
                'Encyclopedic content from Wikipedia and Wikimedia Commons',
                'Additional photos and videos provided by Pexels',
            ],
        ];
    }

    /** @return array<string, int|string> */
    private function wikipediaParameters(string $query): array
    {
        return [
            'action' => 'query', 'generator' => 'search', 'gsrsearch' => $query, 'gsrlimit' => 1,
            'prop' => 'extracts|pageimages|info', 'exintro' => 1, 'explaintext' => 1,
            'piprop' => 'original', 'inprop' => 'url', 'redirects' => 1, 'format' => 'json',
            'origin' => '*',
        ];
    }

    /** @return array<string, int|string> */
    private function wikimediaParameters(string $query): array
    {
        return [
            'action' => 'query', 'generator' => 'search', 'gsrsearch' => $query.' filetype:bitmap',
            'gsrnamespace' => 6, 'gsrlimit' => 5, 'prop' => 'imageinfo',
            'iiprop' => 'url|extmetadata', 'iiurlwidth' => 1400, 'format' => 'json', 'origin' => '*',
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function wikimediaPhotos(?Response $response): array
    {
        $pages = $response?->json('query.pages', []);

        return collect(is_array($pages) ? $pages : [])->map(fn (array $page): array => [
            'id' => 'wikimedia-'.($page['pageid'] ?? md5((string) ($page['title'] ?? ''))),
            'source' => 'wikimedia',
            'image_url' => data_get($page, 'imageinfo.0.thumburl') ?? data_get($page, 'imageinfo.0.url'),
            'page_url' => data_get($page, 'imageinfo.0.descriptionurl'),
            'caption' => str_replace('File:', '', (string) ($page['title'] ?? '')),
            'creator' => strip_tags((string) data_get($page, 'imageinfo.0.extmetadata.Artist.value')) ?: null,
        ])->values()->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function pexelsPhotos(?Response $response): array
    {
        $photos = $response?->json('photos', []);

        return collect(is_array($photos) ? $photos : [])->map(fn (array $photo): array => [
            'id' => 'pexels-'.($photo['id'] ?? ''),
            'source' => 'pexels',
            'image_url' => data_get($photo, 'src.large') ?? data_get($photo, 'src.original'),
            'page_url' => $photo['url'] ?? null,
            'caption' => $photo['alt'] ?? null,
            'creator' => $photo['photographer'] ?? null,
            'creator_url' => $photo['photographer_url'] ?? null,
        ])->values()->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function pexelsVideos(?Response $response): array
    {
        $videos = $response?->json('videos', []);

        return collect(is_array($videos) ? $videos : [])->map(function (array $video): array {
            $videoFiles = $video['video_files'] ?? [];
            $file = collect(is_array($videoFiles) ? $videoFiles : [])
                ->filter(fn (array $candidate): bool => ($candidate['file_type'] ?? null) === 'video/mp4')
                ->sortByDesc(fn (array $candidate): int => (int) ($candidate['width'] ?? 0))
                ->first();

            return [
                'id' => 'pexels-'.($video['id'] ?? ''),
                'source' => 'pexels',
                'video_url' => $file['link'] ?? null,
                'page_url' => $video['url'] ?? null,
                'thumbnail_url' => $video['image'] ?? null,
                'duration_seconds' => $video['duration'] ?? null,
                'creator' => data_get($video, 'user.name'),
                'creator_url' => data_get($video, 'user.url'),
            ];
        })->filter(fn (array $video): bool => filled($video['video_url']))->values()->all();
    }

    private function successful(mixed $response): ?Response
    {
        return $response instanceof Response && $response->successful() ? $response : null;
    }

    /** @return array<string, mixed> */
    private function emptyContent(): array
    {
        return ['description' => null, 'article_url' => null, 'photos' => [], 'videos' => [], 'attribution' => []];
    }
}
