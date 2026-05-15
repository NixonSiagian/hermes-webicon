#!/usr/bin/env python3
"""
Validation script for the React-based Hermes Workspace.

The legacy NIXON workspace was a single HTML/CSS/JS bundle. It was replaced
by a React + Vite app that lives in `webui/` and is built into
`static/nixon-workspace/`. This script just verifies that the build output
exists and has the shape we expect, plus that the React source files
contain the components we promise.
"""

import sys
from pathlib import Path


REPO = Path(__file__).resolve().parent
BUILD_DIR = REPO / "static" / "nixon-workspace"
WEBUI_DIR = REPO / "webui"


def _check(label: str, ok: bool) -> bool:
    print(f"  {'PASS' if ok else 'FAIL'}  {label}")
    return ok


def validate_build_output() -> bool:
    print("Build output:")
    if not BUILD_DIR.exists():
        print(f"  FAIL  build directory missing: {BUILD_DIR}")
        print("        Run: cd webui && npm install && npm run build")
        return False

    index_html = BUILD_DIR / "index.html"
    assets_dir = BUILD_DIR / "assets"
    sprites_dir = BUILD_DIR / "sprites"

    results = [
        _check("index.html exists", index_html.exists()),
        _check("assets/ exists", assets_dir.is_dir()),
        _check(
            "assets/ contains a JS bundle",
            assets_dir.is_dir() and any(assets_dir.glob("*.js")),
        ),
        _check(
            "assets/ contains a CSS bundle",
            assets_dir.is_dir() and any(assets_dir.glob("*.css")),
        ),
        _check("sprites/ exists", sprites_dir.is_dir()),
        _check(
            "sprites/ contains all four agent PNGs",
            sprites_dir.is_dir()
            and {p.name for p in sprites_dir.glob("*.png")}
            >= {"dev.png", "manager.png", "ops.png", "research.png"},
        ),
    ]

    if index_html.exists():
        html = index_html.read_text(encoding="utf-8")
        results.append(_check('index.html has <div id="root">', 'id="root"' in html))
        results.append(
            _check(
                "index.html references hashed assets",
                "./assets/" in html,
            )
        )

    return all(results)


def validate_react_sources() -> bool:
    print("React sources:")
    src = WEBUI_DIR / "src"
    expected = {
        "App.jsx": ["Navbar", "Workspace"],
        "components/Navbar.jsx": ["export default function Navbar"],
        "components/Workspace.jsx": ["export default function Workspace"],
        "components/Room.jsx": ["export default function Room"],
        "components/Agent.jsx": ["export default function Agent"],
    }

    ok = True
    for rel, needles in expected.items():
        path = src / rel
        if not path.exists():
            ok = _check(f"{rel} exists", False) and ok
            continue
        text = path.read_text(encoding="utf-8")
        ok = _check(f"{rel} exists", True) and ok
        for needle in needles:
            ok = _check(f"  {rel} mentions '{needle}'", needle in text) and ok
    return ok


def main() -> int:
    print("Hermes Workspace - Validation")
    print("=" * 40)
    sources_ok = validate_react_sources()
    build_ok = validate_build_output()
    print("=" * 40)
    print(f"React sources: {'OK' if sources_ok else 'FAIL'}")
    print(f"Build output:  {'OK' if build_ok else 'FAIL'}")
    return 0 if (sources_ok and build_ok) else 1


if __name__ == "__main__":
    sys.exit(main())
