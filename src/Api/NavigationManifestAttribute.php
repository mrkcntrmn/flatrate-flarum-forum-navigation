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
            'flatrateForumNavigationPushToStartPath' => NavigationManifest::pushToStartPath(),
            'flatrateForumNavigationLegacyCommunityRoute' => NavigationManifest::legacyCommunityRoute(),
            'flatrateForumNavigationCommunityRoute' => NavigationManifest::legacyCommunityRoute(),
            'flatrateForumNavigationGeneralLiveAvailable' => NavigationManifest::generalLiveAvailable(),
        ];
    }
}
