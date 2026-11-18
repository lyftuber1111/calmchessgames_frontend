import os
import sys
import math
import random
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

FRONTEND_DIR = Path(r"C:\Users\lyftu\gemini_3\updated_html_js_0\calmchessgames_frontend")
MODEL_NAME = "screen_decals_overlay_3"
MODEL_DIR = FRONTEND_DIR / "meshy_test_0" / "models" / MODEL_NAME
TEX_DIR = MODEL_DIR / f"{MODEL_NAME}_textures"
YEST_TEX_DIR = FRONTEND_DIR / "meshy_yest_0" / "models" / MODEL_NAME / f"{MODEL_NAME}_textures"
ALIAS_DIR = FRONTEND_DIR / "meshy_test_0" / "models" / f"screen_decals__{MODEL_NAME[-9:]}"
ALIAS_TEX_DIR = ALIAS_DIR / f"{MODEL_NAME}_textures"

for d in (MODEL_DIR, TEX_DIR, YEST_TEX_DIR, ALIAS_DIR, ALIAS_TEX_DIR):
    d.mkdir(parents=True, exist_ok=True)

# -----------------------------------------------------------------------------
# 1. Overlay Base Frame & Glass Textures (2048 x 2048)
# -----------------------------------------------------------------------------
print("Generating Overlay Frame & Glass Textures for screen_decals_overlay_3...")
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
# 2. Blackened Laser Burn Decal (WITHOUT Radiating Lines) (1024 x 1024)
# -----------------------------------------------------------------------------
# Natural, smooth, smoky organic burn mark:
# - Concentric smoky soot rings fading outwards
# - Organic soot puffs / cloud clusters (NO radiating spoke lines)
# - Rich charred pitch-black carbon deposit
# - Molten orange-amber glow breach core
print("Generating Blackened Laser Burn Decal Textures (NO radiating lines)...")
DECAL_SIZE = (1024, 1024)
CX, CY = 512, 512

img_burn_diff = Image.new("RGBA", DECAL_SIZE, (0, 0, 0, 0))
draw_burn = ImageDraw.Draw(img_burn_diff)

random.seed(101)

# Outer faint smoky soot halo (smooth radial falloff)
for radius in range(450, 80, -6):
    alpha = int(210 * (1.0 - (radius / 450.0)**1.25))
    bbox = [CX - radius, CY - radius, CX + radius, CY + radius]
    draw_burn.ellipse(bbox, fill=(12, 12, 14, min(255, int(alpha * 0.42))))

# Organic soot cloud blotches (circular puffs to break perfect geometry without radiating lines)
for _ in range(160):
    angle = random.uniform(0, 2 * math.pi)
    dist = random.uniform(30, 360)
    px = CX + math.cos(angle) * dist
    py = CY + math.sin(angle) * dist
    pr = random.uniform(35, 95)
    p_alpha = int(140 * (1.0 - (dist / 380.0)**1.5))
    draw_burn.ellipse([px - pr, py - pr, px + pr, py + pr], fill=(8, 8, 10, max(0, p_alpha)))

# Mid charred scorch ring (dense carbon black)
for radius in range(250, 40, -5):
    alpha = int(255 * (1.0 - (radius / 250.0)**1.6))
    draw_burn.ellipse([CX - radius, CY - radius, CX + radius, CY + radius], fill=(5, 5, 6, alpha))

# Core charred breach zone
for radius in range(110, 20, -4):
    ratio = radius / 110.0
    r = int(255 * (1.0 - ratio) + 60 * ratio)
    g = int(110 * (1.0 - ratio) + 20 * ratio)
    b = int(14 * (1.0 - ratio) + 4 * ratio)
    alpha = min(255, int(250 * (1.0 - ratio) + 140))
    draw_burn.ellipse([CX - radius, CY - radius, CX + radius, CY + radius], fill=(r, g, b, alpha))

# Molten core glow breach
draw_burn.ellipse([CX - 22, CY - 22, CX + 22, CY + 22], fill=(255, 190, 80, 255))
draw_burn.ellipse([CX - 10, CY - 10, CX + 10, CY + 10], fill=(255, 250, 220, 255))

# Soft Gaussian blur for a natural, smoky, smooth burn mark
img_burn_diff = img_burn_diff.filter(ImageFilter.GaussianBlur(radius=4.0))

burn_diff_path = TEX_DIR / "decal_laser_burn_diffuse.png"
img_burn_diff.save(burn_diff_path, "PNG")

# Laser Burn Normal Map (smooth indented dish crater)
img_burn_nor = Image.new("RGB", DECAL_SIZE, (128, 128, 255))
draw_bnor = ImageDraw.Draw(img_burn_nor)
for r in range(180, 30, -5):
    draw_bnor.ellipse([CX - r, CY - r, CX + r, CY + r], outline=(145, 120, 240), width=5)
img_burn_nor = img_burn_nor.filter(ImageFilter.GaussianBlur(radius=5.0))
burn_nor_path = TEX_DIR / "decal_laser_burn_normal.png"
img_burn_nor.save(burn_nor_path, "PNG")

# Laser Burn Roughness Map
img_burn_rou = Image.new("L", DECAL_SIZE, 245)
draw_brou = ImageDraw.Draw(img_burn_rou)
draw_brou.ellipse([CX - 90, CY - 90, CX + 90, CY + 90], fill=60)
draw_brou.ellipse([CX - 30, CY - 30, CX + 30, CY + 30], fill=25)
img_burn_rou = img_burn_rou.filter(ImageFilter.GaussianBlur(radius=6.0))
burn_rou_path = TEX_DIR / "decal_laser_burn_roughness.png"
img_burn_rou.save(burn_rou_path, "PNG")

# -----------------------------------------------------------------------------
# 3. Blackened Missile Strike Decal (WITHOUT Radiating Lines) (1024 x 1024)
# -----------------------------------------------------------------------------
# Heavy blast scorch & pulverized impact crater:
# - Volumetric cloudy soot fallout (overlapping clusters of organic circular puffs, NO lines/spokes)
# - Dense jet-black impact crater pit
# - Ember core and burnt carbon fringe
print("Generating Blackened Missile Strike Decal Textures (NO radiating lines)...")
img_strike_diff = Image.new("RGBA", DECAL_SIZE, (0, 0, 0, 0))
draw_strike = ImageDraw.Draw(img_strike_diff)

random.seed(202)

# Outer blast smoke cloud (concentric soft soot falloff)
for radius in range(470, 90, -8):
    alpha = int(195 * (1.0 - (radius / 470.0)**1.3))
    draw_strike.ellipse([CX - radius, CY - radius, CX + radius, CY + radius], fill=(10, 10, 12, min(240, int(alpha * 0.45))))

# Cloud clusters of pulverized smoke and soot (pure organic puffs, strictly NO radiating lines)
for _ in range(240):
    angle = random.uniform(0, 2 * math.pi)
    dist = random.uniform(20, 420)
    px = CX + math.cos(angle) * dist
    py = CY + math.sin(angle) * dist
    pr = random.uniform(25, 80)
    p_alpha = int(160 * (1.0 - (dist / 430.0)**1.4))
    draw_strike.ellipse([px - pr, py - pr, px + pr, py + pr], fill=(6, 6, 8, max(0, p_alpha)))

# Main dense blackened blast crater (heavy pitch black)
for radius in range(290, 30, -5):
    alpha = int(255 * (1.0 - (radius / 290.0)**1.8))
    draw_strike.ellipse([CX - radius, CY - radius, CX + radius, CY + radius], fill=(3, 3, 4, alpha))

# Immediate impact epicenter crater
draw_strike.ellipse([CX - 120, CY - 120, CX + 120, CY + 120], fill=(2, 2, 2, 255))

# Deep molten ember core
for radius in range(45, 8, -3):
    ratio = radius / 45.0
    r = int(240 * (1.0 - ratio) + 120 * ratio)
    g = int(80 * (1.0 - ratio) + 20 * ratio)
    b = int(10 * (1.0 - ratio) + 4 * ratio)
    alpha = min(255, int(245 * (1.0 - ratio) + 100))
    draw_strike.ellipse([CX - radius, CY - radius, CX + radius, CY + radius], fill=(r, g, b, alpha))

draw_strike.ellipse([CX - 14, CY - 14, CX + 14, CY + 14], fill=(255, 170, 40, 255))
draw_strike.ellipse([CX - 6, CY - 6, CX + 6, CY + 6], fill=(255, 240, 200, 255))

# Apply Gaussian blur for smooth organic soot dispersal (NO radiating lines)
img_strike_diff = img_strike_diff.filter(ImageFilter.GaussianBlur(radius=3.8))

strike_diff_path = TEX_DIR / "decal_missile_strike_diffuse.png"
img_strike_diff.save(strike_diff_path, "PNG")

# Missile Strike Normal Map
img_strike_nor = Image.new("RGB", DECAL_SIZE, (128, 128, 255))
draw_snor = ImageDraw.Draw(img_strike_nor)
for r in range(220, 30, -6):
    draw_snor.ellipse([CX - r, CY - r, CX + r, CY + r], outline=(155, 115, 235), width=5)
img_strike_nor = img_strike_nor.filter(ImageFilter.GaussianBlur(radius=4.5))
strike_nor_path = TEX_DIR / "decal_missile_strike_normal.png"
img_strike_nor.save(strike_nor_path, "PNG")

# Missile Strike Roughness Map
img_strike_rou = Image.new("L", DECAL_SIZE, 248)
draw_srou = ImageDraw.Draw(img_strike_rou)
draw_srou.ellipse([CX - 130, CY - 130, CX + 130, CY + 130], fill=180)
draw_srou.ellipse([CX - 35, CY - 35, CX + 35, CY + 35], fill=40)
img_strike_rou = img_strike_rou.filter(ImageFilter.GaussianBlur(radius=5.5))
strike_rou_path = TEX_DIR / "decal_missile_strike_roughness.png"
img_strike_rou.save(strike_rou_path, "PNG")

# -----------------------------------------------------------------------------
# 4. Generate Thumbnail (512 x 512 preview composite)
# -----------------------------------------------------------------------------
thumb = Image.new("RGBA", (512, 512), (10, 12, 16, 255))
scaled_frame = img_base_color.resize((512, 512), Image.Resampling.LANCZOS)
thumb.paste(scaled_frame, (0, 0), scaled_frame)
mini_burn = img_burn_diff.resize((140, 140), Image.Resampling.LANCZOS)
thumb.paste(mini_burn, (120, 160), mini_burn)
mini_strike = img_strike_diff.resize((190, 190), Image.Resampling.LANCZOS)
thumb.paste(mini_strike, (250, 220), mini_strike)
thumb_path = TEX_DIR / "thumbnail.png"
thumb.save(thumb_path, "PNG")

# Mirror all textures to MODEL_DIR, YEST_TEX_DIR, and ALIAS directories
for f in TEX_DIR.glob("*.png"):
    shutil.copy2(f, MODEL_DIR / f.name)
    shutil.copy2(f, YEST_TEX_DIR / f.name)
    shutil.copy2(f, ALIAS_TEX_DIR / f.name)
    shutil.copy2(f, ALIAS_DIR / f.name)

print("All textures for screen_decals_overlay_3 generated and mirrored successfully!")
