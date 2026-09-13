<?php

namespace FlatRate\ForumNavigation\Tests;

use FlatRate\ForumNavigation\CommunityCanonical;
use FlatRate\ForumNavigation\NavigationManifest;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class CommunityCanonicalTest extends TestCase
{
    public function testSelfCanonicalUsesConfiguredForumBaseUrl(): void
    {
        $this->assertSame(
            'https://forum.flatrate.wiki/community',
            CommunityCanonical::fromForumBaseUrl('https://forum.flatrate.wiki')
        );
        $this->assertSame(
            'https://forum.flatrate.wiki/community',
            CommunityCanonical::fromForumBaseUrl('https://forum.flatrate.wiki/')
        );
        $this->assertSame(
            'http://127.0.0.1:8080/community',
            CommunityCanonical::fromForumBaseUrl('http://127.0.0.1:8080')
        );
        $this->assertSame(
            'http://127.0.0.1:8080/community',
            CommunityCanonical::fromForumBaseUrl('http://127.0.0.1:8080/')
        );
        $this->assertSame(
            'https://forum.example.test/forum/community',
            CommunityCanonical::fromForumBaseUrl('https://forum.example.test/forum')
        );
    }

    public function testSelfCanonicalStripsQueryAndFragmentFromBase(): void
    {
        $this->assertSame(
            'https://forum.flatrate.wiki/community',
            CommunityCanonical::fromForumBaseUrl('https://forum.flatrate.wiki/?utm=1#frag')
        );
    }

    public function testCommunityAndTrailingSlashShareOneCanonicalDestination(): void
    {
        $this->assertTrue(CommunityCanonical::isCommunityPath('/community'));
        $this->assertTrue(CommunityCanonical::isCommunityPath('/community/'));
        $this->assertTrue(CommunityCanonical::isCommunityPath('community'));
        $this->assertFalse(CommunityCanonical::isCommunityPath('/'));
        $this->assertFalse(CommunityCanonical::isCommunityPath('/t/gm'));
        $this->assertFalse(CommunityCanonical::isCommunityPath('/d/1-example'));
        $this->assertFalse(CommunityCanonical::isCommunityPath('/u/admin'));
        $this->assertFalse(CommunityCanonical::isCommunityPath('/chat'));
        $this->assertFalse(CommunityCanonical::isCommunityPath('/live'));
        $this->assertFalse(CommunityCanonical::isCommunityPath('/live/community-general-live'));
        $this->assertFalse(CommunityCanonical::isCommunityPath('/admin'));
        $this->assertFalse(CommunityCanonical::isCommunityPath('/api'));
        $this->assertFalse(CommunityCanonical::isCommunityPath('/t/start-here'));
        $this->assertFalse(CommunityCanonical::isCommunityPath('/t/general-shop-discussion'));
    }

    public function testRejectsNonAbsoluteOrNonHttpBases(): void
    {
        $this->expectException(InvalidArgumentException::class);
        CommunityCanonical::fromForumBaseUrl('/community');
    }

    public function testRouteContractStaysAlignedAndIndexable(): void
    {
        $root = dirname(__DIR__);
        $extend = (string) file_get_contents($root . '/extend.php');
        $canonicalSrc = (string) file_get_contents($root . '/src/CommunityCanonical.php');

        $this->assertSame('/community', CommunityCanonical::ROUTE_PATH);
        $this->assertSame('/community', NavigationManifest::communityRoute());
        $this->assertStringContainsString(
            "->route('/community', 'flatrate-forum-navigation.community', CommunityCanonical::class)",
            $extend
        );
        $this->assertStringNotContainsString('->content(', $extend);
        $this->assertStringNotContainsString('forum.flatrate.wiki', $canonicalSrc);
        $this->assertStringNotContainsString('pikapods', $canonicalSrc);
        $this->assertStringNotContainsString('noindex', $canonicalSrc);
        $this->assertStringNotContainsString('nofollow', $canonicalSrc);
        $this->assertStringContainsString('Document::$canonicalUrl', $canonicalSrc);
        $this->assertDoesNotMatchRegularExpression('/preg_replace|str_replace\(|middleware/i', $canonicalSrc);
    }

    public function testInvokeSetsExactlyOneDocumentCanonical(): void
    {
        if (!class_exists(\Flarum\Frontend\Document::class) || !class_exists(\Flarum\Http\UrlGenerator::class)) {
            $this->markTestSkipped('flarum/core is not installed in the package vendor');
        }

        $routes = new \Flarum\Http\RouteCollection();
        $routes->get('/community', CommunityCanonical::ROUTE_NAME, static function () {
            return null;
        });
        $forumUrls = new \Flarum\Http\RouteCollectionUrlGenerator(
            'https://disposable.example:8080/',
            $routes
        );

        $url = $this->getMockBuilder(\Flarum\Http\UrlGenerator::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['to'])
            ->getMock();
        $url->expects($this->once())->method('to')->with('forum')->willReturn($forumUrls);

        $document = $this->getMockBuilder(\Flarum\Frontend\Document::class)
            ->disableOriginalConstructor()
            ->getMock();
        $document->canonicalUrl = null;
        $document->head = [];
        $document->meta = ['robots' => 'index, follow'];

        $request = $this->createMock(\Psr\Http\Message\ServerRequestInterface::class);

        $content = new CommunityCanonical($url);
        $content($document, $request);

        $this->assertSame('https://disposable.example:8080/community', $document->canonicalUrl);
        $this->assertSame([], $document->head);
        $this->assertSame('index, follow', $document->meta['robots']);
    }
}
