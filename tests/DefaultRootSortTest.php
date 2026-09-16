<?php

namespace FlatRate\ForumNavigation\Tests;

use FlatRate\ForumNavigation\Middleware\DefaultRootSort;
use PHPUnit\Framework\TestCase;

class DefaultRootSortTest extends TestCase
{
    public function testCleanRootDefaultsToTop(): void
    {
        $this->assertSame(['sort' => 'top'], DefaultRootSort::queryParamsFor('GET', '/', []));
        $this->assertSame(
            ['page' => '2', 'sort' => 'top'],
            DefaultRootSort::queryParamsFor('GET', '/', ['page' => '2'])
        );
        $this->assertSame(
            ['sort' => 'top'],
            DefaultRootSort::queryParamsFor('GET', '/', ['sort' => ''])
        );
    }

    public function testExplicitSortRemainsUserControlled(): void
    {
        $this->assertSame(
            ['sort' => 'latest'],
            DefaultRootSort::queryParamsFor('GET', '/', ['sort' => 'latest'])
        );
        $this->assertSame(
            ['sort' => 'newest'],
            DefaultRootSort::queryParamsFor('GET', '/', ['sort' => 'newest'])
        );
    }

    public function testSearchAndNonRootRoutesKeepNativeBehavior(): void
    {
        $this->assertSame(
            ['q' => 'brakes'],
            DefaultRootSort::queryParamsFor('GET', '/', ['q' => 'brakes'])
        );
        $this->assertSame([], DefaultRootSort::queryParamsFor('GET', '/t/toyota', []));
        $this->assertSame([], DefaultRootSort::queryParamsFor('GET', '/following', []));
        $this->assertSame([], DefaultRootSort::queryParamsFor('POST', '/', []));
    }

    public function testTrailingSlashNormalizationStaysAtForumRoot(): void
    {
        $this->assertSame(['sort' => 'top'], DefaultRootSort::queryParamsFor('GET', '///', []));
    }
}
