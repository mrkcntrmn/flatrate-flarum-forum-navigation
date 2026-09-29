<?php

namespace FlatRate\ForumNavigation\Tests;

use Less_Parser;
use PHPUnit\Framework\TestCase;

/**
 * Flarum 1.8 LessCompiler constructs Less_Parser with compress=true and the
 * library default strictMath=false. A bare calc() is arithmetic to that
 * compiler: calc(100% - 120px) became calc(-20%), and calc(100% + 0.45rem)
 * became calc(100.45%). Raw forum.less assertions cannot see that rewrite.
 */
class MobileTitleCompiledCssTest extends TestCase
{
    public function testFlarumLessParserPreservesTitleCenterAndCaretCalcs(): void
    {
        $this->assertTrue(class_exists(Less_Parser::class), 'wikimedia/less.php must be installed with flarum/core');

        $parser = new Less_Parser([
            'compress' => true,
        ]);
        $parser->parseFile(dirname(__DIR__) . '/resources/less/forum.less');
        $css = $parser->getCss();

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
            '/\.App-titleControl>\.Dropdown-toggle \.Button-caret\{[^}]*left:calc\(100% \+ 0\.45rem\);/',
            $css
        );
    }
}
