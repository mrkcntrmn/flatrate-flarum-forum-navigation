# flatrate/flarum-forum-navigation

FlatRate.wiki presentation navigation for Flarum 1.8.x (`flarum/core` ^1.8.19).

## What it does

- Replaces the native flat primary-tag sideNav presentation with:
  - **Push to Start** → `/t/start-here`
  - **Technician Topics** → `/t/general-shop-discussion`
  - **Brands** static tree (41 boards; GM/CDJR always expanded, no collapse arrows)
- Puts the same presentation list in the phone hamburger drawer (`HeaderSecondary`); hidden in the desktop header bar
- Retires the public Community landing page
- Redirects legacy `/community` to `/t/start-here` with HTTP 301
- Leaves General Live on its durable `/live/community-general-live` identity
- Embeds a generated navigation runtime manifest asset; does not read the main wiki repo at runtime
- Keeps Flarum's built-in loader/error fallback UX, while marking non-content fallback chrome `data-nosnippet` so it cannot displace technician discussion text in Google snippets

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
| Release | `v1.4.6` |

## Requirements

- PHP ^8.1
- Flarum `flarum/core` ^1.8.19

## Install

Packagist:

```bash
composer require flatrate/flarum-forum-navigation:^1.4
# or exact:
composer require flatrate/flarum-forum-navigation:1.4.6
```

Direct GitHub VCS installs may use immutable tag `v1.4.6`:

```json
{
    "repositories": [
        {
            "type": "vcs",
            "url": "https://github.com/mrkcntrmn/flatrate-flarum-forum-navigation"
        }
    ],
    "require": {
        "flatrate/flarum-forum-navigation": "1.4.6"
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
node --test js/tests/presentation-nav-static.test.mjs js/tests/presentation-nav-picker.test.mjs js/tests/community-live-route.test.mjs
```

## Manifest sync

The control repo generates `configs/forum/navigation-runtime-manifest.json` and syncs it into `resources/navigation-runtime-manifest.json`.

## Package CI

GitHub Actions validates Composer, PHPUnit, the embedded navigation manifest (+ provenance), JS build, and a disposable Flarum **1.8.19** path-install smoke.

```bash
php scripts/validate-manifest.php
bash scripts/ci-flarum-install-smoke.sh
BASE_URL=http://127.0.0.1:8080 bash scripts/disposable-smoke.sh
```

Provenance for the embedded manifest is recorded in `resources/navigation-runtime-manifest.provenance.json` (no runtime network dependency).
