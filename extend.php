<?php

/*
 * This file is part of flatrate/flarum-forum-navigation.
 */

namespace FlatRate\ForumNavigation;

use Flarum\Api\Serializer\ForumSerializer;
use Flarum\Extend;
use FlatRate\ForumNavigation\Api\NavigationManifestAttribute;
use FlatRate\ForumNavigation\Middleware\DefaultRootSort;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/resources/less/forum.less')
        ->css(__DIR__ . '/resources/less/discussion-center-menu.less')
        ->css(__DIR__ . '/resources/less/brand-board-toolbar.less'),

    (new Extend\Middleware('forum'))
        ->add(DefaultRootSort::class),

    (new Extend\Routes('forum'))
        ->get('/community', 'flatrate-forum-navigation.community-redirect', CommunityRedirect::class)
        ->get('/community/', 'flatrate-forum-navigation.community-redirect-slash', CommunityRedirect::class),

    new Extend\Locales(__DIR__ . '/resources/locale'),

    (new Extend\ApiSerializer(ForumSerializer::class))
        ->attributes(NavigationManifestAttribute::class),
];
