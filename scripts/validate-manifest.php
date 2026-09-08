#!/usr/bin/env php
<?php

/**
 * Fail-closed package-level validation for the embedded navigation runtime manifest.
 * No network access. Exit 0 on PASS, 1 on FAIL.
 */

declare(strict_types=1);

$root = dirname(__DIR__);
$manifestPath = $root . '/resources/navigation-runtime-manifest.json';
$provenancePath = $root . '/resources/navigation-runtime-manifest.provenance.json';

function fail(string $message): never
{
    fwrite(STDERR, 'MANIFEST_VALIDATE=FAIL ' . $message . PHP_EOL);
    exit(1);
}

if (!is_file($manifestPath)) {
    fail('embedded manifest missing: ' . $manifestPath);
}

if (!is_file($provenancePath)) {
    fail('provenance metadata missing: ' . $provenancePath);
}

$raw = file_get_contents($manifestPath);
if ($raw === false) {
    fail('unable to read embedded manifest');
}

$sha256 = hash('sha256', $raw);
$manifest = json_decode($raw, true);
if (!is_array($manifest)) {
    fail('embedded manifest is not valid JSON');
}

$provenanceRaw = file_get_contents($provenancePath);
if ($provenanceRaw === false) {
    fail('unable to read provenance metadata');
}

$provenance = json_decode($provenanceRaw, true);
if (!is_array($provenance)) {
    fail('provenance metadata is not valid JSON');
}

$requiredProvenance = [
    'CONTROL_REPO' => 'mrkcntrmn/flatrate-wiki',
    'MANIFEST_SOURCE_PATH' => 'configs/forum/navigation-runtime-manifest.json',
];

foreach ($requiredProvenance as $key => $expected) {
    if (($provenance[$key] ?? null) !== $expected) {
        fail("provenance {$key} mismatch");
    }
}

if (($provenance['SOURCE_MANIFEST_SHA256'] ?? null) !== $sha256) {
    fail(
        'SOURCE_MANIFEST_SHA256 mismatch want='
        . ($provenance['SOURCE_MANIFEST_SHA256'] ?? '<missing>')
        . ' got=' . $sha256
    );
}

if (($manifest['schemaVersion'] ?? null) !== 1) {
    fail('schemaVersion must be 1');
}

if (($manifest['kind'] ?? null) !== 'forum-navigation-runtime-manifest') {
    fail('kind must be forum-navigation-runtime-manifest');
}

$groups = $manifest['groups'] ?? null;
if (!is_array($groups) || count($groups) !== 3) {
    fail('exactly three groups required');
}

$labels = array_map(static fn ($group) => $group['label'] ?? null, $groups);
if ($labels !== ['Community', 'Technician Topics', 'Brands']) {
    fail('group order must be Community, Technician Topics, Brands');
}

$modes = array_map(
    static fn ($group) => [$group['id'] ?? null, $group['mode'] ?? null],
    $groups
);
if ($modes !== [
    ['community', 'link'],
    ['technician-topics', 'link'],
    ['brands', 'tree'],
]) {
    fail('sidebar modes mismatch');
}

$technician = $groups[1]['destination'] ?? [];
if (($technician['boardKey'] ?? null) !== 'general-shop-discussion'
    || ($technician['slug'] ?? null) !== 'general-shop-discussion') {
    fail('Technician Topics destination must remain general-shop-discussion');
}

$brands = $groups[2]['boards'] ?? null;
if (!is_array($brands)) {
    fail('Brands boards required');
}

try {
    $keys = [];
    $walk = static function (array $nodes) use (&$walk, &$keys): void {
        foreach ($nodes as $node) {
            $key = $node['boardKey'] ?? null;
            if (!is_string($key) || $key === '') {
                throw new InvalidArgumentException('brand boardKey required');
            }
            if (str_ends_with($key, '-live') || in_array($key, ['start-here', 'general-live', 'community-general-live'], true)) {
                throw new InvalidArgumentException('forbidden sidebar child: ' . $key);
            }
            $keys[] = $key;
            $children = $node['children'] ?? [];
            if (!is_array($children)) {
                throw new InvalidArgumentException('children must be an array for ' . $key);
            }
            $walk($children);
        }
    };
    $walk($brands);
} catch (InvalidArgumentException $e) {
    fail($e->getMessage());
}

if (count($keys) !== 41 || count(array_unique($keys)) !== 41) {
    fail('BRAND_BOARD_COUNT must be 41 without duplicates (got ' . count($keys) . ')');
}

if (count($brands) !== 33) {
    fail('TOP_LEVEL brand count must be 33');
}

$byKey = [];
$index = static function (array $nodes) use (&$index, &$byKey): void {
    foreach ($nodes as $node) {
        $byKey[$node['boardKey']] = $node;
        $index($node['children'] ?? []);
    }
};
$index($brands);

$gmNames = array_map(static fn ($child) => $child['name'] ?? null, $byKey['gm']['children'] ?? []);
$cdjrNames = array_map(static fn ($child) => $child['name'] ?? null, $byKey['cdjr']['children'] ?? []);
if ($gmNames !== ['Buick', 'Cadillac', 'Chevrolet', 'GMC']) {
    fail('GM children mismatch');
}
if ($cdjrNames !== ['Chrysler', 'Dodge', 'Jeep', 'Ram']) {
    fail('CDJR children mismatch');
}

if (($manifest['community']['route'] ?? null) !== '/community') {
    fail('Community route must be /community');
}

if (($manifest['community']['generalLiveAvailable'] ?? null) !== false) {
    fail('GENERAL_LIVE_AVAILABLE must be false');
}

fwrite(STDOUT, "MANIFEST_VALIDATE=PASS\n");
fwrite(STDOUT, "SOURCE_MANIFEST_SHA256={$sha256}\n");
fwrite(STDOUT, "CONTROL_REPO={$provenance['CONTROL_REPO']}\n");
fwrite(STDOUT, "MANIFEST_SOURCE_PATH={$provenance['MANIFEST_SOURCE_PATH']}\n");
fwrite(STDOUT, "BRAND_BOARD_COUNT=41\n");
fwrite(STDOUT, "COMMUNITY_ROUTE=/community\n");
fwrite(STDOUT, "GENERAL_LIVE_AVAILABLE=false\n");
exit(0);
