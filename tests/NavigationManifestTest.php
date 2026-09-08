<?php

namespace FlatRate\ForumNavigation\Tests;

use FlatRate\ForumNavigation\NavigationManifest;
use PHPUnit\Framework\TestCase;

class NavigationManifestTest extends TestCase
{
    public function testEmbeddedManifestPassesOwnedValidation(): void
    {
        $manifest = NavigationManifest::load();

        $this->assertSame(1, $manifest['schemaVersion']);
        $this->assertSame('forum-navigation-runtime-manifest', $manifest['kind']);
        $this->assertSame(
            ['Community', 'Technician Topics', 'Brands'],
            array_column($manifest['groups'], 'label')
        );
        $this->assertFalse($manifest['community']['generalLiveAvailable']);
        $this->assertSame('/community', NavigationManifest::communityRoute());
        $this->assertFalse(NavigationManifest::generalLiveAvailable());
    }

    public function testTechnicianTopicsDestinationIsGeneralShopDiscussion(): void
    {
        $manifest = NavigationManifest::load();
        $destination = $manifest['groups'][1]['destination'];

        $this->assertSame('tag', $destination['type']);
        $this->assertSame('general-shop-discussion', $destination['boardKey']);
        $this->assertSame('general-shop-discussion', $destination['slug']);
    }

    public function testBrandTreeCountsAndGmCdjrChildren(): void
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

        $this->assertCount(41, $keys);
        $this->assertCount(41, array_unique($keys));
        $this->assertCount(33, $boards);

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
