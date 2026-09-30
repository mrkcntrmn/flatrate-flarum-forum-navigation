#!/usr/bin/env python3
"""Render the mobile center sheet with Flarum's phone dropdown plus compiled Less.php.

The core shell is the fixed bottom sheet. Extension CSS is appended after it.
The title is centered without a transform, so the menu stays viewport-fixed
and bottom-anchored. A top-anchored sheet attached to the title fails.
"""

import asyncio
import json
import os
import shutil
import subprocess
import tempfile
import urllib.request
from pathlib import Path

import websockets

ROOT = Path(__file__).resolve().parents[1]
PORT = 8773
DEBUG_PORT = 9235
PHONE = ((320, 553), (360, 653), (390, 757), (412, 828), (430, 845))
BRANDS = (
    "Acura", "Audi", "BMW", "Cadillac", "Chevrolet", "Chrysler", "Dodge",
    "Ford", "Genesis", "GMC", "Honda", "Hyundai", "Infiniti", "Jaguar",
    "Jeep", "Kia", "Lexus", "Lincoln", "Mazda", "Mercedes-Benz",
)
CORE_CSS = """
:root { --header-color: #eaedf0; --primary-color: #e7672e; --overlay-bg: rgba(0, 0, 0, .5); }
html, body { margin: 0; background: #15191e; color: #eaedf0; }
.page { height: 1400px; padding: 80px 16px; }
.App { position: relative; min-height: 100vh; }
.App-navigation { position: absolute; left: 0; right: 0; top: 0; height: 46px; background: #1b2026; }
.App.affix .App-navigation { position: fixed; }
.ButtonGroup { position: relative; display: inline-block; }
.App-backControl, .App-primaryControl {
  position: absolute; top: 0; margin: 0; z-index: 2;
}
.App-backControl { left: 0; }
.App-primaryControl { right: 0; }
.App-backControl > .Button, .App-primaryControl > .Button {
  width: 40px; height: 46px; padding: 0; border: 0; background: transparent; color: #fff;
}
.Dropdown { position: relative; }
/* Flarum's title rule wins over .Dropdown { position: relative }. */
.App-titleControl {
  position: absolute; top: 0; margin: 0; z-index: 2;
  width: 200px; left: 50%; margin-left: -100px; text-align: center;
}
.Dropdown-menu { min-width: 160px; list-style: none; margin: 0; padding: 0; }
@media (max-width: 767px) {
  .Dropdown .Dropdown-menu {
    margin: 0;
    position: fixed;
    left: 0 !important;
    right: 0 !important;
    width: auto !important;
    bottom: 0;
    top: auto;
    display: block;
    padding: 0;
    padding-bottom: 40px !important;
    max-height: 70vh;
    overflow: auto;
    visibility: hidden;
    transform: translate(0, 70vh);
    background: #fff;
    color: #111;
  }
  .Dropdown.open .Dropdown-menu {
    transform: none;
    visibility: visible;
  }
  .dropdown-backdrop {
    position: fixed;
    left: 0; right: 0; top: 0; bottom: 0;
    background: var(--overlay-bg);
    z-index: 1;
  }
}
@media (min-width: 768px) {
  .Dropdown.open .Dropdown-menu {
    display: block;
    position: absolute;
    top: 100%;
    left: 0;
    width: auto;
    max-height: none;
    background: #fff;
    color: #111;
    visibility: visible;
  }
}
"""


def compile_less() -> str:
    autoload = ROOT / "vendor" / "autoload.php"
    if not autoload.is_file():
        fallback = os.environ.get("LESS_PHP_AUTOLOAD", "")
        autoload = Path(fallback) if fallback else autoload
    if not autoload.is_file():
        raise SystemExit("vendor/autoload.php or LESS_PHP_AUTOLOAD is required")
    less = ROOT / "resources" / "less" / "forum.less"
    php = r"""
require %s;
if (class_exists('Less_Autoloader')) { Less_Autoloader::register(); }
$parser = new Less_Parser(['compress' => true]);
$parser->parseFile(%s);
echo $parser->getCss();
""" % (json.dumps(str(autoload)), json.dumps(str(less)))
    return subprocess.check_output(
        ["php", "-d", "display_errors=0", "-d", "error_reporting=E_ERROR", "-r", php],
        text=True,
        stderr=subprocess.DEVNULL,
    )


def write_fixture(directory: Path, compiled_css: str) -> None:
    rows = "\n".join(
        '<li class="FlatRatePresentationNav-brand"><div class="FlatRatePresentationNav-row">'
        f'<a class="FlatRatePresentationNav-brandLink" href="#">{name}</a></div></li>'
        for name in BRANDS
    )
    html = f"""<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
{CORE_CSS}
{compiled_css}
</style>
</head>
<body>
<div class="App" id="app">
  <div class="page" id="page">forum page body</div>
  <div class="App-navigation">
    <div class="App-backControl"><button class="Button" type="button"></button></div>
    <div id="title" class="ButtonGroup Dropdown dropdown App-titleControl">
      <button id="toggle" class="Dropdown-toggle Button" type="button" aria-expanded="false">
        <span class="Button-label" id="label">FlatRate.wiki</span>
        <i class="Button-caret"></i>
      </button>
      <ul class="Dropdown-menu">
        <li class="item-flatrateQuickRail">
          <div class="FlatRateCenterQuickRail FlatRateCenterQuickRail--guest" id="rail">
            <a class="FlatRateCenterQuickRail-control" data-quick-rail-control="main" href="/">MAIN</a>
          </div>
        </li>
        {rows}
      </ul>
    </div>
    <div class="App-primaryControl"><button class="Button" type="button"></button></div>
  </div>
</div>
<script>
window.setMode = (mode, text, affixed) => {{
  const title = document.getElementById('title');
  title.classList.toggle('FlatRateDiscussionBrandPicker', mode === 'discussion');
  title.classList.remove('open');
  document.getElementById('toggle').setAttribute('aria-expanded', 'false');
  document.getElementById('label').textContent = text || 'FlatRate.wiki';
  document.getElementById('app').classList.toggle('affix', !!affixed);
  window.scrollTo(0, 0);
  document.querySelector('.Dropdown-menu').scrollTop = 0;
  document.querySelector('.dropdown-backdrop')?.remove();
}};
window.openMenu = () => {{
  const title = document.getElementById('title');
  title.classList.add('open');
  document.getElementById('toggle').setAttribute('aria-expanded', 'true');
  if (!document.querySelector('.dropdown-backdrop')) {{
    const backdrop = document.createElement('div');
    backdrop.className = 'dropdown-backdrop';
    backdrop.addEventListener('click', () => window.closeMenu());
    document.body.appendChild(backdrop);
  }}
}};
window.closeMenu = () => {{
  document.getElementById('title').classList.remove('open');
  document.getElementById('toggle').setAttribute('aria-expanded', 'false');
  document.querySelector('.dropdown-backdrop')?.remove();
}};
window.measure = () => {{
  const title = document.querySelector('.App-titleControl');
  const toggle = title.querySelector('.Dropdown-toggle');
  const menu = title.querySelector('.Dropdown-menu');
  const label = title.querySelector('.Button-label');
  const caret = title.querySelector('.Button-caret');
  const tr = title.getBoundingClientRect();
  const br = toggle.getBoundingClientRect();
  const mr = menu.getBoundingClientRect();
  const lr = label.getBoundingClientRect();
  const cr = caret.getBoundingClientRect();
  const style = getComputedStyle(menu);
  const before = menu.scrollTop;
  menu.scrollTop = 0;
  const atZero = menu.scrollTop;
  menu.scrollTop = 200;
  const after = menu.scrollTop;
  const hit = document.elementFromPoint(window.innerWidth / 2, Math.min(window.innerHeight - 20, mr.bottom + 40));
  return {{
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    titleTop: tr.top,
    titleBottom: tr.bottom,
    toggleTop: br.top,
    toggleBottom: br.bottom,
    menuTop: mr.top,
    menuBottom: mr.bottom,
    menuLeft: mr.left,
    menuRight: mr.right,
    menuWidth: mr.width,
    menuHeight: mr.height,
    menuRatio: mr.height / window.innerHeight,
    overflowX: style.overflowX,
    overflowY: style.overflowY,
    position: style.position,
    top: style.top,
    bottom: style.bottom,
    left: style.left,
    heightCss: style.height,
    maxHeight: style.maxHeight,
    railPosition: getComputedStyle(document.querySelector('.item-flatrateQuickRail') || menu).position,
    visibility: style.visibility,
    transform: style.transform,
    paddingBottom: style.paddingBottom,
    scrollHeight: menu.scrollHeight,
    clientHeight: menu.clientHeight,
    before, atZero, after,
    labelDelta: ((lr.left + lr.right) / 2) - (window.innerWidth / 2),
    caretGap: cr.left - lr.right,
    caretW: cr.width,
    labelText: label.innerText.trim(),
    afterContent: getComputedStyle(label, '::after').content,
    scrollY: window.scrollY,
    open: title.classList.contains('open'),
    backdrop: !!document.querySelector('.dropdown-backdrop'),
    hitMenu: !!(hit && (hit === menu || menu.contains(hit))),
    docScrollWidth: document.documentElement.scrollWidth,
    docClientWidth: document.documentElement.clientWidth,
    rail: document.querySelector('[data-quick-rail-control]')?.dataset.quickRailControl || ''
  }};
}};
</script>
</body>
</html>
"""
    (directory / "index.html").write_text(html)


async def cdp(ws, method, params=None):
    cdp.n += 1
    await ws.send(json.dumps({"id": cdp.n, "method": method, "params": params or {}}))
    while True:
        data = json.loads(await asyncio.wait_for(ws.recv(), 15))
        if data.get("id") == cdp.n:
            if "error" in data:
                raise RuntimeError(json.dumps(data["error"])[:500])
            return data.get("result", {})


cdp.n = 0


async def evaluate(ws, expression):
    result = await cdp(ws, "Runtime.evaluate", {
        "expression": expression,
        "returnByValue": True,
        "awaitPromise": True,
    })
    if "exceptionDetails" in result:
        raise RuntimeError(json.dumps(result["exceptionDetails"])[:800])
    return result.get("result", {}).get("value")


async def set_viewport(ws, window_id, width, height):
    outer_h = height + 87
    outer_w = width
    for _ in range(4):
        await cdp(ws, "Browser.setWindowBounds", {
            "windowId": window_id,
            "bounds": {"width": outer_w, "height": outer_h, "windowState": "normal"},
        })
        await cdp(ws, "Page.navigate", {"url": f"http://127.0.0.1:{PORT}/index.html"})
        ready = False
        for _ in range(40):
            ready = await evaluate(ws, "typeof window.measure === 'function'")
            if ready:
                break
            await asyncio.sleep(0.05)
        if not ready:
            raise RuntimeError(f"fixture did not load for {width}x{height}")
        inner = await evaluate(ws, "[window.innerWidth, window.innerHeight]")
        if inner == [width, height]:
            return
        outer_w += width - inner[0]
        outer_h += height - inner[1]
    raise RuntimeError(f"viewport stuck at {inner}, wanted {width}x{height}")


def judge_open(row, phone=True):
    errors = []
    if not phone:
        if row["position"] == "fixed" or "50dvh" in f"{row.get('heightCss', '')}{row.get('maxHeight', '')}":
            errors.append("phone sheet rule applied on desktop")
        if abs(row["menuWidth"] - row["innerWidth"]) <= 1 and row["innerWidth"] >= 768:
            errors.append("desktop menu is viewport width")
        return errors
    room_for_bottom_sheet = (row["innerHeight"] - row["titleBottom"]) > (row["menuHeight"] + 1)
    if room_for_bottom_sheet and abs(row["menuTop"] - row["titleBottom"]) <= 1:
        errors.append("FAIL_TOP_ANCHORED_TO_TITLE")
    if row["menuTop"] <= row["titleBottom"]:
        errors.append(f"menuTop {row['menuTop']:.2f} titleBottom {row['titleBottom']:.2f}")
    if abs(row["menuBottom"] - row["innerHeight"]) > 1:
        errors.append(f"menuBottom {row['menuBottom']:.2f}")
    if abs(row["menuTop"] - (row["innerHeight"] - row["menuHeight"])) > 1:
        errors.append(f"menuTop {row['menuTop']:.2f} expected {row['innerHeight'] - row['menuHeight']:.2f}")
    if abs(row["menuLeft"]) > 1 or abs(row["menuRight"] - row["innerWidth"]) > 1:
        errors.append(f"x {row['menuLeft']:.2f}-{row['menuRight']:.2f}")
    if abs(row["menuWidth"] - row["innerWidth"]) > 1:
        errors.append(f"width {row['menuWidth']:.2f}")
    if not 0.49 <= row["menuRatio"] <= 0.51:
        errors.append(f"ratio {row['menuRatio']:.4f}")
    if row["scrollHeight"] <= row["clientHeight"] or row["after"] <= row["atZero"]:
        errors.append(f"scroll {row['scrollHeight']}/{row['clientHeight']} {row['atZero']}->{row['after']}")
    if abs(row["labelDelta"]) > 1:
        errors.append(f"labelDelta {row['labelDelta']:.2f}")
    if abs(row["caretGap"]) > 1 or abs(row["caretW"] - 16) > 1:
        errors.append(f"caret {row['caretGap']:.2f}/{row['caretW']:.2f}")
    if row["overflowX"] != "hidden" or row["overflowY"] != "auto":
        errors.append(f"overflow {row['overflowX']}/{row['overflowY']}")
    if row["position"] != "fixed":
        errors.append(f"position {row['position']}")
    if row.get("railPosition") != "sticky":
        errors.append(f"rail {row.get('railPosition')}")
    if row["docScrollWidth"] > row["docClientWidth"] + 1:
        errors.append("horizontal scroll")
    if row["visibility"] != "visible":
        errors.append(f"visibility {row['visibility']}")
    return errors


async def run(fixture):
    proc = subprocess.Popen(
        [
            "google-chrome", "--headless=new", "--hide-scrollbars", "--disable-gpu",
            f"--remote-debugging-port={DEBUG_PORT}",
            f"--user-data-dir={fixture}/chrome-profile",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        ws_url = None
        for _ in range(50):
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{DEBUG_PORT}/json/list") as response:
                    pages = [item for item in json.load(response) if item.get("type") == "page"]
                    if pages:
                        ws_url = pages[0]["webSocketDebuggerUrl"]
                        break
            except Exception:
                await asyncio.sleep(0.1)
        if not ws_url:
            raise RuntimeError("chrome did not start")
        async with websockets.connect(ws_url, max_size=8_000_000) as ws:
            await cdp(ws, "Page.enable")
            window_id = (await cdp(ws, "Browser.getWindowForTarget"))["windowId"]
            rows = []

            async def capture(mode, label, width, height, affixed=False):
                await set_viewport(ws, window_id, width, height)
                await evaluate(ws, f"window.setMode({json.dumps(mode)}, {json.dumps(label)}, {str(affixed).lower()})")
                await evaluate(ws, "window.openMenu()")
                row = await evaluate(ws, "window.measure()")
                row.update({"mode": mode, "label": label, "affix": affixed, "kind": "open"})
                return row

            for width, height in PHONE:
                rows.append(await capture("index", "FLATRATE.WIKI", width, height))
            for label in ("Honda", "Audi", "Technician Topics"):
                rows.append(await capture("discussion", label, 390, 757))
            rows.append(await capture("index", "FLATRATE.WIKI", 390, 757, affixed=True))

            await set_viewport(ws, window_id, 390, 757)
            await evaluate(ws, "window.setMode('index', 'FLATRATE.WIKI', false)")
            await evaluate(ws, "window.scrollTo(0, 400)")
            await evaluate(ws, "window.openMenu()")
            scrolled = await evaluate(ws, "window.measure()")
            await evaluate(ws, "window.scrollTo(0, 720)")
            scrolled_more = await evaluate(ws, "window.measure()")
            scrolled.update({
                "mode": "index",
                "label": "FLATRATE.WIKI",
                "affix": False,
                "kind": "page-scroll",
                "laterScrollY": scrolled_more["scrollY"],
                "laterMenuTop": scrolled_more["menuTop"],
                "laterMenuBottom": scrolled_more["menuBottom"],
                "laterMenuHeight": scrolled_more["menuHeight"],
                "laterPosition": scrolled_more["position"],
                "laterInnerHeight": scrolled_more["innerHeight"],
            })
            rows.append(scrolled)

            await set_viewport(ws, window_id, 390, 757)
            await evaluate(ws, "window.setMode('index', 'FLATRATE.WIKI', false)")
            await evaluate(ws, "window.openMenu()")
            await evaluate(ws, "document.querySelector('.Dropdown-menu').scrollTop = 200")
            point = await evaluate(ws, """(() => {
              const r = document.querySelector('.Dropdown-menu').getBoundingClientRect();
              return {x: r.left + r.width / 2, y: r.top + 80};
            })()""")
            before_wheel = await evaluate(ws, "document.querySelector('.Dropdown-menu').scrollTop")
            await cdp(ws, "Input.dispatchMouseEvent", {
                "type": "mouseWheel",
                "x": point["x"],
                "y": point["y"],
                "deltaX": 0,
                "deltaY": 140,
            })
            await asyncio.sleep(0.05)
            after_wheel = await evaluate(ws, "document.querySelector('.Dropdown-menu').scrollTop")
            before_touch = after_wheel
            await cdp(ws, "Input.dispatchTouchEvent", {
                "type": "touchStart",
                "touchPoints": [{"x": point["x"], "y": point["y"]}],
            })
            await cdp(ws, "Input.dispatchTouchEvent", {
                "type": "touchMove",
                "touchPoints": [{"x": point["x"], "y": point["y"] - 90}],
            })
            await cdp(ws, "Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
            after_touch = await evaluate(ws, "document.querySelector('.Dropdown-menu').scrollTop")
            await evaluate(ws, "window.closeMenu()")
            closed = await evaluate(ws, "window.measure()")
            closed.update({"mode": "closed", "label": "FLATRATE.WIKI", "affix": False, "kind": "closed", "wheel": [before_wheel, after_wheel], "touch": [before_touch, after_touch]})
            rows.append(closed)
            await evaluate(ws, "window.openMenu()")
            reopened = await evaluate(ws, "window.measure()")
            reopened.update({"mode": "reopen", "label": "FLATRATE.WIKI", "affix": False, "kind": "reopen"})
            rows.append(reopened)
            await evaluate(ws, "document.querySelector('.dropdown-backdrop').click()")
            dismissed = await evaluate(ws, "({open: document.getElementById('title').classList.contains('open'), backdrop: !!document.querySelector('.dropdown-backdrop')})")
            rows.append({"kind": "backdrop", "dismissed": dismissed, "mode": "backdrop", "label": "FLATRATE.WIKI"})

            await set_viewport(ws, window_id, 1280, 800)
            await evaluate(ws, "window.setMode('index', 'FLATRATE.WIKI', false)")
            await evaluate(ws, "window.openMenu()")
            desktop = await evaluate(ws, "window.measure()")
            desktop.update({"mode": "desktop", "label": "FLATRATE.WIKI", "affix": False, "kind": "desktop"})
            rows.append(desktop)
            return rows
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


def main():
    compiled = compile_less()
    required = (
        "left:0 !important;right:0 !important;width:max-content !important;max-width:calc(100% - 120px);margin-left:auto !important;margin-right:auto !important;transform:none !important",
        "position:fixed !important",
        "top:auto !important",
        "bottom:0 !important",
        "left:0 !important",
        "right:0 !important",
        "width:100vw !important",
        "height:50dvh",
        "max-height:50dvh",
        "overflow-x:hidden",
        "overflow-y:auto",
        "left:100%",
    )
    forbidden = (
        "transform:translateX(-50%)",
        "position:absolute !important;top:100% !important",
        "left:calc(50% - 50vw) !important",
        "calc(-20%)",
        "calc(100.45%)",
    )
    missing = [item for item in required if item not in compiled]
    present = [item for item in forbidden if item in compiled]
    if missing or present:
        raise SystemExit(f"compiled CSS contract failed missing={missing} forbidden={present}")
    fixture = Path(tempfile.mkdtemp(prefix="nav-center-sheet-"))
    try:
        write_fixture(fixture, compiled)
        server = subprocess.Popen(
            ["python3", "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
            cwd=fixture,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        try:
            rows = asyncio.run(run(fixture))
        finally:
            server.terminate()
            server.wait(timeout=5)
    finally:
        shutil.rmtree(fixture, ignore_errors=True)

    failed = False
    for row in rows:
        kind = row["kind"]
        errors = []
        if kind == "open":
            errors = judge_open(row, phone=True)
            if row["mode"] == "index" and "FLATRATE.WIKI" not in row["afterContent"]:
                errors.append(f"index label {row['afterContent']}")
            if row["mode"] == "discussion":
                if row["labelText"] != row["label"] or row["afterContent"] != "none":
                    errors.append(f"context label {row['labelText']}/{row['afterContent']}")
            if not row["backdrop"]:
                errors.append("backdrop missing")
            if row["rail"] != "main":
                errors.append(f"rail {row['rail']}")
        elif kind == "page-scroll":
            errors = judge_open(row, phone=True)
            if row["scrollY"] <= 0 or row["laterScrollY"] <= row["scrollY"]:
                errors.append(f"PAGE_SCROLL_Y {row['scrollY']}->{row['laterScrollY']}")
            anchor_broken = (
                row["position"] != "fixed"
                or row["laterPosition"] != "fixed"
                or abs(row["menuBottom"] - row["innerHeight"]) > 1
                or abs(row["laterMenuBottom"] - row["laterInnerHeight"]) > 1
                or abs(row["menuHeight"] - (0.5 * row["innerHeight"])) > 1
                or abs(row["laterMenuHeight"] - (0.5 * row["laterInnerHeight"])) > 1
                or abs(row["menuTop"] - row["laterMenuTop"]) > 1
            )
            if anchor_broken:
                errors.append(
                    "FAIL_FIXED_VIEWPORT_BINDING "
                    f"top={row['menuTop']:.2f}->{row['laterMenuTop']:.2f} "
                    f"bottom={row['menuBottom']:.2f}->{row['laterMenuBottom']:.2f} "
                    f"pos={row['position']}/{row['laterPosition']}"
                )
        elif kind == "closed":
            if row["visibility"] != "hidden":
                errors.append(f"visibility {row['visibility']}")
            if row["open"] or row["backdrop"]:
                errors.append("still open")
            if abs(row["labelDelta"]) > 1:
                errors.append(f"labelDelta {row['labelDelta']:.2f}")
            if row["hitMenu"]:
                errors.append("closed menu intercepts the page")
            if row["wheel"][1] <= row["wheel"][0]:
                errors.append(f"wheel {row['wheel']}")
            touch = row.get("touch") or [0, 0]
            if touch[1] <= touch[0]:
                errors.append(f"touch {touch}")
        elif kind == "reopen":
            errors = judge_open(row, phone=True)
        elif kind == "backdrop":
            if row["dismissed"]["open"] or row["dismissed"]["backdrop"]:
                errors.append(f"dismiss {row['dismissed']}")
        elif kind == "desktop":
            errors = judge_open(row, phone=False)
            if "50dvh" in str(row.get("top")) or row.get("menuWidth", 0) > 400:
                errors.append(f"desktop sheet {row.get('position')} {row.get('menuWidth')}")
        state = "PASS" if not errors else "FAIL " + "; ".join(errors)
        if errors:
            failed = True
        if kind in {"open", "reopen", "closed", "desktop", "page-scroll"}:
            print(
                f"{state} {kind} {row['mode']} {row['label']} affix={row['affix']} "
                f"{row['innerWidth']}x{row['innerHeight']} "
                f"top={row['menuTop']:.2f} bottom={row['menuBottom']:.2f} "
                f"left={row['menuLeft']:.2f} width={row['menuWidth']:.2f} "
                f"height={row['menuHeight']:.2f} ratio={row['menuRatio']:.4f} "
                f"titleBottom={row['titleBottom']:.2f} "
                f"scroll={row['scrollHeight']}>{row['clientHeight']} entry={row['before']} {row['atZero']}->{row['after']} "
                f"delta={row['labelDelta']:.2f} gap={row['caretGap']:.2f} caret={row['caretW']:.2f} "
                f"pad={row['paddingBottom']} vis={row['visibility']} "
                f"wheel={row.get('wheel')} touch={row.get('touch')}"
                + (
                    f" scrollY={row['scrollY']:.0f}->{row['laterScrollY']:.0f} laterTop={row['laterMenuTop']:.2f} laterBottom={row['laterMenuBottom']:.2f}"
                    if kind == "page-scroll" else ""
                )
            )
        else:
            print(f"{state} backdrop {row['dismissed']}")
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
