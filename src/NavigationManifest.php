<?php

namespace FlatRate\ForumNavigation;

use InvalidArgumentException;
use RuntimeException;

final class NavigationManifest
{
    private static ?array $cached = null;

    public static function assetPath(): string
    {
        return dirname(__DIR__) . '/resources/navigation-runtime-manifest.json';
    }

    public static function load(): array
    {
        if (self::$cached !== null) {
            return self::$cached;
        }

        $path = self::assetPath();
        if (!is_file($path)) {
            throw new RuntimeException('Navigation runtime manifest asset is missing: ' . $path);
        }

        $decoded = json_decode((string) file_get_contents($path), true);
        if (!is_array($decoded)) {
            throw new RuntimeException('Navigation runtime manifest asset is invalid JSON');
        }

        self::assertValid($decoded);
        self::$cached = $decoded;

        return self::$cached;
    }

    public static function communityRoute(): string
    {
        return (string) (self::load()['community']['route'] ?? '/community');
    }

    public static function generalLiveAvailable(): bool
    {
        return (bool) (self::load()['community']['generalLiveAvailable'] ?? false);
    }

    public static function assertValid(array $manifest): void
    {
        if (($manifest['schemaVersion'] ?? null) !== 1) {
            throw new InvalidArgumentException('schemaVersion must be 1');
        }
        if (($manifest['kind'] ?? null) !== 'forum-navigation-runtime-manifest') {
            throw new InvalidArgumentException('kind mismatch');
        }
        if (!isset($manifest['groups']) || !is_array($manifest['groups']) || count($manifest['groups']) !== 3) {
            throw new InvalidArgumentException('exactly three groups required');
        }

        $labels = array_map(static fn ($group) => $group['label'] ?? null, $manifest['groups']);
        if ($labels !== ['Community', 'Technician Topics', 'Brands']) {
            throw new InvalidArgumentException('group order must be Community, Technician Topics, Brands');
        }

        $modes = array_map(static fn ($group) => [$group['id'] ?? null, $group['mode'] ?? null], $manifest['groups']);
        if ($modes !== [
            ['community', 'link'],
            ['technician-topics', 'link'],
            ['brands', 'tree'],
        ]) {
            throw new InvalidArgumentException('sidebar modes mismatch');
        }

        $technician = $manifest['groups'][1]['destination'] ?? [];
        if (($technician['boardKey'] ?? null) !== 'general-shop-discussion'
            || ($technician['slug'] ?? null) !== 'general-shop-discussion') {
            throw new InvalidArgumentException('Technician Topics destination must remain general-shop-discussion');
        }

        $brands = $manifest['groups'][2]['boards'] ?? null;
        if (!is_array($brands)) {
            throw new InvalidArgumentException('Brands boards required');
        }

        $keys = [];
        $walk = static function (array $nodes) use (&$walk, &$keys): void {
            foreach ($nodes as $node) {
                $key = $node['boardKey'] ?? null;
                if (!is_string($key) || $key === '') {
                    throw new InvalidArgumentException('brand boardKey required');
                }
                if (str_ends_with($key, '-live') || in_array($key, ['start-here', 'general-live', 'community-general-live'], true)) {
                    throw new InvalidArgumentException('forbidden sidebar child: ' . $key);
                }
                $keys[] = $key;
                $children = $node['children'] ?? [];
                if (!is_array($children)) {
                    throw new InvalidArgumentException('children must be an array for ' . $key);
                }
                $walk($children);
            }
        };
        $walk($brands);

        if (count($keys) !== 41 || count(array_unique($keys)) !== 41) {
            throw new InvalidArgumentException('BRAND_BOARD_COUNT must be 41 without duplicates');
        }

        $byKey = [];
        $index = static function (array $nodes) use (&$index, &$byKey): void {
            foreach ($nodes as $node) {
                $byKey[$node['boardKey']] = $node;
                $index($node['children'] ?? []);
            }
        };
        $index($brands);

        $gmNames = array_map(static fn ($child) => $child['name'] ?? null, $byKey['gm']['children'] ?? []);
        $cdjrNames = array_map(static fn ($child) => $child['name'] ?? null, $byKey['cdjr']['children'] ?? []);
        if ($gmNames !== ['Buick', 'Cadillac', 'Chevrolet', 'GMC']) {
            throw new InvalidArgumentException('GM children mismatch');
        }
        if ($cdjrNames !== ['Chrysler', 'Dodge', 'Jeep', 'Ram']) {
            throw new InvalidArgumentException('CDJR children mismatch');
        }

        if (($manifest['community']['generalLiveAvailable'] ?? null) !== false) {
            throw new InvalidArgumentException('GENERAL_LIVE_AVAILABLE must be false in C1');
        }
    }
}
