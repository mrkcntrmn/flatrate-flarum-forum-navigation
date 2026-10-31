<?php

namespace FlatRate\ForumNavigation\Tests;

use FlatRate\ForumNavigation\CommunityRedirect;
use FlatRate\ForumNavigation\RobotsTxt;
use FlatRate\ForumNavigation\TagCanonical;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class F2NavigationSeoTest extends TestCase
{
    public function testGuestAndMemberBoardCanonicalsUseTheConfiguredForumHost(): void
    {
        foreach ([
            'tip' => 'https://forum.flatrate.wiki/t/tip',
            'start-here' => 'https://forum.flatrate.wiki/t/start-here',
            'general-shop-discussion' => 'https://forum.flatrate.wiki/t/general-shop-discussion',
            'aston-martin' => 'https://forum.flatrate.wiki/t/aston-martin',
        ] as $slug => $expected) {
            $this->assertSame(
                $expected,
                TagCanonical::canonicalForRoute('https://forum.flatrate.wiki', 'tag', ['slug' => $slug], null)
            );
        }
    }

    public function testDiscussionAndHomeRoutesAreLeftToNativeCanonicals(): void
    {
        $this->assertNull(TagCanonical::canonicalForRoute(
            'https://forum.flatrate.wiki',
            'discussion',
            ['id' => '105'],
            null
        ));
        $this->assertNull(TagCanonical::canonicalForRoute(
            'https://forum.flatrate.wiki',
            'default',
            [],
            'https://forum.flatrate.wiki'
        ));
    }

    public function testExistingCanonicalIsNotReplaced(): void
    {
        $this->assertNull(TagCanonical::canonicalForRoute(
            'https://forum.flatrate.wiki',
            'tag',
            ['slug' => 'tip'],
            'https://forum.flatrate.wiki/t/tip'
        ));
    }

    public function testHiddenOrUnsafeSlugsDoNotReceiveACanonical(): void
    {
        foreach (['', '../admin', 'tip/secret', 'hidden room', 'tag?next=/admin'] as $slug) {
            $this->assertNull(TagCanonical::canonicalForRoute(
                'https://forum.flatrate.wiki',
                'tag',
                ['slug' => $slug],
                null
            ));
        }
    }

    public function testCanonicalRejectsANonHttpForumBase(): void
    {
        $this->expectException(InvalidArgumentException::class);
        TagCanonical::canonicalFromForumBaseUrl('simple-lemming.pikapod.net', 'tip');
    }

    public function testRobotsPointsAtTheConfiguredSitemapAndSkipsAdminAndApi(): void
    {
        $body = RobotsTxt::documentForForumBaseUrl('https://forum.flatrate.wiki');

        $this->assertStringContainsString("Sitemap: https://forum.flatrate.wiki/sitemap.xml\n", $body);
        $this->assertStringContainsString('Disallow: /admin', $body);
        $this->assertStringContainsString('Disallow: /api/', $body);
        $this->assertStringNotContainsString('pikapod', $body);
        $this->assertStringNotContainsString('Disallow: /t/', $body);
        $this->assertStringNotContainsString('Disallow: /d/', $body);
    }

    public function testCommunityRedirectStillTargetsStartHereOnTheConfiguredHost(): void
    {
        $this->assertSame(
            'https://forum.flatrate.wiki/t/start-here',
            CommunityRedirect::targetFromForumBaseUrl('https://forum.flatrate.wiki')
        );
    }

    public function testF2ExtenderRestoresPresentationAndKeepsNativeCanonicals(): void
    {
        $extend = (string) file_get_contents(dirname(__DIR__).'/extend.php');

        $this->assertStringContainsString('TagCanonical::class', $extend);
        $this->assertStringContainsString('RobotsTxt::class', $extend);
        $this->assertStringContainsString(
            "->get('/community', 'flatrate-forum-navigation.community-redirect', CommunityRedirect::class)",
            $extend
        );
        $this->assertStringContainsString('js/dist/forum.js', $extend);
        $this->assertStringContainsString('js/dist/admin.js', $extend);
        $this->assertStringNotContainsString('DiscussionFilterer', $extend);
        $this->assertStringContainsString('Extend\\View()', $extend);
        $this->assertStringNotContainsString('forum.flatrate.wiki', $extend);
        $this->assertStringNotContainsString('pikapod', $extend);
    }
}
