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
    public function testMaintenanceBannerIsDismissibleAndVersioned(): void
    {
        $root = dirname(__DIR__);
        $view = (string) file_get_contents($root . '/resources/views/frontend/content.blade.php');
        $less = (string) file_get_contents($root . '/resources/less/forum.less');

        $this->assertStringContainsString('id="flatrate-maintenance-banner"', $view);
        $this->assertStringContainsString('FLATRATE.WIKI is undergoing maintenance.', $view);
        $this->assertStringContainsString('3:00 AM, 9/23/26', $view);
        $this->assertStringContainsString('flatrate:maintenance-banner:2026-09-23-0300', $view);
        $this->assertStringContainsString("window.localStorage.setItem(storageKey, 'dismissed')", $view);
        $this->assertStringContainsString("drawer.parentNode.insertBefore(banner, drawer.nextSibling)", $view);
        $this->assertStringContainsString('aria-label="Dismiss maintenance announcement"', $view);
        $this->assertStringContainsString('data-nosnippet', $view);

        $this->assertStringContainsString('.FlatRateMaintenanceBanner {', $less);
        $this->assertStringContainsString('background: #c62828;', $less);
        $this->assertStringContainsString('color: #fff;', $less);
        $this->assertStringContainsString('.FlatRateMaintenanceBanner-dismiss', $less);
    }

}
