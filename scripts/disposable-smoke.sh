#!/usr/bin/env bash
# HTTP smoke against a disposable Flarum runtime hosting flatrate-forum-navigation.
# No secrets. Requires BASE_URL (e.g. http://127.0.0.1:8080). Exit 0 on PASS.
set -euo pipefail

export PATH="/usr/bin:/bin:/usr/local/bin:${PATH:-}"

BASE_URL="${BASE_URL:-}"
if [[ -z "${BASE_URL}" ]]; then
  echo "USAGE: BASE_URL=http://127.0.0.1:PORT $0" >&2
  echo "DISPOSABLE_SMOKE=SKIP reason=BASE_URL_unset" >&2
  exit 2
fi

BASE_URL="${BASE_URL%/}"

check_http() {
  local path="$1"
  local label="$2"
  local code
  code="$(curl -sS -o /tmp/flatrate-nav-smoke-body.$$ -w '%{http_code}' "${BASE_URL}${path}")"
  echo "${label}_HTTP=${code}"
  if [[ "${code}" != "200" ]]; then
    echo "DISPOSABLE_SMOKE=FAIL ${label}_HTTP=${code} path=${path}" >&2
    rm -f /tmp/flatrate-nav-smoke-body.$$
    exit 1
  fi
}

check_http "/" "FORUM"
check_http "/community" "COMMUNITY"
check_http "/api" "API"

rm -f /tmp/flatrate-nav-smoke-body.$$

echo "DISPOSABLE_SMOKE=PASS"
echo "FORUM_HTTP=200"
echo "COMMUNITY_HTTP=200"
echo "API_HTTP=200"
echo "PRODUCTION_INSTALL=false"
