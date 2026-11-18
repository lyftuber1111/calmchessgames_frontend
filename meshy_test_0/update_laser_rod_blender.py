import bpy
import mathutils
import math
import shutil
import json
import os
from pathlib import Path

# Paths
FRONTEND_DIR = Path(r"C:\Users\lyftu\gemini_3\updated_html_js_0\calmchessgames_frontend")
SRC_GLB = FRONTEND_DIR / "wormhole0" / "mobile" / "warp_origin_images" / "cyan_laser_rod.glb"
DEST_MOBILE_GLB = FRONTEND_DIR / "wormhole0" / "mobile" / "warp_origin_images" / "cyan_laser_rod.glb"
DEST_MIRROR_GLB = FRONTEND_DIR / "wormhole0" / "warp_origin_images" / "cyan_laser_rod.glb"
DEST_MESHY_GLB  = FRONTEND_DIR / "meshy_test_0" / "models" / "cyan_laser_rod" / "cyan_laser_rod.glb"

TEMP_EXPORT_GLB = FRONTEND_DIR / "wormhole0" / "mobile" / "warp_origin_images" / "cyan_laser_rod_blender_out.glb"

print("==================================================")
print("UPDATING CYAN LASER ROD GLB USING BLENDER")
print("==================================================")

# 1. Reset Blender to factory settings
bpy.ops.wm.read_factory_settings(use_empty=True)

# 2. Import existing GLB
bpy.ops.import_scene.gltf(filepath=str(SRC_GLB))

obj = bpy.data.objects.get("CyanLaserRod_Root")
if not obj:
    raise RuntimeError("CyanLaserRod_Root object not found in imported GLB")

mesh = obj.data

print("Original mesh vertex count:", len(mesh.vertices))
orig_ys = [v.co.y for v in mesh.vertices]
min_y = min(orig_ys)
max_y = max(orig_ys)
print(f"Original Y range in Blender: [{min_y:.6f}, {max_y:.6f}]")

# Step 1: Move pivot point to farthest end on Y axis
# Farthest end is at min_y = -23.809525.
# Moving the pivot point to that end means translating mesh vertices by -min_y along Y:
offset_y = -min_y # +23.809525

# Step 2: Move that end so it starts at +Z 0 so the animation only extends down +Z axis
# Rotation 90 degrees around X axis:
# x' = x, y' = -z, z' = y
rot_x_90 = mathutils.Matrix.Rotation(math.radians(90.0), 4, 'X')
trans_y = mathutils.Matrix.Translation((0.0, offset_y, 0.0))
combined_transform = rot_x_90 @ trans_y

mesh.transform(combined_transform)
mesh.update()

# Verify geometry
xs = [v.co.x for v in mesh.vertices]
ys = [v.co.y for v in mesh.vertices]
zs = [v.co.z for v in mesh.vertices]
radius_x = (max(xs) - min(xs)) / 2.0
radius_y = (max(ys) - min(ys)) / 2.0
circumference = 2.0 * math.pi * radius_x
length_z = max(zs) - min(zs)

print(f"Transformed Mesh Bounds:")
print(f"  X: [{min(xs):.6f}, {max(xs):.6f}] (Radius: {radius_x:.6f} m)")
print(f"  Y: [{min(ys):.6f}, {max(ys):.6f}] (Radius: {radius_y:.6f} m)")
print(f"  Z: [{min(zs):.6f}, {max(zs):.6f}] (Length: {length_z:.6f} m)")
print(f"Circumference: {circumference:.6f} m (Target: 0.25 m)")
print(f"Start at +Z: {min(zs):.6f} m, End at +Z: {max(zs):.6f} m")

# Step 3: Remove old actions to ensure exact clean action naming
for act in list(bpy.data.actions):
    bpy.data.actions.remove(act)

if obj.animation_data:
    obj.animation_data_clear()

obj.animation_data_create()
action = bpy.data.actions.new(name="Laser_Flight_Extension")
obj.animation_data.action = action

# Keyframes:
# Linear extension along Z from 0.001 to 1.000
# Mild radial energy pulse on X and Y (1.0 -> 1.04 -> 1.0 -> 1.04 -> 1.0)
keyframes = [
    (0.0,  (1.0,  1.0,  0.001)),
    (4.8,  (1.04, 1.04, 0.250)),
    (9.6,  (1.00, 1.00, 0.500)),
    (14.4, (1.04, 1.04, 0.750)),
    (19.2, (1.00, 1.00, 1.000)),
    (24.0, (1.00, 1.00, 1.000)),
]

for frame, scale in keyframes:
    obj.scale = scale
    obj.keyframe_insert(data_path="scale", frame=frame)

# Set interpolation to linear
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

bpy.context.scene.frame_start = 0
bpy.context.scene.frame_end = 24

# Step 4: Export to temporary GLB
bpy.ops.export_scene.gltf(
    filepath=str(TEMP_EXPORT_GLB),
    export_format='GLB',
    export_yup=True,
    export_animations=True
)

print(f"Exported to temp GLB: {TEMP_EXPORT_GLB} (Size: {os.path.getsize(TEMP_EXPORT_GLB)} bytes)")

# Replace targets with new GLB
shutil.copy2(TEMP_EXPORT_GLB, DEST_MOBILE_GLB)
shutil.copy2(TEMP_EXPORT_GLB, DEST_MIRROR_GLB)
shutil.copy2(TEMP_EXPORT_GLB, DEST_MESHY_GLB)

if os.path.exists(TEMP_EXPORT_GLB):
    os.remove(TEMP_EXPORT_GLB)

print("Updated destination files:")
print(f"  -> {DEST_MOBILE_GLB}")
print(f"  -> {DEST_MIRROR_GLB}")
print(f"  -> {DEST_MESHY_GLB}")
print("Blender update completed successfully!")
