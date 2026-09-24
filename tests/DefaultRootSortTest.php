<?php

namespace FlatRate\ForumNavigation\Tests;

use PHPUnit\Framework\TestCase;

/**
 * Authenticated MAIN returns to native Latest — no forced sort=top middleware.
 */
class DefaultRootSortTest extends TestCase
{
    public function testDefaultRootSortMiddlewareIsRetired(): void
    {
        $root = dirname(__DIR__);
        $this->assertFileDoesNotExist($root . '/src/Middleware/DefaultRootSort.php');

        $extend = (string) file_get_contents($root . '/extend.php');
        $this->assertStringNotContainsString('DefaultRootSort', $extend);
        $this->assertStringNotContainsString("Extend\\Middleware('forum')", $extend);
    }

    public function testFrontendNoLongerForcesTopRootSort(): void
    {
        $root = dirname(__DIR__);
        $index = (string) file_get_contents($root . '/js/src/forum/index.js');
        $helper = (string) file_get_contents($root . '/js/src/forum/utils/defaultRootSort.js');

        $this->assertStringNotContainsString('withDefaultRootSort', $index);
        $this->assertStringNotContainsString("sort: 'top'", $helper);
        $this->assertStringContainsString('DEFAULT_ROOT_SORT = null', $helper);
    }
}
