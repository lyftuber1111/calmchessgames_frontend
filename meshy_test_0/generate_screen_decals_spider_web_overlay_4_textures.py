import os
import sys
import math
import random
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

FRONTEND_DIR = Path(r"C:\Users\lyftu\gemini_3\updated_html_js_0\calmchessgames_frontend")
MODEL_NAME = "screen_decals_spider_web_overlay_4"
MODEL_DIR = FRONTEND_DIR / "meshy_test_0" / "models" / MODEL_NAME
TEX_DIR = MODEL_DIR / f"{MODEL_NAME}_textures"
YEST_TEX_DIR = FRONTEND_DIR / "meshy_yest_0" / "models" / MODEL_NAME / f"{MODEL_NAME}_textures"
ALIAS_DIR = FRONTEND_DIR / "meshy_test_0" / "models" / f"screen_decals__spider_web_overlay_4"
ALIAS_TEX_DIR = ALIAS_DIR / f"{MODEL_NAME}_textures"

for d in (MODEL_DIR, TEX_DIR, YEST_TEX_DIR, ALIAS_DIR, ALIAS_TEX_DIR):
    d.mkdir(parents=True, exist_ok=True)

# -----------------------------------------------------------------------------
# 1. Copy or Inherit Base Frame & Decal Textures from overlay_3
# -----------------------------------------------------------------------------
SRC_DIR = FRONTEND_DIR / "meshy_test_0" / "models" / "screen_decals_overlay_3"
SRC_TEX_DIR = SRC_DIR / "screen_decals_overlay_3_textures"

print("Copying base overlay 3 textures to overlay 4...")
for f in SRC_TEX_DIR.glob("*.png"):
    shutil.copy2(f, TEX_DIR / f.name)
    shutil.copy2(f, YEST_TEX_DIR / f.name)
    shutil.copy2(f, ALIAS_TEX_DIR / f.name)

# -----------------------------------------------------------------------------
# 2. Generate Full Screen Broken Spider Web Decal Textures (2048 x 2048)
# -----------------------------------------------------------------------------
# The broken spider web spans the entire 16:9 overlay screen.
# Characteristics:
# - Major impact center + secondary tension hub
# - Intricate radial spokes spanning to the outer frame
# - Concentric polygonal web spirals with sagging tension catenary curves
# - Broken, severed strands with coiled dangling ends
# - High-tensile silk filaments, micro-cracks, and dew/crystalline glints
# - Alpha transparent background so the XR world is crystal clear
print("Generating Full-Screen Broken Spider Web Decal Textures (2048 x 2048)...")
TEX_W, TEX_H = 2048, 2048
img_diffuse = Image.new("RGBA", (TEX_W, TEX_H), (0, 0, 0, 0))

# We'll use layered drawing: base halo/glow, main crisp thread, and specular highlight
draw_glow = ImageDraw.Draw(img_diffuse)

random.seed(42) # Reproducible, aesthetically balanced spider web

# Define epicenters (centers of the broken spider web)
# Primary hub slightly off-center (XR aesthetic, prevents blocking crosshair completely)
hubs = [
    {"cx": 820, "cy": 940, "rays": 36, "rings": 28, "max_r": 1150, "break_prob": 0.28},
    {"cx": 1420, "cy": 1260, "rays": 28, "rings": 22, "max_r": 920, "break_prob": 0.32},
    {"cx": 420, "cy": 520, "rays": 20, "rings": 16, "max_r": 680, "break_prob": 0.35},
]

# Track spoke endpoint coordinates for catenary spiral arcs
all_spokes = [] # list of lists of (x, y) points along each ray

for hub in hubs:
    cx, cy = hub["cx"], hub["cy"]
    num_rays = hub["rays"]
    num_rings = hub["rings"]
    max_r = hub["max_r"]
    break_p = hub["break_prob"]
    
    hub_spokes = []
    
    for r_idx in range(num_rays):
        angle = (2.0 * math.pi * r_idx / num_rays) + random.uniform(-0.06, 0.06)
        # Check if this spoke snaps early (broken strand)
        is_spoke_broken = random.random() < 0.22
        spoke_max_len = max_r * random.uniform(0.35, 0.75) if is_spoke_broken else max_r * random.uniform(0.95, 1.25)
        
        spoke_pts = []
        cur_r = 15.0 # start just outside hub core
        
        while cur_r <= spoke_max_len:
            # Add subtle organic jitter/wobble to simulate silk strand physics
            wobble_ang = angle + math.sin(cur_r * 0.04) * 0.02
            px = cx + math.cos(wobble_ang) * cur_r
            py = cy + math.sin(wobble_ang) * cur_r
            spoke_pts.append((px, py, cur_r))
            cur_r += 24.0
            
        hub_spokes.append({"angle": angle, "pts": spoke_pts, "broken": is_spoke_broken})
    
    all_spokes.append({"cx": cx, "cy": cy, "spokes": hub_spokes, "rings": num_rings, "break_p": break_p})

# Draw layers on separate scratch images for clean compositing
img_layer_strands = Image.new("RGBA", (TEX_W, TEX_H), (0, 0, 0, 0))
draw_strands = ImageDraw.Draw(img_layer_strands)

img_layer_glow = Image.new("RGBA", (TEX_W, TEX_H), (0, 0, 0, 0))
draw_glow = ImageDraw.Draw(img_layer_glow)

# 1. Draw Radial Spokes
for hub_data in all_spokes:
    cx, cy = hub_data["cx"], hub_data["cy"]
    for spoke in hub_data["spokes"]:
        pts = spoke["pts"]
        if len(pts) < 2:
            continue
            
        coords = [(p[0], p[1]) for p in pts]
        
        # Soft outer silk halo
        draw_glow.line(coords, fill=(200, 230, 255, 70), width=4)
        # Sharp high-tensile white silk core
        draw_strands.line(coords, fill=(245, 250, 255, 220), width=2)
        
        # If spoke is broken, draw a curled dangling tip
        if spoke["broken"] and len(coords) > 2:
            last_x, last_y = coords[-1]
            penult_x, penult_y = coords[-2]
            dx = last_x - penult_x
            dy = last_y - penult_y
            curl_len = random.uniform(12, 28)
            curl_x = last_x + dx * 0.5 + random.uniform(-15, 15)
            curl_y = last_y + dy * 0.5 + random.uniform(10, 25)
            draw_strands.line([(last_x, last_y), (curl_x, curl_y)], fill=(255, 255, 255, 240), width=2)

# 2. Draw Concentric Spiral Rings with sagging tension catenary curves
for hub_data in all_spokes:
    cx, cy = hub_data["cx"], hub_data["cy"]
    spokes = hub_data["spokes"]
    num_spokes = len(spokes)
    num_rings = hub_data["rings"]
    break_p = hub_data["break_p"]
    
    ring_spacing = 38.0
    
    for ring_i in range(1, num_rings + 1):
        target_r = ring_i * ring_spacing * (1.0 + (ring_i / num_rings) * 0.6) # spaced wider towards perimeter
        
        # In broken webs, large patches or clusters of spirals are completely missing/torn
        is_cluster_torn = random.random() < 0.18
        
        for s_idx in range(num_spokes):
            next_s_idx = (s_idx + 1) % num_spokes
            
            # Check break probability for individual web bridge
            if is_cluster_torn or (random.random() < break_p):
                # 30% chance of a broken dangling bridge remnant
                if random.random() < 0.35:
                    sp1 = spokes[s_idx]["pts"]
                    pt1 = min(sp1, key=lambda p: abs(p[2] - target_r)) if sp1 else None
                    if pt1:
                        hang_x = pt1[0] + random.uniform(-12, 12)
                        hang_y = pt1[1] + random.uniform(10, 30)
                        draw_strands.line([(pt1[0], pt1[1]), (hang_x, hang_y)], fill=(240, 245, 255, 190), width=1)
                continue
                
            sp1 = spokes[s_idx]["pts"]
            sp2 = spokes[next_s_idx]["pts"]
            
            # Find points closest to target_r
            cand1 = [p for p in sp1 if abs(p[2] - target_r) < ring_spacing * 0.9]
            cand2 = [p for p in sp2 if abs(p[2] - target_r) < ring_spacing * 0.9]
            
            if not cand1 or not cand2:
                continue
                
            p1 = cand1[0]
            p2 = cand2[0]
            
            # Catenary midpoint sag towards the center hub (tension curve)
            mid_x = (p1[0] + p2[0]) / 2.0
            mid_y = (p1[1] + p2[1]) / 2.0
            sag_dir_x = cx - mid_x
            sag_dir_y = cy - mid_y
            sag_dist = math.hypot(sag_dir_x, sag_dir_y) + 1e-4
            sag_amount = min(14.0, (ring_spacing * 0.22) * (target_r / 600.0))
            
            sag_x = mid_x + (sag_dir_x / sag_dist) * sag_amount
            sag_y = mid_y + (sag_dir_y / sag_dist) * sag_amount
            
            bridge_pts = [(p1[0], p1[1]), (sag_x, sag_y), (p2[0], p2[1])]
            
            draw_glow.line(bridge_pts, fill=(190, 225, 255, 60), width=3)
            draw_strands.line(bridge_pts, fill=(240, 248, 255, 215), width=1)

# 3. Draw Heavy Anchor Cables (Connecting Hubs and Reaching Screen Corners)
screen_corners = [
    (120, 140), (1928, 140), (120, 1908), (1928, 1908),
    (96, 1024), (1952, 1024), (1024, 96), (1024, 1952)
]

for corner in screen_corners:
    # Pick nearest hub
    nearest_hub = min(hubs, key=lambda h: math.hypot(h["cx"] - corner[0], h["cy"] - corner[1]))
    hx, hy = nearest_hub["cx"], nearest_hub["cy"]
    
    # Subdivided line with subtle sag
    cable_pts = []
    steps = 16
    for st in range(steps + 1):
        t = st / steps
        lx = hx + (corner[0] - hx) * t
        ly = hy + (corner[1] - hy) * t
        # gravitational / tension sag
        sag = math.sin(t * math.pi) * 22.0
        cable_pts.append((lx, ly + sag))
        
    draw_glow.line(cable_pts, fill=(210, 235, 255, 95), width=5)
    draw_strands.line(cable_pts, fill=(255, 255, 255, 245), width=2)

# Inter-hub tension cables
for i in range(len(hubs)):
    for j in range(i + 1, len(hubs)):
        h1, h2 = hubs[i], hubs[j]
        c_pts = []
        steps = 14
        for st in range(steps + 1):
            t = st / steps
            lx = h1["cx"] + (h2["cx"] - h1["cx"]) * t
            ly = h1["cy"] + (h2["cy"] - h1["cy"]) * t
            sag = math.sin(t * math.pi) * 16.0
            c_pts.append((lx, ly + sag))
            
        draw_glow.line(c_pts, fill=(200, 230, 255, 80), width=4)
        draw_strands.line(c_pts, fill=(250, 252, 255, 230), width=2)

# 4. Impact Shattered Micro-Cracks & Dense Silk Core at Primary Hubs
for hub in hubs:
    cx, cy = hub["cx"], hub["cy"]
    # Dense tangled silk core
    for _ in range(40):
        ang = random.uniform(0, 2 * math.pi)
        r = random.uniform(4, 38)
        x1 = cx + math.cos(ang) * r
        y1 = cy + math.sin(ang) * r
        ang2 = random.uniform(0, 2 * math.pi)
        r2 = random.uniform(4, 38)
        x2 = cx + math.cos(ang2) * r2
        y2 = cy + math.sin(ang2) * r2
        draw_strands.line([(x1, y1), (x2, y2)], fill=(255, 255, 255, 220), width=1)
        
    # High-energy radial glass micro-fissures around epicenter
    for _ in range(24):
        ang = random.uniform(0, 2 * math.pi)
        f_len = random.uniform(30, 110)
        fx = cx + math.cos(ang) * f_len
        fy = cy + math.sin(ang) * f_len
        draw_strands.line([(cx, cy), (fx, fy)], fill=(255, 255, 255, 250), width=2)

# 5. Glistening Dew Droplets / Specular Micro-Beads along strands
img_layer_droplets = Image.new("RGBA", (TEX_W, TEX_H), (0, 0, 0, 0))
draw_drop = ImageDraw.Draw(img_layer_droplets)

# Scatter 450 glistening dew beads along spokes and rings
for hub_data in all_spokes:
    for spoke in hub_data["spokes"]:
        pts = spoke["pts"]
        for p in pts:
            if random.random() < 0.08:
                rad = random.uniform(1.8, 3.5)
                # Soft cyan-white glint
                draw_drop.ellipse([p[0] - rad, p[1] - rad, p[0] + rad, p[1] + rad], fill=(235, 250, 255, 235))
                draw_drop.ellipse([p[0] - rad * 0.4, p[1] - rad * 0.4, p[0] + rad * 0.4, p[1] + rad * 0.4], fill=(255, 255, 255, 255))

# Composite all layers with blur on halo
img_glow_blurred = img_layer_glow.filter(ImageFilter.GaussianBlur(radius=2.5))
final_diffuse = Image.alpha_composite(img_diffuse, img_glow_blurred)
final_diffuse = Image.alpha_composite(final_diffuse, img_layer_strands)
final_diffuse = Image.alpha_composite(final_diffuse, img_layer_droplets)

diff_path = TEX_DIR / "decal_spider_web_diffuse.png"
final_diffuse.save(diff_path, "PNG")
print(f"Saved Spider Web Diffuse Map: {diff_path}")

# -----------------------------------------------------------------------------
# 3. Generate Normal Map (Tangible 3D Silk Ridges for XR Headset Lighting)
# -----------------------------------------------------------------------------
# Extract alpha / intensity as heightmap and compute Sobel normal gradients
print("Computing Normal Map for Spider Web Decal...")
alpha_ch = final_diffuse.split()[3] # Alpha channel acts as heightmap
alpha_arr = list(alpha_ch.getdata())

# Create Sobel normal map
img_normal = Image.new("RGB", (TEX_W, TEX_H), (128, 128, 255))
pixels_norm = img_normal.load()
alpha_pix = alpha_ch.load()

STRENGTH = 2.4 # Normal perturbation strength

for y in range(1, TEX_H - 1, 2): # Stepped for high performance on 2048x2048
    for x in range(1, TEX_W - 1, 2):
        # Sample neighborhood
        tl = alpha_pix[x - 1, y - 1]
        t  = alpha_pix[x,     y - 1]
        tr = alpha_pix[x + 1, y - 1]
        l  = alpha_pix[x - 1, y]
        r  = alpha_pix[x + 1, y]
        bl = alpha_pix[x - 1, y + 1]
        b  = alpha_pix[x,     y + 1]
        br = alpha_pix[x + 1, y + 1]
        
        # Sobel convolution
        dx = (tr + 2 * r + br) - (tl + 2 * l + bl)
        dy = (bl + 2 * b + br) - (tl + 2 * t + tr)
        
        nx = -dx * (STRENGTH / 255.0)
        ny = -dy * (STRENGTH / 255.0)
        nz = 1.0
        
        inv_len = 1.0 / math.sqrt(nx * nx + ny * ny + nz * nz)
        nx *= inv_len
        ny *= inv_len
        nz *= inv_len
        
        r_col = int((nx * 0.5 + 0.5) * 255.0)
        g_col = int((ny * 0.5 + 0.5) * 255.0)
        b_col = int((nz * 0.5 + 0.5) * 255.0)
        
        pixels_norm[x, y] = (r_col, g_col, b_col)
        pixels_norm[x + 1, y] = (r_col, g_col, b_col)
        pixels_norm[x, y + 1] = (r_col, g_col, b_col)
        pixels_norm[x + 1, y + 1] = (r_col, g_col, b_col)

nor_path = TEX_DIR / "decal_spider_web_normal.png"
img_normal.save(nor_path, "PNG")
print(f"Saved Spider Web Normal Map: {nor_path}")

# -----------------------------------------------------------------------------
# 4. Generate Roughness Map (Silky Glint Specularity)
# -----------------------------------------------------------------------------
print("Generating Roughness Map...")
img_rough = Image.new("L", (TEX_W, TEX_H), 240) # background non-shiny
pixels_rou = img_rough.load()

for y in range(0, TEX_H, 2):
    for x in range(0, TEX_W, 2):
        a = alpha_pix[x, y]
        if a > 20:
            # Web strands are smooth and shiny (low roughness = high specular glint)
            rou_val = int(35 + (1.0 - (a / 255.0)) * 50)
            pixels_rou[x, y] = rou_val
            if x + 1 < TEX_W: pixels_rou[x + 1, y] = rou_val
            if y + 1 < TEX_H: pixels_rou[x, y + 1] = rou_val
            if x + 1 < TEX_W and y + 1 < TEX_H: pixels_rou[x + 1, y + 1] = rou_val

rou_path = TEX_DIR / "decal_spider_web_roughness.png"
img_rough.save(rou_path, "PNG")
print(f"Saved Spider Web Roughness Map: {rou_path}")

# -----------------------------------------------------------------------------
# 5. Mirror Textures to YEST and ALIAS Folders
# -----------------------------------------------------------------------------
for p in (diff_path, nor_path, rou_path):
    shutil.copy2(p, YEST_TEX_DIR / p.name)
    shutil.copy2(p, ALIAS_TEX_DIR / p.name)
    shutil.copy2(p, MODEL_DIR / p.name) # Root of model dir convenience

# Create thumbnail for web UI & asset browser
thumb = Image.new("RGBA", (512, 512), (10, 14, 20, 255))
# Paste scaled spider web over a subtle dark cockpit glass background
draw_th = ImageDraw.Draw(thumb)
draw_th.rectangle([0, 0, 511, 511], outline=(0, 240, 255, 120), width=4)
# Emissive HUD grid
draw_th.line([(40, 256), (472, 256)], fill=(0, 240, 255, 60), width=1)
draw_th.line([(256, 40), (256, 472)], fill=(0, 240, 255, 60), width=1)

web_scaled = final_diffuse.resize((480, 480), Image.Resampling.LANCZOS)
thumb.paste(web_scaled, (16, 16), web_scaled)

th_path = TEX_DIR / "thumbnail.png"
thumb.save(th_path, "PNG")
shutil.copy2(th_path, MODEL_DIR / "thumbnail.png")
shutil.copy2(th_path, YEST_TEX_DIR / "thumbnail.png")
shutil.copy2(th_path, ALIAS_TEX_DIR / "thumbnail.png")
print(f"Saved Thumbnail: {th_path}")

print("\n--- ALL TEXTURES FOR SCREEN_DECALS_SPIDER_WEB_OVERLAY_4 CREATED SUCCESSFULLY ---")
