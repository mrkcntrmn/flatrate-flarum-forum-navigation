<?php

namespace FlatRate\ForumNavigation\Search\Filter;

use Flarum\Filter\FilterInterface;
use Flarum\Filter\FilterState;
use Flarum\Settings\SettingsRepositoryInterface;

/**
 * Exclude configured Member MAIN pin IDs from the ordinary signed-in root feed.
 * Attach only from that feed — never search, Following, Brand boards, or profiles.
 */
final class ExcludeMainPinsFilter implements FilterInterface
{
    private SettingsRepositoryInterface $settings;

    public function __construct(SettingsRepositoryInterface $settings)
    {
        $this->settings = $settings;
    }

    public function getFilterKey(): string
    {
        return 'flatrateExcludeMainPins';
    }

    public function filter(FilterState $filterState, string $filterValue, bool $negate): void
    {
        $audience = strtolower(trim($filterValue));
        if ($audience !== 'member') {
            // Fail closed for unexpected audiences: do not broaden.
            $filterState->getQuery()->whereRaw('0 = 1');

            return;
        }

        $ids = MainPinsFilter::normalizeIds(
            $this->settings->get(MainPinsFilter::SETTING_MEMBER)
        );

        if ($ids === []) {
            return;
        }

        $filterState->getQuery()->whereNotIn('discussions.id', $ids, 'and', $negate);
    }
}
