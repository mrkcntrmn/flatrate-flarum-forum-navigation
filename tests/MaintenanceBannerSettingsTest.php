<?php

namespace FlatRate\ForumNavigation\Tests;

use FlatRate\ForumNavigation\MaintenanceBannerSettings;
use PHPUnit\Framework\TestCase;

class MaintenanceBannerSettingsTest extends TestCase
{
    public function testMissingValuesPreserveCurrentBannerDefaults(): void
    {
        $this->assertTrue(MaintenanceBannerSettings::normalizeBool(null, true));
        $this->assertSame(
            'FLATRATE.WIKI is undergoing maintenance.',
            MaintenanceBannerSettings::normalizeMessage(null)
        );
        $this->assertSame('red', MaintenanceBannerSettings::normalizeColor(null));
    }

    public function testBlankMessageCanFailClosed(): void
    {
        $this->assertSame('', MaintenanceBannerSettings::normalizeMessage('   '));
    }

    public function testColorIsRestrictedToApprovedPalette(): void
    {
        $this->assertSame('pink', MaintenanceBannerSettings::normalizeColor('PINK'));
        $this->assertSame('red', MaintenanceBannerSettings::normalizeColor('#ff00ff'));
        $this->assertSame('#c72d5d', MaintenanceBannerSettings::PALETTE['pink']['background']);
    }

    public function testRevisionRejectsUnsafeValues(): void
    {
        $fallback = MaintenanceBannerSettings::normalizeRevision(
            '<script>',
            MaintenanceBannerSettings::DEFAULT_MESSAGE,
            'red'
        );

        $this->assertMatchesRegularExpression('/^[a-f0-9]{16}$/', $fallback);
        $this->assertSame(
            'rabc_123',
            MaintenanceBannerSettings::normalizeRevision('rabc_123', 'message', 'blue')
        );
    }
}
