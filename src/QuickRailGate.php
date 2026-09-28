<?php

namespace FlatRate\ForumNavigation;

/**
 * Admin presentation gates and the nullable member quick-rail preference.
 *
 * Settings normalization never reads user preferences. The member preference
 * transformer preserves null and does not treat the string "false" as true.
 */
final class QuickRailGate
{
    public const SETTING_ENABLED = 'flatrate-forum-navigation.quick_rail_enabled';
    public const SETTING_USER_CONTROL_ENABLED = 'flatrate-forum-navigation.quick_rail_user_control_enabled';
    public const SETTING_MEMBER_DEFAULT_VISIBLE = 'flatrate-forum-navigation.quick_rail_member_default_visible';
    public const PREFERENCE_VISIBLE = 'flatrateForumNavigationQuickRailVisible';

    /**
     * @param mixed $value
     */
    public static function normalizeSettingBool($value, bool $missingDefault): bool
    {
        if ($value === null || $value === '') {
            return $missingDefault;
        }

        $normalized = self::transformPreference($value);

        return $normalized === null ? $missingDefault : $normalized;
    }

    /**
     * Nullable boolean transformer for Extend\User::registerPreference.
     *
     * @param mixed $value
     */
    public static function transformPreference($value): ?bool
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value)) {
            $normalized = strtolower(trim($value));
            if ($normalized === '' || $normalized === 'null') {
                return null;
            }
            if ($normalized === '1' || $normalized === 'true') {
                return true;
            }
            if ($normalized === '0' || $normalized === 'false') {
                return false;
            }

            return null;
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

            return null;
        }

        return null;
    }
}
