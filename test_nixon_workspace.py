#!/usr/bin/env python3
"""
Local preview server for the React-based Hermes Workspace.

The standalone workspace is now a Vite + React app whose build artifacts
live in `static/nixon-workspace/`. This script just serves the `static/`
directory so you can hit:

    http://localhost:8081/nixon-workspace/

(or http://localhost:8081/nixon-workspace.html which redirects there).

For day-to-day development with hot reload, prefer:

    cd webui && npm install && npm run dev
"""

import http.server
import socketserver
import sys
from pathlib import Path


class WorkspaceHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).parent / "static"), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()


def main() -> int:
    port = 8081
    url = f"http://localhost:{port}/nixon-workspace/"
    print(f"Serving Hermes Workspace at {url}")
    print("Press Ctrl+C to stop.")
    try:
        with socketserver.TCPServer(("", port), WorkspaceHTTPRequestHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        return 0
    except OSError as exc:
        if getattr(exc, "errno", None) == 48:
            print(f"Port {port} is already in use.")
            return 1
        raise


if __name__ == "__main__":
    sys.exit(main())
