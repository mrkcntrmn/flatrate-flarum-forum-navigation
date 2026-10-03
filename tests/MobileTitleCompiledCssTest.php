<?php

namespace FlatRate\ForumNavigation\Tests;

use Less_Parser;
use PHPUnit\Framework\TestCase;

/**
 * Flarum 1.8 LessCompiler constructs Less_Parser with compress=true and the
 * library default strictMath=false. A bare calc() is arithmetic to that
 * compiler: calc(100% - 120px) became calc(-20%), and the former caret calc
 * became calc(100.45%). Raw forum.less assertions cannot see that rewrite.
 * The title and mobile center-row geometry formulas use escaped calc strings
 * so Less.php preserves mixed-unit browser arithmetic. The caret uses a plain
 * 100% offset after removing horizontal button padding so it is flush to the
 * centered label.
 */
class MobileTitleCompiledCssTest extends TestCase
{
    public function testFlarumLessParserPreservesTitleCenterAndAdjacentCaret(): void
    {
        $this->assertTrue(class_exists(Less_Parser::class), 'wikimedia/less.php must be installed with flarum/core');

        $parser = new Less_Parser([
            'compress' => true,
        ]);
        // Match Flarum's LessCompiler behavior while treating emitted CSS as
        // the contract under test rather than trusting raw Less source.
        $previous = null;
        $previous = set_error_handler(static function (int $severity, string $message, string $file, int $line) use (&$previous) {
            if ($severity === E_WARNING && str_contains($file, 'wikimedia/less.php')) {
                return true;
            }
            if (is_callable($previous)) {
                return $previous($severity, $message, $file, $line);
            }

            return false;
        });
        try {
            $parser->parseFile(dirname(__DIR__) . '/resources/less/forum.less');
            $parser->parseFile(dirname(__DIR__) . '/resources/less/discussion-center-menu.less');
            $css = $parser->getCss();
        } finally {
            restore_error_handler();
        }

        $this->assertMatchesRegularExpression(
            '/\.App-titleControl\{[^}]*left:0 !important;right:0 !important;width:max-content !important;max-width:calc\(100% - 120px\);margin-left:auto !important;margin-right:auto !important;transform:none !important/',
            $css
        );
        $this->assertDoesNotMatchRegularExpression(
            '/\.App-titleControl\{[^}]*transform:translateX\(-50%\)/',
            $css
        );
        $this->assertDoesNotMatchRegularExpression(
            '/\.App-titleControl\{[^}]*max-width:calc\(-20%\)/',
            $css
        );
        $this->assertDoesNotMatchRegularExpression(
            '/\.App-titleControl\{[^}]*max-width:0[%px;]/',
            $css
        );
        $this->assertStringNotContainsString('calc(-20%)', $css);
        $this->assertStringNotContainsString('calc(100.45%)', $css);
        $this->assertStringNotContainsString('calc(60%)', $css);
        $this->assertStringNotContainsString('calc(42.5%)', $css);
        $this->assertSame(4, substr_count($css, 'max-width:calc(100% - 40px)'));
        $this->assertSame(
            4,
            substr_count($css, 'margin-left:calc(50% - 7.5rem + var(--flatrate-mobile-nav-rail-offset')
        );
        $this->assertMatchesRegularExpression(
            '/\.App-titleControl>\.Dropdown-toggle\{[^}]*padding-left:0 !important;[^}]*padding-right:0 !important;/',
            $css
        );
        $this->assertMatchesRegularExpression(
            '/\.App-titleControl>\.Dropdown-toggle \.Button-caret\{[^}]*left:100%;/',
            $css
        );
        $this->assertMatchesRegularExpression(
            '/\.App-titleControl \.Dropdown-menu\{[^}]*position:fixed !important;[^}]*top:auto !important;[^}]*bottom:0 !important;[^}]*left:0 !important;[^}]*right:0 !important;[^}]*width:100vw !important;[^}]*max-width:100vw;[^}]*height:65dvh;[^}]*max-height:65dvh;[^}]*overflow-x:hidden;[^}]*overflow-y:auto;/',
            $css
        );
        $this->assertDoesNotMatchRegularExpression(
            '/\.App-titleControl \.Dropdown-menu\{[^}]*position:absolute !important/',
            $css
        );
        $this->assertDoesNotMatchRegularExpression(
            '/\.App-titleControl \.Dropdown-menu\{[^}]*top:100% !important/',
            $css
        );
        $this->assertDoesNotMatchRegularExpression(
            '/\.App-titleControl \.Dropdown-menu\{[^}]*left:calc\(50% - 50vw\) !important/',
            $css
        );
        $this->assertDoesNotMatchRegularExpression(
            '/\.App-titleControl \.Dropdown-menu\{[^}]*max-height:calc\(100dvh/',
            $css
        );
    }
}
