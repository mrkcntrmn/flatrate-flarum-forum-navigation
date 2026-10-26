<?php

namespace FlatRate\ForumNavigation\Search\Filter;

use Flarum\Settings\SettingsRepositoryInterface;

/**
 * Historical MAIN pin id normalization. Flarum 2 does not register this filter.
 * Native discussion search owns the list. The id helper stays so stored pin
 * lists keep a single fail-closed parser.
 */
final class MainPinsFilter
{
    public const SETTING_PUBLIC = 'flatrate-forum-navigation.public_main_pinned_discussion_ids';
    public const SETTING_MEMBER = 'flatrate-forum-navigation.member_main_pinned_discussion_ids';

    private SettingsRepositoryInterface $settings;

    public function __construct(SettingsRepositoryInterface $settings)
    {
        $this->settings = $settings;
    }

    public function getFilterKey(): string
    {
        return 'flatrateMainPins';
    }

    public function filter($filterState, string $filterValue, bool $negate): void
    {
        $audience = strtolower(trim($filterValue));
        $ids = $this->idsForAudience($audience);

        if ($ids === []) {
            // Fail closed: invalid audience or empty/invalid config matches nothing.
            $filterState->getQuery()->whereRaw('0 = 1');

            return;
        }

        $filterState->getQuery()->whereIn('discussions.id', $ids, 'and', $negate);
    }

    /**
     * @return list<int>
     */
    public function idsForAudience(string $audience): array
    {
        if ($audience === 'public') {
            return self::normalizeIds($this->settings->get(self::SETTING_PUBLIC));
        }

        if ($audience === 'member') {
            return self::normalizeIds($this->settings->get(self::SETTING_MEMBER));
        }

        return [];
    }

    /**
     * @param mixed $raw
     * @return list<int>
     */
    public static function normalizeIds($raw): array
    {
        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return [];
            }
            $raw = $decoded;
        }

        if (!is_array($raw)) {
            return [];
        }

        $ids = [];
        $seen = [];

        foreach ($raw as $entry) {
            if (is_string($entry) && is_numeric($entry)) {
                $entry = (int) $entry;
            }

            if (!is_int($entry) && !(is_float($entry) && $entry == (int) $entry)) {
                continue;
            }

            $id = (int) $entry;
            if ($id <= 0 || isset($seen[$id])) {
                continue;
            }

            $seen[$id] = true;
            $ids[] = $id;
        }

        return $ids;
    }
}
