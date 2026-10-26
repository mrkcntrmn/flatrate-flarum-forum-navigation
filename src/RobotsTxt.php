<?php

/*
 * This file is part of flatrate/flarum-forum-navigation.
 */

namespace FlatRate\ForumNavigation;

use Flarum\Http\UrlGenerator;
use Laminas\Diactoros\Response\TextResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Native Flarum 2 does not publish robots.txt. This handler points crawlers at
 * the existing same-host sitemap and keeps the admin and API trees out of the
 * default crawl. It does not decide which public discussions are indexable.
 */
final class RobotsTxt implements RequestHandlerInterface
{
    public const ROUTE_PATH = '/robots.txt';

    public function __construct(
        private readonly UrlGenerator $url
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        return new TextResponse(
            self::documentForForumBaseUrl($this->url->to('forum')->base()),
            200,
            ['Content-Type' => 'text/plain; charset=UTF-8']
        );
    }

    public static function documentForForumBaseUrl(string $forumBaseUrl): string
    {
        $sitemap = CommunityRedirect::absolutePathFromForumBaseUrl($forumBaseUrl, '/sitemap.xml');

        return implode("\n", [
            'User-agent: *',
            'Disallow: /admin',
            'Disallow: /api/',
            '',
            'Sitemap: '.$sitemap,
            '',
        ]);
    }
}
