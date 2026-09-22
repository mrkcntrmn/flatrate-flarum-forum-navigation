#!/usr/bin/env bash
# Resolve and install flatrate/flarum-forum-navigation into a disposable Flarum tree.
# Pins flarum/core exactly (skeleton version and core version are distinct).
# No production. No secrets. Exit 0 on PASS.
set -euo pipefail

export PATH="/usr/bin:/bin:/usr/local/bin:${PATH:-}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SMOKE_ROOT="${FLARUM_SMOKE_ROOT:-${TMPDIR:-/tmp}/flarum-nav-010c1-ci-smoke-$$}"
FLARUM_SKELETON_VERSION="${FLARUM_SKELETON_VERSION:-1.8.19}"
EXPECTED_CORE="${FLARUM_CORE_VERSION:-1.8.19}"

cleanup() {
  if [[ "${KEEP_SMOKE_ROOT:-0}" != "1" ]]; then
    rm -rf "${SMOKE_ROOT}"
  fi
}
trap cleanup EXIT

rm -rf "${SMOKE_ROOT}"
mkdir -p "${SMOKE_ROOT}"

echo "FLARUM_SMOKE_ROOT=${SMOKE_ROOT}"
echo "PACKAGE_ROOT=${ROOT}"
echo "FLARUM_SKELETON_VERSION=${FLARUM_SKELETON_VERSION}"
echo "EXPECTED_CORE=${EXPECTED_CORE}"

# Skeleton provides the disposable app environment; core is constrained separately.
composer create-project \
  "flarum/flarum:${FLARUM_SKELETON_VERSION}" \
  "${SMOKE_ROOT}" \
  --no-interaction \
  --no-install

cd "${SMOKE_ROOT}"
rm -f composer.lock
composer require \
  "flarum/core:${EXPECTED_CORE}" \
  --no-update \
  --no-interaction
composer update \
  --no-interaction \
  --prefer-dist

INSTALLED_CORE="$(
  composer show flarum/core --format=json \
    | php -r '$j=json_decode(stream_get_contents(STDIN), true); $v=$j["versions"][0] ?? ""; echo preg_replace("/^v/", "", (string)$v);'
)"

if [[ "${INSTALLED_CORE}" != "${EXPECTED_CORE}" ]]; then
  echo "FLARUM_CORE_INSTALL_SMOKE=FAIL expected_core=${EXPECTED_CORE} got=${INSTALLED_CORE}" >&2
  exit 1
fi

composer config repositories.flatrate-forum-navigation path "${ROOT}"
composer require "flatrate/flarum-forum-navigation:*@dev" --no-interaction --prefer-dist

composer show flatrate/flarum-forum-navigation >/dev/null

echo "FLARUM_SKELETON_VERSION=${FLARUM_SKELETON_VERSION}"
echo "FLARUM_CORE_VERSION=${INSTALLED_CORE}"
echo "EXTENSION_PACKAGE=flatrate/flarum-forum-navigation"
echo "FLARUM_CORE_INSTALL_SMOKE=PASS"

# Prove the extension hooks the live Flarum 1.8.19 Navigation render seam, not a
# dead items() path. Missing upstream Navigation.tsx is a hard compatibility
# failure — never skip the seam assertion.
CORE_NAVIGATION_SOURCE="${SMOKE_ROOT}/vendor/flarum/core/js/src/common/components/Navigation.tsx"
EXTENSION_NAVIGATION_SOURCE="${ROOT}/js/src/forum/discussionCenterMenu.js"

if [[ ! -f "${CORE_NAVIGATION_SOURCE}" ]]; then
  echo "FLARUM_NAVIGATION_RENDER_SEAM=FAIL source_missing path=${CORE_NAVIGATION_SOURCE}" >&2
  exit 1
fi

if ! grep -Fq 'this.getBackButton()' "${CORE_NAVIGATION_SOURCE}"; then
  echo "FLARUM_NAVIGATION_RENDER_SEAM=FAIL upstream_missing_getBackButton" >&2
  exit 1
fi

if ! grep -Fq 'this.getDrawerButton()' "${CORE_NAVIGATION_SOURCE}"; then
  echo "FLARUM_NAVIGATION_RENDER_SEAM=FAIL upstream_missing_getDrawerButton" >&2
  exit 1
fi

if [[ ! -f "${EXTENSION_NAVIGATION_SOURCE}" ]]; then
  echo "FLARUM_NAVIGATION_RENDER_SEAM=FAIL extension_source_missing" >&2
  exit 1
fi

if ! grep -Fq "override(" "${EXTENSION_NAVIGATION_SOURCE}"; then
  echo "FLARUM_NAVIGATION_RENDER_SEAM=FAIL extension_missing_override" >&2
  exit 1
fi

if ! grep -Fq "'getBackButton'" "${EXTENSION_NAVIGATION_SOURCE}"; then
  echo "FLARUM_NAVIGATION_RENDER_SEAM=FAIL extension_missing_getBackButton" >&2
  exit 1
fi

if ! grep -Fq "'getDrawerButton'" "${EXTENSION_NAVIGATION_SOURCE}"; then
  echo "FLARUM_NAVIGATION_RENDER_SEAM=FAIL extension_missing_getDrawerButton" >&2
  exit 1
fi

if grep -Fq "Navigation.prototype, 'items'" "${EXTENSION_NAVIGATION_SOURCE}"; then
  echo "FLARUM_NAVIGATION_RENDER_SEAM=FAIL obsolete_items_hook" >&2
  exit 1
fi

# Discussion-center Brand picker must emit SelectDropdown-compatible LinkButtons
# from the canonical Brand manifest — not a nested PresentationNav div slot.
if ! grep -Fq 'listDiscussionBrandBoards' "${EXTENSION_NAVIGATION_SOURCE}"; then
  echo "CENTER_BRANDS_RENDER_SOURCE=FAIL missing_listDiscussionBrandBoards" >&2
  exit 1
fi

if ! grep -Fq 'FlatRateDiscussionBrandLink' "${EXTENSION_NAVIGATION_SOURCE}"; then
  echo "CENTER_BRANDS_RENDER_SOURCE=FAIL missing_FlatRateDiscussionBrandLink" >&2
  exit 1
fi

if ! grep -Fq 'brandHref(board)' "${EXTENSION_NAVIGATION_SOURCE}"; then
  echo "CENTER_BRANDS_RENDER_SOURCE=FAIL missing_brandHref" >&2
  exit 1
fi

if grep -Fq "pickerItems.add('flatratePresentationNav'" "${EXTENSION_NAVIGATION_SOURCE}"; then
  echo "CENTER_BRANDS_RENDER_SOURCE=FAIL nested_PresentationNav_slot" >&2
  exit 1
fi

echo "CENTER_BRANDS_RENDER_SOURCE=PASS"
echo "FLARUM_NAVIGATION_RENDER_SEAM=PASS"
echo "PRODUCTION_INSTALL=false"
