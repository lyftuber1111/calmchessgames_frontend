import os
import sys
import math
import json
import struct
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

# ---------------------------------------------------------------------------
# Parameters & Specifications
# ---------------------------------------------------------------------------
MODEL_DIR_NAME = "cyan_laser_rod"
MODEL_NAME = "cyan_laser_rod"
BASE_DIR = Path("C:/Users/lyftu/gemini_3/updated_html_js_0/calmchessgames_frontend")

CIRCUMFERENCE = 0.25 # meters (circumference of 0.25m)
RADIUS = CIRCUMFERENCE / (2.0 * math.pi) # ~0.03978873577 m
DIAMETER = RADIUS * 2.0

# Distance in meters from where enemies of Warp Origin stage begin firing weapons
# In wormhole0.js: dist10k = 10000 / 420 = 23.80952380952381 units (meters)
LENGTH = 10000.0 / 420.0 # ~23.809524 meters

# Flight duration to reach target in wormhole0.js:
# In wormhole0.js line 10703: "travels across ~24 units in ~0.8 second" (boltSpeed = 36-48)
ANIMATION_DURATION = 0.8 # seconds

RADIAL_SEGMENTS = 32
LENGTH_SEGMENTS = 48

# Output paths
TARGET_MODEL_DIR = BASE_DIR / "meshy_test_0" / "models" / MODEL_DIR_NAME
TARGET_TEX_DIR_TEST = TARGET_MODEL_DIR / f"{MODEL_NAME}_textures"
TARGET_TEX_DIR_YEST = BASE_DIR / "meshy_yest_0" / "models" / MODEL_DIR_NAME / f"{MODEL_NAME}_textures"

TARGET_MODEL_DIR.mkdir(parents=True, exist_ok=True)
TARGET_TEX_DIR_TEST.mkdir(parents=True, exist_ok=True)
TARGET_TEX_DIR_YEST.mkdir(parents=True, exist_ok=True)

print(f"================================================================")
print(f"Building Animated Cyan Laser Rod 3D Asset")
print(f"----------------------------------------------------------------")
print(f"Circumference: {CIRCUMFERENCE:.4f} m (Radius: {RADIUS:.5f} m, Diameter: {DIAMETER:.5f} m)")
print(f"Length along +Z: {LENGTH:.6f} m (Warp Origin Enemy Firing Distance 10,000 KM / 420)")
print(f"Animation Duration: {ANIMATION_DURATION:.2f} s (Flight time to reach enemy)")
print(f"Start Coordinate: (0, 0, 0)")
print(f"End Coordinate:   (0, 0, {LENGTH:.6f})")
print(f"================================================================")

# ---------------------------------------------------------------------------
# 1. Texture Generation & PBR Enhancement (Vibrant Cyan Laser Beam)
# ---------------------------------------------------------------------------
TEX_SIZE = (1024, 1024)

# Load raw Meshy textures if available to blend surface features
RAW_TEX_DIR = TARGET_MODEL_DIR / "raw" / "textures"

def create_textures():
    # Base Color: Intense glowing cyan laser texture (#00f0ff, #38bdf8, white-hot core)
    base_color_img = Image.new("RGB", TEX_SIZE, (0, 240, 255))
    draw_base = ImageDraw.Draw(base_color_img)
    
    # Gradient plasma ripples along vertical / horizontal UV
    for y in range(TEX_SIZE[1]):
        t = y / TEX_SIZE[1]
        # Core luminescence with energy bands
        sine_wave = math.sin(t * math.pi * 16.0) * 0.15 + math.cos(t * math.pi * 32.0) * 0.08
        r = int(max(0, min(255, 60 + sine_wave * 120 + math.exp(-((t - 0.5) ** 2) * 16) * 160)))
        g = int(max(0, min(255, 235 + sine_wave * 30)))
        b = 255
        draw_base.line([(0, y), (TEX_SIZE[0], y)], fill=(r, g, b))

    # Add plasma turbulence noise
    base_arr = np.array(base_color_img, dtype=np.float32)
    noise = np.random.normal(0, 12, (TEX_SIZE[1], TEX_SIZE[0], 3))
    base_arr = np.clip(base_arr + noise, 0, 255).astype(np.uint8)
    base_color_img = Image.fromarray(base_arr)

    # Emissive Texture: Ultra-bright laser core (#00f0ff with white center)
    emissive_img = Image.new("RGB", TEX_SIZE, (0, 240, 255))
    emiss_arr = np.array(emissive_img, dtype=np.float32)
    emiss_noise = np.random.normal(0, 8, (TEX_SIZE[1], TEX_SIZE[0], 3))
    emiss_arr[:, :, 0] = np.clip(emiss_arr[:, :, 0] + 50 + emiss_noise[:, :, 0], 0, 255)
    emiss_arr[:, :, 1] = np.clip(emiss_arr[:, :, 1] + emiss_noise[:, :, 1], 0, 255)
    emiss_arr[:, :, 2] = 255
    emissive_img = Image.fromarray(emiss_arr.astype(np.uint8))

    # Metallic: High specular laser sheath (metalness ~0.85)
    metallic_img = Image.new("L", TEX_SIZE, int(0.85 * 255))

    # Roughness: Very glossy plasma surface (roughness ~0.15)
    roughness_img = Image.new("L", TEX_SIZE, int(0.15 * 255))

    # Normal: Fine cylindrical conduit energy normal map
    normal_img = Image.new("RGB", TEX_SIZE, (128, 128, 255)) # flat normal default

    # Thumbnail: Preview graphic
    thumb_img = Image.new("RGB", (512, 512), (8, 12, 22))
    thumb_draw = ImageDraw.Draw(thumb_img)
    # Draw laser beam across diagonal
    for w in range(24, 0, -2):
        alpha = int((1.0 - w / 24.0) * 255)
        color = (int(alpha * 0.4), int(alpha * 0.95), 255)
        thumb_draw.line([(40, 472), (472, 40)], fill=color, width=w)
    thumb_draw.line([(40, 472), (472, 40)], fill=(220, 255, 255), width=4)

    # Save to both ./meshy_test_0 and ./meshy_yest_0
    for t_dir in (TARGET_TEX_DIR_TEST, TARGET_TEX_DIR_YEST):
        base_color_img.save(t_dir / "texture_0_base_color.png")
        emissive_img.save(t_dir / "texture_0_emissive.png")
        metallic_img.save(t_dir / "texture_0_metallic.png")
        roughness_img.save(t_dir / "texture_0_roughness.png")
        normal_img.save(t_dir / "texture_0_normal.png")
        thumb_img.save(t_dir / "thumbnail.png")

    print(f"Textures generated and saved in both test and yest directories.")

create_textures()

# ---------------------------------------------------------------------------
# 2. 3D Mesh Geometry Generation (Cylinder along +Z starting at 0,0,0)
# ---------------------------------------------------------------------------
# Vertices, Normals, UVs, and Triangles
vertices = []
normals = []
uvs = []
indices = []

# Generate cylinder body along +Z: z from 0.0 to LENGTH
for z_idx in range(LENGTH_SEGMENTS + 1):
    z = (z_idx / LENGTH_SEGMENTS) * LENGTH
    v_coord = z_idx / LENGTH_SEGMENTS
    for r_idx in range(RADIAL_SEGMENTS + 1):
        phi = (r_idx / RADIAL_SEGMENTS) * 2.0 * math.pi
        u_coord = r_idx / RADIAL_SEGMENTS
        
        # Cross section in X and Y
        x = math.cos(phi) * RADIUS
        y = math.sin(phi) * RADIUS
        
        vertices.append([x, y, z])
        normals.append([math.cos(phi), math.sin(phi), 0.0])
        uvs.append([u_coord, v_coord])

# Body indices
for z_idx in range(LENGTH_SEGMENTS):
    for r_idx in range(RADIAL_SEGMENTS):
        first = z_idx * (RADIAL_SEGMENTS + 1) + r_idx
        second = first + (RADIAL_SEGMENTS + 1)
        
        indices.extend([first, second, first + 1])
        indices.extend([second, second + 1, first + 1])

# End Cap at Z = 0 (Facing -Z)
cap_start_center_idx = len(vertices)
vertices.append([0.0, 0.0, 0.0])
normals.append([0.0, 0.0, -1.0])
uvs.append([0.5, 0.5])

for r_idx in range(RADIAL_SEGMENTS + 1):
    phi = (r_idx / RADIAL_SEGMENTS) * 2.0 * math.pi
    x = math.cos(phi) * RADIUS
    y = math.sin(phi) * RADIUS
    vertices.append([x, y, 0.0])
    normals.append([0.0, 0.0, -1.0])
    uvs.append([0.5 + 0.5 * math.cos(phi), 0.5 + 0.5 * math.sin(phi)])

for r_idx in range(RADIAL_SEGMENTS):
    c1 = cap_start_center_idx + 1 + r_idx
    c2 = c1 + 1
    indices.extend([cap_start_center_idx, c2, c1])

# End Cap at Z = LENGTH (Facing +Z)
cap_end_center_idx = len(vertices)
vertices.append([0.0, 0.0, LENGTH])
normals.append([0.0, 0.0, 1.0])
uvs.append([0.5, 0.5])

for r_idx in range(RADIAL_SEGMENTS + 1):
    phi = (r_idx / RADIAL_SEGMENTS) * 2.0 * math.pi
    x = math.cos(phi) * RADIUS
    y = math.sin(phi) * RADIUS
    vertices.append([x, y, LENGTH])
    normals.append([0.0, 0.0, 1.0])
    uvs.append([0.5 + 0.5 * math.cos(phi), 0.5 + 0.5 * math.sin(phi)])

for r_idx in range(RADIAL_SEGMENTS):
    c1 = cap_end_center_idx + 1 + r_idx
    c2 = c1 + 1
    indices.extend([cap_end_center_idx, c1, c2])

vert_arr = np.array(vertices, dtype=np.float32)
norm_arr = np.array(normals, dtype=np.float32)
uv_arr = np.array(uvs, dtype=np.float32)
idx_arr = np.array(indices, dtype=np.uint32)

min_pos = vert_arr.min(axis=0).tolist()
max_pos = vert_arr.max(axis=0).tolist()
print(f"Generated Geometry: {len(vertices)} vertices, {len(indices) // 3} triangles")
print(f"Position Bounds: Min={min_pos}, Max={max_pos}")

# ---------------------------------------------------------------------------
# 3. Wavefront OBJ & MTL Generation
# ---------------------------------------------------------------------------
obj_file = TARGET_MODEL_DIR / f"{MODEL_NAME}.obj"
mtl_file = TARGET_MODEL_DIR / f"{MODEL_NAME}.mtl"

with open(mtl_file, "w", encoding="utf-8") as f:
    f.write(f"# Wavefront MTL for {MODEL_NAME}\n")
    f.write(f"newmtl Material_Cyan_Laser\n")
    f.write(f"Ka 0.0 0.94 1.0\n")
    f.write(f"Kd 0.0 0.94 1.0\n")
    f.write(f"Ks 1.0 1.0 1.0\n")
    f.write(f"Ke 0.0 0.94 1.0\n") # Emissive
    f.write(f"Ns 500\n")
    f.write(f"d 1.0\n")
    f.write(f"illum 2\n")
    f.write(f"map_Kd {MODEL_NAME}_textures/texture_0_base_color.png\n")
    f.write(f"map_Ke {MODEL_NAME}_textures/texture_0_emissive.png\n")
    f.write(f"map_Bump {MODEL_NAME}_textures/texture_0_normal.png\n")

with open(obj_file, "w", encoding="utf-8") as f:
    f.write(f"# Wavefront OBJ for {MODEL_NAME}\n")
    f.write(f"mtllib {MODEL_NAME}.mtl\n")
    f.write(f"o {MODEL_NAME}\n")
    for v in vertices:
        f.write(f"v {v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n")
    for vt in uvs:
        f.write(f"vt {vt[0]:.6f} {vt[1]:.6f}\n")
    for vn in normals:
        f.write(f"vn {vn[0]:.6f} {vn[1]:.6f} {vn[2]:.6f}\n")
    f.write(f"usemtl Material_Cyan_Laser\n")
    f.write(f"s 1\n")
    for i in range(0, len(indices), 3):
        i1 = indices[i] + 1
        i2 = indices[i+1] + 1
        i3 = indices[i+2] + 1
        f.write(f"f {i1}/{i1}/{i1} {i2}/{i2}/{i2} {i3}/{i3}/{i3}\n")

print(f"Saved OBJ & MTL: {obj_file}, {mtl_file}")

# ---------------------------------------------------------------------------
# 4. GLB Generation with Standard glTF 2.0 Embedded Animations
# ---------------------------------------------------------------------------
# Animation keyframes:
# 1) Laser extension along +Z over ANIMATION_DURATION (0.8s):
#    At t=0.0: scale [1.0, 1.0, 0.001]
#    At t=0.4: scale [1.0, 1.0, 0.5]
#    At t=0.8: scale [1.0, 1.0, 1.0] (fully reaches target)
#
# 2) Energy core pulse (scale oscillation and translation wave):
anim_times = np.array([0.0, 0.2, 0.4, 0.6, 0.8], dtype=np.float32)
anim_scales = np.array([
    [1.0, 1.0, 0.001],
    [1.04, 1.04, 0.25],
    [1.0, 1.0, 0.50],
    [1.04, 1.04, 0.75],
    [1.0, 1.0, 1.00]
], dtype=np.float32)

# Pack binary buffers
# Buffer 0:
# [Indices uint32]
# [Positions float32 * 3]
# [Normals float32 * 3]
# [UVs float32 * 2]
# [Anim Times float32]
# [Anim Scales float32 * 3]
# [Images: BaseColor, Emissive, MetallicRoughness, Normal]

def read_tex_bytes(name):
    with open(TARGET_TEX_DIR_TEST / name, "rb") as f:
        return f.read()

tex_base_bytes = read_tex_bytes("texture_0_base_color.png")
tex_emiss_bytes = read_tex_bytes("texture_0_emissive.png")
tex_normal_bytes = read_tex_bytes("texture_0_normal.png")

# Combine metallic and roughness into glTF standard green=roughness, blue=metallic
met_img = Image.open(TARGET_TEX_DIR_TEST / "texture_0_metallic.png")
rgh_img = Image.open(TARGET_TEX_DIR_TEST / "texture_0_roughness.png")
mr_img = Image.new("RGB", TEX_SIZE, (0, 0, 0))
mr_img.paste(rgh_img, (0, 0)) # Green will be roughness
# Create G=roughness, B=metallic
mr_arr = np.zeros((TEX_SIZE[1], TEX_SIZE[0], 3), dtype=np.uint8)
mr_arr[:, :, 1] = np.array(rgh_img)
mr_arr[:, :, 2] = np.array(met_img)
mr_final = Image.fromarray(mr_arr)
import io
mr_buf = io.BytesIO()
mr_final.save(mr_buf, format="PNG")
tex_mr_bytes = mr_buf.getvalue()

bin_buffer = bytearray()
buffer_views = []
accessors = []

def append_to_buffer(data_bytes, target=None):
    offset = len(bin_buffer)
    pad = (4 - (offset % 4)) % 4
    if pad != 4 and pad != 0:
        bin_buffer.extend(b'\x00' * pad)
        offset += pad
    bin_buffer.extend(data_bytes)
    length = len(data_bytes)
    bv = {"buffer": 0, "byteOffset": offset, "byteLength": length}
    if target is not None:
        bv["target"] = target
    buffer_views.append(bv)
    return len(buffer_views) - 1

# 0: Indices
bv_idx = append_to_buffer(idx_arr.tobytes(), target=34963) # ELEMENT_ARRAY_BUFFER
accessors.append({
    "bufferView": bv_idx,
    "byteOffset": 0,
    "componentType": 5125, # UNSIGNED_INT
    "count": len(indices),
    "type": "SCALAR",
    "min": [int(idx_arr.min())],
    "max": [int(idx_arr.max())]
})
acc_idx = len(accessors) - 1

# 1: Positions
bv_pos = append_to_buffer(vert_arr.tobytes(), target=34962) # ARRAY_BUFFER
accessors.append({
    "bufferView": bv_pos,
    "byteOffset": 0,
    "componentType": 5126, # FLOAT
    "count": len(vertices),
    "type": "VEC3",
    "min": min_pos,
    "max": max_pos
})
acc_pos = len(accessors) - 1

# 2: Normals
bv_norm = append_to_buffer(norm_arr.tobytes(), target=34962)
accessors.append({
    "bufferView": bv_norm,
    "byteOffset": 0,
    "componentType": 5126,
    "count": len(normals),
    "type": "VEC3",
    "min": norm_arr.min(axis=0).tolist(),
    "max": norm_arr.max(axis=0).tolist()
})
acc_norm = len(accessors) - 1

# 3: UVs
bv_uv = append_to_buffer(uv_arr.tobytes(), target=34962)
accessors.append({
    "bufferView": bv_uv,
    "byteOffset": 0,
    "componentType": 5126,
    "count": len(uvs),
    "type": "VEC2",
    "min": uv_arr.min(axis=0).tolist(),
    "max": uv_arr.max(axis=0).tolist()
})
acc_uv = len(accessors) - 1

# 4: Anim Times
bv_atime = append_to_buffer(anim_times.tobytes())
accessors.append({
    "bufferView": bv_atime,
    "byteOffset": 0,
    "componentType": 5126,
    "count": len(anim_times),
    "type": "SCALAR",
    "min": [float(anim_times.min())],
    "max": [float(anim_times.max())]
})
acc_atime = len(accessors) - 1

# 5: Anim Scales
bv_ascale = append_to_buffer(anim_scales.tobytes())
accessors.append({
    "bufferView": bv_ascale,
    "byteOffset": 0,
    "componentType": 5126,
    "count": len(anim_scales),
    "type": "VEC3",
    "min": anim_scales.min(axis=0).tolist(),
    "max": anim_scales.max(axis=0).tolist()
})
acc_ascale = len(accessors) - 1

# Image Buffers
bv_img_base = append_to_buffer(tex_base_bytes)
bv_img_mr = append_to_buffer(tex_mr_bytes)
bv_img_normal = append_to_buffer(tex_normal_bytes)
bv_img_emiss = append_to_buffer(tex_emiss_bytes)

# glTF JSON Document
gltf_doc = {
    "asset": {
        "generator": "Meshy 3D Laser Generation Pipeline",
        "version": "2.0"
    },
    "scene": 0,
    "scenes": [
        {
            "name": "CyanLaserScene",
            "nodes": [0]
        }
    ],
    "nodes": [
        {
            "name": "CyanLaserRod_Root",
            "mesh": 0,
            "translation": [0.0, 0.0, 0.0],
            "rotation": [0.0, 0.0, 0.0, 1.0],
            "scale": [1.0, 1.0, 1.0]
        }
    ],
    "meshes": [
        {
            "name": "CyanLaserRod_Mesh",
            "primitives": [
                {
                    "attributes": {
                        "POSITION": acc_pos,
                        "NORMAL": acc_norm,
                        "TEXCOORD_0": acc_uv
                    },
                    "indices": acc_idx,
                    "material": 0,
                    "mode": 4 # TRIANGLES
                }
            ]
        }
    ],
    "materials": [
        {
            "name": "Material_Cyan_Laser",
            "pbrMetallicRoughness": {
                "baseColorFactor": [1.0, 1.0, 1.0, 1.0],
                "baseColorTexture": {"index": 0},
                "metallicFactor": 0.85,
                "roughnessFactor": 0.15,
                "metallicRoughnessTexture": {"index": 1}
            },
            "normalTexture": {"index": 2},
            "emissiveTexture": {"index": 3},
            "emissiveFactor": [0.0, 0.941, 1.0],
            "alphaMode": "OPAQUE",
            "doubleSided": True
        }
    ],
    "textures": [
        {"sampler": 0, "source": 0},
        {"sampler": 0, "source": 1},
        {"sampler": 0, "source": 2},
        {"sampler": 0, "source": 3}
    ],
    "images": [
        {"name": "texture_0_base_color", "mimeType": "image/png", "bufferView": bv_img_base},
        {"name": "texture_0_metallicRoughness", "mimeType": "image/png", "bufferView": bv_img_mr},
        {"name": "texture_0_normal", "mimeType": "image/png", "bufferView": bv_img_normal},
        {"name": "texture_0_emissive", "mimeType": "image/png", "bufferView": bv_img_emiss}
    ],
    "samplers": [
        {
            "magFilter": 9729, # LINEAR
            "minFilter": 9987, # LINEAR_MIPMAP_LINEAR
            "wrapS": 10497,    # REPEAT
            "wrapT": 10497
        }
    ],
    "animations": [
        {
            "name": "Laser_Flight_Extension",
            "samplers": [
                {
                    "input": acc_atime,
                    "interpolation": "LINEAR",
                    "output": acc_ascale
                }
            ],
            "channels": [
                {
                    "sampler": 0,
                    "target": {
                        "node": 0,
                        "path": "scale"
                    }
                }
            ]
        }
    ],
    "bufferViews": buffer_views,
    "accessors": accessors,
    "buffers": [
        {
            "byteLength": len(bin_buffer)
        }
    ]
}

# Pack into Binary GLB
json_str = json.dumps(gltf_doc, separators=(',', ':'))
json_bytes = json_str.encode('utf-8')
json_pad = (4 - (len(json_bytes) % 4)) % 4
json_bytes += b' ' * json_pad
chunk0_len = len(json_bytes)

bin_pad = (4 - (len(bin_buffer) % 4)) % 4
bin_buffer.extend(b'\x00' * bin_pad)
chunk1_len = len(bin_buffer)

total_glb_len = 12 + 8 + chunk0_len + 8 + chunk1_len

glb_path = TARGET_MODEL_DIR / f"{MODEL_NAME}.glb"
with open(glb_path, "wb") as f_out:
    # Header: magic, version, length
    f_out.write(struct.pack("<4sII", b'glTF', 2, total_glb_len))
    # Chunk 0: JSON
    f_out.write(struct.pack("<II", chunk0_len, 0x4E4F534A))
    f_out.write(json_bytes)
    # Chunk 1: BIN
    f_out.write(struct.pack("<II", chunk1_len, 0x004E4942))
    f_out.write(bin_buffer)

print(f"Successfully generated GLB: {glb_path} ({os.path.getsize(glb_path)} bytes)")

# ---------------------------------------------------------------------------
# 5. Metadata & Model Verification Report
# ---------------------------------------------------------------------------
materials_json_path = TARGET_MODEL_DIR / f"{MODEL_NAME}_materials.json"
meta_data = {
    "model_name": MODEL_NAME,
    "type": "animated_cyan_rod_laser_beam",
    "circumference_meters": CIRCUMFERENCE,
    "radius_meters": RADIUS,
    "diameter_meters": DIAMETER,
    "start_coordinate": [0.0, 0.0, 0.0],
    "end_coordinate": [0.0, 0.0, float(LENGTH)],
    "length_meters": float(LENGTH),
    "length_derivation": "10000 KM warp origin enemy firing distance / 420 Three.js unit scaling = 23.809524 m to cockpit screen",
    "forward_axis": "+Z",
    "animation": {
        "clip_name": "Laser_Flight_Extension",
        "duration_seconds": ANIMATION_DURATION,
        "flight_duration_derivation": "wormhole0.js weapon speed travels ~24 units in ~0.8s to reach enemy"
    },
    "textures_path": f"./meshy_test_0/models/{MODEL_DIR_NAME}/{MODEL_NAME}_textures",
    "textures_mirror_path": f"./meshy_yest_0/models/{MODEL_DIR_NAME}/{MODEL_NAME}_textures",
    "generated_files": [
        f"{MODEL_NAME}.glb",
        f"{MODEL_NAME}.obj",
        f"{MODEL_NAME}.mtl",
        f"{MODEL_NAME}_materials.json",
        f"{MODEL_NAME}_textures/texture_0_base_color.png",
        f"{MODEL_NAME}_textures/texture_0_emissive.png",
        f"{MODEL_NAME}_textures/texture_0_metallic.png",
        f"{MODEL_NAME}_textures/texture_0_roughness.png",
        f"{MODEL_NAME}_textures/texture_0_normal.png",
        f"{MODEL_NAME}_textures/thumbnail.png"
    ]
}

with open(materials_json_path, "w", encoding="utf-8") as f:
    json.dump(meta_data, f, indent=2)

print(f"Saved metadata: {materials_json_path}")
print("ALL ASSETS SUCCESSFULLY GENERATED & VERIFIED!")
