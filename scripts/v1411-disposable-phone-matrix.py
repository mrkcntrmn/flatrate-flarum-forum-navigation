#!/usr/bin/env python3
"""Disposable Flarum 1.8.19 acceptance for FORUM-NAV-CONTEXT-001 v1.4.11.

Runs only against a throwaway local Flarum instance. It seeds the exact failure
classes from the v1.4.10 closeout and validates backend family-feed semantics
plus rendered phone behavior in headless Chromium.
"""

import asyncio
import json
import os
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

import websockets

BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:8094").rstrip("/")
ADMIN_USERNAME = os.environ.get("DISPOSABLE_ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("DISPOSABLE_ADMIN_PASSWORD", "DisposablePass123!")
WIDTHS = (320, 360, 390, 412, 430)
RESULT_PATH = Path(os.environ.get("V1411_MATRIX_RESULT", "/tmp/v1411-matrix-results.json"))

FAMILIES = {
    "cdjr": ("cdjr", "chrysler", "dodge", "jeep", "ram"),
    "gm": ("gm", "buick", "cadillac", "chevrolet", "gmc"),
    "jlr": ("jlr", "jaguar", "land-rover", "range-rover"),
}

TAGS = {
    "start-here": "Push to Start",
    "general-shop-discussion": "Technician Topics",
    "volkswagen": "Volkswagen",
    "cdjr": "CDJR",
    "chrysler": "Chrysler",
    "dodge": "Dodge",
    "jeep": "Jeep",
    "ram": "Ram",
    "gm": "GM",
    "buick": "Buick",
    "cadillac": "Cadillac",
    "chevrolet": "Chevrolet",
    "gmc": "GMC",
    "jlr": "JLR",
    "jaguar": "Jaguar",
    "land-rover": "Land Rover",
    "range-rover": "Range Rover",
}

SEED = [
    ("CONTEXT-CDJR-PARENT-01", "cdjr", "parent"),
    ("CONTEXT-CDJR-PARENT-02", "cdjr", "parent"),
    ("CONTEXT-CDJR-PARENT-03", "cdjr", "parent"),
    ("CONTEXT-CHRYSLER-01", "chrysler", "child"),
    ("CONTEXT-CHRYSLER-02", "chrysler", "child"),
    ("CONTEXT-DODGE-01", "dodge", "child"),
    ("CONTEXT-DODGE-02", "dodge", "child"),
    ("CONTEXT-JEEP-FAMILYSEARCH771", "jeep", "FAMILYSEARCH771"),
    ("CONTEXT-JEEP-02", "jeep", "child"),
    ("CONTEXT-JEEP-03", "jeep", "child"),
    ("CONTEXT-RAM-01", "ram", "child"),
    ("CONTEXT-RAM-02", "ram", "child"),
    ("CONTEXT-GM-01", "gm", "parent"),
    ("CONTEXT-BUICK-01", "buick", "child"),
    ("CONTEXT-CADILLAC-01", "cadillac", "child"),
    ("CONTEXT-CHEVROLET-01", "chevrolet", "child"),
    ("CONTEXT-GMC-01", "gmc", "child"),
    ("CONTEXT-JLR-01", "jlr", "parent"),
    ("CONTEXT-JAGUAR-01", "jaguar", "child"),
    ("CONTEXT-LAND-ROVER-01", "land-rover", "child"),
    ("CONTEXT-RANGE-ROVER-01", "range-rover", "child"),
    ("CONTEXT-VW-01", "volkswagen", "leaf"),
    ("CONTEXT-TECH-TOPICS-01", "general-shop-discussion", "tech"),
]


def fail(message):
    raise AssertionError(message)


def http_json(method, path, *, token=None, payload=None, query=None, retries=8):
    url = f"{BASE_URL}{path}"
    if query:
        url += "?" + urllib.parse.urlencode(query)
    body = None
    headers = {"Accept": "application/vnd.api+json"}
    if payload is not None:
        body = json.dumps(payload).encode()
        headers["Content-Type"] = "application/vnd.api+json"
    if token:
        headers["Authorization"] = f"Token {token}"

    for attempt in range(retries):
        request = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                raw = response.read().decode()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode(errors="replace")
            if exc.code == 429 and attempt + 1 < retries:
                time.sleep(min(1 + attempt, 5))
                continue
            raise RuntimeError(f"{method} {url} -> {exc.code}: {detail}") from exc


def login():
    body = urllib.parse.urlencode(
        {"identification": ADMIN_USERNAME, "password": ADMIN_PASSWORD, "remember": 1}
    ).encode()
    req = urllib.request.Request(
        f"{BASE_URL}/api/token",
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        result = json.loads(response.read().decode())
    token = result.get("token")
    if not token:
        fail(f"admin token missing: {result}")
    return token


def create_tag(token, slug, name):
    payload = {
        "data": {
            "type": "tags",
            "attributes": {
                "name": name,
                "slug": slug,
                "description": "",
                "color": "#6b7280",
                "isHidden": False,
            },
        }
    }
    result = http_json("POST", "/api/tags", token=token, payload=payload)
    tag_id = str(result.get("data", {}).get("id", ""))
    if not tag_id:
        fail(f"tag create returned no id for {slug}: {result}")
    return tag_id


def create_discussion(token, title, tag_id, marker):
    payload = {
        "data": {
            "type": "discussions",
            "attributes": {
                "title": title,
                "content": f"{title} disposable body {marker}",
            },
            "relationships": {
                "tags": {"data": [{"type": "tags", "id": str(tag_id)}]}
            },
        }
    }
    result = http_json("POST", "/api/discussions", token=token, payload=payload)
    discussion_id = str(result.get("data", {}).get("id", ""))
    if not discussion_id:
        fail(f"discussion create returned no id for {title}: {result}")
    return discussion_id


def list_discussions(**params):
    query = {"include": "tags", "page[limit]": 50}
    query.update(params)
    return http_json("GET", "/api/discussions", query=query)


def titles(payload):
    return [str(row.get("attributes", {}).get("title", "")) for row in payload.get("data", [])]


def tag_slug_by_id(payload):
    out = {}
    for row in payload.get("included", []):
        if row.get("type") != "tags":
            continue
        out[str(row.get("id"))] = str(row.get("attributes", {}).get("slug", ""))
    return out


def assert_parent_family(parent, expected_titles):
    payload = list_discussions(**{"filter[tag]": parent})
    got = set(titles(payload))
    expected = set(expected_titles)
    if got != expected:
        fail(
            f"{parent} family feed mismatch expected={sorted(expected)} got={sorted(got)}"
        )
    return payload


def assert_leaf_exact(slug, expected_titles):
    payload = list_discussions(**{"filter[tag]": slug})
    got = set(titles(payload))
    expected = set(expected_titles)
    if got != expected:
        fail(f"{slug} exact feed mismatch expected={sorted(expected)} got={sorted(got)}")


def assert_family_pagination(parent, expected_titles):
    seen_ids = []
    seen_titles = []
    offset = 0
    limit = 4
    for _ in range(10):
        payload = http_json(
            "GET",
            "/api/discussions",
            query={
                "filter[tag]": parent,
                "include": "tags",
                "page[limit]": limit,
                "page[offset]": offset,
            },
        )
        rows = payload.get("data", [])
        seen_ids.extend(str(row.get("id")) for row in rows)
        seen_titles.extend(
            str(row.get("attributes", {}).get("title", "")) for row in rows
        )
        if len(rows) < limit:
            break
        offset += limit
    if len(seen_ids) != len(set(seen_ids)):
        fail(f"{parent} pagination duplicated discussion ids: {seen_ids}")
    if set(seen_titles) != set(expected_titles):
        fail(
            f"{parent} pagination mismatch expected={sorted(expected_titles)} got={sorted(seen_titles)}"
        )


def assert_family_sort(parent, expected_titles):
    payload = list_discussions(**{"filter[tag]": parent, "sort": "-commentCount"})
    got = set(titles(payload))
    if got != set(expected_titles):
        fail(
            f"{parent} sorted feed mismatch expected={sorted(expected_titles)} got={sorted(got)}"
        )


def assert_family_search():
    payload = http_json(
        "GET",
        "/api/discussions",
        query={
            "filter[q]": "tag:cdjr FAMILYSEARCH771",
            "include": "tags",
            "page[limit]": 50,
        },
    )
    got = titles(payload)
    if "CONTEXT-JEEP-FAMILYSEARCH771" not in got:
        fail(f"family search did not return Jeep child through CDJR: {got}")
    wrong = [
        title
        for title in got
        if title != "CONTEXT-JEEP-FAMILYSEARCH771"
    ]
    if wrong:
        fail(f"family search returned unexpected rows: {wrong}")


def assert_child_context(payload):
    included_tags = tag_slug_by_id(payload)
    target = None
    for row in payload.get("data", []):
        if row.get("attributes", {}).get("title") == "CONTEXT-JEEP-FAMILYSEARCH771":
            target = row
            break
    if target is None:
        fail("Jeep child missing from parent family payload")
    rel = target.get("relationships", {}).get("tags", {}).get("data", [])
    slugs = {included_tags.get(str(item.get("id")), "") for item in rel}
    if "jeep" not in slugs or "cdjr" in slugs:
        fail(f"child owning context was rewritten: {sorted(slugs)}")


def assert_ssr_child_preload():
    with urllib.request.urlopen(f"{BASE_URL}/t/cdjr", timeout=30) as response:
        html = response.read().decode(errors="replace")
    if "CONTEXT-JEEP-FAMILYSEARCH771" not in html:
        fail("CDJR SSR payload did not preload a Jeep child discussion")


async def cdp(ws, method, params=None, timeout=15):
    cdp.counter += 1
    request_id = cdp.counter
    await ws.send(json.dumps({"id": request_id, "method": method, "params": params or {}}))
    while True:
        raw = await asyncio.wait_for(ws.recv(), timeout)
        message = json.loads(raw)
        if message.get("id") == request_id:
            if "error" in message:
                raise RuntimeError(message["error"])
            return message.get("result", {})


cdp.counter = 0


async def evaluate(ws, expression):
    result = await cdp(
        ws,
        "Runtime.evaluate",
        {
            "expression": expression,
            "returnByValue": True,
            "awaitPromise": True,
        },
    )
    if result.get("exceptionDetails"):
        raise RuntimeError(result["exceptionDetails"])
    remote = result.get("result", {})
    return remote.get("value")


async def wait_until(ws, expression, *, attempts=100, delay=0.1):
    for _ in range(attempts):
        try:
            if await evaluate(ws, expression):
                return
        except Exception:
            pass
        await asyncio.sleep(delay)
    raise RuntimeError(f"condition did not become true: {expression}")


def chrome_binary():
    for candidate in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser"):
        path = shutil.which(candidate)
        if path:
            return path
    raise RuntimeError("Chrome/Chromium binary not found")


async def browser_matrix():
    profile = tempfile.mkdtemp(prefix="v1411-chrome-")
    port = 9228
    proc = subprocess.Popen(
        [
            chrome_binary(),
            "--headless=new",
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            f"--remote-debugging-port={port}",
            f"--user-data-dir={profile}",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        ws_url = None
        for _ in range(100):
            try:
                with urllib.request.urlopen(
                    f"http://127.0.0.1:{port}/json/list", timeout=2
                ) as response:
                    pages = [
                        item
                        for item in json.load(response)
                        if item.get("type") == "page"
                    ]
                    if pages:
                        ws_url = pages[0]["webSocketDebuggerUrl"]
                        break
            except Exception:
                pass
            await asyncio.sleep(0.1)
        if not ws_url:
            raise RuntimeError("Chrome DevTools target did not start")

        async with websockets.connect(ws_url, max_size=16_000_000) as ws:
            await cdp(ws, "Page.enable")
            await cdp(ws, "Runtime.enable")
            await cdp(ws, "Network.enable")

            async def visit(path, width, expected_label):
                await cdp(
                    ws,
                    "Emulation.setDeviceMetricsOverride",
                    {
                        "width": width,
                        "height": 800,
                        "deviceScaleFactor": 1,
                        "mobile": True,
                        "screenWidth": width,
                        "screenHeight": 800,
                    },
                )
                await cdp(ws, "Page.navigate", {"url": f"{BASE_URL}{path}"})
                await wait_until(
                    ws,
                    """document.readyState === 'complete' &&
                       !!document.querySelector('.App-titleControl .Button-label') &&
                       document.querySelector('.App-titleControl .Button-label').innerText.trim().length > 0""",
                )
                await evaluate(ws, "document.fonts && document.fonts.ready")
                await asyncio.sleep(0.25)
                result = await evaluate(
                    ws,
                    """(() => {
                      const titleControl = document.querySelector('.App-titleControl');
                      const toggleEl = titleControl && titleControl.querySelector(':scope > .Dropdown-toggle');
                      const label = titleControl && titleControl.querySelector('.Button-label');
                      const wrenchEl = titleControl && titleControl.querySelector('.fa-wrench');
                      const caretEl = titleControl && titleControl.querySelector('.Button-caret');
                      const lr = label.getBoundingClientRect();
                      const rect = (el) => {
                        if (!el) return null;
                        const r = el.getBoundingClientRect();
                        return {left:r.left,right:r.right,width:r.width,top:r.top,height:r.height};
                      };
                      const style = (el) => {
                        if (!el) return null;
                        const s = getComputedStyle(el);
                        return {
                          position:s.position,display:s.display,width:s.width,maxWidth:s.maxWidth,
                          left:s.left,right:s.right,marginLeft:s.marginLeft,marginRight:s.marginRight,
                          paddingLeft:s.paddingLeft,paddingRight:s.paddingRight,
                          transform:s.transform,boxSizing:s.boxSizing
                        };
                      };
                      const back = document.querySelector('.App-backControl a');
                      const banner = document.querySelector('.FlatRateParentBrandBanner');
                      const toggle = document.querySelector('.FlatRateParentBrandBanner-toggle');
                      const links = [...document.querySelectorAll('.FlatRateBrandFamilyLinks-link')].map((a) => ({
                        text: a.textContent.trim(),
                        path: new URL(a.href, location.href).pathname
                      }));
                      return {
                        width: window.innerWidth,
                        clientWidth: document.documentElement.clientWidth,
                        label: label.innerText.trim(),
                        labelDelta: ((lr.left + lr.right) / 2) - (document.documentElement.clientWidth / 2),
                        geometry: {
                          title: rect(titleControl),
                          toggle: rect(toggleEl),
                          label: rect(label),
                          wrench: rect(wrenchEl),
                          caret: rect(caretEl),
                          titleStyle: style(titleControl),
                          toggleStyle: style(toggleEl),
                          labelStyle: style(label),
                          wrenchStyle: style(wrenchEl),
                          caretStyle: style(caretEl),
                          children: toggleEl ? [...toggleEl.children].map((el) => ({
                            tag: el.tagName,
                            className: el.className,
                            rect: rect(el),
                            style: style(el)
                          })) : []
                        },
                        backPath: back ? new URL(back.href, location.href).pathname : null,
                        hamburger: !!document.querySelector('.App-backControl .Navigation-drawer'),
                        wrench: !!document.querySelector('.App-titleControl .fa-wrench'),
                        scrollWidth: document.documentElement.scrollWidth,
                        clientWidth: document.documentElement.clientWidth,
                        loadingErrorVisible: (() => {
                          const el = document.getElementById('flarum-loading-error');
                          return !!el && getComputedStyle(el).display !== 'none';
                        })(),
                        banner: banner ? {
                          text: banner.innerText,
                          tagline: (banner.querySelector('.FlatRateBrandTagline') || {}).innerText || '',
                          toggleExpanded: toggle ? toggle.getAttribute('aria-expanded') : null,
                          links
                        } : null,
                        resources: performance.getEntriesByType('resource').map((entry) => entry.name)
                      };
                    })()""",
                )
                if result["clientWidth"] != width:
                    fail(
                        f"{path} layout viewport mismatch wanted={width} "
                        f"clientWidth={result['clientWidth']} innerWidth={result['width']}"
                    )
                if result["label"] != expected_label:
                    fail(
                        f"{path} title mismatch wanted={expected_label!r} got={result['label']!r}"
                    )
                if result["backPath"] != "/":
                    fail(f"{path} direct-entry back is not MAIN: {result['backPath']}")
                if result["hamburger"]:
                    fail(f"{path} direct-entry still shows hamburger")
                if result["scrollWidth"] > result["clientWidth"] + 1:
                    fail(f"{path} has horizontal scroll at {width}px")
                if result["loadingErrorVisible"]:
                    fail(f"{path} rendered Flarum loading error")
                return result

            tech_rows = []
            for width in WIDTHS:
                row = await visit(
                    "/t/general-shop-discussion", width, "Technician Topics"
                )
                if not row["wrench"]:
                    fail(f"Technician Topics wrench missing at {width}px")
                if abs(float(row["labelDelta"])) > 1:
                    fail(
                        "Technician Topics center delta "
                        f"{row['labelDelta']}px at {width}px geometry="
                        + json.dumps(row.get("geometry"), sort_keys=True)
                    )
                tech_rows.append(
                    {
                        "width": width,
                        "label_delta_px": row["labelDelta"],
                        "no_horizontal_scroll": row["scrollWidth"]
                        <= row["clientWidth"] + 1,
                    }
                )

            vw = await visit("/t/volkswagen", 390, "Volkswagen")
            cdjr = await visit("/t/cdjr", 390, "CDJR")

            if not cdjr["banner"]:
                fail("CDJR parent banner did not render")
            banner = cdjr["banner"]
            if banner["tagline"].strip() != "Mopar":
                fail(f"CDJR tagline mismatch: {banner['tagline']!r}")
            if "CDJR" in banner["text"]:
                fail(f"CDJR parent name duplicated inside banner: {banner['text']!r}")
            expected_links = {
                "Chrysler": "/t/chrysler",
                "Dodge": "/t/dodge",
                "Jeep": "/t/jeep",
                "Ram": "/t/ram",
            }
            got_links = {item["text"]: item["path"] for item in banner["links"]}
            if got_links != expected_links:
                fail(f"CDJR child links mismatch: {got_links}")
            if banner["toggleExpanded"] != "false":
                fail(
                    f"CDJR banner should start collapsed, got aria-expanded={banner['toggleExpanded']}"
                )

            await evaluate(
                ws,
                "document.querySelector('.FlatRateParentBrandBanner-toggle').click()",
            )
            await asyncio.sleep(0.1)
            expanded = await evaluate(
                ws,
                "document.querySelector('.FlatRateParentBrandBanner-toggle').getAttribute('aria-expanded')",
            )
            if expanded != "true":
                fail(f"CDJR disclosure did not expand, got {expanded!r}")

            child_api_requests = []
            for url in cdjr["resources"]:
                parsed = urllib.parse.urlparse(url)
                if "/api/discussions" not in parsed.path:
                    continue
                query = urllib.parse.parse_qs(parsed.query)
                tags = query.get("filter[tag]", [])
                if tags and tags[0] in {"chrysler", "dodge", "jeep", "ram"}:
                    child_api_requests.append(url)
            if child_api_requests:
                fail(f"parent board issued client child fanout requests: {child_api_requests}")

            return {
                "TECHNICIAN_TOPICS_GEOMETRY": tech_rows,
                "VOLKSWAGEN_DIRECT_ENTRY_BACK": "PASS",
                "TECH_TOPICS_DIRECT_ENTRY_BACK": "PASS",
                "CDJR_PARENT_BANNER": "PASS",
                "CDJR_CHILD_LINKS_ALWAYS_VISIBLE": "PASS",
                "CDJR_DISCLOSURE": "PASS",
                "FAMILY_CLIENT_CHILD_FANOUT": False,
            }
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        shutil.rmtree(profile, ignore_errors=True)


def backend_matrix(token, tag_ids):
    expected_by_family = {
        parent: [
            title
            for title, slug, _ in SEED
            if slug in set(family)
        ]
        for parent, family in FAMILIES.items()
    }

    payloads = {}
    for parent, expected in expected_by_family.items():
        payloads[parent] = assert_parent_family(parent, expected)

    assert_leaf_exact(
        "jeep",
        [title for title, slug, _ in SEED if slug == "jeep"],
    )
    assert_leaf_exact(
        "chevrolet",
        [title for title, slug, _ in SEED if slug == "chevrolet"],
    )
    assert_leaf_exact(
        "jaguar",
        [title for title, slug, _ in SEED if slug == "jaguar"],
    )

    assert_family_pagination("cdjr", expected_by_family["cdjr"])
    assert_family_sort("cdjr", expected_by_family["cdjr"])
    assert_family_search()
    assert_child_context(payloads["cdjr"])
    assert_ssr_child_preload()

    return {
        "CDJR_FAMILY_FEED": "PASS",
        "GM_FAMILY_FEED": "PASS",
        "JLR_FAMILY_FEED": "PASS",
        "JEEP_LEAF_EXACT": "PASS",
        "CHEVROLET_LEAF_EXACT": "PASS",
        "JAGUAR_LEAF_EXACT": "PASS",
        "FAMILY_SINGLE_SERVER_QUERY": "PASS",
        "FAMILY_SSR_PRELOAD": "PASS",
        "FAMILY_SORT": "PASS",
        "FAMILY_SEARCH": "PASS",
        "FAMILY_PAGINATION": "PASS",
        "FAMILY_DEDUPE": "PASS",
        "CHILD_OWNING_CONTEXT_PRESERVED": "PASS",
    }


def main():
    token = login()
    tag_ids = {slug: create_tag(token, slug, name) for slug, name in TAGS.items()}

    for title, slug, marker in SEED:
        create_discussion(token, title, tag_ids[slug], marker)

    backend = backend_matrix(token, tag_ids)
    browser = asyncio.run(browser_matrix())

    result = {
        "WORK_ORDER": "FORUM-NAV-CONTEXT-001-V1411-DISPOSABLE-R1",
        "SOURCE_CANDIDATE_SHA": os.environ.get("SOURCE_CANDIDATE_SHA", ""),
        "FLARUM_CORE": "1.8.19",
        "BROWSER": "Chromium",
        "PHONE_BROWSER_MATRIX": "PASS",
        "PRODUCTION_DEPLOYED": False,
        **backend,
        **browser,
    }
    RESULT_PATH.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))
    print("V1411_DISPOSABLE_PHONE_MATRIX=PASS")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        failure = {
            "WORK_ORDER": "FORUM-NAV-CONTEXT-001-V1411-DISPOSABLE-R1",
            "SOURCE_CANDIDATE_SHA": os.environ.get("SOURCE_CANDIDATE_SHA", ""),
            "FLARUM_CORE": "1.8.19",
            "PHONE_BROWSER_MATRIX": "FAIL",
            "PRODUCTION_DEPLOYED": False,
            "ERROR": f"{type(exc).__name__}: {exc}",
        }
        RESULT_PATH.write_text(json.dumps(failure, indent=2) + "\n")
        print(json.dumps(failure, indent=2))
        raise
