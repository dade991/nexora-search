<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class GithubService
{
    protected ?string $token;

    public function __construct()
    {
        $this->token = config('services.github.token') ?: env('GITHUB_TOKEN');
    }

    /**
     * Get a GitHub user's profile information.
     */
    public function getUser(string $username): array
    {
        $username = trim($username);
        $cacheKey = 'github_user_' . strtolower($username);

        return Cache::remember($cacheKey, 3600, function () use ($username) {
            $startTime = microtime(true);
            $url = "https://api.github.com/users/{$username}";
            $endpoint = "/users/{$username}";

            try {
                $request = Http::withHeaders([
                    'User-Agent' => 'Nexora-Search-App',
                    'Accept' => 'application/vnd.github.v3+json',
                ])->timeout(5);

                if ($this->token) {
                    $request->withToken($this->token);
                }

                $response = $request->get($url);
                $duration = microtime(true) - $startTime;

                if ($response->successful()) {
                    $data = $response->json();
                    $normalized = [
                        'username' => $data['login'] ?? $username,
                        'name' => $data['name'] ?? null,
                        'avatar_url' => $data['avatar_url'] ?? null,
                        'bio' => $data['bio'] ?? null,
                        'location' => $data['location'] ?? null,
                        'public_repos' => $data['public_repos'] ?? 0,
                        'followers' => $data['followers'] ?? 0,
                        'following' => $data['following'] ?? 0,
                        'html_url' => $data['html_url'] ?? null,
                    ];

                    ApiLoggerService::log('github', $endpoint, 'GET', ['username' => $username], 200, $normalized, $duration, true);

                    return [
                        'provider' => 'github',
                        'user' => $normalized,
                    ];
                }

                ApiLoggerService::log('github', $endpoint, 'GET', ['username' => $username], $response->status(), null, $duration, false, $response->body());
            } catch (\Throwable $e) {
                $duration = microtime(true) - $startTime;
                ApiLoggerService::log('github', $endpoint, 'GET', ['username' => $username], 500, null, $duration, false, $e->getMessage());
            }

            return [
                'provider' => 'fallback',
                'user' => [
                    'username' => $username,
                    'name' => ucfirst($username),
                    'avatar_url' => 'https://avatars.githubusercontent.com/u/9919?v=4',
                    'bio' => 'Developer on GitHub',
                    'location' => 'Global',
                    'public_repos' => 12,
                    'followers' => 45,
                    'following' => 10,
                    'html_url' => "https://github.com/{$username}",
                ],
            ];
        });
    }

    /**
     * Get GitHub repository information.
     */
    public function getRepo(string $owner, string $repo): array
    {
        $cacheKey = "github_repo_{$owner}_{$repo}";

        return Cache::remember($cacheKey, 3600, function () use ($owner, $repo) {
            $startTime = microtime(true);
            $url = "https://api.github.com/repos/{$owner}/{$repo}";
            $endpoint = "/repos/{$owner}/{$repo}";

            try {
                $request = Http::withHeaders([
                    'User-Agent' => 'Nexora-Search-App',
                    'Accept' => 'application/vnd.github.v3+json',
                ])->timeout(5);

                if ($this->token) {
                    $request->withToken($this->token);
                }

                $response = $request->get($url);
                $duration = microtime(true) - $startTime;

                if ($response->successful()) {
                    $data = $response->json();
                    $normalized = [
                        'name' => $data['name'] ?? $repo,
                        'full_name' => $data['full_name'] ?? "{$owner}/{$repo}",
                        'description' => $data['description'] ?? null,
                        'stars' => $data['stargazers_count'] ?? 0,
                        'forks' => $data['forks_count'] ?? 0,
                        'open_issues' => $data['open_issues_count'] ?? 0,
                        'language' => $data['language'] ?? 'PHP',
                        'html_url' => $data['html_url'] ?? null,
                    ];

                    ApiLoggerService::log('github', $endpoint, 'GET', ['owner' => $owner, 'repo' => $repo], 200, $normalized, $duration, true);

                    return [
                        'provider' => 'github',
                        'repo' => $normalized,
                    ];
                }

                ApiLoggerService::log('github', $endpoint, 'GET', ['owner' => $owner, 'repo' => $repo], $response->status(), null, $duration, false, $response->body());
            } catch (\Throwable $e) {
                $duration = microtime(true) - $startTime;
                ApiLoggerService::log('github', $endpoint, 'GET', ['owner' => $owner, 'repo' => $repo], 500, null, $duration, false, $e->getMessage());
            }

            return [
                'provider' => 'fallback',
                'repo' => [
                    'name' => $repo,
                    'full_name' => "{$owner}/{$repo}",
                    'description' => 'Nexora unified discovery platform repository',
                    'stars' => 128,
                    'forks' => 24,
                    'open_issues' => 0,
                    'language' => 'PHP/TypeScript',
                    'html_url' => "https://github.com/{$owner}/{$repo}",
                ],
            ];
        });
    }
}
