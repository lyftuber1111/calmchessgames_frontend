import os
import sys
import math
import random
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

FRONTEND_DIR = Path(r"C:\Users\lyftu\gemini_3\updated_html_js_0\calmchessgames_frontend")
MODEL_DIR = FRONTEND_DIR / "meshy_test_0" / "models" / "screen_decals__overlay_2"
TEX_DIR = MODEL_DIR / "screen_decals_overlay_2_textures"
YEST_TEX_DIR = FRONTEND_DIR / "meshy_yest_0" / "models" / "screen_decals__overlay_2" / "screen_decals_overlay_2_textures"

TEX_DIR.mkdir(parents=True, exist_ok=True)
YEST_TEX_DIR.mkdir(parents=True, exist_ok=True)

# -----------------------------------------------------------------------------
# 1. Overlay Base Frame & Glass Textures (2048 x 2048)
# -----------------------------------------------------------------------------
print("Generating Main Overlay Frame & Glass Textures...")
TEX_SIZE = (2048, 2048)

img_base_color = Image.new("RGBA", TEX_SIZE, (18, 22, 28, 255))
draw_bc = ImageDraw.Draw(img_base_color)

# Outer frame borders
draw_bc.rectangle([0, 0, 2047, 2047], outline=(48, 56, 70, 255), width=36)
draw_bc.rectangle([48, 48, 1999, 1999], outline=(28, 34, 44, 255), width=24)

# Solid front/back panel sections
draw_bc.rectangle([80, 80, 1967, 260], fill=(22, 26, 34, 255))
draw_bc.rectangle([80, 1787, 1967, 1967], fill=(22, 26, 34, 255))
draw_bc.rectangle([80, 260, 240, 1787], fill=(20, 24, 32, 255))
draw_bc.rectangle([1807, 260, 1967, 1787], fill=(20, 24, 32, 255))

# Central translucent clear glass area (soft ice-blue tint)
draw_bc.rectangle([250, 270, 1797, 1777], fill=(235, 245, 255, 45))

# Emissive cyan telemetry brackets & chevrons
cyan = (0, 240, 255, 255)
# Top HUD line
draw_bc.line([(450, 170), (1597, 170)], fill=cyan, width=4)
draw_bc.rectangle([940, 135, 1107, 195], outline=cyan, width=3)
draw_bc.line([(980, 165), (1067, 165)], fill=cyan, width=2)
# Bottom HUD line
draw_bc.line([(550, 1870), (1497, 1870)], fill=cyan, width=4)

# Corner targeting chevrons
for corner in [(280, 300, 1, 1), (1767, 300, -1, 1), (280, 1747, 1, -1), (1767, 1747, -1, -1)]:
    cx, cy, sx, sy = corner
    draw_bc.line([(cx, cy), (cx + sx * 100, cy)], fill=cyan, width=5)
    draw_bc.line([(cx, cy), (cx, cy + sy * 100)], fill=cyan, width=5)

bc_path = TEX_DIR / "texture_0_base_color.png"
img_base_color.save(bc_path, "PNG")

# Metallic Map
img_metallic = Image.new("L", TEX_SIZE, 215)
draw_met = ImageDraw.Draw(img_metallic)
draw_met.rectangle([250, 270, 1797, 1777], fill=10) # Glass non-metallic
met_path = TEX_DIR / "texture_0_metallic.png"
img_metallic.save(met_path, "PNG")

# Roughness Map
img_roughness = Image.new("L", TEX_SIZE, 80)
draw_rou = ImageDraw.Draw(img_roughness)
draw_rou.rectangle([80, 80, 1967, 260], fill=60)
draw_rou.rectangle([80, 1787, 1967, 1967], fill=60)
draw_rou.rectangle([80, 260, 240, 1787], fill=60)
draw_rou.rectangle([1807, 260, 1967, 1787], fill=60)
draw_rou.rectangle([250, 270, 1797, 1777], fill=12) # Glass polished
rou_path = TEX_DIR / "texture_0_roughness.png"
img_roughness.save(rou_path, "PNG")

# Normal Map
img_normal = Image.new("RGB", TEX_SIZE, (128, 128, 255))
draw_nor = ImageDraw.Draw(img_normal)
draw_nor.rectangle([76, 76, 1971, 1971], outline=(140, 140, 240), width=6)
nor_path = TEX_DIR / "texture_0_normal.png"
img_normal.save(nor_path, "PNG")

# -----------------------------------------------------------------------------
# 2. Blackened Laser Burn Decal Texture (1024 x 1024)
# -----------------------------------------------------------------------------
print("Generating Blackened Laser Burn Decal Textures...")
DECAL_SIZE = (1024, 1024)
CX, CY = 512, 512

# Diffuse + Alpha map:
# Deep blackened scorched soot halo, high-temp charred crater ring, molten glowing core
img_burn_diff = Image.new("RGBA", DECAL_SIZE, (0, 0, 0, 0))
draw_burn = ImageDraw.Draw(img_burn_diff)

# Procedural noise and radial soot layers
random.seed(42)

# Outer soot clouds (faint radial dark soot)
for radius in range(460, 60, -8):
    alpha = int(220 * (1.0 - (radius / 460.0)**1.2))
    # Add slight random irregularity to make organic soot feathering
    bbox = [CX - radius, CY - radius, CX + radius, CY + radius]
    draw_burn.ellipse(bbox, fill=(10, 10, 12, min(255, int(alpha * 0.45))))

# Carbonized soot fingers / burn tendrils
for angle_deg in range(0, 360, 12):
    angle = math.radians(angle_deg)
    arm_len = random.randint(180, 380)
    width = random.randint(18, 45)
    ex = CX + int(math.cos(angle) * arm_len)
    ey = CY + int(math.sin(angle) * arm_len)
    draw_burn.line([(CX, CY), (ex, ey)], fill=(8, 8, 10, 140), width=width)

# Mid charred scorch ring (Heavy jet black carbon)
for radius in range(260, 30, -5):
    alpha = int(255 * (1.0 - (radius / 260.0)**1.8))
    # Intense charred pitch black
    shade = random.randint(4, 12)
    draw_burn.ellipse([CX - radius, CY - radius, CX + radius, CY + radius], fill=(shade, shade, shade + 2, alpha))

# Inner thermal scorch ring (molten orange-amber glow with burnt rim)
for radius in range(80, 10, -4):
    ratio = radius / 80.0
    r = int(255 * (1.0 - ratio) + 80 * ratio)
    g = int(95 * (1.0 - ratio) + 25 * ratio)
    b = int(12 * (1.0 - ratio) + 5 * ratio)
    alpha = min(255, int(240 * (1.0 - ratio) + 120))
    draw_burn.ellipse([CX - radius, CY - radius, CX + radius, CY + radius], fill=(r, g, b, alpha))

# Core breach pinpoint
draw_burn.ellipse([CX - 16, CY - 16, CX + 16, CY + 16], fill=(255, 210, 120, 255))
draw_burn.ellipse([CX - 7, CY - 7, CX + 7, CY + 7], fill=(255, 255, 240, 255))

# Apply subtle blur to soften edges naturally
img_burn_diff = img_burn_diff.filter(ImageFilter.GaussianBlur(radius=3.5))

burn_diff_path = TEX_DIR / "decal_laser_burn_diffuse.png"
img_burn_diff.save(burn_diff_path, "PNG")

# Laser Burn Normal Map
img_burn_nor = Image.new("RGB", DECAL_SIZE, (128, 128, 255))
draw_bnor = ImageDraw.Draw(img_burn_nor)
# Indented crater rim
for r in range(120, 40, -4):
    nx = int(128 + 35 * math.cos(r))
    ny = int(128 + 35 * math.sin(r))
    draw_bnor.ellipse([CX - r, CY - r, CX + r, CY + r], outline=(nx, ny, 230), width=4)
img_burn_nor = img_burn_nor.filter(ImageFilter.GaussianBlur(radius=4.0))
burn_nor_path = TEX_DIR / "decal_laser_burn_normal.png"
img_burn_nor.save(burn_nor_path, "PNG")

# Laser Burn Roughness Map (Charred soot is ultra rough ~0.95, molten core is glassy ~0.15)
img_burn_rou = Image.new("L", DECAL_SIZE, 240)
draw_brou = ImageDraw.Draw(img_burn_rou)
draw_brou.ellipse([CX - 70, CY - 70, CX + 70, CY + 70], fill=40)
draw_brou.ellipse([CX - 25, CY - 25, CX + 25, CY + 25], fill=20)
img_burn_rou = img_burn_rou.filter(ImageFilter.GaussianBlur(radius=5.0))
burn_rou_path = TEX_DIR / "decal_laser_burn_roughness.png"
img_burn_rou.save(burn_rou_path, "PNG")

# -----------------------------------------------------------------------------
# 3. Blackened Missile Strike Decal Texture (1024 x 1024)
# -----------------------------------------------------------------------------
print("Generating Blackened Missile Strike Decal Textures...")
img_strike_diff = Image.new("RGBA", DECAL_SIZE, (0, 0, 0, 0))
draw_strike = ImageDraw.Draw(img_strike_diff)

# Explosive blast starburst soot spikes
for angle_deg in range(0, 360, 6):
    angle = math.radians(angle_deg)
    burst_len = random.randint(140, 490)
    w = random.randint(6, 32)
    ex = CX + int(math.cos(angle) * burst_len)
    ey = CY + int(math.sin(angle) * burst_len)
    s_alpha = random.randint(120, 220)
    draw_strike.line([(CX, CY), (ex, ey)], fill=(6, 6, 8, s_alpha), width=w)

# Outer blast smoke halo
for radius in range(480, 100, -10):
    alpha = int(190 * (1.0 - (radius / 480.0)**1.3))
    draw_strike.ellipse([CX - radius, CY - radius, CX + radius, CY + radius], fill=(12, 12, 14, min(240, int(alpha * 0.4))))

# Main heavy black impact crater & fractured glass spall spokes
for radius in range(320, 40, -6):
    alpha = int(255 * (1.0 - (radius / 320.0)**2.2))
    draw_strike.ellipse([CX - radius, CY - radius, CX + radius, CY + radius], fill=(4, 4, 6, alpha))

# Radial structural impact fracture spokes (sharp glass cracks cutting through charred soot)
for angle_deg in range(0, 360, 18):
    angle = math.radians(angle_deg + random.uniform(-4, 4))
    crack_len = random.randint(220, 470)
    points = [(CX, CY)]
    curr_x, curr_y = CX, CY
    step = 30
    dist = 0
    while dist < crack_len:
        dist += step
        curr_x = CX + int(math.cos(angle) * dist) + random.randint(-8, 8)
        curr_y = CY + int(math.sin(angle) * dist) + random.randint(-8, 8)
        points.append((curr_x, curr_y))
    # White/cyan micro-fractures in glass surrounded by black carbon char
    draw_strike.line(points, fill=(220, 240, 255, 230), width=3)
    # Shrapnel splatter flecks
    for _ in range(3):
        fx = curr_x + random.randint(-25, 25)
        fy = curr_y + random.randint(-25, 25)
        fr = random.randint(3, 9)
        draw_strike.ellipse([fx - fr, fy - fr, fx + fr, fy + fr], fill=(5, 5, 6, 255))

# Heavy blast center crater with blackened cavity
draw_strike.ellipse([CX - 110, CY - 110, CX + 110, CY + 110], fill=(2, 2, 3, 255))
# Ember spark center
draw_strike.ellipse([CX - 28, CY - 28, CX + 28, CY + 28], fill=(180, 50, 10, 240))
draw_strike.ellipse([CX - 12, CY - 12, CX + 12, CY + 12], fill=(255, 140, 25, 255))

img_strike_diff = img_strike_diff.filter(ImageFilter.GaussianBlur(radius=2.2))

strike_diff_path = TEX_DIR / "decal_missile_strike_diffuse.png"
img_strike_diff.save(strike_diff_path, "PNG")

# Missile Strike Normal Map (Heavy crater depression and shatter lines)
img_strike_nor = Image.new("RGB", DECAL_SIZE, (128, 128, 255))
draw_snor = ImageDraw.Draw(img_strike_nor)
for r in range(160, 40, -8):
    draw_snor.ellipse([CX - r, CY - r, CX + r, CY + r], outline=(150, 105, 220), width=6)
img_strike_nor = img_strike_nor.filter(ImageFilter.GaussianBlur(radius=3.5))
strike_nor_path = TEX_DIR / "decal_missile_strike_normal.png"
img_strike_nor.save(strike_nor_path, "PNG")

# Missile Strike Roughness Map
img_strike_rou = Image.new("L", DECAL_SIZE, 245)
draw_srou = ImageDraw.Draw(img_strike_rou)
draw_srou.ellipse([CX - 120, CY - 120, CX + 120, CY + 120], fill=210)
draw_srou.ellipse([CX - 25, CY - 25, CX + 25, CY + 25], fill=45)
img_strike_rou = img_strike_rou.filter(ImageFilter.GaussianBlur(radius=4.0))
strike_rou_path = TEX_DIR / "decal_missile_strike_roughness.png"
img_strike_rou.save(strike_rou_path, "PNG")

# -----------------------------------------------------------------------------
# 4. Generate Thumbnail (512 x 512 preview composite)
# -----------------------------------------------------------------------------
thumb = Image.new("RGBA", (512, 512), (10, 12, 16, 255))
# Resized frame base
scaled_frame = img_base_color.resize((512, 512), Image.Resampling.LANCZOS)
thumb.paste(scaled_frame, (0, 0), scaled_frame)
# Stamp mini laser burn
mini_burn = img_burn_diff.resize((140, 140), Image.Resampling.LANCZOS)
thumb.paste(mini_burn, (120, 160), mini_burn)
# Stamp mini missile strike
mini_strike = img_strike_diff.resize((190, 190), Image.Resampling.LANCZOS)
thumb.paste(mini_strike, (250, 220), mini_strike)
thumb_path = TEX_DIR / "thumbnail.png"
thumb.save(thumb_path, "PNG")

# Also copy all textures to target model directory root and yest_0 directory
for f in TEX_DIR.glob("*.png"):
    # Copy to MODEL_DIR
    shutil.copy2(f, MODEL_DIR / f.name)
    # Copy to YEST_TEX_DIR
    shutil.copy2(f, YEST_TEX_DIR / f.name)
    # Copy to alias directory if exists
    alias_dir = FRONTEND_DIR / "meshy_test_0" / "models" / "screen_decals_overlay_2" / "screen_decals_overlay_2_textures"
    alias_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(f, alias_dir / f.name)
    shutil.copy2(f, FRONTEND_DIR / "meshy_test_0" / "models" / "screen_decals_overlay_2" / f.name)

print("All PBR textures generated and synchronized successfully!")
