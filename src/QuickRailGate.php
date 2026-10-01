<?php

namespace FlatRate\ForumNavigation;

/**
 * Center-menu V2 audience gates.
 *
 * V1 (warehouse MAIN + Brands) is the fail-closed/default presentation.
 * Admin and signed-in user V2 visibility are intentionally independent.
 */
final class QuickRailGate
{
    public const SETTING_V2_ADMIN_VISIBLE = 'flatrate-forum-navigation.center_menu_v2_admin_visible';
    public const SETTING_V2_USER_VISIBLE = 'flatrate-forum-navigation.center_menu_v2_user_visible';

    /**
     * @param mixed $value
     */
    public static function normalizeSettingBool($value, bool $missingDefault): bool
    {
        if ($value === null || $value === '') {
            return $missingDefault;
        }

        if (is_string($value)) {
            $normalized = strtolower(trim($value));
            if ($normalized === '1' || $normalized === 'true') {
                return true;
            }
            if ($normalized === '0' || $normalized === 'false') {
                return false;
            }

            return $missingDefault;
        }

        if (is_bool($value)) {
            return $value;
        }

        if (is_int($value) || is_float($value)) {
            if ((int) $value === 1) {
                return true;
            }
            if ((int) $value === 0) {
                return false;
            }
        }

        return $missingDefault;
    }
}
