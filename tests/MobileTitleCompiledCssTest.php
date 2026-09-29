<?php

namespace FlatRate\ForumNavigation\Tests;

use Less_Parser;
use PHPUnit\Framework\TestCase;

/**
 * Flarum 1.8 LessCompiler constructs Less_Parser with compress=true and the
 * library default strictMath=false. A bare calc() is arithmetic to that
 * compiler: calc(100% - 120px) became calc(-20%), and the former caret calc
 * became calc(100.45%). Raw forum.less assertions cannot see that rewrite.
 * The title max-width still needs an escaped calc; the caret now uses a plain
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
        // Flarum's LessCompiler does not fail the asset build on Less.php
        // warnings. Untouched menu calc(100% - 40px) rules still evaluate to
        // calc(60%) and emit that warning family; they are outside this fix.
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
            $css = $parser->getCss();
        } finally {
            restore_error_handler();
        }

        $this->assertMatchesRegularExpression(
            '/\.App-titleControl\{[^}]*width:max-content !important;max-width:calc\(100% - 120px\);/',
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
        $this->assertMatchesRegularExpression(
            '/\.App-titleControl>\.Dropdown-toggle\{[^}]*padding-left:0 !important;[^}]*padding-right:0 !important;/',
            $css
        );
        $this->assertMatchesRegularExpression(
            '/\.App-titleControl>\.Dropdown-toggle \.Button-caret\{[^}]*left:100%;/',
            $css
        );
        $this->assertMatchesRegularExpression(
            '/\.App-titleControl \.Dropdown-menu\{[^}]*max-height:50dvh;[^}]*overflow-x:hidden;[^}]*overflow-y:auto;/',
            $css
        );
        $this->assertDoesNotMatchRegularExpression(
            '/\.App-titleControl \.Dropdown-menu\{[^}]*max-height:calc\(100dvh/',
            $css
        );
    }
}
