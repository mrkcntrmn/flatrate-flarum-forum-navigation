<?php

namespace FlatRate\ForumNavigation\Tests;

use FlatRate\ForumNavigation\QuickRailGate;
use PHPUnit\Framework\TestCase;

class QuickRailGateTest extends TestCase
{
    public function testV2AudienceKeysDefaultOffWithoutAMigration(): void
    {
        $root = dirname(__DIR__);
        $extend = (string) file_get_contents($root . '/extend.php');
        $attribute = (string) file_get_contents($root . '/src/Api/QuickRailSettingsAttribute.php');

        $this->assertSame(
            'flatrate-forum-navigation.center_menu_v2_admin_visible',
            QuickRailGate::SETTING_V2_ADMIN_VISIBLE
        );
        $this->assertSame(
            'flatrate-forum-navigation.center_menu_v2_user_visible',
            QuickRailGate::SETTING_V2_USER_VISIBLE
        );

        $this->assertStringContainsString(
            "->default(QuickRailGate::SETTING_V2_ADMIN_VISIBLE, '0')",
            $extend
        );
        $this->assertStringContainsString(
            "->default(QuickRailGate::SETTING_V2_USER_VISIBLE, '0')",
            $extend
        );
        $this->assertStringNotContainsString('registerPreference', $extend);
        $this->assertStringNotContainsString('QuickRailGate::PREFERENCE_VISIBLE', $extend);
        $this->assertStringNotContainsString('quick_rail_user_control_enabled', $extend);
        $this->assertStringNotContainsString('quick_rail_member_default_visible', $extend);
        $this->assertStringContainsString('QuickRailSettingsAttribute::class', $extend);
        $this->assertStringNotContainsString('Extend\\Migration', $extend);
        $this->assertStringNotContainsString('->migration(', $extend);
        $this->assertDirectoryDoesNotExist($root . '/migrations');

        $this->assertStringContainsString('flatrateCenterMenuV2AdminVisible', $attribute);
        $this->assertStringContainsString('flatrateCenterMenuV2UserVisible', $attribute);
        $this->assertStringNotContainsString('flatrateQuickRailEnabled', $attribute);
        $this->assertStringNotContainsString('flatrateQuickRailUserControlEnabled', $attribute);
        $this->assertStringNotContainsString('flatrateQuickRailMemberDefaultVisible', $attribute);
    }

    /**
     * @dataProvider settingBoolProvider
     * @param mixed $value
     */
    public function testNormalizeSettingBool($value, bool $missingDefault, bool $expected): void
    {
        $this->assertSame($expected, QuickRailGate::normalizeSettingBool($value, $missingDefault));
    }

    public function settingBoolProvider(): array
    {
        return [
            'missing null uses default false' => [null, false, false],
            'missing null uses default true' => [null, true, true],
            'empty string uses default true' => ['', true, true],
            'string 0' => ['0', true, false],
            'string 1' => ['1', false, true],
            'int 0' => [0, true, false],
            'int 1' => [1, false, true],
            'bool false' => [false, true, false],
            'bool true' => [true, false, true],
            'string false' => ['false', true, false],
            'string true' => ['true', false, true],
            'invalid string uses default false' => ['maybe', false, false],
            'invalid string uses default true' => ['maybe', true, true],
        ];
    }
}
