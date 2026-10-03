<?php

/*
 * This file is part of flatrate/flarum-forum-navigation.
 */

namespace FlatRate\ForumNavigation\Tests;

use Flarum\Http\SlugManager;
use Flarum\Tags\Query\TagFilterGambit;
use FlatRate\ForumNavigation\Provider\BrandFamilyTagFilterServiceProvider;
use FlatRate\ForumNavigation\Search\Filter\BrandFamilyTagFilter;
use Illuminate\Container\Container;
use PHPUnit\Framework\TestCase;

final class BrandFamilyTagFilterResolutionTest extends TestCase
{
    public function testContainerResolvesNativeGambitToFamilyFilter(): void
    {
        $container = new Container();
        $container->instance(SlugManager::class, new SlugManager([]));

        (new BrandFamilyTagFilterServiceProvider($container))->register();

        $resolved = $container->make(TagFilterGambit::class);

        $this->assertInstanceOf(BrandFamilyTagFilter::class, $resolved);
        $this->assertSame(BrandFamilyTagFilter::class, get_class($resolved));
        $this->assertNotSame(TagFilterGambit::class, get_class($resolved));
    }

    public function testRegistrationDoesNotAddASecondTagFilter(): void
    {
        $extend = file_get_contents(dirname(__DIR__) . '/extend.php');
        $provider = file_get_contents(dirname(__DIR__) . '/src/Provider/BrandFamilyTagFilterServiceProvider.php');

        $this->assertStringContainsString('BrandFamilyTagFilterServiceProvider', $extend);
        $this->assertStringContainsString('Extend\\ServiceProvider', $extend);
        $this->assertStringNotContainsString('ReplaceBrandFamilyTagFilter', $extend);
        $this->assertStringNotContainsString('addFilter(BrandFamilyTagFilter', $extend);
        $this->assertStringNotContainsString('addFilter(\\FlatRate\\ForumNavigation\\Search\\Filter\\BrandFamilyTagFilter', $extend);
        $this->assertStringContainsString('bind(TagFilterGambit::class, BrandFamilyTagFilter::class)', $provider);
        $this->assertFileDoesNotExist(dirname(__DIR__) . '/src/Extend/ReplaceBrandFamilyTagFilter.php');
    }
}
