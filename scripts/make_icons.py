"""Generate favicon-16/32, apple-touch-icon (180), og-square (512) from logo."""
from PIL import Image
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = Image.open(os.path.join(ROOT, "logo.jpeg")).convert("RGB")

specs = [
    ("favicon-16.png", 16),
    ("favicon-32.png", 32),
    ("apple-touch-icon.png", 180),
    ("icon-192.png", 192),
    ("icon-512.png", 512),
]
for name, size in specs:
    img = src.resize((size, size), Image.LANCZOS)
    out = os.path.join(ROOT, name)
    img.save(out, optimize=True)
    print(f"wrote {out} ({size}x{size})")
