<?php

namespace App\Services;

use App\ExternalServiceUnavailableException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class WeatherService
{
    /**
     * Get current weather conditions for given coordinates.
     */
    public function getCurrentWeather(float $latitude, float $longitude, ?string $locationName = null): array
    {
        $cacheKey = "weather_current_{$latitude}_{$longitude}";

        return Cache::remember($cacheKey, 600, function () use ($latitude, $longitude, $locationName) {
            $startTime = microtime(true);
            $url = 'https://api.open-meteo.com/v1/forecast';
            $params = [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'current' => 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
                'timezone' => 'auto',
            ];

            try {
                $response = Http::timeout(5)->get($url, $params);
                $duration = microtime(true) - $startTime;

                if ($response->successful()) {
                    $data = $response->json();
                    $current = $data['current'] ?? [];

                    $normalized = [
                        'source' => 'Open-Meteo',
                        'location' => [
                            'name' => $locationName ?? 'Coordinates ('.round($latitude, 4).', '.round($longitude, 4).')',
                            'latitude' => $latitude,
                            'longitude' => $longitude,
                            'timezone' => $data['timezone'] ?? 'UTC',
                        ],
                        'temperature' => $current['temperature_2m'] ?? null,
                        'feels_like' => $current['apparent_temperature'] ?? null,
                        'humidity' => $current['relative_humidity_2m'] ?? null,
                        'precipitation' => $current['precipitation'] ?? 0,
                        'wind_speed' => $current['wind_speed_10m'] ?? null,
                        'wind_direction' => $current['wind_direction_10m'] ?? null,
                        'condition' => $this->mapWeatherCode($current['weather_code'] ?? 0),
                        'weather_code' => $current['weather_code'] ?? 0,
                        'updated_at' => $current['time'] ?? now()->toIso8601String(),
                    ];

                    ApiLoggerService::log('weather_provider', '/forecast', 'GET', $params, $response->status(), $normalized, $duration, true);

                    return $normalized;
                }

                ApiLoggerService::log('weather_provider', '/forecast', 'GET', $params, $response->status(), null, $duration, false, $response->body());
            } catch (\Throwable $e) {
                $duration = microtime(true) - $startTime;
                ApiLoggerService::log('weather_provider', '/forecast', 'GET', $params, 500, null, $duration, false, $e->getMessage());
            }

            throw new ExternalServiceUnavailableException('open_meteo', 'Open-Meteo could not complete the request.', 502);
        });
    }

    /**
     * Get 7-day weather forecast.
     */
    public function getForecast(float $latitude, float $longitude, int $days = 7): array
    {
        $days = max(1, min(14, $days));
        $cacheKey = "weather_forecast_{$latitude}_{$longitude}_{$days}";

        return Cache::remember($cacheKey, 1800, function () use ($latitude, $longitude, $days) {
            $startTime = microtime(true);
            $url = 'https://api.open-meteo.com/v1/forecast';
            $params = [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'daily' => 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
                'forecast_days' => $days,
                'timezone' => 'auto',
            ];

            try {
                $response = Http::timeout(5)->get($url, $params);
                $duration = microtime(true) - $startTime;

                if ($response->successful()) {
                    $data = $response->json();
                    $daily = $data['daily'] ?? [];
                    $forecasts = [];

                    if (isset($daily['time'])) {
                        foreach ($daily['time'] as $index => $date) {
                            $forecasts[] = [
                                'date' => $date,
                                'max_temp' => $daily['temperature_2m_max'][$index] ?? null,
                                'min_temp' => $daily['temperature_2m_min'][$index] ?? null,
                                'precipitation' => $daily['precipitation_sum'][$index] ?? 0,
                                'max_wind' => $daily['wind_speed_10m_max'][$index] ?? null,
                                'condition' => $this->mapWeatherCode($daily['weather_code'][$index] ?? 0),
                            ];
                        }
                    }

                    $result = [
                        'source' => 'Open-Meteo',
                        'latitude' => $latitude,
                        'longitude' => $longitude,
                        'forecasts' => $forecasts,
                    ];

                    ApiLoggerService::log('weather_provider', '/forecast-daily', 'GET', $params, 200, $result, $duration, true);

                    return $result;
                }

                ApiLoggerService::log('weather_provider', '/forecast-daily', 'GET', $params, $response->status(), null, $duration, false, $response->body());
            } catch (\Throwable $e) {
                $duration = microtime(true) - $startTime;
                ApiLoggerService::log('weather_provider', '/forecast-daily', 'GET', $params, 500, null, $duration, false, $e->getMessage());
            }

            throw new ExternalServiceUnavailableException('open_meteo', 'Open-Meteo could not complete the request.', 502);
        });
    }

    /**
     * Get historical weather for coordinates.
     */
    public function getHistorical(float $latitude, float $longitude, ?string $startDate = null, ?string $endDate = null): array
    {
        $startDate = $startDate ?? now()->subDays(7)->toDateString();
        $endDate = $endDate ?? now()->subDays(1)->toDateString();

        $cacheKey = "weather_historical_{$latitude}_{$longitude}_{$startDate}_{$endDate}";

        return Cache::remember($cacheKey, 86400, function () use ($latitude, $longitude, $startDate, $endDate) {
            $startTime = microtime(true);
            $url = 'https://archive-api.open-meteo.com/v1/archive';
            $params = [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'daily' => 'temperature_2m_mean,precipitation_sum',
                'timezone' => 'auto',
            ];

            try {
                $response = Http::timeout(6)->get($url, $params);
                $duration = microtime(true) - $startTime;

                if ($response->successful()) {
                    $data = $response->json();
                    ApiLoggerService::log('weather_provider', '/archive', 'GET', $params, 200, $data, $duration, true);

                    return [
                        'source' => 'Open-Meteo Archive',
                        'latitude' => $latitude,
                        'longitude' => $longitude,
                        'history' => $data['daily'] ?? [],
                    ];
                }

                ApiLoggerService::log('weather_provider', '/archive', 'GET', $params, $response->status(), null, $duration, false, $response->body());
            } catch (\Throwable $e) {
                $duration = microtime(true) - $startTime;
                ApiLoggerService::log('weather_provider', '/archive', 'GET', $params, 500, null, $duration, false, $e->getMessage());
            }

            throw new ExternalServiceUnavailableException('open_meteo', 'Open-Meteo could not complete the request.', 502);
        });
    }

    /**
     * Convert WMO weather codes to human readable conditions and icons.
     */
    protected function mapWeatherCode(int $code): array
    {
        return match ($code) {
            0 => ['label' => 'Clear sky', 'icon' => 'sun'],
            1, 2, 3 => ['label' => 'Partly cloudy', 'icon' => 'cloud-sun'],
            45, 48 => ['label' => 'Foggy', 'icon' => 'fog'],
            51, 53, 55 => ['label' => 'Drizzle', 'icon' => 'cloud-drizzle'],
            61, 63, 65 => ['label' => 'Rain', 'icon' => 'cloud-rain'],
            71, 73, 75 => ['label' => 'Snow', 'icon' => 'snowflake'],
            80, 81, 82 => ['label' => 'Rain showers', 'icon' => 'cloud-showers-heavy'],
            95, 96, 99 => ['label' => 'Thunderstorm', 'icon' => 'bolt'],
            default => ['label' => 'Overcast', 'icon' => 'cloud'],
        };
    }
}
