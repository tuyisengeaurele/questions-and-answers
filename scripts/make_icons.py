"""Draw the app icons: a lime tile with a graphite road."""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
LIME, GRAPHITE = (198, 241, 53), (19, 21, 24)


def draw(size: int) -> Image.Image:
    s = size * 4
    im = Image.new("RGB", (s, s), LIME)
    d = ImageDraw.Draw(im)
    d.polygon(
        [(0.40 * s, 0.14 * s), (0.60 * s, 0.14 * s), (0.86 * s, 0.86 * s), (0.14 * s, 0.86 * s)],
        fill=GRAPHITE,
    )
    for y0, y1 in [(0.24, 0.34), (0.46, 0.58), (0.70, 0.84)]:
        w0, w1 = 0.012 + (y0 - 0.14) * 0.03, 0.012 + (y1 - 0.14) * 0.03
        d.polygon(
            [
                (0.5 * s - w0 * s, y0 * s),
                (0.5 * s + w0 * s, y0 * s),
                (0.5 * s + w1 * s, y1 * s),
                (0.5 * s - w1 * s, y1 * s),
            ],
            fill=LIME,
        )
    return im.resize((size, size), Image.LANCZOS)


for size, path in [
    (192, "public/icon-192.png"),
    (512, "public/icon-512.png"),
    (180, "src/app/apple-icon.png"),
    (64, "src/app/icon.png"),
]:
    draw(size).save(ROOT / path)
