<?php

namespace FlatRate\ForumNavigation\Tests;

use PHPUnit\Framework\TestCase;

class StartBoardPinStaticTest extends TestCase
{
    public function testStartBoardPinSourcesUseCanonicalAuthority(): void
    {
        $root = dirname(__DIR__);
        $component = (string) file_get_contents($root . '/js/src/forum/components/StartBoardPin.js');
        $util = (string) file_get_contents($root . '/js/src/forum/utils/startBoardPin.js');
        $index = (string) file_get_contents($root . '/js/src/forum/index.js');
        $less = (string) file_get_contents($root . '/resources/less/forum.less');
        $dist = (string) file_get_contents($root . '/js/dist/forum.js');

        $this->assertStringContainsString('pushToStartHref', $component);
        $this->assertStringContainsString('START_NAV_LABEL', $component);
        $this->assertStringContainsString('START_NAV_ICON', $component);
        $this->assertStringContainsString('FlatRateStartBoardPin', $component);
        $this->assertStringContainsString('data-flatrate-start-board-pin', $component);
        $this->assertStringContainsString('START_BOARD_PIN_DISMISSED_KEY', $component);
        $this->assertStringContainsString('flatrate:start-board-pin:dismissed:v1', $component);
        $this->assertStringContainsString('localStorage.setItem', $component);
        $this->assertStringContainsString('FlatRateStartBoardPin-close', $component);
        $this->assertStringContainsString('fas fa-times', $component);
        $this->assertStringContainsString('super.oninit(vnode)', $component);
        $this->assertStringNotContainsString('START_BOARD_PIN_COLLAPSED_KEY', $component);
        $this->assertStringNotContainsString('aria-expanded', $component);
        $this->assertStringNotContainsString('fa-chevron-up', $component);
        $this->assertStringNotContainsString('fa-chevron-down', $component);
        $this->assertStringContainsString('shouldShowStartBoardPin', $util);
        $this->assertStringContainsString('flatrateStartBoardPin', $util);
        $this->assertStringContainsString('START_BOARD_PIN_PRIORITY = 110', $util);
        $this->assertStringContainsString("contentItems", $index);
        $this->assertStringContainsString('StartBoardPin', $index);
        $this->assertStringContainsString('addStartBoardPinItem', $index);
        $this->assertStringContainsString('.FlatRateStartBoardPin', $less);
        $this->assertStringContainsString('.FlatRateStartBoardPin-close', $less);
        $this->assertStringContainsString('grid-template-columns: 44px minmax(0, 1fr) 44px', $less);
        $this->assertStringContainsString('#66ff00', $less);
        $this->assertStringNotContainsString('.FlatRateStartBoardPin-toggle', $less);
        $this->assertStringNotContainsString('.FlatRateStartBoardPin.is-collapsed', $less);
        $this->assertStringContainsString('FlatRateStartBoardPin', $dist);
        $this->assertStringContainsString('flatrateStartBoardPin', $dist);
        $this->assertStringContainsString('dismissed:v1', $dist);
        $this->assertStringNotContainsString("createRecord('discussions')", $component);
        $this->assertStringNotContainsString("createRecord('discussions')", $index);
        $this->assertStringNotContainsString('new Discussion', $component);
        $this->assertStringNotContainsString('new Discussion', $index);
    }
}
