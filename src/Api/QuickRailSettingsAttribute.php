<?php

namespace FlatRate\ForumNavigation\Api;

use Flarum\Api\Serializer\ForumSerializer;
use Flarum\Settings\SettingsRepositoryInterface;
use FlatRate\ForumNavigation\QuickRailGate;

/**
 * Non-secret presentation gates for the member quick rail.
 * Member preference stays on the current-user resource.
 */
final class QuickRailSettingsAttribute
{
    private SettingsRepositoryInterface $settings;

    public function __construct(SettingsRepositoryInterface $settings)
    {
        $this->settings = $settings;
    }

    public function __invoke(ForumSerializer $serializer): array
    {
        return [
            'flatrateQuickRailEnabled' => QuickRailGate::normalizeSettingBool(
                $this->settings->get(QuickRailGate::SETTING_ENABLED),
                false
            ),
            'flatrateQuickRailUserControlEnabled' => QuickRailGate::normalizeSettingBool(
                $this->settings->get(QuickRailGate::SETTING_USER_CONTROL_ENABLED),
                true
            ),
            'flatrateQuickRailMemberDefaultVisible' => QuickRailGate::normalizeSettingBool(
                $this->settings->get(QuickRailGate::SETTING_MEMBER_DEFAULT_VISIBLE),
                true
            ),
        ];
    }
}
