<?php

namespace FlatRate\ForumNavigation\Api;

use Flarum\Api\Serializer\ForumSerializer;
use Flarum\Settings\SettingsRepositoryInterface;
use FlatRate\ForumNavigation\MaintenanceBannerSettings;

/**
 * Public, presentation-safe maintenance banner configuration.
 *
 * This intentionally serializes no admin capability or secret setting data.
 */
final class MaintenanceBannerSettingsAttribute
{
    private SettingsRepositoryInterface $settings;

    public function __construct(SettingsRepositoryInterface $settings)
    {
        $this->settings = $settings;
    }

    public function __invoke(ForumSerializer $serializer): array
    {
        $message = MaintenanceBannerSettings::normalizeMessage(
            $this->settings->get(MaintenanceBannerSettings::SETTING_MESSAGE)
        );
        $color = MaintenanceBannerSettings::normalizeColor(
            $this->settings->get(MaintenanceBannerSettings::SETTING_COLOR)
        );
        $palette = MaintenanceBannerSettings::PALETTE[$color];
        $enabled = MaintenanceBannerSettings::normalizeBool(
            $this->settings->get(MaintenanceBannerSettings::SETTING_ENABLED),
            true
        ) && $message !== '';

        return [
            'flatrateMaintenanceBanner' => [
                'enabled' => $enabled,
                'message' => $message,
                'color' => $color,
                'backgroundColor' => $palette['background'],
                'textColor' => $palette['foreground'],
                'revision' => MaintenanceBannerSettings::normalizeRevision(
                    $this->settings->get(MaintenanceBannerSettings::SETTING_REVISION),
                    $message,
                    $color
                ),
            ],
        ];
    }
}
