#!/usr/bin/env python3
"""Render the mobile title with Flarum's Less.php output, not raw forum.less.

CI enforces the compiler contract in tests/MobileTitleCompiledCssTest.php.
This script is the rendered gate at 320, 360, 390, 412, and 430 CSS pixels.
It needs google-chrome and the Font Awesome package from a Flarum 1.8 tree.
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
WIDTHS = (320, 360, 390, 412, 430)
LABELS = ("Honda", "Audi", "Technician Topics")
FA_DIR = Path(os.environ.get("FONT_AWESOME_DIR", ""))
CORE_CSS = """
:root { --header-height-phone: 46px; --header-color: #eaedf0; --primary-color: #e7672e; }
html, body { margin: 0; background: #15191e; }
.App { position: relative !important; min-height: 100vh; }
.App-navigation { position: absolute; left: 0; right: 0; top: 0; height: 46px; }
.ButtonGroup { position: relative; display: inline-block; vertical-align: middle; }
.ButtonGroup > .Button { position: relative; float: left; }
.App-primaryControl, .App-titleControl, .App-backControl {
  position: absolute !important; top: 0 !important; margin: 0; z-index: 2;
}
.App-backControl { left: 0; }
.App-backControl > .Button, .App-primaryControl > .Button {
  width: 40px; height: 46px; padding: 0; border: 0; background: transparent; color: #fff;
}
.App-primaryControl { right: 0; width: auto; }
.App-titleControl {
  width: 200px; left: 50%; margin-left: -100px; text-align: center; color: var(--header-color);
}
.App-titleControl > .Button {
  color: var(--header-color); width: 100%; overflow: hidden; text-overflow: ellipsis;
  font-size: 16px; height: 46px; border: 0; background: transparent; padding: 13px; margin: 0;
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
    fa = directory / "font-awesome"
    fa.mkdir()
    os.symlink(FA_DIR / "css", fa / "css")
    os.symlink(FA_DIR / "webfonts", fa / "webfonts")
    html = f"""<!doctype html>
<html>
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="/font-awesome/css/all.min.css">
<style>
{CORE_CSS}
{compiled_css}
</style>
</head>
<body>
<div class="App">
  <div class="App-navigation">
    <div class="App-backControl"><button class="Button Button--icon" type="button" aria-label="back"></button></div>
    <div id="title" class="ButtonGroup Dropdown dropdown App-titleControl Dropdown--select">
      <button class="Dropdown-toggle Button" type="button">
        <span class="Button-label" id="label">FlatRate.wiki</span>
        <i class="icon fas fa-sort Button-caret"></i>
      </button>
    </div>
    <div class="App-primaryControl"><button class="Button" type="button" aria-label="follow"></button></div>
  </div>
</div>
<script>
window.setMode = (mode, text) => {{
  const title = document.getElementById('title');
  const label = document.getElementById('label');
  title.classList.toggle('FlatRateDiscussionBrandPicker', mode === 'discussion');
  label.textContent = text || 'FlatRate.wiki';
}};
window.measure = () => {{
  const title = document.querySelector('.App-titleControl');
  const toggle = title.querySelector('.Dropdown-toggle');
  const label = title.querySelector('.Button-label');
  const caret = title.querySelector('.Button-caret');
  const box = (el) => {{
    const r = el.getBoundingClientRect();
    return {{l: r.left, r: r.right, w: r.width, t: r.top, h: r.height}};
  }};
  const lr = box(label);
  const before = getComputedStyle(caret, '::before');
  return {{
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    labelText: label.innerText.trim(),
    after: getComputedStyle(label, '::after').content,
    labelDelta: ((lr.l + lr.r) / 2) - (window.innerWidth / 2),
    title: box(title),
    label: lr,
    caret: box(caret),
    maxWidth: getComputedStyle(title).maxWidth,
    overflow: getComputedStyle(toggle).overflow,
    caretContent: before.content,
    caretFont: before.fontFamily,
    backRight: document.querySelector('.App-backControl').getBoundingClientRect().right
  }};
}};
</script>
</body>
</html>
"""
    (directory / "index.html").write_text(html)


async def cdp(ws, method, params=None, timeout=10):
    cdp.id += 1
    message = {"id": cdp.id, "method": method, "params": params or {}}
    await ws.send(json.dumps(message))
    while True:
        raw = await asyncio.wait_for(ws.recv(), timeout)
        data = json.loads(raw)
        if data.get("id") == cdp.id:
            if "error" in data:
                raise RuntimeError(data["error"])
            return data.get("result", {})


cdp.id = 0


async def evaluate(ws, expression):
    result = await cdp(
        ws,
        "Runtime.evaluate",
        {"expression": expression, "returnByValue": True, "awaitPromise": True},
    )
    if "exceptionDetails" in result:
        raise RuntimeError(result["exceptionDetails"])
    remote = result.get("result", {})
    if remote.get("type") == "undefined":
        return None
    return remote["value"]


def judge(row):
    errors = []
    delta = row["labelDelta"]
    if abs(delta) > 1:
        errors.append(f"labelDelta {delta:.2f}")
    if row["title"]["w"] <= 0:
        errors.append(f"title width {row['title']['w']}")
    if row["maxWidth"] in {"0px", "0%", "none"} or row["maxWidth"].startswith("0"):
        errors.append(f"maxWidth {row['maxWidth']}")
    if abs(row["caret"]["w"] - 16) > 0.6:
        errors.append(f"caret width {row['caret']['w']}")
    if row["caret"]["l"] < row["label"]["r"] - 0.5:
        errors.append("caret overlaps label")
    if row["caret"]["r"] > row["innerWidth"] + 0.5 or row["caret"]["l"] < 0:
        errors.append("caret outside viewport")
    if row["overflow"] != "visible":
        errors.append(f"overflow {row['overflow']}")
    if row["scrollWidth"] > row["clientWidth"] + 1:
        errors.append("horizontal scroll")
    if "Font Awesome 5 Free" not in row["caretFont"]:
        errors.append(f"caret font {row['caretFont']}")
    if row["caretContent"] in {"none", "normal", '""', "''"}:
        errors.append(f"caret content {row['caretContent']}")
    if abs(row["backRight"] - 40) > 1:
        errors.append(f"back right {row['backRight']}")
    return errors


async def run(port, fixture):
    proc = subprocess.Popen(
        [
            "google-chrome",
            "--headless=new",
            "--hide-scrollbars",
            "--disable-gpu",
            "--remote-debugging-port=9224",
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
                with urllib.request.urlopen("http://127.0.0.1:9224/json/list") as response:
                    pages = [item for item in json.load(response) if item.get("type") == "page"]
                    if pages:
                        ws_url = pages[0]["webSocketDebuggerUrl"]
                        break
            except Exception:
                await asyncio.sleep(0.1)
        if not ws_url:
            raise RuntimeError("chrome page target did not start")
        async with websockets.connect(ws_url, max_size=8_000_000) as ws:
            await cdp(ws, "Page.enable")
            window_id = (await cdp(ws, "Browser.getWindowForTarget"))["windowId"]
            rows = []
            for width in WIDTHS:
                await cdp(
                    ws,
                    "Browser.setWindowBounds",
                    {
                        "windowId": window_id,
                        "bounds": {"width": width, "height": 800, "windowState": "normal"},
                    },
                )
                await cdp(ws, "Page.navigate", {"url": f"http://127.0.0.1:{port}/index.html"})
                ready = False
                for _ in range(50):
                    ready = await evaluate(
                        ws,
                        "document.readyState === 'complete' && typeof window.measure === 'function'",
                    )
                    if ready:
                        break
                    await asyncio.sleep(0.05)
                if not ready:
                    raise RuntimeError(f"fixture did not load at {width}px")
                await evaluate(ws, "document.fonts.ready")
                await evaluate(ws, "window.setMode('index', 'FlatRate.wiki')")
                index = await evaluate(ws, "window.measure()")
                if index["innerWidth"] != width:
                    raise RuntimeError(
                        f"window bounds did not stick: wanted {width}, got {index['innerWidth']}"
                    )
                index["mode"] = "index"
                rows.append(index)
                for label in LABELS:
                    quoted = json.dumps(label)
                    await evaluate(ws, f"window.setMode('discussion', {quoted})")
                    discussion = await evaluate(ws, "window.measure()")
                    discussion["mode"] = "discussion"
                    discussion["expected"] = label
                    rows.append(discussion)
            return rows
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


def main():
    if not FA_DIR.is_dir() or not (FA_DIR / "css" / "all.min.css").is_file():
        raise SystemExit("Set FONT_AWESOME_DIR to a Font Awesome 5 tree with css/all.min.css")
    compiled = compile_less()
    if "calc(-20%)" in compiled or "calc(100.45%)" in compiled:
        raise SystemExit("compiled CSS still contains the Less arithmetic rewrite")
    if "max-width:calc(100% - 120px)" not in compiled:
        raise SystemExit("compiled CSS is missing max-width:calc(100% - 120px)")
    fixture = Path(tempfile.mkdtemp(prefix="nav-title-geometry-"))
    try:
        write_fixture(fixture, compiled)
        server = subprocess.Popen(
            ["python3", "-m", "http.server", "8766", "--bind", "127.0.0.1"],
            cwd=fixture,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        try:
            rows = asyncio.run(run(8766, fixture))
        finally:
            server.terminate()
            server.wait(timeout=5)
    finally:
        shutil.rmtree(fixture, ignore_errors=True)

    failed = False
    for row in rows:
        errors = judge(row)
        if row["mode"] == "index":
            if row["after"] != '"FLATRATE.WIKI"':
                errors.append(f"after {row['after']}")
        else:
            if row["labelText"] != row["expected"]:
                errors.append(f"label {row['labelText']!r}")
            if row["after"] not in {"none", "normal"}:
                errors.append(f"discussion after {row['after']}")
        state = "PASS" if not errors else "FAIL " + "; ".join(errors)
        if errors:
            failed = True
        print(
            f"{state} width={row['innerWidth']} mode={row['mode']} "
            f"label={row.get('expected') or row['after']} delta={row['labelDelta']:.2f} "
            f"titleW={row['title']['w']:.2f} maxWidth={row['maxWidth']} "
            f"caretW={row['caret']['w']:.2f} caretL={row['caret']['l']:.2f} labelR={row['label']['r']:.2f}"
        )
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
