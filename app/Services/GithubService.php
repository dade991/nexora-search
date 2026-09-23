<?php

namespace App\Services;

use App\ExternalServiceUnavailableException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class GithubService
{
    private ?string $token;

    public function __construct()
    {
        $this->token = config('services.github.token');
    }

    public function getUser(string $username): array
    {
        $username = trim($username);

        return Cache::remember('github_user_'.mb_strtolower($username), 3600, function () use ($username): array {
            $data = $this->request("/users/{$username}");

            return ['provider' => 'github', 'user' => [
                'username' => $data['login'] ?? $username,
                'name' => $data['name'] ?? null,
                'avatar_url' => $data['avatar_url'] ?? null,
                'bio' => $data['bio'] ?? null,
                'location' => $data['location'] ?? null,
                'public_repos' => $data['public_repos'] ?? 0,
                'followers' => $data['followers'] ?? 0,
                'following' => $data['following'] ?? 0,
                'html_url' => $data['html_url'] ?? null,
            ]];
        });
    }

    public function getRepo(string $owner, string $repo): array
    {
        return Cache::remember("github_repo_{$owner}_{$repo}", 3600, function () use ($owner, $repo): array {
            $data = $this->request("/repos/{$owner}/{$repo}");

            return ['provider' => 'github', 'repo' => [
                'name' => $data['name'] ?? $repo,
                'full_name' => $data['full_name'] ?? "{$owner}/{$repo}",
                'description' => $data['description'] ?? null,
                'stars' => $data['stargazers_count'] ?? 0,
                'forks' => $data['forks_count'] ?? 0,
                'open_issues' => $data['open_issues_count'] ?? 0,
                'language' => $data['language'] ?? null,
                'html_url' => $data['html_url'] ?? null,
            ]];
        });
    }

    private function request(string $endpoint): array
    {
        $startedAt = microtime(true);

        try {
            $request = Http::acceptJson()->withHeaders(['User-Agent' => 'Nexora-Search'])->connectTimeout(3)->timeout(8);
            if (filled($this->token)) {
                $request = $request->withToken($this->token);
            }
            $response = $request->get('https://api.github.com'.$endpoint);
        } catch (\Throwable $e) {
            $duration = microtime(true) - $startedAt;
            ApiLoggerService::log('github', $endpoint, 'GET', null, 503, null, $duration, false, $e->getMessage());

            throw new ExternalServiceUnavailableException('github', 'GitHub could not complete the request.', 503);
        }

        $duration = microtime(true) - $startedAt;
        ApiLoggerService::log('github', $endpoint, 'GET', null, $response->status(), null, $duration, $response->successful(), $response->successful() ? null : $response->body());

        if ($response->notFound()) {
            throw new ExternalServiceUnavailableException('github', 'The requested GitHub resource was not found.', 404);
        }
        if (! $response->successful()) {
            throw new ExternalServiceUnavailableException('github', 'GitHub could not complete the request.', 503);
        }

        return $response->json();
    }
}
