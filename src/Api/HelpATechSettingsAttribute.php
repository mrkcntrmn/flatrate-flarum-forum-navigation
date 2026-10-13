<?php

namespace FlatRate\ForumNavigation\Api;

use Flarum\Api\Serializer\ForumSerializer;
use Flarum\Settings\SettingsRepositoryInterface;
use FlatRate\ForumNavigation\HelpATechGate;

/**
 * Non-secret presentation gate for Help a Tech admin preview.
 *
 * Serializes flatrateHelpATechAdminPreview to Forum attributes.
 * Defaults to false.
 */
final class HelpATechSettingsAttribute
{
    private SettingsRepositoryInterface $settings;

    public function __construct(SettingsRepositoryInterface $settings)
    {
        $this->settings = $settings;
    }

    public function __invoke(ForumSerializer $serializer): array
    {
        return [
            'flatrateHelpATechAdminPreview' => HelpATechGate::normalizeSettingBool(
                $this->settings->get(HelpATechGate::SETTING_ADMIN_PREVIEW),
                false
            ),
        ];
    }
}
