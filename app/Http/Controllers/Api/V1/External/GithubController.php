<?php

namespace App\Http\Controllers\Api\V1\External;

use App\Http\Controllers\Controller;
use App\Services\GithubService;
use Illuminate\Http\JsonResponse;

class GithubController extends Controller
{
    public function __construct(protected GithubService $githubService) {}

    /**
     * Get user profile on GitHub.
     */
    public function user(string $username): JsonResponse
    {
        $userData = $this->githubService->getUser($username);

        return response()->json($userData);
    }

    /**
     * Get GitHub repository details.
     */
    public function repo(string $owner, string $repo): JsonResponse
    {
        $repoData = $this->githubService->getRepo($owner, $repo);

        return response()->json($repoData);
    }
}
