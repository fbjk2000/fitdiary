from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SITE = ROOT / "site"

BG = "#0b1020"
PANEL = "#111a2f"
PANEL_ALT = "#182544"
CORAL = "#ff7a59"
SKY = "#69c8ff"
SAND = "#ffe4bb"
TEXT = "#f4f7fb"


def hex_rgba(value: str, alpha: int = 255):
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def rounded_gradient_background(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = img.load()

    bg = hex_rgba(BG)
    panel = hex_rgba(PANEL)
    panel_alt = hex_rgba(PANEL_ALT)
    coral = hex_rgba(CORAL, 52)
    sky = hex_rgba(SKY, 44)
    sand = hex_rgba(SAND, 24)

    for y in range(size):
        for x in range(size):
            nx = x / (size - 1)
            ny = y / (size - 1)
            base_mix = 0.5 * ny + 0.5 * nx
            r = int(panel[0] * (1 - base_mix) + bg[0] * base_mix)
            g = int(panel[1] * (1 - base_mix) + bg[1] * base_mix)
            b = int(panel[2] * (1 - base_mix) + panel_alt[2] * (1 - base_mix) * 0.25 + bg[2] * base_mix)

            def orb(cx, cy, radius, color):
                dx = nx - cx
                dy = ny - cy
                dist = (dx * dx + dy * dy) ** 0.5
                strength = max(0.0, 1.0 - dist / radius)
                return tuple(int(c * (strength ** 2)) for c in color[:3]), strength

            coral_rgb, coral_strength = orb(0.22, 0.18, 0.42, coral)
            sky_rgb, sky_strength = orb(0.82, 0.18, 0.38, sky)
            sand_rgb, sand_strength = orb(0.72, 0.86, 0.44, sand)

            r = min(255, r + coral_rgb[0] + sky_rgb[0] + sand_rgb[0])
            g = min(255, g + coral_rgb[1] + sky_rgb[1] + sand_rgb[1])
            b = min(255, b + coral_rgb[2] + sky_rgb[2] + sand_rgb[2])
            px[x, y] = (r, g, b, 255)

    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * 0.23), fill=255)
    img.putalpha(mask)

    border = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(border)
    d.rounded_rectangle(
        (max(1, size * 0.018), max(1, size * 0.018), size - max(2, size * 0.018), size - max(2, size * 0.018)),
        radius=int(size * 0.22),
        outline=(255, 255, 255, 20),
        width=max(2, int(size * 0.012)),
    )
    return Image.alpha_composite(img, border)


def draw_brand_mark(size: int, monochrome: bool = False) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    coral = hex_rgba(TEXT if monochrome else CORAL)
    sky = hex_rgba(TEXT if monochrome else SKY)
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)

    stroke = int(size * 0.11)
    x0 = int(size * 0.32)
    y0 = int(size * 0.22)
    y1 = int(size * 0.78)
    top_end = int(size * 0.64)
    mid_y = int(size * 0.49)
    mid_end = int(size * 0.56)

    for target in (sdraw, draw):
        color_main = (0, 0, 0, 80) if target is sdraw else coral
        target.rounded_rectangle((x0 - stroke // 2, y0, x0 + stroke // 2, y1), radius=stroke // 2, fill=color_main)
        target.rounded_rectangle((x0, y0, top_end, y0 + stroke), radius=stroke // 2, fill=color_main)
        target.rounded_rectangle((x0, mid_y, mid_end, mid_y + stroke), radius=stroke // 2, fill=color_main)

        wing = [
            (top_end - int(stroke * 0.52), y0 + int(stroke * 0.22)),
            (top_end + int(stroke * 0.34), y0 - int(stroke * 0.32)),
            (top_end + int(stroke * 0.84), y0 + int(stroke * 0.18)),
            (top_end + int(stroke * 0.22), y0 + int(stroke * 0.82)),
        ]
        target.polygon(wing, fill=(0, 0, 0, 80) if target is sdraw else sky)

        seam = [
            (top_end - int(stroke * 0.12), y0 + int(stroke * 0.08)),
            (top_end + int(stroke * 0.18), y0 - int(stroke * 0.08)),
            (top_end + int(stroke * 0.34), y0 + int(stroke * 0.14)),
            (top_end + int(stroke * 0.02), y0 + int(stroke * 0.3)),
        ]
        target.polygon(seam, fill=(0, 0, 0, 80) if target is sdraw else sky)

    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=max(2, int(size * 0.02))))
    shadow_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow_layer.alpha_composite(shadow, dest=(0, int(size * 0.018)))
    return Image.alpha_composite(shadow_layer, img)


def save_icon_assets():
    icon = rounded_gradient_background(1024)
    icon.alpha_composite(draw_brand_mark(1024))
    icon.save(ASSETS / "icon.png")

    splash = Image.new("RGBA", (1242, 2436), hex_rgba(BG))
    panel = rounded_gradient_background(820)
    mark = draw_brand_mark(820)
    panel.alpha_composite(mark)
    splash.alpha_composite(panel, dest=((1242 - 820) // 2, 420))
    splash.save(ASSETS / "splash-icon.png")

    foreground = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    foreground.alpha_composite(draw_brand_mark(1024), dest=(0, 0))
    foreground.save(ASSETS / "android-icon-foreground.png")

    mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    mono.alpha_composite(draw_brand_mark(1024, monochrome=True))
    mono.save(ASSETS / "android-icon-monochrome.png")

    bg = Image.new("RGBA", (1024, 1024), hex_rgba(BG))
    bg.save(ASSETS / "android-icon-background.png")

    favicon = rounded_gradient_background(64)
    favicon.alpha_composite(draw_brand_mark(64))
    favicon.save(ASSETS / "favicon.png")


def save_site_brand_svg():
    svg = f"""<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="120" height="120" rx="30" fill="{PANEL}"/>
  <rect x="4" y="4" width="120" height="120" rx="30" stroke="rgba(255,255,255,0.12)"/>
  <path d="M40 28C40 24.6863 42.6863 22 46 22H48C51.3137 22 54 24.6863 54 28V100C54 103.314 51.3137 106 48 106H46C42.6863 106 40 103.314 40 100V28Z" fill="{CORAL}"/>
  <path d="M46 22H76C79.3137 22 82 24.6863 82 28V30C82 33.3137 79.3137 36 76 36H46V22Z" fill="{CORAL}"/>
  <path d="M46 57H68C71.3137 57 74 59.6863 74 63V65C74 68.3137 71.3137 71 68 71H46V57Z" fill="{CORAL}"/>
  <path d="M75.5 21.5L96.5 12L105.5 25.5L87.5 38L75.5 33V21.5Z" fill="{SKY}"/>
  <path d="M76 24.5L86 20L91 25L80.5 30.5L76 28.5V24.5Z" fill="{SKY}"/>
</svg>
"""
    (SITE / "brand-mark.svg").write_text(svg, encoding="utf-8")


if __name__ == "__main__":
    save_icon_assets()
    save_site_brand_svg()
    print("FitDiary brand assets generated.")
