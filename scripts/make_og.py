"""Generate og.jpg (1200x630) from banner + logo. Run once, not committed to runtime."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1200, 630

# theme palette
NIGHT = (11, 7, 16)
NIGHT2 = (21, 10, 27)
RED = (226, 35, 26)
GOLD = (245, 197, 24)
CREAM = (255, 233, 176)

# 1) base canvas with vertical gradient
canvas = Image.new("RGB", (W, H), NIGHT)
px = canvas.load()
for y in range(H):
    t = y / H
    r = int(NIGHT[0] + (NIGHT2[0] - NIGHT[0]) * t)
    g = int(NIGHT[1] + (NIGHT2[1] - NIGHT[1]) * t)
    b = int(NIGHT[2] + (NIGHT2[2] - NIGHT[2]) * t)
    for x in range(W):
        px[x, y] = (r, g, b)

# 2) red glow top-left
glow = Image.new("RGB", (W, H), (0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse([-300, -200, 700, 500], fill=(80, 12, 12))
glow = glow.filter(ImageFilter.GaussianBlur(140))
canvas = Image.blend(canvas, Image.eval(glow, lambda v: min(255, v)), 0.55)

# 3) gold glow top-right
glow2 = Image.new("RGB", (W, H), (0, 0, 0))
gd2 = ImageDraw.Draw(glow2)
gd2.ellipse([700, -250, 1500, 450], fill=(60, 50, 8))
glow2 = glow2.filter(ImageFilter.GaussianBlur(160))
canvas = Image.blend(canvas, Image.eval(glow2, lambda v: min(255, v)), 0.6)

# 4) banner — scale to fit
banner = Image.open(os.path.join(ROOT, "banner.jpeg")).convert("RGB")
b_target_w = 1080
b_ratio = b_target_w / banner.width
b_target_h = int(banner.height * b_ratio)
banner = banner.resize((b_target_w, b_target_h), Image.LANCZOS)

# add gold border to banner
bordered = Image.new("RGB", (b_target_w + 12, b_target_h + 12), GOLD)
bordered.paste(banner, (6, 6))

bx = (W - bordered.width) // 2
by = 110
canvas.paste(bordered, (bx, by))

# 5) text below
draw = ImageDraw.Draw(canvas)

# try to find a bold system font
font_paths = [
    "/System/Library/Fonts/Supplemental/Impact.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/Library/Fonts/Arial Bold.ttf",
]
font_path = next((p for p in font_paths if os.path.exists(p)), None)


def fit_font(text, max_width, max_size, min_size=20):
    size = max_size
    while size >= min_size:
        f = (
            ImageFont.truetype(font_path, size)
            if font_path
            else ImageFont.load_default()
        )
        if draw.textlength(text, font=f) <= max_width:
            return f
        size -= 2
    return f


SAFE_PAD = 60  # left/right safe area
max_text_w = W - SAFE_PAD * 2

# main title - drawn near top
title = "$AMC — AMURICAN MEGA CENDORR"
font_big = fit_font(title, max_text_w, 78)
tw = draw.textlength(title, font=font_big)
tx = (W - tw) // 2
ty = 22

draw.text((tx + 4, ty + 4), title, font=font_big, fill=(0, 0, 0))
draw.text((tx, ty), title, font=font_big, fill=CREAM)

# subtitle below banner
sub = "MOVIEZ GO HIYOR!!!  •  $AMC ON SOLANA  •  PUMP.FUN"
font_med = fit_font(sub, max_text_w, 34)
sw = draw.textlength(sub, font=font_med)
sx = (W - sw) // 2
sy = by + bordered.height + 28
draw.text((sx + 3, sy + 3), sub, font=font_med, fill=(0, 0, 0))
draw.text((sx, sy), sub, font=font_med, fill=GOLD)

# 6) save
out = os.path.join(ROOT, "og.jpg")
canvas.save(out, "JPEG", quality=88, optimize=True)
print(f"wrote {out} ({W}x{H})")
