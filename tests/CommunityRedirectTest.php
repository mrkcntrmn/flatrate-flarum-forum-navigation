<?php

namespace FlatRate\ForumNavigation\Tests;

use FlatRate\ForumNavigation\CommunityRedirect;
use FlatRate\ForumNavigation\NavigationManifest;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class CommunityRedirectTest extends TestCase
{
    public function testRedirectTargetUsesConfiguredForumBaseUrl(): void
    {
        $this->assertSame(
            'https://forum.flatrate.wiki/t/start-here',
            CommunityRedirect::targetFromForumBaseUrl('https://forum.flatrate.wiki')
        );
        $this->assertSame(
            'https://forum.flatrate.wiki/t/start-here',
            CommunityRedirect::targetFromForumBaseUrl('https://forum.flatrate.wiki/')
        );
        $this->assertSame(
            'http://127.0.0.1:8080/t/start-here',
            CommunityRedirect::targetFromForumBaseUrl('http://127.0.0.1:8080')
        );
        $this->assertSame(
            'https://forum.example.test/forum/t/start-here',
            CommunityRedirect::targetFromForumBaseUrl('https://forum.example.test/forum')
        );
    }

    public function testRedirectTargetStripsQueryAndFragmentFromBase(): void
    {
        $this->assertSame(
            'https://forum.flatrate.wiki/t/start-here',
            CommunityRedirect::targetFromForumBaseUrl('https://forum.flatrate.wiki/?utm=1#frag')
        );
    }

    public function testCommunityAndTrailingSlashAreLegacyPaths(): void
    {
        $this->assertTrue(CommunityRedirect::isCommunityPath('/community'));
        $this->assertTrue(CommunityRedirect::isCommunityPath('/community/'));
        $this->assertTrue(CommunityRedirect::isCommunityPath('community'));
        $this->assertFalse(CommunityRedirect::isCommunityPath('/'));
        $this->assertFalse(CommunityRedirect::isCommunityPath('/t/gm'));
        $this->assertFalse(CommunityRedirect::isCommunityPath('/d/1-example'));
        $this->assertFalse(CommunityRedirect::isCommunityPath('/u/admin'));
        $this->assertFalse(CommunityRedirect::isCommunityPath('/chat'));
        $this->assertFalse(CommunityRedirect::isCommunityPath('/live'));
        $this->assertFalse(CommunityRedirect::isCommunityPath('/live/community-general-live'));
        $this->assertFalse(CommunityRedirect::isCommunityPath('/admin'));
        $this->assertFalse(CommunityRedirect::isCommunityPath('/api'));
        $this->assertFalse(CommunityRedirect::isCommunityPath('/t/start-here'));
        $this->assertFalse(CommunityRedirect::isCommunityPath('/t/general-shop-discussion'));
    }

    public function testRejectsNonAbsoluteOrNonHttpBases(): void
    {
        $this->expectException(InvalidArgumentException::class);
        CommunityRedirect::targetFromForumBaseUrl('/community');
    }

    public function testRouteContractIsRedirectNotLandingPage(): void
    {
        $root = dirname(__DIR__);
        $extend = (string) file_get_contents($root . '/extend.php');
        $redirectSrc = (string) file_get_contents($root . '/src/CommunityRedirect.php');

        $this->assertSame('/community', CommunityRedirect::ROUTE_PATH);
        $this->assertSame('/t/start-here', CommunityRedirect::TARGET_PATH);
        $this->assertSame(301, CommunityRedirect::STATUS);
        $this->assertSame('/community', NavigationManifest::legacyCommunityRoute());
        $this->assertSame('/t/start-here', NavigationManifest::pushToStartPath());
        $this->assertStringContainsString(
            "->get('/community', 'flatrate-forum-navigation.community-redirect', CommunityRedirect::class)",
            $extend
        );
        $this->assertStringNotContainsString('CommunityCanonical', $extend);
        $this->assertStringNotContainsString("->route('/community'", $extend);
        $this->assertStringNotContainsString('forum.flatrate.wiki', $redirectSrc);
        $this->assertStringNotContainsString('pikapods', $redirectSrc);
        $this->assertStringNotContainsString('noindex', $redirectSrc);
        $this->assertStringNotContainsString('canonicalUrl', $redirectSrc);
        $this->assertStringContainsString('RedirectResponse', $redirectSrc);
    }

    public function testHandleReturnsPermanentRedirect(): void
    {
        if (!class_exists(\Flarum\Http\UrlGenerator::class) || !class_exists(\Laminas\Diactoros\Response\RedirectResponse::class)) {
            $this->markTestSkipped('flarum/core is not installed in the package vendor');
        }

        $routes = new \Flarum\Http\RouteCollection();
        $routes->get('/t/{slug}', 'tag', static function () {
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

        $request = $this->createMock(\Psr\Http\Message\ServerRequestInterface::class);

        $handler = new CommunityRedirect($url);
        $response = $handler->handle($request);

        $this->assertSame(301, $response->getStatusCode());
        $this->assertSame(
            'https://disposable.example:8080/t/start-here',
            $response->getHeaderLine('location')
        );
    }
}
