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
}
