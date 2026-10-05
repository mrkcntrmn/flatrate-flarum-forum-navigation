<?php

namespace FlatRate\ForumNavigation\Tests;

use PHPUnit\Framework\TestCase;

class FrontendContentViewTest extends TestCase
{
    public function testFallbackChromeIsExcludedFromSearchSnippets(): void
    {
        $root = dirname(__DIR__);
        $view = (string) file_get_contents($root . '/resources/views/frontend/content.blade.php');

        $this->assertMatchesRegularExpression(
            '/<div id="flarum-loading"[^>]*\bdata-nosnippet\b[^>]*>/',
            $view
        );
        $this->assertMatchesRegularExpression(
            '/<div class="Alert"\s+data-nosnippet>/',
            $view
        );
        $this->assertMatchesRegularExpression(
            '/<div id="flarum-loading-error"[^>]*\bdata-nosnippet\b[^>]*>/',
            $view
        );

        $this->assertStringContainsString(
            "core.views.content.loading_text",
            $view
        );
        $this->assertStringContainsString(
            "core.views.content.javascript_disabled_message",
            $view
        );
        $this->assertStringContainsString(
            "core.views.content.load_error_message",
            $view
        );
    }

    public function testSeoDiscussionContentRemainsSnippetEligible(): void
    {
        $root = dirname(__DIR__);
        $view = (string) file_get_contents($root . '/resources/views/frontend/content.blade.php');

        $this->assertStringContainsString('<noscript id="flarum-content">', $view);
        $this->assertStringContainsString('{!! $content !!}', $view);
        $this->assertDoesNotMatchRegularExpression(
            '/<noscript id="flarum-content"[^>]*\bdata-nosnippet\b/i',
            $view
        );
    }

    public function testFlarumContentViewOverrideIsRegistered(): void
    {
        $root = dirname(__DIR__);
        $extend = (string) file_get_contents($root . '/extend.php');

        $this->assertStringContainsString('new Extend\\View()', $extend);
        $this->assertStringContainsString(
            "->extendNamespace('flarum', __DIR__ . '/resources/views')",
            $extend
        );
    }
    public function testMaintenanceBannerUsesSettingsDrivenRuntimeShell(): void
    {
        $root = dirname(__DIR__);
        $view = (string) file_get_contents($root . '/resources/views/frontend/content.blade.php');
        $less = (string) file_get_contents($root . '/resources/less/forum.less');
        $runtime = (string) file_get_contents($root . '/js/src/forum/maintenanceBanner.js');

        $this->assertStringContainsString('id="flatrate-maintenance-banner"', $view);
        $this->assertStringContainsString('FlatRateMaintenanceBanner-copy', $view);
        $this->assertStringNotContainsString('9/24/26 4:00 PM', $view);
        $this->assertStringNotContainsString('flatrate:maintenance-banner:2026-09-24-1600', $view);
        $this->assertStringContainsString('aria-label="Dismiss maintenance announcement"', $view);
        $this->assertStringContainsString('data-nosnippet', $view);

        $this->assertStringContainsString('flatrateMaintenanceBanner', $runtime);
        $this->assertStringContainsString("window.localStorage.setItem(storageKey, 'dismissed')", $runtime);
        $this->assertStringContainsString("drawer.parentNode.insertBefore(banner, drawer.nextSibling)", $runtime);

        $this->assertStringContainsString('.FlatRateMaintenanceBanner {', $less);
        $this->assertStringContainsString('var(--flatrate-maintenance-bg, #c62828)', $less);
        $this->assertStringContainsString('var(--flatrate-maintenance-fg, #fff)', $less);
        $this->assertStringContainsString('.FlatRateMaintenanceBanner-dismiss', $less);
    }

}
