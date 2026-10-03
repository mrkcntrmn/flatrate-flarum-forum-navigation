<?php

namespace FlatRate\ForumNavigation;

/**
 * Manifest-backed Brand family slug expansion.
 * Unknown slugs and an unreadable manifest fail closed to the exact slug.
 */
final class BrandFamilySlugs
{
    /**
     * @return list<string>
     */
    public static function expandSlug(string $slug, ?array $manifest = null): array
    {
        $slug = trim($slug);
        if ($slug === '' || $slug === 'untagged') {
            return [$slug];
        }

        if ($manifest === null) {
            try {
                $manifest = NavigationManifest::load();
            } catch (\Throwable $e) {
                return [$slug];
            }
        }

        if (!isset($manifest['groups']) || !is_array($manifest['groups'])) {
            return [$slug];
        }

        $node = self::findBrand($manifest, $slug);
        if ($node === null) {
            return [$slug];
        }

        $slugs = [];
        self::collect($node, $slugs);

        return $slugs === [] ? [$slug] : $slugs;
    }

    /**
     * @param array<int, string>|string $rawSlugs
     * @return list<string>
     */
    public static function expandList($rawSlugs, ?array $manifest = null): array
    {
        $inputs = is_array($rawSlugs) ? $rawSlugs : explode(',', (string) $rawSlugs);
        $expanded = [];
        $seen = [];

        foreach ($inputs as $input) {
            foreach (self::expandSlug((string) $input, $manifest) as $slug) {
                if ($slug === '' || isset($seen[$slug])) {
                    continue;
                }
                $seen[$slug] = true;
                $expanded[] = $slug;
            }
        }

        return $expanded;
    }

    private static function findBrand(array $manifest, string $slug): ?array
    {
        foreach ($manifest['groups'] as $group) {
            if (!is_array($group) || ($group['mode'] ?? null) !== 'tree' || ($group['id'] ?? null) !== 'brands') {
                continue;
            }

            $found = self::walk($group['boards'] ?? [], $slug);
            if ($found !== null) {
                return $found;
            }
        }

        return null;
    }

    private static function walk($boards, string $slug): ?array
    {
        if (!is_array($boards)) {
            return null;
        }

        foreach ($boards as $board) {
            if (!is_array($board)) {
                continue;
            }
            if ((string) ($board['slug'] ?? '') === $slug) {
                return $board;
            }
            $child = self::walk($board['children'] ?? [], $slug);
            if ($child !== null) {
                return $child;
            }
        }

        return null;
    }

    /**
     * @param array<string, mixed> $board
     * @param list<string> $slugs
     */
    private static function collect(array $board, array &$slugs): void
    {
        $slug = (string) ($board['slug'] ?? '');
        if ($slug !== '' && !in_array($slug, $slugs, true)) {
            $slugs[] = $slug;
        }

        foreach ($board['children'] ?? [] as $child) {
            if (is_array($child)) {
                self::collect($child, $slugs);
            }
        }
    }
}
