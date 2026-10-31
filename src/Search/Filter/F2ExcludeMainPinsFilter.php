<?php

namespace FlatRate\ForumNavigation\Search\Filter;

use Flarum\Search\Filter\FilterInterface;
use Flarum\Search\SearchState;
use Flarum\Settings\SettingsRepositoryInterface;

final class F2ExcludeMainPinsFilter implements FilterInterface
{
    public function __construct(private SettingsRepositoryInterface $settings)
    {
    }

    public function getFilterKey(): string
    {
        return 'flatrateExcludeMainPins';
    }

    public function filter(SearchState $state, string|array $value, bool $negate): void
    {
        if ($value !== 'member') {
            $state->getQuery()->whereRaw('0 = 1');
            return;
        }
        $ids = MainPinsFilter::normalizeIds($this->settings->get(MainPinsFilter::SETTING_MEMBER));
        if ($ids) $state->getQuery()->whereIn('discussions.id', $ids, 'and', !$negate);
    }
}
