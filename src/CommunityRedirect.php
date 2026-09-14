<?php

/*
 * This file is part of flatrate/flarum-forum-navigation.
 */

namespace FlatRate\ForumNavigation;

use Flarum\Http\UrlGenerator;
use InvalidArgumentException;
use Laminas\Diactoros\Response\RedirectResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Compatibility redirect for the retired public Community landing route.
 *
 * GET /community -> HTTP 301 Location: /t/start-here
 *
 * Uses Flarum's supported forum Routes extend and a PSR-15 handler.
 * Does not emit a /community self-canonical.
 */
final class CommunityRedirect implements RequestHandlerInterface
{
    public const ROUTE_NAME = 'flatrate-forum-navigation.community-redirect';
    public const ROUTE_PATH = '/community';
    public const TARGET_PATH = '/t/start-here';
    public const STATUS = 301;

    /** @var UrlGenerator */
    private $url;

    public function __construct(UrlGenerator $url)
    {
        $this->url = $url;
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        return new RedirectResponse(
            self::targetFromForumBaseUrl($this->url->to('forum')->base()),
            self::STATUS
        );
    }

    /**
     * Derive the Push to Start destination from the configured forum origin.
     * Never hard-codes a production hostname.
     */
    public static function targetFromForumBaseUrl(string $forumBaseUrl): string
    {
        return self::absolutePathFromForumBaseUrl($forumBaseUrl, self::TARGET_PATH);
    }

    public static function legacyCommunityUrlFromForumBaseUrl(string $forumBaseUrl): string
    {
        return self::absolutePathFromForumBaseUrl($forumBaseUrl, self::ROUTE_PATH);
    }

    public static function isCommunityPath(?string $path): bool
    {
        if (!is_string($path) || $path === '') {
            return false;
        }

        return '/' . trim($path, '/') === self::ROUTE_PATH;
    }

    private static function absolutePathFromForumBaseUrl(string $forumBaseUrl, string $path): string
    {
        $parts = parse_url($forumBaseUrl);
        if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
            throw new InvalidArgumentException('Forum base URL must be an absolute http(s) origin');
        }

        $scheme = strtolower((string) $parts['scheme']);
        if ($scheme !== 'http' && $scheme !== 'https') {
            throw new InvalidArgumentException('Forum base URL scheme must be http or https');
        }

        $host = strtolower((string) $parts['host']);
        $port = isset($parts['port']) ? ':' . $parts['port'] : '';
        $basePath = isset($parts['path']) ? rtrim((string) $parts['path'], '/') : '';

        return $scheme . '://' . $host . $port . $basePath . $path;
    }
}
