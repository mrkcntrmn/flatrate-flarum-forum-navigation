<?php

namespace FlatRate\ForumNavigation\Api;

use Flarum\Api\Serializer\ForumSerializer;
use Flarum\Settings\SettingsRepositoryInterface;
use FlatRate\ForumNavigation\Search\Filter\MainPinsFilter;

/**
 * Serialize MAIN pin ID order for client-side ordering among visible rows.
 * Never serializes discussion content. IDs are not an authorization grant.
 */
final class MainLandingSettingsAttribute
{
    private SettingsRepositoryInterface $settings;

    public function __construct(SettingsRepositoryInterface $settings)
    {
        $this->settings = $settings;
    }

    public function __invoke(ForumSerializer $serializer): array
    {
        return [
            'flatratePublicMainPinnedDiscussionIds' => MainPinsFilter::normalizeIds(
                $this->settings->get(MainPinsFilter::SETTING_PUBLIC)
            ),
            'flatrateMemberMainPinnedDiscussionIds' => MainPinsFilter::normalizeIds(
                $this->settings->get(MainPinsFilter::SETTING_MEMBER)
            ),
        ];
    }
}
