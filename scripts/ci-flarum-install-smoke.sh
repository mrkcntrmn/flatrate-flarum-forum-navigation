#!/usr/bin/env bash
# Resolve and install flatrate/flarum-forum-navigation into a disposable Flarum tree.
# Pins flarum/core exactly (skeleton version and core version are distinct).
# No production. No secrets. Exit 0 on PASS.
set -euo pipefail

export PATH="/usr/bin:/bin:/usr/local/bin:${PATH:-}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
git config --global --add safe.directory "${ROOT}" || true
SMOKE_ROOT="${FLARUM_SMOKE_ROOT:-${TMPDIR:-/tmp}/flarum-nav-010c1-ci-smoke-$$}"
FLARUM_SKELETON_VERSION="${FLARUM_SKELETON_VERSION:-2.0.0}"
EXPECTED_CORE="${FLARUM_CORE_VERSION:-2.0.2}"

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

# Keep the accepted advisory allowlist exact. Inactive Flarum 1.8 advisories
# do not fail the audit; unknown advisories still do.
php "${ROOT}/scripts/ci-composer-advisory-policy.php" apply composer.json
php "${ROOT}/scripts/ci-composer-advisory-policy.php" verify composer.json

composer update \
  --no-interaction \
  --prefer-dist \
  --no-audit

INSTALLED_CORE="$(
  composer show flarum/core --format=json \
    | php -r '$j=json_decode(stream_get_contents(STDIN), true); $v=$j["versions"][0] ?? ""; echo preg_replace("/^v/", "", (string)$v);'
)"

if [[ "${INSTALLED_CORE}" != "${EXPECTED_CORE}" ]]; then
  echo "FLARUM_CORE_INSTALL_SMOKE=FAIL expected_core=${EXPECTED_CORE} got=${INSTALLED_CORE}" >&2
  exit 1
fi

# A pull-request checkout is detached, so give the path package its branch name
# before Composer guesses a version from HEAD.
git -C "${ROOT}" checkout -B feat/f2-minimal-nav-seo
composer config repositories.flatrate-forum-navigation path "${ROOT}"
composer require "flatrate/flarum-forum-navigation:*@dev" --no-interaction --prefer-dist --no-audit

AUDIT_JSON="${SMOKE_ROOT}/composer-audit.json"
set +e
composer audit --format=json > "${AUDIT_JSON}"
AUDIT_RC=$?
set -e
echo "COMPOSER_AUDIT_EXIT=${AUDIT_RC}"
php "${ROOT}/scripts/ci-composer-advisory-policy.php" assert-audit "${AUDIT_JSON}"
rm -f "${AUDIT_JSON}"

composer show flatrate/flarum-forum-navigation >/dev/null

echo "FLARUM_SKELETON_VERSION=${FLARUM_SKELETON_VERSION}"
echo "FLARUM_CORE_VERSION=${INSTALLED_CORE}"
echo "EXTENSION_PACKAGE=flatrate/flarum-forum-navigation"
echo "FLARUM_CORE_INSTALL_SMOKE=PASS"

EXTEND_PHP="${SMOKE_ROOT}/vendor/flatrate/flarum-forum-navigation/extend.php"
if ! grep -Fq 'TagCanonical::class' "${EXTEND_PHP}"; then
  echo "NAVIGATION_F2_EXTENDER=FAIL missing_tag_canonical" >&2
  exit 1
fi
if ! grep -Fq 'RobotsTxt::class' "${EXTEND_PHP}"; then
  echo "NAVIGATION_F2_EXTENDER=FAIL missing_robots" >&2
  exit 1
fi
if grep -Fq 'js/dist/forum.js' "${EXTEND_PHP}"; then
  echo "NAVIGATION_F2_EXTENDER=FAIL historical_frontend_registered" >&2
  exit 1
fi
echo "NAVIGATION_F2_EXTENDER=PASS"

INSTALL_JSON="${SMOKE_ROOT}/install.json"
cat > "${INSTALL_JSON}" <<'EOF'
{
  "debug": true,
  "baseUrl": "http://127.0.0.1:8765",
  "databaseConfiguration": {
    "driver": "sqlite",
    "database": "storage/f2-nav.sqlite"
  },
  "adminUser": {
    "username": "navadmin",
    "password": "nav-admin-pass",
    "email": "nav-admin@example.test"
  },
  "settings": {
    "forum_title": "Navigation Smoke"
  },
  "extensions": "flarum-tags,flatrate-forum-navigation"
}
EOF

php flarum install --file "${INSTALL_JSON}"
rm -f "${INSTALL_JSON}"

(
  cd "${SMOKE_ROOT}/public"
  php -S 127.0.0.1:8765 index.php > "${SMOKE_ROOT}/http.log" 2>&1
) &
HTTP_PID=$!
cleanup_http() {
  kill "${HTTP_PID}" >/dev/null 2>&1 || true
}
trap 'cleanup_http; cleanup' EXIT

ready=0
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
  if curl -s -o /dev/null http://127.0.0.1:8765/api; then
    ready=1
    break
  fi
  sleep 0.25
done
if [[ "${ready}" != "1" ]]; then
  echo "NAVIGATION_F2_HTTP=FAIL server_not_ready" >&2
  cat "${SMOKE_ROOT}/http.log" >&2 || true
  exit 1
fi

TOKEN_BODY="$(mktemp)"
TOKEN_CODE="$(
  curl -sS -o "${TOKEN_BODY}" -w '%{http_code}' -H 'Content-Type: application/json' \
    -d '{"identification":"navadmin","password":"nav-admin-pass"}' \
    http://127.0.0.1:8765/api/token
)"
TOKEN="$(php -r '$j=json_decode(file_get_contents($argv[1]), true); echo $j["token"] ?? "";' "${TOKEN_BODY}")"
if [[ -z "${TOKEN}" ]]; then
  echo "NAVIGATION_F2_HTTP=FAIL admin_token status=${TOKEN_CODE}" >&2
  cat "${TOKEN_BODY}" >&2 || true
  cat "${SMOKE_ROOT}/http.log" >&2 || true
  exit 1
fi
rm -f "${TOKEN_BODY}"

create_tag() {
  local name="$1"
  local slug="$2"
  local hidden="$3"
  local restricted="$4"
  local out
  out="$(mktemp)"
  local code
  code="$(
    curl -sS -o "${out}" -w '%{http_code}' -H 'Content-Type: application/json' -H "Authorization: Token ${TOKEN}" \
      -d "{\"data\":{\"type\":\"tags\",\"attributes\":{\"name\":\"${name}\",\"slug\":\"${slug}\",\"description\":\"${name}\",\"color\":\"#888888\",\"isHidden\":${hidden}}}}" \
      http://127.0.0.1:8765/api/tags
  )"
  if [[ "${code}" != "201" && "${code}" != "200" ]]; then
    echo "NAVIGATION_F2_HTTP=FAIL create_tag slug=${slug} status=${code}" >&2
    cat "${out}" >&2 || true
    exit 1
  fi
  if [[ "${restricted}" == "true" ]]; then
    local id
    id="$(php -r '$j=json_decode(file_get_contents($argv[1]), true); echo $j["data"]["id"] ?? "";' "${out}")"
    local patch
    patch="$(mktemp)"
    local patch_code
    patch_code="$(
      curl -sS -o "${patch}" -w '%{http_code}' -X PATCH -H 'Content-Type: application/json' -H "Authorization: Token ${TOKEN}" \
        -d "{\"data\":{\"type\":\"tags\",\"id\":\"${id}\",\"attributes\":{\"isRestricted\":true}}}" \
        "http://127.0.0.1:8765/api/tags/${id}"
    )"
    if [[ "${patch_code}" != "200" ]]; then
      echo "NAVIGATION_F2_HTTP=FAIL restrict_tag slug=${slug} status=${patch_code}" >&2
      cat "${patch}" >&2 || true
      exit 1
    fi
    rm -f "${patch}"
  fi
  rm -f "${out}"
}

create_tag Tip tip false false
create_tag "Start Here" start-here false false
create_tag "General Shop Discussion" general-shop-discussion false false
create_tag "Aston Martin" aston-martin false false
create_tag "Hidden Room" hidden-room false true

assert_canonical() {
  local path="$1"
  local expected="$2"
  local out
  out="$(mktemp)"
  local code
  code="$(curl -sS -o "${out}" -w '%{http_code}' "http://127.0.0.1:8765${path}")"
  if [[ "${code}" != "200" ]]; then
    echo "SEO_CANONICAL=FAIL path=${path} status=${code}" >&2
    cat "${out}" >&2 || true
    exit 1
  fi
  if ! grep -Fq "rel=\"canonical\" href=\"${expected}\"" "${out}"; then
    echo "SEO_CANONICAL=FAIL path=${path} expected=${expected}" >&2
    exit 1
  fi
  rm -f "${out}"
}

assert_canonical / "http://127.0.0.1:8765"
assert_canonical /t/tip "http://127.0.0.1:8765/t/tip"
assert_canonical /t/start-here "http://127.0.0.1:8765/t/start-here"
assert_canonical /t/general-shop-discussion "http://127.0.0.1:8765/t/general-shop-discussion"
assert_canonical /t/aston-martin "http://127.0.0.1:8765/t/aston-martin"

COMMUNITY_HEADERS="$(curl -sI http://127.0.0.1:8765/community)"
if ! grep -Eq 'HTTP/.* 301' <<< "${COMMUNITY_HEADERS}"; then
  echo "NAV_COMMUNITY_REDIRECT=FAIL" >&2
  echo "${COMMUNITY_HEADERS}" >&2
  exit 1
fi
if ! grep -Fiq 'Location: http://127.0.0.1:8765/t/start-here' <<< "${COMMUNITY_HEADERS}"; then
  echo "NAV_COMMUNITY_REDIRECT=FAIL location" >&2
  echo "${COMMUNITY_HEADERS}" >&2
  exit 1
fi
echo "NAV_COMMUNITY_REDIRECT=PASS"

HIDDEN_BODY="$(curl -s "http://127.0.0.1:8765/t/hidden-room")"
HIDDEN_STATUS="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8765/t/hidden-room)"
if [[ "${HIDDEN_STATUS}" == "200" ]]; then
  echo "NAV_HIDDEN_TAG_DENIAL=FAIL status=200" >&2
  exit 1
fi
if grep -Fq 'rel="canonical" href="http://127.0.0.1:8765/t/hidden-room"' <<< "${HIDDEN_BODY}"; then
  echo "NAV_HIDDEN_TAG_DENIAL=FAIL canonical_published" >&2
  exit 1
fi
GUEST_TAGS="$(curl -fsS http://127.0.0.1:8765/api/tags)"
if grep -Eq '"slug": ?"hidden-room"' <<< "${GUEST_TAGS}"; then
  echo "NAV_HIDDEN_TAG_DENIAL=FAIL listed_to_guest" >&2
  exit 1
fi
echo "NAV_HIDDEN_TAG_DENIAL=PASS status=${HIDDEN_STATUS}"

ROBOTS="$(curl -fsS http://127.0.0.1:8765/robots.txt)"
if ! grep -Fq 'Sitemap: http://127.0.0.1:8765/sitemap.xml' <<< "${ROBOTS}"; then
  echo "SEO_ROBOTS=FAIL" >&2
  exit 1
fi
if grep -Fq 'pikapod' <<< "${ROBOTS}"; then
  echo "SEO_ROBOTS=FAIL host_leak" >&2
  exit 1
fi
echo "SEO_ROBOTS=PASS"

php flarum extension:disable flatrate-forum-navigation
FALLBACK_ROBOTS="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8765/robots.txt)"
HOME_STATUS="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8765/)"
TIP_BODY="$(curl -fsS http://127.0.0.1:8765/t/tip)"
if [[ "${FALLBACK_ROBOTS}" == "200" ]]; then
  echo "NAVIGATION_DISABLE_FALLBACK=FAIL robots_still_registered" >&2
  exit 1
fi
if [[ "${HOME_STATUS}" != "200" ]]; then
  echo "NAVIGATION_DISABLE_FALLBACK=FAIL home=${HOME_STATUS}" >&2
  exit 1
fi
if grep -Fq 'rel="canonical" href="http://127.0.0.1:8765/t/tip"' <<< "${TIP_BODY}"; then
  echo "NAVIGATION_DISABLE_FALLBACK=FAIL tag_canonical_still_present" >&2
  exit 1
fi
echo "NAVIGATION_DISABLE_FALLBACK=PASS"
echo "NAVIGATION_F2_HTTP=PASS"
echo "PRODUCTION_INSTALL=false"
