<?php

/*
 * This file is part of flatrate/flarum-forum-navigation.
 */

namespace FlatRate\ForumNavigation;

use Flarum\Api\Serializer\ForumSerializer;
use Flarum\Extend;
use FlatRate\ForumNavigation\Api\NavigationManifestAttribute;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/resources/less/forum.less')
        ->route('/community', 'flatrate-forum-navigation.community'),

    new Extend\Locales(__DIR__ . '/resources/locale'),

    (new Extend\ApiSerializer(ForumSerializer::class))
        ->attributes(NavigationManifestAttribute::class),
];
