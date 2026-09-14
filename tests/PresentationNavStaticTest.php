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
        $this->assertStringNotContainsString('FlatRatePresentationNav-groupLabel', $src);
        $this->assertStringContainsString('START_NAV_LABEL', $src);
        $this->assertStringContainsString('FlatRatePresentationNav-link--start', $src);
        $this->assertStringContainsString('TECHNICIAN_TOPICS_ICON', $src);
        $this->assertStringContainsString('FlatRatePresentationNav-link--technician', $src);
        $this->assertStringContainsString('BRAND_NAV_ICON', $src);
        $this->assertStringContainsString('fa-wrench', $dist);
        $this->assertStringContainsString('#66ff00', $less);
        $this->assertStringNotContainsString('FlatRatePresentationNav-groupLabel', $dist);
        $this->assertStringNotContainsString('FlatRatePresentationNav-groupLabel', $less);
        $this->assertStringContainsString('.item-flatrateDrawerNav', $less);
        $this->assertStringContainsString('.item-flatrateDrawerFollowing', $less);
        $this->assertStringContainsString('.App-titleControl .FlatRatePresentationNav-item--brands', $less);
        $this->assertStringContainsString('text-align: center', $less);
        $this->assertStringContainsString('display: inline-block', $less);
        $this->assertStringContainsString('margin-left: 1.25rem', $less);
        $this->assertStringContainsString('.App-drawer .item-session', $less);
        $this->assertStringContainsString('padding: 0.75rem 10px 1rem', $less);
        $this->assertStringContainsString('padding: 15px 20px 15px 50px', $less);
        $this->assertStringNotContainsString('padding-left: 70px', $less);
        $this->assertStringContainsString('.App-drawer .item-LiveChats', $less);
        $this->assertStringContainsString('.App-drawer .item-flatrateDrawerFollowing .Button', $less);
        $this->assertStringContainsString('FlatRatePresentationNav-item--technician-topics', $less);
        $index = (string) file_get_contents($root . '/js/src/forum/index.js');
        $this->assertStringContainsString("from 'flarum/forum/components/HeaderSecondary'", $index);
        $this->assertStringContainsString('flatrateDrawerNav', $index);
        $this->assertStringContainsString('flatrateDrawerFollowing', $index);
    }
}
