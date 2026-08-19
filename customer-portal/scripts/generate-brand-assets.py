#!/usr/bin/env python3
"""Regenerate v2 raster brand projections from the canonical SVG mark."""
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'public' / 'favicon.svg'
V2 = ROOT / 'public' / 'brand' / 'v2'


def main() -> None:
    V2.mkdir(parents=True, exist_ok=True)
    sizes = {
        'favicon-16.png': 16,
        'favicon-32.png': 32,
        'favicon-48.png': 48,
        'apple-touch-icon.png': 180,
        'icon-192.png': 192,
        'icon-512.png': 512,
        'mark-256.png': 256,
    }
    for name, size in sizes.items():
        out = V2 / name
        subprocess.check_call(['rsvg-convert', '-w', str(size), '-h', str(size), str(SRC), '-o', str(out)])
    shutil.copyfile(V2 / 'favicon-16.png', ROOT / 'public' / 'favicon-16x16.png')
    shutil.copyfile(V2 / 'favicon-32.png', ROOT / 'public' / 'favicon-32x32.png')
    shutil.copyfile(V2 / 'apple-touch-icon.png', ROOT / 'public' / 'apple-touch-icon.png')
    shutil.copyfile(V2 / 'icon-192.png', ROOT / 'public' / 'icon-192x192.png')
    shutil.copyfile(V2 / 'icon-512.png', ROOT / 'public' / 'icon-512x512.png')
    subprocess.check_call([
        'convert',
        str(V2 / 'favicon-16.png'),
        str(V2 / 'favicon-32.png'),
        str(V2 / 'favicon-48.png'),
        str(ROOT / 'public' / 'favicon.ico'),
    ])
    print('brand rasters regenerated under public/brand/v2')


if __name__ == '__main__':
    main()
