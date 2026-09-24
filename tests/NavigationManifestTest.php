<?php

namespace FlatRate\ForumNavigation\Tests;

use FlatRate\ForumNavigation\NavigationManifest;
use PHPUnit\Framework\TestCase;

class NavigationManifestTest extends TestCase
{
    public function testEmbeddedManifestPassesOwnedValidation(): void
    {
        $manifest = NavigationManifest::load();

        $this->assertSame(2, $manifest['schemaVersion']);
        $this->assertSame('forum-navigation-runtime-manifest', $manifest['kind']);
        $this->assertSame(
            ['Push to Start', 'Technician Topics', 'Brands'],
            array_column($manifest['groups'], 'label')
        );
        $this->assertSame(
            ['community', 'technician-topics', 'brands'],
            array_column($manifest['groups'], 'id')
        );
        $this->assertTrue($manifest['generalLive']['available']);
        $this->assertSame('/community', NavigationManifest::legacyCommunityRoute());
        $this->assertSame('/t/start-here', NavigationManifest::pushToStartPath());
        $this->assertTrue(NavigationManifest::generalLiveAvailable());
        $this->assertSame('/live/community-general-live', NavigationManifest::generalLiveRoute());
        $this->assertSame('community-general-live', $manifest['generalLive']['roomKey']);
        $this->assertArrayNotHasKey('community', $manifest);
        $this->assertDoesNotMatchRegularExpression('/"label": "Community"/', json_encode($manifest));
    }

    public function testPushToStartDestinationIsStartHere(): void
    {
        $manifest = NavigationManifest::load();
        $destination = $manifest['groups'][0]['destination'];

        $this->assertSame('tag', $destination['type']);
        $this->assertSame('start-here', $destination['boardKey']);
        $this->assertSame('start-here', $destination['slug']);
        $this->assertSame('start-here', $manifest['pushToStart']['boardKey']);
        $this->assertSame('start-here', $manifest['pushToStart']['slug']);
        $this->assertSame('/community', $manifest['legacyCommunity']['route']);
        $this->assertSame('/t/start-here', $manifest['legacyCommunity']['redirectTarget']);
    }

    public function testTechnicianTopicsDestinationIsGeneralShopDiscussion(): void
    {
        $manifest = NavigationManifest::load();
        $destination = $manifest['groups'][1]['destination'];

        $this->assertSame('tag', $destination['type']);
        $this->assertSame('general-shop-discussion', $destination['boardKey']);
        $this->assertSame('general-shop-discussion', $destination['slug']);
    }

    public function testBrandTreeCountsAndGmCdjrJlrChildren(): void
    {
        $manifest = NavigationManifest::load();
        $boards = $manifest['groups'][2]['boards'];
        $keys = [];
        $walk = static function (array $nodes) use (&$walk, &$keys): void {
            foreach ($nodes as $node) {
                $keys[] = $node['boardKey'];
                $walk($node['children'] ?? []);
            }
        };
        $walk($boards);

        $this->assertCount(45, $keys);
        $this->assertCount(45, array_unique($keys));
        $this->assertCount(34, $boards);

        $byKey = [];
        $index = static function (array $nodes) use (&$index, &$byKey): void {
            foreach ($nodes as $node) {
                $byKey[$node['boardKey']] = $node;
                $index($node['children'] ?? []);
            }
        };
        $index($boards);

        $this->assertSame(
            ['Buick', 'Cadillac', 'Chevrolet', 'GMC'],
            array_column($byKey['gm']['children'], 'name')
        );
        $this->assertSame(
            ['Chrysler', 'Dodge', 'Jeep', 'Ram'],
            array_column($byKey['cdjr']['children'], 'name')
        );
        $this->assertNotContains('start-here', $keys);
        foreach ($keys as $key) {
            $this->assertStringEndsNotWith('-live', $key);
        }
    }
}
