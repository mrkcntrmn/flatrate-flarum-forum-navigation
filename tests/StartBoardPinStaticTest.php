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
        $this->assertStringContainsString('shouldShowStartBoardPin', $util);
        $this->assertStringContainsString('flatrateStartBoardPin', $util);
        $this->assertStringContainsString("contentItems", $index);
        $this->assertStringContainsString('StartBoardPin', $index);
        $this->assertStringContainsString('addStartBoardPinItem', $index);
        $this->assertStringContainsString('.FlatRateStartBoardPin', $less);
        $this->assertStringContainsString('#66ff00', $less);
        $this->assertStringContainsString('FlatRateStartBoardPin', $dist);
        $this->assertStringContainsString('flatrateStartBoardPin', $dist);
        $this->assertStringNotContainsString("createRecord('discussions')", $component);
        $this->assertStringNotContainsString("createRecord('discussions')", $index);
        $this->assertStringNotContainsString('new Discussion', $component);
        $this->assertStringNotContainsString('new Discussion', $index);
    }
}
