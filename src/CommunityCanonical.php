<?php

/*
 * This file is part of flatrate/flarum-forum-navigation.
 */

namespace FlatRate\ForumNavigation;

use Flarum\Frontend\Document;
use Flarum\Http\UrlGenerator;
use InvalidArgumentException;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Route-scoped server-side Community self-canonical.
 *
 * Uses Flarum's supported Frontend::route() content callback and
 * Document::$canonicalUrl so the tag is present in raw HTML without
 * JavaScript or response-body rewriting.
 */
final class CommunityCanonical
{
    public const ROUTE_NAME = 'flatrate-forum-navigation.community';
    public const ROUTE_PATH = '/community';

    /** @var UrlGenerator */
    private $url;

    public function __construct(UrlGenerator $url)
    {
        $this->url = $url;
    }

    public function __invoke(Document $document, ServerRequestInterface $request): void
    {
        $document->canonicalUrl = self::fromForumBaseUrl($this->url->to('forum')->base());
    }

    /**
     * Derive the Community self-canonical from the configured forum origin.
     * Never hard-codes a production hostname.
     */
    public static function fromForumBaseUrl(string $forumBaseUrl): string
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

        return $scheme . '://' . $host . $port . $basePath . self::ROUTE_PATH;
    }

    public static function isCommunityPath(?string $path): bool
    {
        if (!is_string($path) || $path === '') {
            return false;
        }

        return '/' . trim($path, '/') === self::ROUTE_PATH;
    }
}
