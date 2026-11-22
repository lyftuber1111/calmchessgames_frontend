"""Generate high-contrast Tachyon Lance screen decal textures for black backgrounds.

Outputs into:
  ./meshy_test_0/models/screen_decals_tachyon_lance/screen_decals_tachyon_lance_textures/

Replaces:
  - Laser burn decals -> decal_tachyon_pierce_glancing_{diffuse,normal,roughness}.png (1024x1024)
  - Missile strike decals -> decal_tachyon_pierce_heavy_{diffuse,normal,roughness}.png (1024x1024)
  - Core spider web -> decal_tachyon_core_breach_{diffuse,normal,roughness}.png (2048x2048)
  - Full screen spider web -> decal_tachyon_screen_shatter_{diffuse,normal,roughness}.png (2048x2048)
"""

import math
import random
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


FRONTEND_DIR = Path(r"C:\Users\lyftu\gemini_3\updated_html_js_0\calmchessgames_frontend")
SRC_TEX_DIR = (
    FRONTEND_DIR
    / "meshy_test_0"
    / "models"
    / "screen_decals_spider_web_overlay_4"
    / "screen_decals_spider_web_overlay_4_textures"
)
MODEL_DIR = FRONTEND_DIR / "meshy_test_0" / "models" / "screen_decals_tachyon_lance"
TEX_DIR = MODEL_DIR / "screen_decals_tachyon_lance_textures"
YEST_TEX_DIR = (
    FRONTEND_DIR / "meshy_yest_0" / "models" / "screen_decals_tachyon_lance" / "screen_decals_tachyon_lance_textures"
)

for d in (MODEL_DIR, TEX_DIR, YEST_TEX_DIR):
    d.mkdir(parents=True, exist_ok=True)


def copy_base_frame_textures():
    """Copy the visor metallic frame textures from overlay_4."""
    for name in (
        "texture_0_base_color.png",
        "texture_0_metallic.png",
        "texture_0_normal.png",
        "texture_0_roughness.png",
    ):
        src = SRC_TEX_DIR / name
        if src.exists():
            shutil.copy2(src, TEX_DIR / name)
            shutil.copy2(src, YEST_TEX_DIR / name)


def radial_glow_rgba(size, cx, cy, stops, power=1.0):
    """Create an RGBA glow image from radial color/alpha stops [(r_norm, (r,g,b,a)), ...]."""
    y, x = np.ogrid[:size, :size]
    dist = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    max_r = stops[-1][0]
    norm = np.clip(dist / max(1e-6, max_r), 0.0, 1.0)
    if power != 1.0:
        norm = norm ** power

    rs = np.array([s[0] / max(1e-6, max_r) for s in stops], dtype=np.float32)
    rgba = np.zeros((size, size, 4), dtype=np.float32)
    for ch in range(4):
        vals = np.array([s[1][ch] for s in stops], dtype=np.float32)
        rgba[..., ch] = np.interp(norm, rs, vals)
    return Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), "RGBA")


def draw_hex_ring(draw, cx, cy, radius, color, width=3, start_deg=0, end_deg=360, rot_deg=0.0):
    """Draw a hexagonal ring or partial hexagonal arc."""
    pts = []
    for k in range(7):
        deg = rot_deg + k * 60.0
        rad = math.radians(deg)
        pts.append((cx + math.cos(rad) * radius, cy + math.sin(rad) * radius))
    for k in range(6):
        seg_deg = (k * 60.0 + 30.0) % 360.0
        if start_deg <= seg_deg <= end_deg or (end_deg > 360 and seg_deg + 360 <= end_deg):
            draw.line([pts[k], pts[k + 1]], fill=color, width=width)


def draw_jagged_crack(draw_glow, draw_core, x0, y0, angle, length, rng, glow_col, core_col,
                      core_w=2, glow_w=6, branch_prob=0.35, depth=0, max_depth=2):
    """Draw sharp crystalline glass-shear fractures (straight angular segments, zero sagging silk)."""
    steps = max(3, int(length / 26))
    step_len = length / steps
    pts = [(x0, y0)]
    cur_x, cur_y = x0, y0
    cur_ang = angle

    for s in range(1, steps + 1):
        # Sharp angular kinks rather than smooth waves
        cur_ang += rng.uniform(-0.18, 0.18) if (s % 2 == 1) else rng.uniform(-0.08, 0.08)
        cur_x += math.cos(cur_ang) * step_len
        cur_y += math.sin(cur_ang) * step_len
        pts.append((cur_x, cur_y))

        if depth < max_depth and 0 < s < steps and rng.random() < branch_prob:
            side = 1 if rng.random() < 0.5 else -1
            b_ang = cur_ang + side * rng.uniform(0.38, 0.92)
            b_len = length * rng.uniform(0.28, 0.55)
            draw_jagged_crack(
                draw_glow,
                draw_core,
                cur_x,
                cur_y,
                b_ang,
                b_len,
                rng,
                glow_col,
                core_col,
                core_w=max(1, core_w - 1),
                glow_w=max(2, glow_w - 2),
                branch_prob=branch_prob * 0.65,
                depth=depth + 1,
                max_depth=max_depth,
            )

    if len(pts) >= 2:
        draw_glow.line(pts, fill=glow_col, width=glow_w, joint="curve")
        draw_core.line(pts, fill=core_col, width=core_w, joint="curve")


def draw_lightning_arc(draw_glow, draw_core, p0, p1, rng, jitter=16.0, glow_col=(180, 70, 255, 160),
                       core_col=(245, 225, 255, 240), core_w=2, glow_w=6):
    """Draw a high-energy tachyon phase discharge arc between two points."""
    x0, y0 = p0
    x1, y1 = p1
    dx, dy = x1 - x0, y1 - y0
    dist = math.hypot(dx, dy)
    if dist < 8:
        return
    nx, ny = -dy / dist, dx / dist
    segs = max(4, int(dist / 24))
    pts = [(x0, y0)]
    for i in range(1, segs):
        t = i / segs
        off = rng.uniform(-jitter, jitter) * math.sin(t * math.pi)
        pts.append((x0 + dx * t + nx * off, y0 + dy * t + ny * off))
    pts.append((x1, y1))
    draw_glow.line(pts, fill=glow_col, width=glow_w)
    draw_core.line(pts, fill=core_col, width=core_w)


def apply_radial_edge_fade(img: Image.Image, inner_r_frac=0.72, outer_r_frac=0.95) -> Image.Image:
    """Fade alpha cleanly to zero before quad borders so no rectangular clipping ever appears."""
    arr = np.array(img, dtype=np.float32)
    h, w = arr.shape[:2]
    cx, cy = w * 0.5, h * 0.5
    max_r = min(cx, cy)
    yy, xx = np.ogrid[:h, :w]
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    r_in = max_r * inner_r_frac
    r_out = max_r * outer_r_frac
    mask = np.clip((r_out - dist) / max(1e-6, (r_out - r_in)), 0.0, 1.0)
    mask = mask * mask * (3.0 - 2.0 * mask)
    arr[..., 3] *= mask
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")


def save_normal_and_roughness(diffuse_img: Image.Image, normal_path: Path, roughness_path: Path,
                              strength=3.2, base_rough=225, crack_rough=28):
    """Compute Sobel normal map and glossy crystalline roughness map via NumPy."""
    rgba = np.array(diffuse_img, dtype=np.float32)
    lum = 0.299 * rgba[..., 0] + 0.587 * rgba[..., 1] + 0.114 * rgba[..., 2]
    height = (rgba[..., 3] / 255.0) * (0.4 + 0.6 * (lum / 255.0))

    p = np.pad(height, 1, mode="edge")
    dx = (p[:-2, 2:] + 2.0 * p[1:-1, 2:] + p[2:, 2:]) - (p[:-2, :-2] + 2.0 * p[1:-1, :-2] + p[2:, :-2])
    dy = (p[2:, :-2] + 2.0 * p[2:, 1:-1] + p[2:, 2:]) - (p[:-2, :-2] + 2.0 * p[:-2, 1:-1] + p[:-2, 2:])

    nx = -dx * strength
    ny = -dy * strength
    nz = np.ones_like(nx)
    inv_len = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz)
    nx *= inv_len
    ny *= inv_len
    nz *= inv_len

    norm_rgb = np.stack(
        [
            np.clip((nx * 0.5 + 0.5) * 255.0, 0, 255),
            np.clip((ny * 0.5 + 0.5) * 255.0, 0, 255),
            np.clip((nz * 0.5 + 0.5) * 255.0, 0, 255),
        ],
        axis=-1,
    ).astype(np.uint8)
    Image.fromarray(norm_rgb, "RGB").save(normal_path, "PNG")

    alpha_norm = rgba[..., 3] / 255.0
    rough = base_rough - alpha_norm * (base_rough - crack_rough)
    Image.fromarray(np.clip(rough, 0, 255).astype(np.uint8), "L").save(roughness_path, "PNG")


def save_and_mirror(img: Image.Image, path: Path):
    img.save(path, "PNG")
    shutil.copy2(path, YEST_TEX_DIR / path.name)
    shutil.copy2(path, MODEL_DIR / path.name)


# ---------------------------------------------------------------------------
# 1. Non-Lethal Glancing Tachyon Lance Pierce Decal (1024x1024)
# ---------------------------------------------------------------------------

def generate_glancing_pierce():
    size = 1024
    cx, cy = 512, 512
    rng = random.Random(301)

    # Pinpoint ultraviolet-magenta & cyan ionization halo (non-lethal, contained)
    base = radial_glow_rgba(
        size,
        cx,
        cy,
        [
            (0.0, (255, 245, 255, 255)),
            (18.0, (240, 140, 255, 240)),
            (46.0, (175, 65, 255, 175)),
            (115.0, (35, 215, 255, 85)),
            (220.0, (20, 160, 220, 28)),
            (360.0, (0, 0, 0, 0)),
        ],
    )

    glow_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    core_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    dg = ImageDraw.Draw(glow_layer)
    dc = ImageDraw.Draw(core_layer)

    # Subtle directional glancing lance graze streak
    ang_graze = math.radians(-28.0)
    gx0 = cx - math.cos(ang_graze) * 230
    gy0 = cy - math.sin(ang_graze) * 230
    gx1 = cx + math.cos(ang_graze) * 230
    gy1 = cy + math.sin(ang_graze) * 230
    dg.line([(gx0, gy0), (gx1, gy1)], fill=(195, 75, 255, 125), width=18)
    dc.line([(cx - math.cos(ang_graze) * 145, cy - math.sin(ang_graze) * 145),
             (cx + math.cos(ang_graze) * 145, cy + math.sin(ang_graze) * 145)],
            fill=(240, 248, 255, 210), width=4)

    # Containment-field hexagonal deflection arcs (cyan + amber-gold)
    draw_hex_ring(dg, cx, cy, 145, (0, 240, 255, 130), width=8, start_deg=20, end_deg=235, rot_deg=15)
    draw_hex_ring(dc, cx, cy, 145, (180, 252, 255, 230), width=3, start_deg=20, end_deg=235, rot_deg=15)
    draw_hex_ring(dg, cx, cy, 215, (255, 200, 75, 110), width=7, start_deg=180, end_deg=350, rot_deg=15)
    draw_hex_ring(dc, cx, cy, 215, (255, 224, 130, 215), width=2, start_deg=180, end_deg=350, rot_deg=15)

    # 14 short contained crystalline hairline micro-cracks
    for i in range(14):
        ang = (2.0 * math.pi * i / 14.0) + rng.uniform(-0.15, 0.15)
        length = rng.uniform(75.0, 195.0)
        sx = cx + math.cos(ang) * 14.0
        sy = cy + math.sin(ang) * 14.0
        draw_jagged_crack(
            dg, dc, sx, sy, ang, length, rng,
            glow_col=(65, 230, 255, 135),
            core_col=(242, 250, 255, 235),
            core_w=2, glow_w=5, branch_prob=0.22, max_depth=1,
        )

    # Pinpoint luminous white-magenta micro-puncture ring
    dg.ellipse([cx - 26, cy - 26, cx + 26, cy + 26], outline=(235, 100, 255, 225), width=6)
    dc.ellipse([cx - 12, cy - 12, cx + 12, cy + 12], fill=(255, 250, 255, 255))

    glow_blurred = glow_layer.filter(ImageFilter.GaussianBlur(radius=3.5))
    out = Image.alpha_composite(base, glow_blurred)
    out = Image.alpha_composite(out, core_layer)
    out = apply_radial_edge_fade(out, 0.72, 0.94)

    diff_p = TEX_DIR / "decal_tachyon_pierce_glancing_diffuse.png"
    norm_p = TEX_DIR / "decal_tachyon_pierce_glancing_normal.png"
    rou_p = TEX_DIR / "decal_tachyon_pierce_glancing_roughness.png"
    save_and_mirror(out, diff_p)
    save_normal_and_roughness(out, norm_p, rou_p, strength=3.0)
    for p in (norm_p, rou_p):
        shutil.copy2(p, YEST_TEX_DIR / p.name)
        shutil.copy2(p, MODEL_DIR / p.name)
    print(f"[TEX] Saved glancing pierce: {diff_p.name}")
    return out


# ---------------------------------------------------------------------------
# 2. Non-Lethal Heavy Tachyon Lance Pierce Decal (1024x1024)
# ---------------------------------------------------------------------------

def generate_heavy_pierce():
    size = 1024
    cx, cy = 512, 512
    rng = random.Random(402)

    base = radial_glow_rgba(
        size,
        cx,
        cy,
        [
            (0.0, (255, 250, 235, 255)),
            (28.0, (255, 195, 95, 245)),
            (68.0, (215, 70, 245, 195)),
            (155.0, (145, 55, 245, 110)),
            (270.0, (25, 210, 255, 45)),
            (430.0, (0, 0, 0, 0)),
        ],
    )

    glow_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    core_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    dg = ImageDraw.Draw(glow_layer)
    dc = ImageDraw.Draw(core_layer)

    # Diagonal superluminal Cherenkov lance graze vector
    ang = math.radians(34.0)
    for r_len, w, col_g, col_c in [
        (330, 26, (205, 65, 255, 145), (255, 242, 255, 235)),
        (230, 14, (0, 238, 255, 165), (255, 255, 255, 255)),
    ]:
        p0 = (cx - math.cos(ang) * r_len, cy - math.sin(ang) * r_len)
        p1 = (cx + math.cos(ang) * r_len, cy + math.sin(ang) * r_len)
        dg.line([p0, p1], fill=col_g, width=w)
        dc.line([p0, p1], fill=col_c, width=max(3, w // 5))

    # Fractured amber-gold & cyan shield overload hexes around puncture
    draw_hex_ring(dg, cx, cy, 175, (255, 200, 70, 145), width=10, start_deg=0, end_deg=360, rot_deg=12)
    draw_hex_ring(dc, cx, cy, 175, (255, 235, 145, 235), width=3, start_deg=0, end_deg=360, rot_deg=12)
    draw_hex_ring(dg, cx, cy, 265, (0, 240, 255, 125), width=8, start_deg=35, end_deg=295, rot_deg=42)
    draw_hex_ring(dc, cx, cy, 265, (195, 252, 255, 225), width=3, start_deg=35, end_deg=295, rot_deg=42)

    # 24 sharp angular stress cracks (contained within r<=420)
    for i in range(24):
        c_ang = (2.0 * math.pi * i / 24.0) + rng.uniform(-0.12, 0.12)
        c_len = rng.uniform(110.0, 290.0)
        sx = cx + math.cos(c_ang) * 20.0
        sy = cy + math.sin(c_ang) * 20.0
        draw_jagged_crack(
            dg, dc, sx, sy, c_ang, c_len, rng,
            glow_col=(185, 95, 255, 145) if i % 2 == 0 else (35, 235, 255, 145),
            core_col=(245, 252, 255, 245),
            core_w=2, glow_w=6, branch_prob=0.34, max_depth=1,
        )

    # Diamond / lance-chevron bore aperture at center
    d_pts = [
        (cx + math.cos(ang) * 52, cy + math.sin(ang) * 52),
        (cx - math.sin(ang) * 26, cy + math.cos(ang) * 26),
        (cx - math.cos(ang) * 52, cy - math.sin(ang) * 52),
        (cx + math.sin(ang) * 26, cy - math.cos(ang) * 26),
    ]
    dg.polygon(d_pts, outline=(255, 110, 245, 245), fill=(255, 175, 80, 200))
    dc.ellipse([cx - 18, cy - 18, cx + 18, cy + 18], fill=(255, 252, 245, 255))

    glow_blurred = glow_layer.filter(ImageFilter.GaussianBlur(radius=4.0))
    out = Image.alpha_composite(base, glow_blurred)
    out = Image.alpha_composite(out, core_layer)
    out = apply_radial_edge_fade(out, 0.72, 0.94)

    diff_p = TEX_DIR / "decal_tachyon_pierce_heavy_diffuse.png"
    norm_p = TEX_DIR / "decal_tachyon_pierce_heavy_normal.png"
    rou_p = TEX_DIR / "decal_tachyon_pierce_heavy_roughness.png"
    save_and_mirror(out, diff_p)
    save_normal_and_roughness(out, norm_p, rou_p, strength=3.4)
    for p in (norm_p, rou_p):
        shutil.copy2(p, YEST_TEX_DIR / p.name)
        shutil.copy2(p, MODEL_DIR / p.name)
    print(f"[TEX] Saved heavy pierce: {diff_p.name}")
    return out


# ---------------------------------------------------------------------------
# 3. Core Tachyon Lance Breach Decal (2048x2048) -> replaces Core Spider Web
# ---------------------------------------------------------------------------

def generate_core_breach():
    size = 2048
    cx, cy = 1024, 1024
    rng = random.Random(503)

    base = radial_glow_rgba(
        size,
        cx,
        cy,
        [
            (0.0, (255, 252, 255, 255)),
            (55.0, (245, 150, 255, 250)),
            (130.0, (185, 55, 245, 210)),
            (280.0, (95, 55, 235, 130)),
            (520.0, (0, 220, 255, 55)),
            (860.0, (0, 0, 0, 0)),
        ],
    )

    glow_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    core_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    dg = ImageDraw.Draw(glow_layer)
    dc = ImageDraw.Draw(core_layer)

    # Concentric relativistic Cherenkov shockwave rings + breaking hex cells
    for rad, width_g, width_c, g_col, c_col in [
        (190, 18, 5, (235, 95, 255, 195), (255, 240, 255, 250)),
        (340, 14, 4, (0, 242, 255, 175), (205, 254, 255, 245)),
        (510, 12, 3, (255, 200, 65, 150), (255, 234, 145, 230)),
        (690, 10, 2, (165, 85, 255, 115), (225, 245, 255, 200)),
    ]:
        dg.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline=g_col, width=width_g)
        dc.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline=c_col, width=width_c)

    # Breaking hexagonal energy lattice rings
    draw_hex_ring(dg, cx, cy, 275, (0, 245, 255, 150), width=12, rot_deg=15)
    draw_hex_ring(dc, cx, cy, 275, (220, 255, 255, 240), width=4, rot_deg=15)
    draw_hex_ring(dg, cx, cy, 455, (255, 205, 80, 145), width=10, start_deg=15, end_deg=330, rot_deg=45)
    draw_hex_ring(dc, cx, cy, 455, (255, 235, 160, 230), width=3, start_deg=15, end_deg=330, rot_deg=45)

    # High-energy crystalline canopy shear rays (NO sagging silk threads)
    num_rays = 36
    ray_tips = []
    for i in range(num_rays):
        ang = (2.0 * math.pi * i / num_rays) + rng.uniform(-0.07, 0.07)
        r_len = rng.uniform(360.0, 860.0) if i % 2 == 0 else rng.uniform(220.0, 560.0)
        sx = cx + math.cos(ang) * 28.0
        sy = cy + math.sin(ang) * 28.0
        draw_jagged_crack(
            dg, dc, sx, sy, ang, r_len, rng,
            glow_col=(0, 235, 255, 150) if i % 3 != 0 else (200, 85, 255, 155),
            core_col=(245, 252, 255, 245),
            core_w=3 if i % 3 == 0 else 2,
            glow_w=8 if i % 3 == 0 else 5,
            branch_prob=0.42, max_depth=2,
        )
        if i % 3 == 0:
            ray_tips.append((cx + math.cos(ang) * rng.uniform(240, 520), cy + math.sin(ang) * rng.uniform(240, 520)))

    # Electric violet & cyan tachyon arcs crackling between fracture facets
    for idx in range(len(ray_tips)):
        p_a = ray_tips[idx]
        p_b = ray_tips[(idx + 1) % len(ray_tips)]
        draw_lightning_arc(
            dg, dc, p_a, p_b, rng, jitter=22.0,
            glow_col=(185, 70, 255, 165) if idx % 2 == 0 else (0, 240, 255, 165),
            core_col=(250, 245, 255, 245), core_w=2, glow_w=7,
        )

    # Intense lance puncture vortex at core
    dg.ellipse([cx - 64, cy - 64, cx + 64, cy + 64], outline=(255, 140, 255, 255), width=14)
    dc.ellipse([cx - 32, cy - 32, cx + 32, cy + 32], fill=(255, 252, 255, 255))

    glow_blurred = glow_layer.filter(ImageFilter.GaussianBlur(radius=5.0))
    out = Image.alpha_composite(base, glow_blurred)
    out = Image.alpha_composite(out, core_layer)
    out = apply_radial_edge_fade(out, 0.74, 0.96)

    diff_p = TEX_DIR / "decal_tachyon_core_breach_diffuse.png"
    norm_p = TEX_DIR / "decal_tachyon_core_breach_normal.png"
    rou_p = TEX_DIR / "decal_tachyon_core_breach_roughness.png"
    save_and_mirror(out, diff_p)
    save_normal_and_roughness(out, norm_p, rou_p, strength=3.6)
    for p in (norm_p, rou_p):
        shutil.copy2(p, YEST_TEX_DIR / p.name)
        shutil.copy2(p, MODEL_DIR / p.name)
    print(f"[TEX] Saved core breach: {diff_p.name}")
    return out


# ---------------------------------------------------------------------------
# 4. Full-Screen Tachyon Lance Shatter Decal (2048x2048) -> replaces Full-Screen Spider Web
# ---------------------------------------------------------------------------

def generate_fullscreen_shatter():
    size = 2048
    rng = random.Random(604)

    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    core_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    dg = ImageDraw.Draw(glow_layer)
    dc = ImageDraw.Draw(core_layer)

    # 3 superluminal Tachyon Lance penetration epicenters across the 16:9 visor
    hubs = [
        {"cx": 780, "cy": 920, "rays": 18, "max_r": 1020, "hex_r": 240},
        {"cx": 1440, "cy": 1280, "rays": 14, "max_r": 760, "hex_r": 185},
        {"cx": 460, "cy": 500, "rays": 11, "max_r": 580, "hex_r": 145},
    ]

    for hub in hubs:
        h_glow = radial_glow_rgba(
            size,
            hub["cx"],
            hub["cy"],
            [
                (0.0, (255, 250, 255, 255)),
                (40.0, (235, 105, 255, 220)),
                (115.0, (170, 50, 245, 135)),
                (275.0, (0, 225, 255, 50)),
                (520.0, (0, 0, 0, 0)),
            ],
        )
        img = Image.alpha_composite(img, h_glow)

    # Blazing diagonal superluminal Tachyon Lance grazing rift connecting the hubs across the screen
    rift_pts = [(260, 290), (460, 500), (780, 920), (1120, 1105), (1440, 1280), (1820, 1520)]
    dg.line(rift_pts, fill=(205, 55, 255, 200), width=34, joint="curve")
    dg.line(rift_pts, fill=(0, 242, 255, 210), width=16, joint="curve")
    dc.line(rift_pts, fill=(255, 245, 255, 255), width=6, joint="curve")

    # Clean, bold angular tempered-glass crystalline shatter polygons & radial stress faults
    for hub in hubs:
        cx, cy = hub["cx"], hub["cy"]
        num_rays = hub["rays"]
        max_r = hub["max_r"]

        # Crystalline radial faults
        ray_angles = sorted((2.0 * math.pi * i / num_rays) + rng.uniform(-0.08, 0.08) for i in range(num_rays))
        ring_radii = [125, 255, 420, 640, 880]
        ring_pts_map = {r: [] for r in ring_radii}

        for idx, ang in enumerate(ray_angles):
            r_len = max_r * rng.uniform(0.60, 1.12)
            draw_jagged_crack(
                dg, dc, cx + math.cos(ang) * 20, cy + math.sin(ang) * 20, ang, r_len, rng,
                glow_col=(0, 232, 255, 155) if idx % 2 == 0 else (195, 75, 255, 155),
                core_col=(242, 252, 255, 245),
                core_w=3 if idx % 2 == 0 else 2,
                glow_w=7 if idx % 2 == 0 else 5,
                branch_prob=0.20, max_depth=1,
            )
            for rr in ring_radii:
                if rr <= r_len * 0.92:
                    jitter_r = rr * rng.uniform(0.90, 1.10)
                    ring_pts_map[rr].append((idx, cx + math.cos(ang) * jitter_r, cy + math.sin(ang) * jitter_r))

        # Straight polygonal shatter bridges between adjacent rays (clean open glass facets)
        for rr in ring_radii:
            pts = ring_pts_map[rr]
            for k in range(len(pts)):
                idx_a, x_a, y_a = pts[k]
                idx_b, x_b, y_b = pts[(k + 1) % len(pts)]
                if (idx_b - idx_a) % num_rays > 2:
                    continue
                if rng.random() < 0.26:
                    continue
                if rng.random() < 0.30:
                    mx = 0.5 * (x_a + x_b) + rng.uniform(-12, 12)
                    my = 0.5 * (y_a + y_b) + rng.uniform(-12, 12)
                    poly_line = [(x_a, y_a), (mx, my), (x_b, y_b)]
                else:
                    poly_line = [(x_a, y_a), (x_b, y_b)]

                dg.line(poly_line, fill=(0, 238, 255, 130), width=5)
                dc.line(poly_line, fill=(235, 248, 255, 225), width=2)

        # Fractured amber-gold & cyan shield-matrix hex arcs around each hub
        draw_hex_ring(dg, cx, cy, hub["hex_r"], (255, 205, 75, 150), width=10, start_deg=10, end_deg=320, rot_deg=22)
        draw_hex_ring(dc, cx, cy, hub["hex_r"], (255, 235, 160, 235), width=3, start_deg=10, end_deg=320, rot_deg=22)
        draw_hex_ring(dg, cx, cy, hub["hex_r"] * 1.45, (0, 240, 255, 125), width=8, start_deg=80, end_deg=345, rot_deg=52)
        draw_hex_ring(dc, cx, cy, hub["hex_r"] * 1.45, (205, 253, 255, 225), width=2, start_deg=80, end_deg=345, rot_deg=52)

        # Bright central breach ring & core
        dg.ellipse([cx - 42, cy - 42, cx + 42, cy + 42], outline=(245, 120, 255, 250), width=10)
        dc.ellipse([cx - 20, cy - 20, cx + 20, cy + 20], fill=(255, 252, 255, 255))

    # High-energy tachyon lightning discharges jumping along the diagonal rift
    for a, b in zip(rift_pts[:-1], rift_pts[1:]):
        draw_lightning_arc(dg, dc, a, b, rng, jitter=38.0, glow_col=(210, 75, 255, 195), core_col=(255, 240, 255, 255), core_w=3, glow_w=10)
        draw_lightning_arc(dg, dc, a, b, rng, jitter=55.0, glow_col=(0, 245, 255, 165), core_col=(215, 255, 255, 235), core_w=2, glow_w=7)

    # Crystalline shard specular highlights scattered along crack intersections
    for _ in range(280):
        px = rng.uniform(90, size - 90)
        py = rng.uniform(90, size - 90)
        if rng.random() < 0.6:
            # Diamond shard glint
            r_s = rng.uniform(3.0, 7.0)
            col = (0, 245, 255, 235) if rng.random() < 0.55 else (245, 155, 255, 235)
            dc.polygon([(px, py - r_s), (px + r_s * 0.7, py), (px, py + r_s), (px - r_s * 0.7, py)], fill=col)

    glow_blurred = glow_layer.filter(ImageFilter.GaussianBlur(radius=4.5))
    out = Image.alpha_composite(img, glow_blurred)
    out = Image.alpha_composite(out, core_layer)

    diff_p = TEX_DIR / "decal_tachyon_screen_shatter_diffuse.png"
    norm_p = TEX_DIR / "decal_tachyon_screen_shatter_normal.png"
    rou_p = TEX_DIR / "decal_tachyon_screen_shatter_roughness.png"
    save_and_mirror(out, diff_p)
    save_normal_and_roughness(out, norm_p, rou_p, strength=3.4)
    for p in (norm_p, rou_p):
        shutil.copy2(p, YEST_TEX_DIR / p.name)
        shutil.copy2(p, MODEL_DIR / p.name)
    print(f"[TEX] Saved full-screen shatter: {diff_p.name}")
    return out


def create_thumbnail(glancing, heavy, core_breach, fullscreen_shatter):
    """Create 512x512 composite preview against #000000 black background."""
    thumb = Image.new("RGBA", (512, 512), (0, 0, 0, 255))
    draw = ImageDraw.Draw(thumb)
    # Subtle outer cyan HUD frame border
    draw.rectangle([2, 2, 509, 509], outline=(0, 240, 255, 180), width=4)

    fs_scaled = fullscreen_shatter.resize((496, 496), Image.Resampling.LANCZOS)
    thumb.paste(fs_scaled, (8, 8), fs_scaled)

    core_scaled = core_breach.resize((190, 190), Image.Resampling.LANCZOS)
    thumb.paste(core_scaled, (150, 155), core_scaled)

    g_scaled = glancing.resize((115, 115), Image.Resampling.LANCZOS)
    thumb.paste(g_scaled, (345, 70), g_scaled)

    h_scaled = heavy.resize((135, 135), Image.Resampling.LANCZOS)
    thumb.paste(h_scaled, (55, 315), h_scaled)

    th_path = TEX_DIR / "thumbnail.png"
    save_and_mirror(thumb, th_path)
    print(f"[TEX] Saved thumbnail: {th_path}")


def main():
    copy_base_frame_textures()
    glancing = generate_glancing_pierce()
    heavy = generate_heavy_pierce()
    core_breach = generate_core_breach()
    fullscreen_shatter = generate_fullscreen_shatter()
    create_thumbnail(glancing, heavy, core_breach, fullscreen_shatter)
    print("\n--- ALL TACHYON LANCE SCREEN DECAL TEXTURES GENERATED SUCCESSFULLY ---")


if __name__ == "__main__":
    main()
