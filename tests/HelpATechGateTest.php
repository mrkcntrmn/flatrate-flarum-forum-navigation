<?php

namespace FlatRate\ForumNavigation\Tests;

use FlatRate\ForumNavigation\HelpATechGate;
use PHPUnit\Framework\TestCase;

class HelpATechGateTest extends TestCase
{
    public function testHelpATechDefaultsOffWithoutAMigration(): void
    {
        $root = dirname(__DIR__);
        $extend = (string) file_get_contents($root . '/extend.php');
        $attribute = (string) file_get_contents($root . '/src/Api/HelpATechSettingsAttribute.php');

        $this->assertSame(
            'flatrate-forum-navigation.help_a_tech_admin_preview',
            HelpATechGate::SETTING_ADMIN_PREVIEW
        );

        $this->assertStringContainsString(
            "->default(HelpATechGate::SETTING_ADMIN_PREVIEW, '0')",
            $extend
        );

        $this->assertStringContainsString('HelpATechSettingsAttribute::class', $extend);
        $this->assertStringNotContainsString('Extend\\Migration', $extend);
        $this->assertStringNotContainsString('->migration(', $extend);
        $this->assertDirectoryDoesNotExist($root . '/migrations');

        $this->assertStringContainsString('flatrateHelpATechAdminPreview', $attribute);
    }

    /**
     * @dataProvider settingBoolProvider
     * @param mixed $value
     */
    public function testNormalizeSettingBool($value, bool $missingDefault, bool $expected): void
    {
        $this->assertSame($expected, HelpATechGate::normalizeSettingBool($value, $missingDefault));
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
