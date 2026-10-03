<?php

/*
 * Resolve Flarum's native TagFilterGambit class string through a container
 * that has registered BrandFamilyTagFilterServiceProvider.
 *
 * Usage: php scripts/assert-tag-filter-resolution.php /path/to/flarum
 */

$root = $argv[1] ?? '';
$autoload = rtrim($root, '/') . '/vendor/autoload.php';

if ($root === '' || !is_file($autoload)) {
    fwrite(STDERR, "TAG_FILTER_RESOLUTION=FAIL missing_autoload\n");
    exit(1);
}

require $autoload;

use Flarum\Http\SlugManager;
use Flarum\Tags\Query\TagFilterGambit;
use FlatRate\ForumNavigation\Provider\BrandFamilyTagFilterServiceProvider;
use FlatRate\ForumNavigation\Search\Filter\BrandFamilyTagFilter;
use Illuminate\Container\Container;

if (!class_exists(TagFilterGambit::class)) {
    fwrite(STDERR, "TAG_FILTER_RESOLUTION=FAIL native_gambit_missing\n");
    exit(1);
}

$container = new Container();
$container->instance(SlugManager::class, new SlugManager([]));
(new BrandFamilyTagFilterServiceProvider($container))->register();

$resolved = $container->make(TagFilterGambit::class);

if (!$resolved instanceof BrandFamilyTagFilter || get_class($resolved) !== BrandFamilyTagFilter::class) {
    $class = is_object($resolved) ? get_class($resolved) : gettype($resolved);
    fwrite(STDERR, "TAG_FILTER_RESOLUTION=FAIL class={$class}\n");
    exit(1);
}

echo "TAG_FILTER_RESOLUTION=BrandFamilyTagFilter\n";
