#!/usr/bin/env python3
"""Take screenshots of task-manager pages. Usage:
  python3 scripts/screenshot.py <url> <output.png> [width] [height]
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 scripts/screenshot.py <url> <output.png> [width=1280] [height=800]")
        sys.exit(1)
    url = sys.argv[1]
    out = Path(sys.argv[2])
    width = int(sys.argv[3]) if len(sys.argv) > 3 else 1280
    height = int(sys.argv[4]) if len(sys.argv) > 4 else 800
    out.parent.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": width, "height": height})
        page.goto(url, wait_until="networkidle", timeout=20000)
        # Give fonts/animations a moment to settle
        page.wait_for_timeout(500)
        page.screenshot(path=str(out), full_page=True)
        browser.close()
    print(f"Saved: {out} ({out.stat().st_size} bytes)")

if __name__ == "__main__":
    main()
