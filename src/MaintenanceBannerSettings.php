<?php

namespace FlatRate\ForumNavigation;

/**
 * Site-wide maintenance banner settings.
 *
 * The current hard-coded banner remains the compatibility default until an
 * administrator explicitly changes these settings. Public serialization is
 * limited to presentation-safe values.
 */
final class MaintenanceBannerSettings
{
    public const SETTING_ENABLED = 'flatrate-forum-navigation.maintenance_banner_enabled';
    public const SETTING_MESSAGE = 'flatrate-forum-navigation.maintenance_banner_message';
    public const SETTING_COLOR = 'flatrate-forum-navigation.maintenance_banner_color';
    public const SETTING_REVISION = 'flatrate-forum-navigation.maintenance_banner_revision';

    public const DEFAULT_MESSAGE = 'FLATRATE.WIKI is undergoing maintenance.';
    public const DEFAULT_COLOR = 'red';
    public const DEFAULT_REVISION = '2026-09-24-1600';

    /**
     * @var array<string, array{background: string, foreground: string}>
     */
    public const PALETTE = [
        'red' => ['background' => '#c62828', 'foreground' => '#ffffff'],
        'orange' => ['background' => '#ef6c00', 'foreground' => '#ffffff'],
        'yellow' => ['background' => '#f9a825', 'foreground' => '#111827'],
        'blue' => ['background' => '#1565c0', 'foreground' => '#ffffff'],
        'green' => ['background' => '#2e7d32', 'foreground' => '#ffffff'],
        'pink' => ['background' => '#c72d5d', 'foreground' => '#ffffff'],
    ];

    /**
     * @param mixed $value
     */
    public static function normalizeBool($value, bool $missingDefault): bool
    {
        if ($value === null || $value === '') {
            return $missingDefault;
        }

        if (is_bool($value)) {
            return $value;
        }

        if (is_int($value) || is_float($value)) {
            return (int) $value === 1;
        }

        if (is_string($value)) {
            $normalized = strtolower(trim($value));
            if ($normalized === '1' || $normalized === 'true') {
                return true;
            }
            if ($normalized === '0' || $normalized === 'false') {
                return false;
            }
        }

        return $missingDefault;
    }

    /**
     * @param mixed $value
     */
    public static function normalizeMessage($value): string
    {
        if ($value === null) {
            return self::DEFAULT_MESSAGE;
        }

        if (!is_string($value)) {
            return '';
        }

        $message = trim($value);

        // Admin UI limits this to 280 characters. Reject unexpectedly large
        // provider/config values instead of projecting them into public chrome.
        if (strlen($message) > 1120) {
            return '';
        }

        return $message;
    }

    /**
     * @param mixed $value
     */
    public static function normalizeColor($value): string
    {
        $color = is_string($value) ? strtolower(trim($value)) : '';
        return array_key_exists($color, self::PALETTE) ? $color : self::DEFAULT_COLOR;
    }

    /**
     * @param mixed $value
     */
    public static function normalizeRevision($value, string $message, string $color): string
    {
        if (is_string($value)) {
            $revision = trim($value);
            if ($revision !== '' && preg_match('/^[A-Za-z0-9_-]{1,64}$/', $revision) === 1) {
                return $revision;
            }
        }

        return substr(hash('sha256', $message . '|' . $color), 0, 16);
    }
}
