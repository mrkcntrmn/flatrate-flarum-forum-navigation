<?php

/*
 * This file is part of flatrate/flarum-forum-navigation.
 *
 * Flarum 2 registers only the behavior native tags do not provide:
 * a tag-page canonical URL, robots.txt, and the retired /community redirect.
 * The historical presentation bundle stays in the repository and is not loaded.
 */

namespace FlatRate\ForumNavigation;

use Flarum\Extend;

return [
    (new Extend\Frontend('forum'))
        ->content(TagCanonical::class),

    (new Extend\Routes('forum'))
        ->get('/community', 'flatrate-forum-navigation.community-redirect', CommunityRedirect::class)
        ->get('/community/', 'flatrate-forum-navigation.community-redirect-slash', CommunityRedirect::class)
        ->get('/robots.txt', 'flatrate-forum-navigation.robots', RobotsTxt::class),
];
