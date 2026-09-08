<?php

namespace FlatRate\ForumNavigation\Api;

use Flarum\Api\Serializer\ForumSerializer;
use FlatRate\ForumNavigation\NavigationManifest;

class NavigationManifestAttribute
{
    public function __invoke(ForumSerializer $serializer): array
    {
        return [
            'flatrateForumNavigationManifest' => NavigationManifest::load(),
            'flatrateForumNavigationCommunityRoute' => NavigationManifest::communityRoute(),
            'flatrateForumNavigationGeneralLiveAvailable' => NavigationManifest::generalLiveAvailable(),
        ];
    }
}
