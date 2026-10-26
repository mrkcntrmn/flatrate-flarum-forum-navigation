<?php

/*
 * This file is part of flatrate/flarum-forum-navigation.
 */

namespace FlatRate\ForumNavigation;

use Flarum\Frontend\Document;
use Flarum\Http\RequestUtil;
use Flarum\Http\SlugManager;
use Flarum\Http\UrlGenerator;
use Flarum\Tags\Tag as TagModel;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use InvalidArgumentException;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Flarum 2 tag pages set a title and description and leave canonicalUrl empty.
 * Fill that URL from the configured forum origin so it cannot point at the host
 * that merely runs the container.
 */
final class TagCanonical
{
    public const ROUTE_NAME = 'tag';

    public function __construct(
        private readonly UrlGenerator $url,
        private readonly SlugManager $slugger
    ) {
    }

    public function __invoke(Document $document, ServerRequestInterface $request): void
    {
        $parameters = $request->getAttribute('routeParameters');
        $canonical = self::canonicalForRoute(
            $this->url->to('forum')->base(),
            $request->getAttribute('routeName'),
            $parameters,
            $document->canonicalUrl
        );

        if ($canonical === null || !is_array($parameters) || !isset($parameters['slug']) || !is_string($parameters['slug'])) {
            return;
        }

        try {
            $this->slugger->forResource(TagModel::class)->fromSlug($parameters['slug'], RequestUtil::getActor($request));
        } catch (ModelNotFoundException) {
            return;
        }

        $document->canonicalUrl = $canonical;
    }

    /**
     * @param mixed $routeParameters
     */
    public static function canonicalForRoute(string $forumBaseUrl, mixed $routeName, mixed $routeParameters, ?string $existingCanonical): ?string
    {
        if ($routeName !== self::ROUTE_NAME) {
            return null;
        }

        if (is_string($existingCanonical) && $existingCanonical !== '') {
            return null;
        }

        $slug = is_array($routeParameters) ? ($routeParameters['slug'] ?? null) : null;
        if (!is_string($slug) || !self::isBoardSlug($slug)) {
            return null;
        }

        return self::canonicalFromForumBaseUrl($forumBaseUrl, $slug);
    }

    public static function canonicalFromForumBaseUrl(string $forumBaseUrl, string $slug): string
    {
        if (!self::isBoardSlug($slug)) {
            throw new InvalidArgumentException('Tag slug must be one public path segment');
        }

        return CommunityRedirect::absolutePathFromForumBaseUrl($forumBaseUrl, '/t/'.$slug);
    }

    public static function isBoardSlug(string $slug): bool
    {
        return (bool) preg_match('/^[A-Za-z0-9][A-Za-z0-9_-]*$/', $slug);
    }
}
