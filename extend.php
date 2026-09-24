<?php

/*
 * This file is part of flatrate/flarum-forum-navigation.
 */

namespace FlatRate\ForumNavigation;

use Flarum\Api\Serializer\ForumSerializer;
use Flarum\Discussion\Filter\DiscussionFilterer;
use Flarum\Extend;
use FlatRate\ForumNavigation\Api\MainLandingSettingsAttribute;
use FlatRate\ForumNavigation\Api\NavigationManifestAttribute;
use FlatRate\ForumNavigation\Search\Filter\ExcludeMainPinsFilter;
use FlatRate\ForumNavigation\Search\Filter\MainPinsFilter;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/resources/less/forum.less')
        ->css(__DIR__ . '/resources/less/discussion-center-menu.less')
        ->css(__DIR__ . '/resources/less/brand-board-toolbar.less')
        ->css(__DIR__ . '/resources/less/drawer-home.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__ . '/js/dist/admin.js'),

    (new Extend\View())
        ->extendNamespace('flarum', __DIR__ . '/resources/views'),

    (new Extend\Routes('forum'))
        ->get('/community', 'flatrate-forum-navigation.community-redirect', CommunityRedirect::class)
        ->get('/community/', 'flatrate-forum-navigation.community-redirect-slash', CommunityRedirect::class),

    new Extend\Locales(__DIR__ . '/resources/locale'),

    (new Extend\Settings())
        ->default(MainPinsFilter::SETTING_PUBLIC, '[]')
        ->default(MainPinsFilter::SETTING_MEMBER, '[]'),

    // Flarum 1.8.19 discussion list filter seam (filter[key]=value).
    // Plan docs mention SearchDriver (2.x naming); 1.8 uses Extend\Filter.
    (new Extend\Filter(DiscussionFilterer::class))
        ->addFilter(MainPinsFilter::class)
        ->addFilter(ExcludeMainPinsFilter::class),

    (new Extend\ApiSerializer(ForumSerializer::class))
        ->attributes(NavigationManifestAttribute::class)
        ->attributes(MainLandingSettingsAttribute::class),
];
