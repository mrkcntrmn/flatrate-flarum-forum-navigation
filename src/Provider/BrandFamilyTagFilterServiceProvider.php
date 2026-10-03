<?php

/*
 * This file is part of flatrate/flarum-forum-navigation.
 */

namespace FlatRate\ForumNavigation\Provider;

use Flarum\Foundation\AbstractServiceProvider;
use Flarum\Tags\Query\TagFilterGambit;
use FlatRate\ForumNavigation\Search\Filter\BrandFamilyTagFilter;

/**
 * Flarum 1.8.19 stores TagFilterGambit::class in the filter and simple-search
 * arrays, then resolves that class string through the container. Binding the
 * native class here is independent of whether this extension or flarum-tags
 * appends the class string first.
 *
 * Do not also add BrandFamilyTagFilter as a second `tag` filter. The filterer
 * runs every filter registered under the same key.
 */
final class BrandFamilyTagFilterServiceProvider extends AbstractServiceProvider
{
    public function register()
    {
        $this->container->bind(TagFilterGambit::class, BrandFamilyTagFilter::class);
    }
}
