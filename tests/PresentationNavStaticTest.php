<?php

namespace FlatRate\ForumNavigation\Tests;

use PHPUnit\Framework\TestCase;

class PresentationNavStaticTest extends TestCase
{
    public function testSourceAndDistHaveNoCollapseControls(): void
    {
        $root = dirname(__DIR__);
        $src = (string) file_get_contents($root . '/js/src/forum/components/PresentationNav.js');
        $dist = (string) file_get_contents($root . '/js/dist/forum.js');
        $less = (string) file_get_contents($root . '/resources/less/forum.less');

        foreach ([
            'brandsExpanded',
            'expandedParents',
            'FlatRatePresentationNav-expander',
            'aria-expanded',
            'aria-controls',
        ] as $needle) {
            $this->assertStringNotContainsString($needle, $src, $needle . ' remains in PresentationNav source');
            $this->assertStringNotContainsString($needle, $dist, $needle . ' remains in compiled forum.js');
        }

        $this->assertStringNotContainsString('FlatRatePresentationNav-expander', $less);
        $this->assertStringContainsString('children.map((child) => this.renderBrandNode(child, depth + 1))', $src);
        $this->assertStringContainsString('brandHref(board)', $src);
        $this->assertStringContainsString('.item-flatrateDrawerNav', $less);
        $index = (string) file_get_contents($root . '/js/src/forum/index.js');
        $this->assertStringContainsString("from 'flarum/forum/components/HeaderSecondary'", $index);
        $this->assertStringContainsString('flatrateDrawerNav', $index);
    }
}
