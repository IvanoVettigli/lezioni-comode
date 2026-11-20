#!/usr/bin/env python3
"""Avvia un server HTTP locale per testare il sito con ES Modules su Windows/macOS/Linux."""

from __future__ import annotations

import argparse
import functools
import http.server
import mimetypes
import socketserver
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent


class CleanHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Garantisce MIME types corretti per ES Modules (.js/.mjs) anche su Windows."""

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript; charset=utf-8",
        ".mjs": "application/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".svg": "image/svg+xml",
    }

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main() -> None:
    mimetypes.add_type("application/javascript", ".js")
    parser = argparse.ArgumentParser(description="Server HTTP locale per Le comode lezioni d'Ivano")
    parser.add_argument("--port", type=int, default=8000, help="Porta locale (default: 8000)")
    parser.add_argument("--host", default="127.0.0.1", help="Host bind (default: 127.0.0.1)")
    args = parser.parse_args()

    handler = functools.partial(CleanHTTPRequestHandler, directory=str(ROOT_DIR))
    with socketserver.TCPServer((args.host, args.port), handler) as httpd:
        print(f"Server locale attivo su http://{args.host}:{args.port}/")
        print(f"Cartella servita: {ROOT_DIR}")
        print("Premi Ctrl+C per fermare.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer fermato.")


if __name__ == "__main__":
    main()
