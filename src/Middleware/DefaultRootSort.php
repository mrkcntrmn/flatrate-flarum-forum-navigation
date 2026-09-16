<?php

namespace FlatRate\ForumNavigation\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class DefaultRootSort implements MiddlewareInterface
{
    public const DEFAULT_SORT = 'top';

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $query = self::queryParamsFor(
            $request->getMethod(),
            $request->getUri()->getPath(),
            $request->getQueryParams()
        );

        if ($query !== $request->getQueryParams()) {
            $request = $request->withQueryParams($query);
        }

        return $handler->handle($request);
    }

    public static function queryParamsFor(string $method, string $path, array $query): array
    {
        if (strtoupper($method) !== 'GET' || self::normalizePath($path) !== '/') {
            return $query;
        }

        $search = $query['q'] ?? null;
        if (is_string($search) ? trim($search) !== '' : (bool) $search) {
            return $query;
        }

        $sort = $query['sort'] ?? null;
        if (is_string($sort) ? trim($sort) !== '' : (bool) $sort) {
            return $query;
        }

        $query['sort'] = self::DEFAULT_SORT;

        return $query;
    }

    private static function normalizePath(string $path): string
    {
        $normalized = rtrim($path, '/');
        return $normalized === '' ? '/' : $normalized;
    }
}
