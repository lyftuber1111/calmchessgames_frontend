import bpy
import mathutils
import math
import shutil
import json
import os
import struct
from pathlib import Path

# Paths
FRONTEND_DIR = Path(r"C:\Users\lyftu\gemini_3\updated_html_js_0\calmchessgames_frontend")
SRC_GLB = FRONTEND_DIR / "wormhole0" / "mobile" / "warp_origin_images" / "cyan_laser_rod.glb"
DEST_MOBILE_GLB = FRONTEND_DIR / "wormhole0" / "mobile" / "warp_origin_images" / "cyan_laser_rod.glb"
DEST_MIRROR_GLB = FRONTEND_DIR / "wormhole0" / "warp_origin_images" / "cyan_laser_rod.glb"
DEST_MESHY_GLB  = FRONTEND_DIR / "meshy_test_0" / "models" / "cyan_laser_rod" / "cyan_laser_rod.glb"
DEST_OBJ        = FRONTEND_DIR / "meshy_test_0" / "models" / "cyan_laser_rod" / "cyan_laser_rod.obj"
TEMP_EXPORT_GLB = FRONTEND_DIR / "wormhole0" / "mobile" / "warp_origin_images" / "cyan_laser_rod_blender_out.glb"

print("==================================================")
print("BUILDING CYAN LASER ROD (BLENDER -Y / XR +Z FORWARD)")
print("==================================================")

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SRC_GLB))

obj = bpy.data.objects.get("CyanLaserRod_Root")
if not obj:
    raise RuntimeError("CyanLaserRod_Root not found")

mesh = obj.data

# Ensure clean bounds in Blender:
# Pivot at Y=0, extending along -Y to -23.809525 (Blender forward, corresponding to +Z forward in XR)
# Cross-section in X and Z with radius ~0.039789 m (circumference = 0.25 m)
xs = [v.co.x for v in mesh.vertices]
ys = [v.co.y for v in mesh.vertices]
zs = [v.co.z for v in mesh.vertices]

print(f"Blender bounds: X=[{min(xs):.4f}, {max(xs):.4f}], Y=[{min(ys):.4f}, {max(ys):.4f}], Z=[{min(zs):.4f}, {max(zs):.4f}]")

# Ensure clean animation
for act in list(bpy.data.actions):
    bpy.data.actions.remove(act)

if obj.animation_data:
    obj.animation_data_clear()

obj.animation_data_create()
action = bpy.data.actions.new(name="Laser_Flight_Extension")
obj.animation_data.action = action

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

# Export GLB with +Y up (which maps Blender -Y forward to XR +Z forward)
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

bpy.ops.wm.obj_export(
    filepath=str(DEST_OBJ),
    export_selected_objects=False,
    export_uv=True,
    export_normals=True,
    export_materials=True
)

print("Export completed successfully!")
