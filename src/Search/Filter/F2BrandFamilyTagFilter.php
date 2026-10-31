<?php

namespace FlatRate\ForumNavigation\Search\Filter;

use Flarum\Tags\Search\Filter\TagFilter;
use Flarum\User\User;
use FlatRate\ForumNavigation\BrandFamilySlugs;
use Illuminate\Database\Eloquent\Builder;

final class F2BrandFamilyTagFilter extends TagFilter
{
    protected function constrain(Builder $query, string|array $rawSlugs, bool $negate, User $actor): void
    {
        // Preserve each AND group, expand only positive parent-brand OR groups.
        $groups = (array) $rawSlugs;
        if (!$negate) {
            $groups = array_map(static fn ($group) => implode(',', BrandFamilySlugs::expandList($group)), $groups);
        }
        parent::constrain($query, $groups, $negate, $actor);
    }
}
