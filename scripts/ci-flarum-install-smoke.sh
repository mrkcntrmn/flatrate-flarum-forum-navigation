#!/usr/bin/env bash
# Resolve and install flatrate/flarum-forum-navigation into a disposable Flarum 1.8.19 tree.
# No production. No secrets. Exit 0 on PASS.
set -euo pipefail

export PATH="/usr/bin:/bin:/usr/local/bin:${PATH:-}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SMOKE_ROOT="${FLARUM_SMOKE_ROOT:-${TMPDIR:-/tmp}/flarum-nav-010c1-ci-smoke-$$}"
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

composer create-project "flarum/flarum:${EXPECTED_CORE}" "${SMOKE_ROOT}" --no-interaction

cd "${SMOKE_ROOT}"

INSTALLED_CORE="$(
  composer show flarum/core --format=json \
    | php -r '$j=json_decode(stream_get_contents(STDIN), true); $v=$j["versions"][0] ?? ""; echo preg_replace("/^v/", "", (string)$v);'
)"

if [[ "${INSTALLED_CORE}" != "${EXPECTED_CORE}" ]]; then
  echo "FLARUM_1_8_19_INSTALL_SMOKE=FAIL expected_core=${EXPECTED_CORE} got=${INSTALLED_CORE}" >&2
  exit 1
fi

composer config repositories.flatrate-forum-navigation path "${ROOT}"
composer require "flatrate/flarum-forum-navigation:*@dev" --no-interaction --prefer-dist

composer show flatrate/flarum-forum-navigation >/dev/null

echo "FLARUM_CORE_VERSION=${INSTALLED_CORE}"
echo "EXTENSION_PACKAGE=flatrate/flarum-forum-navigation"
echo "FLARUM_1_8_19_INSTALL_SMOKE=PASS"
echo "PRODUCTION_INSTALL=false"
