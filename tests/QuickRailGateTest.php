<?php

namespace FlatRate\ForumNavigation\Tests;

use FlatRate\ForumNavigation\QuickRailGate;
use PHPUnit\Framework\TestCase;

class QuickRailGateTest extends TestCase
{
    public function testSettingKeysAndDefaultsAreRegisteredWithoutAMigration(): void
    {
        $root = dirname(__DIR__);
        $extend = (string) file_get_contents($root . '/extend.php');
        $attribute = (string) file_get_contents($root . '/src/Api/QuickRailSettingsAttribute.php');

        $this->assertSame('flatrate-forum-navigation.quick_rail_enabled', QuickRailGate::SETTING_ENABLED);
        $this->assertSame('flatrate-forum-navigation.quick_rail_user_control_enabled', QuickRailGate::SETTING_USER_CONTROL_ENABLED);
        $this->assertSame('flatrate-forum-navigation.quick_rail_member_default_visible', QuickRailGate::SETTING_MEMBER_DEFAULT_VISIBLE);
        $this->assertSame('flatrateForumNavigationQuickRailVisible', QuickRailGate::PREFERENCE_VISIBLE);

        $this->assertStringContainsString("->default(QuickRailGate::SETTING_ENABLED, '0')", $extend);
        $this->assertStringContainsString("->default(QuickRailGate::SETTING_USER_CONTROL_ENABLED, '1')", $extend);
        $this->assertStringContainsString("->default(QuickRailGate::SETTING_MEMBER_DEFAULT_VISIBLE, '1')", $extend);
        $this->assertStringContainsString('Extend\\User', $extend);
        $this->assertStringContainsString('registerPreference', $extend);
        $this->assertStringContainsString('QuickRailGate::PREFERENCE_VISIBLE', $extend);
        $this->assertStringContainsString('QuickRailSettingsAttribute::class', $extend);
        $this->assertStringNotContainsString('Extend\\Migration', $extend);
        $this->assertStringNotContainsString('->migration(', $extend);
        $this->assertDirectoryDoesNotExist($root . '/migrations');

        $this->assertStringNotContainsString('PREFERENCE_VISIBLE', $attribute);
        $this->assertStringNotContainsString('flatrateForumNavigationQuickRailVisible', $attribute);
        $this->assertStringContainsString('flatrateQuickRailEnabled', $attribute);
        $this->assertStringContainsString('flatrateQuickRailUserControlEnabled', $attribute);
        $this->assertStringContainsString('flatrateQuickRailMemberDefaultVisible', $attribute);
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
        ];
    }

    /**
     * @dataProvider preferenceProvider
     * @param mixed $value
     */
    public function testPreferenceTransformerPreservesNullAndExplicitBooleans($value, ?bool $expected): void
    {
        $this->assertSame($expected, QuickRailGate::transformPreference($value));
    }

    public function preferenceProvider(): array
    {
        return [
            'null' => [null, null],
            'empty' => ['', null],
            'string null' => ['null', null],
            'false' => [false, false],
            'true' => [true, true],
            'string false' => ['false', false],
            'string true' => ['true', true],
            'string 0' => ['0', false],
            'string 1' => ['1', true],
            'int 0' => [0, false],
            'int 1' => [1, true],
        ];
    }
}
