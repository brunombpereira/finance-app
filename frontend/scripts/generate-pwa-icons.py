#!/usr/bin/env python3
"""Generate the PWA raster icons (pwa-192.png / pwa-512.png) from the Nexo mark.

Keeps the PNGs in sync with public/favicon.svg — a rounded tile with a
cyan->magenta diagonal gradient and a white "N" whose connecting stroke
climbs to a data point. Run from the frontend/ directory:

    python3 scripts/generate-pwa-icons.py
"""
from PIL import Image, ImageDraw

CYAN = (6, 182, 212)
MAGENTA = (217, 70, 239)

# Mark geometry in a 48x48 design space (matches src/components/Logo.tsx).
STROKE = 5
POINTS = [(14, 21), (14, 34), (34, 14)]  # left vertical -> diagonal -> peak
RIGHT = [(34, 34), (34, 14)]             # right vertical
DOT = (34, 14)
DOT_R = 4


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient(size):
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            px[x, y] = lerp(CYAN, MAGENTA, (x + y) / (2 * size))
    return img


def thick_line(draw, p1, p2, width, fill):
    draw.line([p1, p2], fill=fill, width=width)
    r = width / 2
    for cx, cy in (p1, p2):  # round caps / joins
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill)


def render(size):
    f = size / 48
    img = gradient(size)
    # Rounded-tile mask.
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=int(13 * f), fill=255)
    tile = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    tile.paste(img, (0, 0), mask)

    draw = ImageDraw.Draw(tile)
    w = int(STROKE * f)
    scaled = [(x * f, y * f) for x, y in POINTS]
    thick_line(draw, scaled[0], scaled[1], w, (255, 255, 255, 255))
    thick_line(draw, scaled[1], scaled[2], w, (255, 255, 255, 255))
    thick_line(draw, (RIGHT[0][0] * f, RIGHT[0][1] * f), (RIGHT[1][0] * f, RIGHT[1][1] * f), w, (255, 255, 255, 255))
    dr = DOT_R * f
    draw.ellipse([DOT[0] * f - dr, DOT[1] * f - dr, DOT[0] * f + dr, DOT[1] * f + dr], fill=(255, 255, 255, 255))
    return tile


if __name__ == "__main__":
    for s in (192, 512):
        render(s).save(f"public/pwa-{s}.png")
        print(f"wrote public/pwa-{s}.png")
