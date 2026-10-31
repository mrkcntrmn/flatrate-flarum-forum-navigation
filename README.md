# flatrate/flarum-forum-navigation

Flarum 2 presentation restoration candidate, stacked on the native navigation/SEO migration. Registers the retained FlatRate forum/admin bundles, styles, translations, and fallback view. Adapts the existing presentation to Flarum 2 without changing tag identities or enabling Live.

## What it does

- Restores the manifest-driven FlatRate desktop navigation and phone board picker
- Restores board banners, curated MAIN pins, discussion controls, and gated quick navigation
- Uses Flarum 2 IndexSidebar, ItemList, component, search-state, and admin registry APIs
- Sets a same-host canonical URL on public tag pages when Flarum leaves it empty
- Publishes `/robots.txt` with the configured sitemap URL and disallows `/admin` and `/api/`
- Redirects legacy `/community` to `/t/start-here` with HTTP 301
- Leaves General Live on its durable `/live/community-general-live` identity
- Embeds a generated navigation runtime manifest asset; does not read the main wiki repo at runtime
- Keeps Flarum's built-in loader/error fallback UX, while marking non-content fallback chrome `data-nosnippet` so it cannot displace technician discussion text in Google snippets
- Retains maintenance banner source for later qualification; this candidate does not publish or activate its public settings

## Flarum 2 compatibility

The forum resource publishes an explicit allowlist of presentation attributes. Native Flarum visibility constraints still apply before pin and brand-family filters narrow results. Missing quick-rail visibility settings remain false; this change does not activate Live, uploads, or an operational maintenance banner.

Phone discussion navigation collapses the duplicate drawer/history structural Back controls to one owning-board arrow. Composer controls retain accessible native action names when mobile styles hide their labels, and the basic editor gets a content label. Hero controls inherit the banner text color.

The previous webpack configuration emitted the removed `flarum.core.compat` runtime. Version 3.1.0 uses Flarum 2 modules. Explicit export lists preserve identifiers containing digits with that loader.

## Qualification

PHP tests cover public attributes and actor-scoped SQLite pin filtering, including negation and invalid values. JavaScript tests cover the retained presentation contracts. The disposable Flarum 2.0.2 install smoke checks SEO, private-tag denial, disable fallback, and browser acceptance for desktop board transitions, the phone picker, structural Back uniqueness, Follow/Unfollow persistence, moderator reachability, and saved replies. Browser acceptance uses only synthetic local data.

## Hard boundaries

```text
PRODUCTION_INSTALL=false in FORUM-IA-011A
PUBLIC_COMMUNITY_SURFACE=false
PUSH_TO_START_SLUG=start-here
LIVE_CHAT_CODE_MUTATION=false
FLARUM_PARENT_GRAPH_CHANGED=false
```

Disabling this extension restores native Flarum sideNav without mutating tag IDs, slugs, names, or parent graph.

## Extension identity

| Field | Value |
| --- | --- |
| Composer | `flatrate/flarum-forum-navigation` |
| Extension ID | `flatrate-forum-navigation` |
| Namespace | `FlatRate\ForumNavigation\` |
| Release | `v1.4.11` |

## Requirements

- PHP ^8.3
- Flarum `flarum/core` ^2.0.2
- Flarum `flarum/tags` ^2.0.0

## Install

Packagist:

```bash
composer require flatrate/flarum-forum-navigation:^1.4
# or exact:
composer require flatrate/flarum-forum-navigation:1.4.11
```

Direct GitHub VCS installs may use immutable tag `v1.4.11`:

```json
{
    "repositories": [
        {
            "type": "vcs",
            "url": "https://github.com/mrkcntrmn/flatrate-flarum-forum-navigation"
        }
    ],
    "require": {
        "flatrate/flarum-forum-navigation": "1.4.11"
    }
}
```

Tracking `main` for development maps to `1.x-dev` via the Composer branch alias:

```bash
composer require flatrate/flarum-forum-navigation:dev-main
```

## Build

```bash
cd js
npm ci
npm run build
```

## Tests

```bash
composer install
composer test
node --test js/tests/*.test.mjs
```

## Manifest sync

The control repo generates `configs/forum/navigation-runtime-manifest.json` and syncs it into `resources/navigation-runtime-manifest.json`.

## Package CI

GitHub Actions validates Composer, PHPUnit, the embedded navigation manifest (+ provenance), JS build, and a disposable Flarum **2.0.2** path-install smoke.

```bash
php scripts/validate-manifest.php
bash scripts/ci-flarum-install-smoke.sh
BASE_URL=http://127.0.0.1:8080 bash scripts/disposable-smoke.sh
```

Provenance for the embedded manifest is recorded in `resources/navigation-runtime-manifest.provenance.json` (no runtime network dependency).
