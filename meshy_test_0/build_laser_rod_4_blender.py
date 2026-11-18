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

print("==================================================")
print("BUILDING CYAN LASER ROD 4 (XR +Z FORWARD / 28m / 0.8s)")
print("Circumference: 0.25m | Pivot at +Z 0 extending down +Z")
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

# Target specs:
TARGET_CIRCUMFERENCE = 0.25 # meters
TARGET_RADIUS = TARGET_CIRCUMFERENCE / (2.0 * math.pi) # ~0.03978873577 m
LENGTH = 28.0 # meters (strictly 28m long as requested)

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
    # Scale cross section to exact 0.25m circumference
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

print(f"New Blender bounds: X=[{min(xs_new):.6f}, {max(xs_new):.6f}], Y=[{min(ys_new):.6f}, {max(ys_new):.6f}], Z=[{min(zs_new):.6f}, {max(zs_new):.6f}]")

# Verify caps
cap_start = [v for v in mesh.vertices if abs(v.co.y - 0.0) < 1e-4]
cap_end   = [v for v in mesh.vertices if abs(v.co.y - (-LENGTH)) < 1e-4]
print(f"Start cap vertices (at Y=0.0): {len(cap_start)}")
print(f"End cap vertices (at Y=-{LENGTH:.1f}m): {len(cap_end)}")

# Animation setup:
# Strictly 0.8 seconds duration!
# At 30 FPS: 0.8s * 30 = 24 frames
bpy.context.scene.render.fps = 30
bpy.context.scene.render.fps_base = 1.0
bpy.context.scene.frame_start = 0
bpy.context.scene.frame_end = 24

for act in list(bpy.data.actions):
    bpy.data.actions.remove(act)

if obj.animation_data:
    obj.animation_data_clear()

obj.animation_data_create()
action = bpy.data.actions.new(name="Laser_Flight_Extension")
obj.animation_data.action = action

# Blender forward is -Y. In glTF export with export_yup=True:
# Blender -Y maps to XR +Z forward.
# Scaling along Blender Y axis scales along XR +Z forward axis!
# Keyframes across 0.80 seconds (24 frames at 30 fps):
# Frame 0 begins strictly at +Z 0 (scale 0.000 / length 0) and expands down +Z axis to full 28m
keyframes = [
    (0.0,  (1.00, 0.000, 1.00)), # t = 0.00s: laser begins at origin (+Z 0, length 0m)
    (4.8,  (1.03, 0.250, 1.03)), # t = 0.16s: 25% extension (7m) with subtle plasma pulse
    (9.6,  (1.00, 0.500, 1.00)), # t = 0.32s: 50% extension (14m)
    (14.4, (1.03, 0.750, 1.03)), # t = 0.48s: 75% extension (21m) with subtle plasma pulse
    (19.2, (1.00, 1.000, 1.00)), # t = 0.64s: 100% full extension (28m)
    (24.0, (1.00, 1.000, 1.00)), # t = 0.80s: fully extended hold
]

for frame, scale in keyframes:
    obj.scale = scale
    obj.keyframe_insert(data_path="scale", frame=frame)

# Set linear interpolation
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

# Set initial scale to frame 0 (starts at +Z 0)
obj.scale = (1.00, 0.000, 1.00)

# Export GLB with +Y up (maps Blender -Y forward to XR +Z forward)
bpy.ops.export_scene.gltf(
    filepath=str(TEMP_EXPORT_GLB),
    export_format='GLB',
    export_yup=True,
    export_animations=True
)

shutil.copy2(TEMP_EXPORT_GLB, DEST_MOBILE_GLB)
shutil.copy2(TEMP_EXPORT_GLB, DEST_MIRROR_GLB)
shutil.copy2(TEMP_EXPORT_GLB, DEST_MESHY_GLB)

if os.path.exists(TEMP_EXPORT_GLB):
    os.remove(TEMP_EXPORT_GLB)

# Export OBJ as companion asset
bpy.ops.wm.obj_export(
    filepath=str(DEST_OBJ),
    export_selected_objects=True,
    export_uv=True,
    export_normals=True,
    export_materials=True
)

# Copy texture assets into cyan_laser_rod_4_textures directories
src_tex_dir = FRONTEND_DIR / "meshy_test_0" / "models" / "cyan_laser_rod_2" / "cyan_laser_rod_2_textures"
for f in src_tex_dir.glob("*.png"):
    shutil.copy2(f, DEST_MESHY_TEX_DIR / f.name)
    shutil.copy2(f, DEST_YEST_TEX_DIR / f.name)

# Generate materials JSON
materials_data = {
    "model": f"{MODEL_NAME}.glb",
    "base_name": MODEL_NAME,
    "exported_at": "2026-11-18T02:42:00.000Z",
    "specifications": {
        "circumference_meters": 0.25,
        "radius_meters": round(TARGET_RADIUS, 6),
        "diameter_meters": round(TARGET_RADIUS * 2.0, 6),
        "length_meters": round(LENGTH, 6),
        "blender_coordinates": {
            "pivot_point": [0.0, 0.0, 0.0],
            "start_coordinate": [0.0, 0.0, 0.0],
            "end_coordinate": [0.0, -round(LENGTH, 6), 0.0],
            "forward_axis": "-Y (Blender Front / Forward)",
            "both_ends_capped": True
        },
        "xr_gltf_coordinates": {
            "pivot_point": [0.0, 0.0, 0.0],
            "start_coordinate": [0.0, 0.0, 0.0],
            "end_coordinate": [0.0, 0.0, round(LENGTH, 6)],
            "forward_axis": "+Z (XR / glTF Forward)",
            "both_ends_capped": True
        },
        "animation": {
            "name": "Laser_Flight_Extension",
            "blender_extension_axis": "-Y",
            "xr_extension_axis": "+Z",
            "duration_seconds": 0.8,
            "fps": 30,
            "total_frames": 24,
            "keyframes": "Scale extends from 0.000 to 1.000 starting at origin (0, 0, 0) over strictly 0.8 seconds down +Z axis"
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
