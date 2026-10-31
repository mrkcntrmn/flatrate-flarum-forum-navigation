<?php

namespace FlatRate\ForumNavigation\Api;

use Flarum\Api\Schema\Attribute;
use Flarum\Settings\SettingsRepositoryInterface;
use FlatRate\ForumNavigation\NavigationManifest;
use FlatRate\ForumNavigation\QuickRailGate;
use FlatRate\ForumNavigation\Search\Filter\MainPinsFilter;

final class F2PresentationFields
{
    public function __construct(private SettingsRepositoryInterface $settings)
    {
    }

    public function __invoke(): array
    {
        // Explicit public presentation allowlist. Never serialize all settings.
        $values = [
            'flatrateForumNavigationManifest' => NavigationManifest::load(),
            'flatrateForumNavigationPushToStartPath' => NavigationManifest::pushToStartPath(),
            'flatrateForumNavigationLegacyCommunityRoute' => NavigationManifest::legacyCommunityRoute(),
            'flatrateForumNavigationCommunityRoute' => NavigationManifest::legacyCommunityRoute(),
            'flatrateForumNavigationGeneralLiveAvailable' => NavigationManifest::generalLiveAvailable(),
            'flatratePublicMainPinnedDiscussionIds' => MainPinsFilter::normalizeIds($this->settings->get(MainPinsFilter::SETTING_PUBLIC)),
            'flatrateMemberMainPinnedDiscussionIds' => MainPinsFilter::normalizeIds($this->settings->get(MainPinsFilter::SETTING_MEMBER)),
            'flatrateCenterMenuV2AdminVisible' => QuickRailGate::normalizeSettingBool($this->settings->get(QuickRailGate::SETTING_V2_ADMIN_VISIBLE), false),
            'flatrateCenterMenuV2UserVisible' => QuickRailGate::normalizeSettingBool($this->settings->get(QuickRailGate::SETTING_V2_USER_VISIBLE), false),
        ];

        return array_map(
            static fn ($name, $value) => Attribute::make($name)->get(static fn () => $value),
            array_keys($values),
            array_values($values)
        );
    }
}
