<?php

namespace FlatRate\ForumNavigation;

/**
 * Help a Tech admin preview rollout gate.
 *
 * Defaults to OFF ('0').
 * Admin-only preview gate for H1/H2 qualification.
 */
final class HelpATechGate
{
    public const SETTING_ADMIN_PREVIEW = 'flatrate-forum-navigation.help_a_tech_admin_preview';

    /**
     * @param mixed $value
     */
    public static function normalizeSettingBool($value, bool $missingDefault = false): bool
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
