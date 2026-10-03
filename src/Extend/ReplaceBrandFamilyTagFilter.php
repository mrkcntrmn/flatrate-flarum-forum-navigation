<?php

namespace FlatRate\ForumNavigation\Extend;

use Flarum\Discussion\Filter\DiscussionFilterer;
use Flarum\Discussion\Search\DiscussionSearcher;
use Flarum\Extend\ExtenderInterface;
use Flarum\Extension\Extension;
use Flarum\Tags\Query\TagFilterGambit;
use FlatRate\ForumNavigation\Search\Filter\BrandFamilyTagFilter;
use Illuminate\Contracts\Container\Container;

/**
 * Swap the native exact tag filter/gambit for the family-aware subclass.
 * Registered after flarum/tags so the class is already in the filter list.
 */
final class ReplaceBrandFamilyTagFilter implements ExtenderInterface
{
    public function extend(Container $container, Extension $extension = null)
    {
        $container->extend('flarum.filter.filters', function ($filters) {
            return $this->replace($filters, DiscussionFilterer::class);
        });

        $container->extend('flarum.simple_search.gambits', function ($gambits) {
            return $this->replace($gambits, DiscussionSearcher::class);
        });
    }

    private function replace($map, string $key)
    {
        if (!is_array($map) || !isset($map[$key]) || !is_array($map[$key])) {
            return $map;
        }

        $map[$key] = array_map(function ($class) {
            return $class === TagFilterGambit::class ? BrandFamilyTagFilter::class : $class;
        }, $map[$key]);

        return $map;
    }
}
