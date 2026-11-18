import bpy
import mathutils
import math
import shutil
import json
import os
from pathlib import Path

FRONTEND_DIR = Path(r"C:\Users\lyftu\gemini_3\updated_html_js_0\calmchessgames_frontend")
SRC_GLB = FRONTEND_DIR / "wormhole0" / "mobile" / "warp_origin_images" / "cyan_laser_rod_1.glb"
DEST_MOBILE_GLB = FRONTEND_DIR / "wormhole0" / "mobile" / "warp_origin_images" / "cyan_laser_rod_1.glb"
DEST_MIRROR_GLB = FRONTEND_DIR / "wormhole0" / "warp_origin_images" / "cyan_laser_rod_1.glb"
DEST_MESHY_DIR  = FRONTEND_DIR / "meshy_test_0" / "models" / "cyan_laser_rod_1"
DEST_MESHY_GLB  = DEST_MESHY_DIR / "cyan_laser_rod_1.glb"
DEST_OBJ        = DEST_MESHY_DIR / "cyan_laser_rod_1.obj"
TEMP_EXPORT_GLB = FRONTEND_DIR / "wormhole0" / "mobile" / "warp_origin_images" / "cyan_laser_rod_1_blender_out.glb"

DEST_MESHY_DIR.mkdir(parents=True, exist_ok=True)

print("==================================================")
print("BUILDING CYAN LASER ROD 1 (BLENDER -Y / XR +Z FORWARD)")
print("Circumference: 0.025m | Pivot at Z 0 extending down +Z")
print("==================================================")

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SRC_GLB))

obj = bpy.data.objects.get("CyanLaserRod_Root")
if not obj:
    # Try finding mesh object
    for o in bpy.data.objects:
        if o.type == 'MESH':
            obj = o
            break
if not obj:
    raise RuntimeError("No suitable mesh object found in imported GLB")

mesh = obj.data

# Target specs:
TARGET_CIRCUMFERENCE = 0.025 # meters
TARGET_RADIUS = TARGET_CIRCUMFERENCE / (2.0 * math.pi) # ~0.003978873577 m
LENGTH = 23.809524536132812 # meters (10000 / 420)

# Inspect current bounds
xs = [v.co.x for v in mesh.vertices]
ys = [v.co.y for v in mesh.vertices]
zs = [v.co.z for v in mesh.vertices]

print(f"Current Blender bounds: X=[{min(xs):.6f}, {max(xs):.6f}], Y=[{min(ys):.6f}, {max(ys):.6f}], Z=[{min(zs):.6f}, {max(zs):.6f}]")

# Current radius in X and Z:
curr_radius_x = max(abs(min(xs)), abs(max(xs)))
curr_radius_z = max(abs(min(zs)), abs(max(zs)))
scale_factor_x = TARGET_RADIUS / curr_radius_x if curr_radius_x > 0 else 1.0
scale_factor_z = TARGET_RADIUS / curr_radius_z if curr_radius_z > 0 else 1.0

print(f"Scaling cross section: scale_x={scale_factor_x:.6f}, scale_z={scale_factor_z:.6f} to achieve radius {TARGET_RADIUS:.6f}m")

# Apply scaling to vertices and ensure Y goes from 0 to -LENGTH (Blender forward -Y)
# Check Y orientation:
y_min = min(ys)
y_max = max(ys)

for v in mesh.vertices:
    # Scale cross section to exact 0.025m circumference
    v.co.x = v.co.x * scale_factor_x
    v.co.z = v.co.z * scale_factor_z
    
    # Ensure start is exactly at Y=0 and end extends to -LENGTH
    # If Y is already between -LENGTH and 0:
    t = (v.co.y - y_max) / (y_min - y_max) if abs(y_min - y_max) > 1e-4 else 0.0
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
print(f"Start cap vertices (at Y=0): {len(cap_start)}")
print(f"End cap vertices (at Y=-{LENGTH:.4f}): {len(cap_end)}")

# Ensure clean animation
for act in list(bpy.data.actions):
    bpy.data.actions.remove(act)

if obj.animation_data:
    obj.animation_data_clear()

obj.animation_data_create()
action = bpy.data.actions.new(name="Laser_Flight_Extension")
obj.animation_data.action = action

# Blender forward is -Y. In glTF export with export_yup=True:
# Blender -Y maps to XR +Z forward!
# Scaling along Blender Y axis scales along XR +Z forward axis!
keyframes = [
    (0.0,  (1.00, 0.001, 1.00)),
    (4.8,  (1.04, 0.250, 1.04)),
    (9.6,  (1.00, 0.500, 1.00)),
    (14.4, (1.04, 0.750, 1.04)),
    (19.2, (1.00, 1.000, 1.00)),
    (24.0, (1.00, 1.000, 1.00)),
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

# Set initial scale to frame 0
obj.scale = (1.00, 0.001, 1.00)

bpy.context.scene.frame_start = 0
bpy.context.scene.frame_end = 24

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
    export_selected_objects=False,
    export_uv=True,
    export_normals=True,
    export_materials=True
)

print("Export completed successfully!")
