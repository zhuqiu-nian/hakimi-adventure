import argparse
import http.server
import os
import platform
import socketserver
import subprocess
import sys
import webbrowser
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Start Hakimi Adventure web demo.")
    parser.add_argument("--host", default="127.0.0.1", help="Bind host. Use 0.0.0.0 on a cloud server.")
    parser.add_argument("--port", type=int, default=8080, help="HTTP port.")
    parser.add_argument("--no-browser", action="store_true", help="Do not open a browser automatically.")
    parser.add_argument("--prefer-bat", action="store_true", help="On Windows, run run_web_demo.bat if it exists.")
    return parser.parse_args()


def run_bat_if_requested(root: Path, args: argparse.Namespace) -> bool:
    if not args.prefer_bat:
        return False
    if platform.system().lower() != "windows":
        return False

    bat_path = root / "run_web_demo.bat"
    if not bat_path.exists():
        return False

    subprocess.Popen(["cmd", "/c", str(bat_path)], cwd=str(root))
    return True


def serve_static(root: Path, host: str, port: int, open_browser: bool) -> None:
    index_path = root / "index.html"
    if not index_path.exists():
        print("[Hakimi Demo] index.html was not found.")
        print("[Hakimi Demo] Put this script inside the built web-desktop folder.")
        sys.exit(1)

    os.chdir(root)
    handler = http.server.SimpleHTTPRequestHandler

    class ReusableTCPServer(socketserver.TCPServer):
        allow_reuse_address = True

    url_host = "localhost" if host in ("0.0.0.0", "::") else host
    url = f"http://{url_host}:{port}"

    with ReusableTCPServer((host, port), handler) as httpd:
        print(f"[Hakimi Demo] Serving: {root}")
        print(f"[Hakimi Demo] URL: {url}")
        print("[Hakimi Demo] Press Ctrl+C to stop.")
        if open_browser:
            webbrowser.open(url)
        httpd.serve_forever()


def main() -> None:
    args = parse_args()
    root = Path(__file__).resolve().parent

    if run_bat_if_requested(root, args):
        return

    serve_static(root, args.host, args.port, not args.no_browser)


if __name__ == "__main__":
    main()
