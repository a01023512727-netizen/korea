#!/usr/bin/env python3
"""Generate simple PNG icons for PWA and Android."""

from pathlib import Path
import struct
import zlib

BG = (196, 92, 38)   # #c45c26
FG = (255, 255, 255)


def png_chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', crc)


def make_png(size: int, path: Path) -> None:
    rows = []
    cx, cy = size // 2, size // 2
    r = int(size * 0.38)

    for y in range(size):
        row = b'\x00'
        for x in range(size):
            dx, dy = x - cx, y - cy
            if dx * dx + dy * dy <= r * r:
                row += bytes(FG)
            else:
                row += bytes(BG)
        rows.append(row)

    raw = b''.join(rows)
    compressed = zlib.compress(raw, 9)

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    png = b'\x89PNG\r\n\x1a\n'
    png += png_chunk(b'IHDR', ihdr)
    png += png_chunk(b'IDAT', compressed)
    png += png_chunk(b'IEND', b'')
    path.write_bytes(png)


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    web_icons = root / 'icons'
    web_icons.mkdir(exist_ok=True)
    make_png(192, web_icons / 'icon-192.png')
    make_png(512, web_icons / 'icon-512.png')

    android_sizes = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192,
    }
    res_root = root / 'android' / 'app' / 'src' / 'main' / 'res'
    for folder, size in android_sizes.items():
        out_dir = res_root / folder
        out_dir.mkdir(parents=True, exist_ok=True)
        make_png(size, out_dir / 'ic_launcher.png')
        make_png(size, out_dir / 'ic_launcher_round.png')

    print('Icons generated for web and Android.')


if __name__ == '__main__':
    main()
