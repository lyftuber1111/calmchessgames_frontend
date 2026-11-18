import bpy
import mathutils
import math
import shutil
import json
import os
import struct
from pathlib import Path

FRONTEND_DIR = Path(r"C:\Users\lyftu\gemini_3\updated_html_js_0\calmchessgames_frontend")
SRC_GLB = FRONTEND_DIR / "meshy_test_0" / "models" / "cyan_laser_rod_2" / "cyan_laser_rod_2.glb"

MODEL_NAME = "cyan_laser_rod_4"
DEST_MESHY_DIR = FRONTEND_DIR / "meshy_test_0" / "models" / MODEL_NAME
DEST_MESHY_TEX_DIR = DEST_MESHY_DIR / f"{MODEL_NAME}_textures"
DEST_YEST_TEX_DIR = FRONTEND_DIR / "meshy_yest_0" / "models" / MODEL_NAME / f"{MODEL_NAME}_textures"

DEST_MESHY_GLB  = DEST_MESHY_DIR / f"{MODEL_NAME}.glb"
DEST_OBJ        = DEST_MESHY_DIR / f"{MODEL_NAME}.obj"
DEST_MTL        = DEST_MESHY_DIR / f"{MODEL_NAME}.mtl"
DEST_JSON       = DEST_MESHY_DIR / f"{MODEL_NAME}_materials.json"

DEST_MOBILE_GLB = FRONTEND_DIR / "wormhole0" / "mobile" / "warp_origin_images" / f"{MODEL_NAME}.glb"
DEST_MOBILE_JSON= FRONTEND_DIR / "wormhole0" / "mobile" / "warp_origin_images" / f"{MODEL_NAME}_materials.json"

DEST_MIRROR_GLB = FRONTEND_DIR / "wormhole0" / "warp_origin_images" / f"{MODEL_NAME}.glb"
DEST_MIRROR_JSON= FRONTEND_DIR / "wormhole0" / "warp_origin_images" / f"{MODEL_NAME}_materials.json"

TEMP_EXPORT_GLB = FRONTEND_DIR / "wormhole0" / "mobile" / "warp_origin_images" / f"{MODEL_NAME}_blender_out.glb"

DEST_MESHY_DIR.mkdir(parents=True, exist_ok=True)
DEST_MESHY_TEX_DIR.mkdir(parents=True, exist_ok=True)
DEST_YEST_TEX_DIR.mkdir(parents=True, exist_ok=True)

# Target specs:
# Circumference strictly 0.25 meters in XR (radius = 0.25 / (2*pi) ~= 0.0397887m, diameter ~= 0.0795775m)
TARGET_CIRCUMFERENCE = 0.25 # meters
TARGET_RADIUS = TARGET_CIRCUMFERENCE / (2.0 * math.pi) # ~0.03978873577 m
TARGET_DIAMETER = TARGET_RADIUS * 2.0 # ~0.0795774715 m
TARGET_WIDTH = TARGET_DIAMETER # ~0.0795775 m
TARGET_HEIGHT = TARGET_DIAMETER # ~0.0795775 m
LENGTH = 28.0 # meters (strictly 28m long)
DURATION_SECONDS = 0.8 # strictly 0.8 seconds duration
FPS = 30
TOTAL_FRAMES = int(round(DURATION_SECONDS * FPS)) # 24 frames

print("==================================================")
print(f"BUILDING CYAN LASER ROD 4 (CIRCUMFERENCE: {TARGET_CIRCUMFERENCE}m, LENGTH: {LENGTH}m, DURATION: {DURATION_SECONDS}s)")
print(f"Radius: {TARGET_RADIUS:.6f}m, Diameter: {TARGET_DIAMETER:.6f}m | Pivot at +Z 0 extending down +Z")
print("==================================================")

# Clean Blender state
bpy.ops.wm.read_factory_settings(use_empty=True)
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
for m in list(bpy.data.meshes):
    bpy.data.meshes.remove(m, do_unlink=True)
for mat in list(bpy.data.materials):
    bpy.data.materials.remove(mat, do_unlink=True)
for act in list(bpy.data.actions):
    bpy.data.actions.remove(act, do_unlink=True)

# Import base laser rod
bpy.ops.import_scene.gltf(filepath=str(SRC_GLB))

# Find root mesh
obj = bpy.data.objects.get("CyanLaserRod_Root")
if not obj:
    for o in bpy.data.objects:
        if o.type == 'MESH':
            obj = o
            break
if not obj:
    raise RuntimeError("No suitable mesh object found in imported GLB")

# Remove any non-laser objects from the scene
for o in list(bpy.data.objects):
    if o != obj:
        bpy.data.objects.remove(o, do_unlink=True)

obj.name = "CyanLaserRod_Root"
mesh = obj.data
mesh.name = "CyanLaserRod_Mesh"

# Select only obj
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# Current bounds
xs = [v.co.x for v in mesh.vertices]
ys = [v.co.y for v in mesh.vertices]
zs = [v.co.z for v in mesh.vertices]

print(f"Imported bounds: X=[{min(xs):.6f}, {max(xs):.6f}], Y=[{min(ys):.6f}, {max(ys):.6f}], Z=[{min(zs):.6f}, {max(zs):.6f}]")

curr_radius_x = max(abs(min(xs)), abs(max(xs)))
curr_radius_z = max(abs(min(zs)), abs(max(zs)))
scale_factor_x = TARGET_RADIUS / curr_radius_x if curr_radius_x > 0 else 1.0
scale_factor_z = TARGET_RADIUS / curr_radius_z if curr_radius_z > 0 else 1.0

y_min = min(ys)
y_max = max(ys)

for v in mesh.vertices:
    # Scale cross section to exact 0.25m circumference (radius = 0.039789m, width/height = 0.079577m)
    v.co.x = v.co.x * scale_factor_x
    v.co.z = v.co.z * scale_factor_z
    
    # Ensure start is strictly at Y=0 and end extends to -LENGTH (-28.0m in Blender)
    # (In glTF export with export_yup=True, Blender -Y corresponds to XR +Z forward)
    t = (v.co.y - y_max) / (y_min - y_max) if abs(y_min - y_max) > 1e-4 else 0.0
    if t < 1e-5:
        v.co.y = 0.0
    elif t > 1.0 - 1e-5:
        v.co.y = -LENGTH
    else:
        v.co.y = - t * LENGTH

mesh.update()

# Recalculate and verify bounds
xs_new = [v.co.x for v in mesh.vertices]
ys_new = [v.co.y for v in mesh.vertices]
zs_new = [v.co.z for v in mesh.vertices]

width_x = max(xs_new) - min(xs_new)
height_z = max(zs_new) - min(zs_new)
length_y = max(ys_new) - min(ys_new)

print(f"New Blender bounds: X=[{min(xs_new):.6f}, {max(xs_new):.6f}] (Width: {width_x:.4f}m)")
print(f"                    Z=[{min(zs_new):.6f}, {max(zs_new):.6f}] (Height: {height_z:.4f}m)")
print(f"                    Y=[{min(ys_new):.6f}, {max(ys_new):.6f}] (Length: {length_y:.4f}m)")

# Verify caps
cap_start = [v for v in mesh.vertices if abs(v.co.y - 0.0) < 1e-4]
cap_end   = [v for v in mesh.vertices if abs(v.co.y - (-LENGTH)) < 1e-4]
print(f"Start cap vertices (at Y=0.0): {len(cap_start)}")
print(f"End cap vertices (at Y=-{LENGTH:.1f}m): {len(cap_end)}")

# Animation setup:
# Strictly linear extension from 0.0 meters to 28.0 meters across exactly 0.8 seconds (24 frames @ 30 FPS)
bpy.context.scene.render.fps = FPS
bpy.context.scene.render.fps_base = 1.0
bpy.context.scene.frame_start = 0
bpy.context.scene.frame_end = TOTAL_FRAMES

for act in list(bpy.data.actions):
    bpy.data.actions.remove(act)

if obj.animation_data:
    obj.animation_data_clear()

obj.animation_data_create()
action = bpy.data.actions.new(name="Laser_Flight_Extension")
obj.animation_data.action = action

# Keyframes across 0.8 seconds (0 to 24 frames @ 30 FPS):
# Starts at length 0.0m (t=0.0s, scale Y=0.000) and extends linearly to 28.0m (t=0.8s, scale Y=1.000)
# Circumference remains strictly 0.25m throughout (scale X=1.000, scale Z=1.000)
keyframes = [
    (0.0,                (1.000, 0.000, 1.000)), # Frame 0  (t = 0.00s): starts at length 0.000m (pivot at +Z 0)
    (float(TOTAL_FRAMES), (1.000, 1.000, 1.000)), # Frame 24 (t = 0.80s): extends to full 28.000m down +Z
]

for frame, scale in keyframes:
    obj.scale = scale
    obj.keyframe_insert(data_path="scale", frame=frame)

# Set strict linear interpolation
if hasattr(action, 'fcurves'):
    for fc in action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'
elif hasattr(action, 'layers'):
    for l in action.layers:
        for s in l.strips:
            for cb in s.channelbags:
                for fc in cb.fcurves:
                    for kp in fc.keyframe_points:
                        kp.interpolation = 'LINEAR'

# Set base/rest scale to frame 24 (full scale 1.0, 1.0, 1.0) so default node dimensions match OBJ (0.25m circumference x 28m)
bpy.context.scene.frame_set(TOTAL_FRAMES)
obj.scale = (1.000, 1.000, 1.000)

# Export GLB with +Y up (maps Blender -Y forward to XR +Z forward)
bpy.ops.export_scene.gltf(
    filepath=str(TEMP_EXPORT_GLB),
    export_format='GLB',
    export_yup=True,
    export_animations=True
)

# Post-process GLB to explicitly ensure base node 0 rest scale is [1.0, 1.0, 1.0] (matching OBJ dimensions)
with open(str(TEMP_EXPORT_GLB), 'rb') as f:
    glb_data = f.read()

magic, version, total_len = struct.unpack('<4sII', glb_data[:12])
chunk0_len, chunk0_type = struct.unpack('<II', glb_data[12:20])
json_bytes = glb_data[20:20+chunk0_len]
gltf_json = json.loads(json_bytes.decode('utf-8'))

# Set root node rest scale to [1.0, 1.0, 1.0]
gltf_json['nodes'][0]['scale'] = [1.0, 1.0, 1.0]

new_json_bytes = json.dumps(gltf_json, separators=(',', ':')).encode('utf-8')
pad = (4 - (len(new_json_bytes) % 4)) % 4
new_json_bytes += b' ' * pad

new_chunk0_len = len(new_json_bytes)
bin_chunk = glb_data[20+chunk0_len:]
new_total_len = 12 + 8 + new_chunk0_len + len(bin_chunk)

new_header = struct.pack('<4sII', magic, version, new_total_len)
new_chunk0_header = struct.pack('<II', new_chunk0_len, chunk0_type)
final_glb_data = new_header + new_chunk0_header + new_json_bytes + bin_chunk

with open(str(TEMP_EXPORT_GLB), 'wb') as f:
    f.write(final_glb_data)

shutil.copy2(TEMP_EXPORT_GLB, DEST_MOBILE_GLB)
shutil.copy2(TEMP_EXPORT_GLB, DEST_MIRROR_GLB)
shutil.copy2(TEMP_EXPORT_GLB, DEST_MESHY_GLB)

if os.path.exists(TEMP_EXPORT_GLB):
    os.remove(TEMP_EXPORT_GLB)

# Export OBJ as companion asset with full unscaled 28m geometry (scale=1,1,1)
obj.scale = (1.000, 1.000, 1.000)
bpy.ops.wm.obj_export(
    filepath=str(DEST_OBJ),
    export_selected_objects=True,
    export_uv=True,
    export_normals=True,
    export_materials=True
)
obj.scale = (1.000, 1.000, 1.000)

# Copy texture assets into cyan_laser_rod_4_textures directories
src_tex_dir = FRONTEND_DIR / "meshy_test_0" / "models" / "cyan_laser_rod_2" / "cyan_laser_rod_2_textures"
for f in src_tex_dir.glob("*.png"):
    shutil.copy2(f, DEST_MESHY_TEX_DIR / f.name)
    shutil.copy2(f, DEST_YEST_TEX_DIR / f.name)

# Generate materials JSON
materials_data = {
    "model": f"{MODEL_NAME}.glb",
    "base_name": MODEL_NAME,
    "exported_at": "2026-11-18T04:47:00.000Z",
    "specifications": {
        "circumference_meters": 0.25,
        "radius_meters": round(TARGET_RADIUS, 6),
        "diameter_meters": round(TARGET_DIAMETER, 6),
        "width_meters": round(TARGET_WIDTH, 6),
        "height_meters": round(TARGET_HEIGHT, 6),
        "length_meters": round(LENGTH, 6),
        "blender_coordinates": {
            "pivot_point": [0.0, 0.0, 0.0],
            "start_coordinate": [0.0, 0.0, 0.0],
            "end_coordinate": [0.0, -round(LENGTH, 6), 0.0],
            "forward_axis": "-Y (Blender Front / Forward)",
            "cross_section_width_x": round(TARGET_WIDTH, 6),
            "cross_section_height_z": round(TARGET_HEIGHT, 6),
            "both_ends_capped": True
        },
        "xr_gltf_coordinates": {
            "pivot_point": [0.0, 0.0, 0.0],
            "start_coordinate": [0.0, 0.0, 0.0],
            "end_coordinate": [0.0, 0.0, round(LENGTH, 6)],
            "forward_axis": "+Z (XR / glTF Forward)",
            "cross_section_width_x": round(TARGET_WIDTH, 6),
            "cross_section_height_y": round(TARGET_HEIGHT, 6),
            "both_ends_capped": True
        },
        "animation": {
            "name": "Laser_Flight_Extension",
            "blender_extension_axis": "-Y",
            "xr_extension_axis": "+Z",
            "duration_seconds": 0.8,
            "fps": 30,
            "total_frames": 24,
            "base_scale": [1.0, 1.0, 1.0],
            "keyframes": "Strict linear extension taking 0.8 seconds: starts at length 0.000m (t=0.00s, scale=[1,1,0]) and extends continuously to 28.000m (t=0.80s, scale=[1,1,1]) down +Z axis with constant 0.25m circumference"
        }
    },
    "color_palette": [
        "#FFFFFF",
        "#00F8FF"
    ],
    "materials": [
        {
            "name": "Material_Cyan_Laser",
            "type": "MeshStandardMaterial",
            "color": "#FFFFFF",
            "emissive": "#00F8FF",
            "roughness": 0.15,
            "metalness": 0.85,
            "opacity": 1,
            "wireframe": False,
            "textures": {
                "base_color": "texture_0_base_color",
                "normal": "texture_0_normal",
                "roughness": "texture_0_metallicRoughness",
                "metallic": "texture_0_metallicRoughness"
            }
        }
    ],
    "companion_files": [
        f"{MODEL_NAME}.glb",
        f"{MODEL_NAME}.obj",
        f"{MODEL_NAME}.mtl",
        f"{MODEL_NAME}_materials.json",
        f"{MODEL_NAME}_textures/texture_0_base_color.png",
        f"{MODEL_NAME}_textures/texture_0_emissive.png",
        f"{MODEL_NAME}_textures/texture_0_metallic.png",
        f"{MODEL_NAME}_textures/texture_0_normal.png",
        f"{MODEL_NAME}_textures/texture_0_roughness.png",
        f"{MODEL_NAME}_textures/thumbnail.png"
    ]
}

with open(DEST_JSON, "w", encoding="utf-8") as f:
    json.dump(materials_data, f, indent=4)

shutil.copy2(DEST_JSON, DEST_MOBILE_JSON)
shutil.copy2(DEST_JSON, DEST_MIRROR_JSON)

print(f"Export completed successfully for {MODEL_NAME}!")
