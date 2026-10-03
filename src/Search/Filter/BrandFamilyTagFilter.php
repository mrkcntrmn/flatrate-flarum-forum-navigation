<?php

namespace FlatRate\ForumNavigation\Search\Filter;

use FlatRate\ForumNavigation\BrandFamilySlugs;
use Flarum\Tags\Query\TagFilterGambit;
use Flarum\User\User;
use Illuminate\Database\Query\Builder;

/**
 * Expands a manifest parent Brand inside the native tag filter.
 *
 * TagFilterGambit::filter() and the tag: search gambit both call constrain().
 * Overriding that one method keeps the forum document preload and later
 * DiscussionFilterer requests on the same family predicate. The predicate is
 * still the native tag whereIn, so actor visibility on the filterer query is
 * unchanged. Negation and unknown slugs stay exact.
 *
 * Realtime: Flarum Pusher inserts against the active exact tag id. A child
 * Brand discussion created while a parent board is open is not live-inserted.
 * First load, refresh, sort, search, and pagination use this filter.
 */
class BrandFamilyTagFilter extends TagFilterGambit
{
    protected function constrain(Builder $query, $rawSlugs, $negate, User $actor)
    {
        if ($negate) {
            parent::constrain($query, $rawSlugs, true, $actor);

            return;
        }

        parent::constrain($query, implode(',', BrandFamilySlugs::expandList($rawSlugs)), false, $actor);
    }
}
