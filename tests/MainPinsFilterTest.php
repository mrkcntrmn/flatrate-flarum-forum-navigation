<?php

namespace FlatRate\ForumNavigation\Tests;

use FlatRate\ForumNavigation\Search\Filter\MainPinsFilter;
use PHPUnit\Framework\TestCase;

class MainPinsFilterTest extends TestCase
{
    public function testNormalizeIdsDedupesAndDropsInvalid(): void
    {
        $this->assertSame(
            [89, 42, 103],
            MainPinsFilter::normalizeIds([89, '42', 103, 89, 0, -3, 'x', null])
        );
    }

    public function testNormalizeIdsFailsClosedOnInvalidJson(): void
    {
        $this->assertSame([], MainPinsFilter::normalizeIds('{not-json'));
        $this->assertSame([], MainPinsFilter::normalizeIds(null));
        $this->assertSame([], MainPinsFilter::normalizeIds(''));
    }

    public function testNormalizeIdsAcceptsJsonString(): void
    {
        $this->assertSame([1, 2], MainPinsFilter::normalizeIds('[1,2,1]'));
    }

    public function testFilterKeysAndSettingsAreStable(): void
    {
        $extend = (string) file_get_contents(dirname(__DIR__) . '/extend.php');
        $main = (string) file_get_contents(dirname(__DIR__) . '/src/Search/Filter/MainPinsFilter.php');
        $exclude = (string) file_get_contents(dirname(__DIR__) . '/src/Search/Filter/ExcludeMainPinsFilter.php');

        $this->assertStringContainsString('flatrateMainPins', $main);
        $this->assertStringContainsString('flatrateExcludeMainPins', $exclude);
        $this->assertStringContainsString('whereIn', $main);
        $this->assertStringContainsString('whereNotIn', $exclude);
        $this->assertStringNotContainsString('is_sticky', $main);
        $this->assertStringNotContainsString('isSticky', $main);
        $this->assertStringNotContainsString('is_sticky', $exclude);
        $this->assertStringNotContainsString('isSticky', $exclude);
        $this->assertStringContainsString('DiscussionFilterer::class', $extend);
        $this->assertStringContainsString('MainPinsFilter::class', $extend);
        $this->assertStringContainsString('ExcludeMainPinsFilter::class', $extend);
        $this->assertStringNotContainsString('DefaultRootSort', $extend);
    }
}
