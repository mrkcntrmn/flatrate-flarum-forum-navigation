<?php

namespace FlatRate\ForumNavigation\Search\Filter;

use Flarum\Search\Filter\FilterInterface;
use Flarum\Search\SearchState;
use Flarum\Settings\SettingsRepositoryInterface;

final class F2MainPinsFilter implements FilterInterface
{
    public function __construct(private SettingsRepositoryInterface $settings)
    {
    }

    public function getFilterKey(): string
    {
        return 'flatrateMainPins';
    }

    public function filter(SearchState $state, string|array $value, bool $negate): void
    {
        $setting = match ($value) {
            'public' => MainPinsFilter::SETTING_PUBLIC,
            'member' => MainPinsFilter::SETTING_MEMBER,
            default => null,
        };
        $ids = $setting ? MainPinsFilter::normalizeIds($this->settings->get($setting)) : [];
        if (!$ids) {
            $state->getQuery()->whereRaw('0 = 1');
            return;
        }
        // This only narrows the actor-visible core query, including negation.
        $state->getQuery()->whereIn('discussions.id', $ids, 'and', $negate);
    }
}
