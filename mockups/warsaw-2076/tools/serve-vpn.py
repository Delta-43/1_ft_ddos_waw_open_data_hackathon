#!/usr/bin/env python3
"""Serve the mockup on this machine's Tailscale IPv4 address, without sudo."""
import argparse
import errno
import functools
import hashlib
import http.server
import ipaddress
import json
from pathlib import Path
import shutil
import subprocess
import sys
import urllib.error
import urllib.request


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('port', nargs='?', type=int, default=5179,
                        help='TCP port (1024–65535; default: 5179)')
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error('Choose a port between 1024 and 65535.')
    if not shutil.which('tailscale'):
        parser.exit(1, 'Tailscale is not installed. Install it and join your VPN first.\n')
    try:
        result = subprocess.run(['tailscale', 'status', '--json'], check=True,
                                capture_output=True, text=True, timeout=10)
        status = json.loads(result.stdout)
        if status.get('BackendState') != 'Running':
            parser.exit(1, 'Tailscale is not connected. Connect it, then run this script again.\n')
        addresses = status.get('Self', {}).get('TailscaleIPs', [])
        address = next(str(ipaddress.IPv4Address(ip)) for ip in addresses if ':' not in ip)
    except (subprocess.SubprocessError, ValueError, StopIteration) as error:
        parser.exit(1, f'Could not determine your connected Tailscale IPv4 address: {error}\n')

    root = Path(__file__).resolve().parents[1]
    if not (root / 'data/warsaw-overview.js').is_file():
        parser.exit(1, 'The map cache is missing. Use the complete mockups/warsaw-2076 folder.\n')
    url = f'http://{address}:{args.port}/'
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
    try:
        server = http.server.ThreadingHTTPServer((address, args.port), handler)
    except OSError as error:
        if error.errno != errno.EADDRINUSE:
            parser.exit(1, f'Could not start the demo: {error}\n')
        # Reuse an identical running demo without stopping or replacing any process.
        try:
            opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
            with opener.open(url + 'index.html', timeout=3) as response:
                existing = response.read(1024 * 1024)
            if hashlib.sha256(existing).digest() == hashlib.sha256((root / 'index.html').read_bytes()).digest():
                print(f'Demo is already running.\nShare this VPN link: {url}', flush=True)
                return
        except (OSError, urllib.error.URLError):
            pass
        parser.exit(1, f'Port {args.port} is already in use by another server or demo version.\n'
                       f'Try: bash "{root / "start-demo.sh"}" {args.port + 1 if args.port < 65535 else 5179}\n')

    print(f'Share this VPN link: {url}\n'
          'Your friend must be connected to the same Tailscale network and allowed to reach this port.\n'
          'Keep this terminal open. Press Ctrl+C to stop the demo.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nDemo stopped.', flush=True)
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
