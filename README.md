# flatrate/flarum-forum-navigation

FlatRate.wiki presentation navigation for Flarum 1.8.x.

## What it does

- Replaces the native flat primary-tag sideNav presentation with:
  - **Community** → `/community`
  - **Technician Topics** → `/t/general-shop-discussion`
  - **Brands** expandable tree (41 boards; GM/CDJR nesting preserved)
- Serves a FlatRate-owned Community page with Start Here CTA and non-interactive General Live coming-soon state (`GENERAL_LIVE_AVAILABLE=false`)
- Embeds a generated navigation runtime manifest asset; does not read the main wiki repo at runtime

## Hard boundaries

```text
PRODUCTION_INSTALL=false in FORUM-IA-010C1
LIVE_SIDEBAR_CHANGE=false
LIVE_TAG_RENAME=false
FLARUM_PARENT_GRAPH_CHANGED=false
```

Disabling this extension restores native Flarum sideNav without mutating tag IDs, slugs, names, or parent graph.

## Extension identity

| Field | Value |
| --- | --- |
| Composer | `flatrate/flarum-forum-navigation` |
| Extension ID | `flatrate-forum-navigation` |
| Namespace | `FlatRate\ForumNavigation\` |

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
```

## Manifest sync

The control repo generates `configs/forum/navigation-runtime-manifest.json` and syncs it into `resources/navigation-runtime-manifest.json`.
