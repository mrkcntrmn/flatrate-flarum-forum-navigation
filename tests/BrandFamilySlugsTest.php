<?php

namespace FlatRate\ForumNavigation\Tests;

use FlatRate\ForumNavigation\BrandFamilySlugs;
use FlatRate\ForumNavigation\NavigationManifest;
use PHPUnit\Framework\TestCase;

class BrandFamilySlugsTest extends TestCase
{
    public function testParentFamiliesIncludeDescendantsOnce(): void
    {
        $manifest = NavigationManifest::load();

        $this->assertSame(
            ['cdjr', 'chrysler', 'dodge', 'jeep', 'ram'],
            BrandFamilySlugs::expandSlug('cdjr', $manifest)
        );
        $this->assertSame(
            ['gm', 'buick', 'cadillac', 'chevrolet', 'gmc'],
            BrandFamilySlugs::expandSlug('gm', $manifest)
        );
        $this->assertSame(
            ['jlr', 'jaguar', 'land-rover', 'range-rover'],
            BrandFamilySlugs::expandSlug('jlr', $manifest)
        );
    }

    public function testLeafAndUnknownSlugsFailClosed(): void
    {
        $manifest = NavigationManifest::load();

        $this->assertSame(['jeep'], BrandFamilySlugs::expandSlug('jeep', $manifest));
        $this->assertSame(['chevrolet'], BrandFamilySlugs::expandSlug('chevrolet', $manifest));
        $this->assertSame(['volkswagen'], BrandFamilySlugs::expandSlug('volkswagen', $manifest));
        $this->assertSame(['not-a-brand'], BrandFamilySlugs::expandSlug('not-a-brand', $manifest));
        $this->assertSame(['cdjr'], BrandFamilySlugs::expandSlug('cdjr', ['groups' => 'bad']));
        $this->assertSame(['untagged'], BrandFamilySlugs::expandSlug('untagged', $manifest));
    }

    public function testExpandedListDedupesOverlappingInputs(): void
    {
        $manifest = NavigationManifest::load();

        $this->assertSame(
            ['cdjr', 'chrysler', 'dodge', 'jeep', 'ram'],
            BrandFamilySlugs::expandList('cdjr,jeep', $manifest)
        );
    }

    public function testFilterStaysOnTheNativeTagPredicate(): void
    {
        $src = file_get_contents(dirname(__DIR__) . '/src/Search/Filter/BrandFamilyTagFilter.php');
        $extend = file_get_contents(dirname(__DIR__) . '/extend.php');
        $composer = json_decode((string) file_get_contents(dirname(__DIR__) . '/composer.json'), true);

        $this->assertSame('^1.8.8', $composer['require']['flarum/tags'] ?? null);
        $this->assertStringContainsString('parent::constrain', $src);
        $this->assertStringContainsString('BrandFamilySlugs::expandList', $src);
        $this->assertStringNotContainsString("DB::table('discussions')", $src);
        $this->assertStringContainsString('ReplaceBrandFamilyTagFilter', $extend);
        $this->assertStringContainsString('class_exists', $extend);
    }
}
