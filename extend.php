<?php

/*
 * This file is part of flatrate/flarum-forum-navigation.
 *
 * Restore the FlatRate presentation on Flarum 2's resource/search interfaces.
 */

namespace FlatRate\ForumNavigation;

use Flarum\Extend;
use Flarum\Discussion\Search\DiscussionSearcher;
use Flarum\Search\Database\DatabaseSearchDriver;
use FlatRate\ForumNavigation\Search\Filter\F2MainPinsFilter;
use FlatRate\ForumNavigation\Search\Filter\F2ExcludeMainPinsFilter;
use FlatRate\ForumNavigation\Search\Filter\F2BrandFamilyTagFilter;
use Flarum\Tags\Search\Filter\TagFilter;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/resources/less/forum.less')
        ->css(__DIR__ . '/resources/less/discussion-center-menu.less')
        ->css(__DIR__ . '/resources/less/brand-board-toolbar.less')
        ->css(__DIR__ . '/resources/less/drawer-home.less')
        ->content(TagCanonical::class),

    (new Extend\Frontend('admin'))->js(__DIR__ . '/js/dist/admin.js'),
    (new Extend\View())->extendNamespace('flarum', __DIR__ . '/resources/views'),
    new Extend\Locales(__DIR__ . '/resources/locale'),
    (new Extend\ApiResource(\Flarum\Api\Resource\ForumResource::class))
        ->fields(Api\F2PresentationFields::class),
    (new Extend\SearchDriver(DatabaseSearchDriver::class))
        ->addFilter(DiscussionSearcher::class, F2MainPinsFilter::class)
        ->addFilter(DiscussionSearcher::class, F2ExcludeMainPinsFilter::class)
        ->replaceFilter(DiscussionSearcher::class, TagFilter::class, F2BrandFamilyTagFilter::class),

    (new Extend\Routes('forum'))
        ->get('/community', 'flatrate-forum-navigation.community-redirect', CommunityRedirect::class)
        ->get('/community/', 'flatrate-forum-navigation.community-redirect-slash', CommunityRedirect::class)
        ->get('/robots.txt', 'flatrate-forum-navigation.robots', RobotsTxt::class),
];
