<?php

namespace FlatRate\ForumNavigation\Api;

use Flarum\Api\Serializer\ForumSerializer;
use Flarum\Settings\SettingsRepositoryInterface;
use FlatRate\ForumNavigation\QuickRailGate;

/**
 * Non-secret presentation gates for Center Menu V2.
 *
 * Guests always resolve to V1 in forum JS. Admin and signed-in user gates
 * remain independent and default off.
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
            'flatrateCenterMenuV2AdminVisible' => QuickRailGate::normalizeSettingBool(
                $this->settings->get(QuickRailGate::SETTING_V2_ADMIN_VISIBLE),
                false
            ),
            'flatrateCenterMenuV2UserVisible' => QuickRailGate::normalizeSettingBool(
                $this->settings->get(QuickRailGate::SETTING_V2_USER_VISIBLE),
                false
            ),
        ];
    }
}
