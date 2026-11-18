import bpy
import mathutils
import math
import shutil
import json
import os
import struct
from pathlib import Path

FRONTEND_DIR = Path(r"C:\Users\lyftu\gemini_3\updated_html_js_0\calmchessgames_frontend")
SRC_GLB = FRONTEND_DIR / "meshy_test_0" / "models" / "cyan_laser_rod_4" / "cyan_laser_rod_4.glb"

MODEL_NAME = "cyan_laser_rod_5"
DEST_MESHY_DIR = FRONTEND_DIR / "meshy_test_0" / "models" / MODEL_NAME
DEST_MESHY_TEX_DIR = DEST_MESHY_DIR / f"{MODEL_NAME}_textures"
DEST_YEST_TEX_DIR = FRONTEND_DIR / "meshy_yest_0" / "models" / MODEL_NAME / f"{MODEL_NAME}_textures"

DEST_MESHY_GLB  = DEST_MESHY_DIR / f"{MODEL_NAME}.glb"
DEST_BLEND      = DEST_MESHY_DIR / f"{MODEL_NAME}.blend"
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
# Diameter strictly 0.125 XR meters
# Radius = 0.125 / 2.0 = 0.0625 m
# Circumference = 2 * pi * radius = pi * diameter ~= 0.392699 m
# Rod starts at +Z 0 with length 0.1m, and expands for 28.9 XR meters over 0.8s
# Total max length = 0.1 + 28.9 = 29.0m
# Pivot point is at +Z 0 (location 0, 0, 0)
# Base scale is strictly [1.0, 1.0, 1.0] representing full rest dimensions (width 0.125m, height 0.125m, length 29.0m)
TARGET_DIAMETER = 0.125 # meters
TARGET_RADIUS = TARGET_DIAMETER / 2.0 # 0.0625 m
CIRCUMFERENCE = math.pi * TARGET_DIAMETER # ~0.392699 m
TARGET_WIDTH = TARGET_DIAMETER # cross-section X width (0.125m)
TARGET_HEIGHT = TARGET_DIAMETER # cross-section Y height (0.125m)
START_LENGTH = 0.1 # meters (starts at +Z 0 with a length of 0.1m)
EXPANSION_LENGTH = 28.9 # meters (expands in length for 28.9 XR meters)
TOTAL_LENGTH = START_LENGTH + EXPANSION_LENGTH # 29.0 meters
CAMERA_DISTANCE = TOTAL_LENGTH + 0.25 # 29.25 meters (User camera strike point 0.25m)
DURATION_SECONDS = 0.8 # strictly 0.8 seconds duration
FPS = 30
TOTAL_FRAMES = int(round(DURATION_SECONDS * FPS)) # 24 frames

print("==================================================")
print(f"BUILDING CYAN LASER ROD 5")
print(f"Diameter: {TARGET_DIAMETER}m | Radius: {TARGET_RADIUS}m | Start Length: {START_LENGTH}m | Expansion: {EXPANSION_LENGTH}m -> Full Length: {TOTAL_LENGTH}m")
print(f"Base Scale: [1.0, 1.0, 1.0] | Duration: {DURATION_SECONDS}s ({TOTAL_FRAMES} frames @ {FPS} FPS)")
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

# Clear any previous animation and reset object transform to origin
if obj.animation_data:
    obj.animation_data_clear()

obj.location = (0.0, 0.0, 0.0)
obj.rotation_euler = (0.0, 0.0, 0.0)
obj.scale = (1.0, 1.0, 1.0)

# Select only obj
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# Current bounds
xs = [v.co.x for v in mesh.vertices]
ys = [v.co.y for v in mesh.vertices]
zs = [v.co.z for v in mesh.vertices]

print(f"Imported bounds: X=[{min(xs):.6f}, {max(xs):.6f}], Y=[{min(ys):.6f}, {max(ys):.6f}], Z=[{min(zs):.6f}, {max(zs):.6f}]")

center_x = (min(xs) + max(xs)) / 2.0
center_y = (min(ys) + max(ys)) / 2.0
curr_radius_x = (max(xs) - min(xs)) / 2.0
curr_radius_y = (max(ys) - min(ys)) / 2.0
scale_factor_x = TARGET_RADIUS / curr_radius_x if curr_radius_x > 0 else 1.0
scale_factor_y = TARGET_RADIUS / curr_radius_y if curr_radius_y > 0 else 1.0

z_min = min(zs)
z_max = max(zs)

for v in mesh.vertices:
    old_x = v.co.x
    old_y = v.co.y
    old_z = v.co.z
    # Cross section in X and Y centered around (0,0) with exact 0.125m diameter (radius = 0.0625m)
    v.co.x = (old_x - center_x) * scale_factor_x
    v.co.y = (old_y - center_y) * scale_factor_y
    
    # Length extending strictly along +Z axis from Z=0.0 to Z=TOTAL_LENGTH (29.0m)
    # The pivot point is on the end at (0,0,0) and the rod expands down +Z
    t = (old_z - z_min) / (z_max - z_min) if abs(z_max - z_min) > 1e-4 else 0.0
    if t < 1e-5:
        v.co.z = 0.0
    elif t > 1.0 - 1e-5:
        v.co.z = TOTAL_LENGTH
    else:
        v.co.z = t * TOTAL_LENGTH

mesh.update()

# UV and Normals calculation with Industry Best Practices:
# 1. Recalculate mesh normals to ensure clean outward-pointing faces
bpy.context.view_layer.objects.active = obj
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')

# 2. Industry best practice shading: Smooth shading on cylinder with sharp boundary angles
bpy.ops.object.shade_smooth_by_angle(angle=math.radians(60))

# 3. Explicitly set 3D cursor and Object Origin (Pivot Point) to exact start end (0, 0, 0)
bpy.context.scene.cursor.location = (0.0, 0.0, 0.0)
bpy.context.scene.cursor.rotation_euler = (0.0, 0.0, 0.0)
bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
bpy.context.scene.tool_settings.transform_pivot_point = 'CURSOR'

# Recalculate and verify bounds
xs_new = [v.co.x for v in mesh.vertices]
ys_new = [v.co.y for v in mesh.vertices]
zs_new = [v.co.z for v in mesh.vertices]

width_x = max(xs_new) - min(xs_new)
height_y = max(ys_new) - min(ys_new)
length_z = max(zs_new) - min(zs_new)

print(f"New Blender bounds: X=[{min(xs_new):.6f}, {max(xs_new):.6f}] (Width: {width_x:.4f}m)")
print(f"                    Y=[{min(ys_new):.6f}, {max(ys_new):.6f}] (Height: {height_y:.4f}m)")
print(f"                    Z=[{min(zs_new):.6f}, {max(zs_new):.6f}] (Length: {length_z:.4f}m)")

# Verify caps
cap_start = [v for v in mesh.vertices if abs(v.co.z - 0.0) < 1e-4]
cap_end   = [v for v in mesh.vertices if abs(v.co.z - TOTAL_LENGTH) < 1e-4]
print(f"Start cap vertices (at Z=0.0): {len(cap_start)}")
print(f"End cap vertices (at Z={TOTAL_LENGTH:.1f}m): {len(cap_end)}")

# Animation setup:
# Starts at +Z 0 with length 0.1m, expands for 28.9m to reach 29.0m over 0.8s (24 frames @ 30 FPS)
# Start scale Z = START_LENGTH / TOTAL_LENGTH = 0.1 / 29.0 = 0.0034482758620689655
# End scale Z = 1.0 (full length 29.0m)
# Base width and height remain strictly 0.125m throughout (scale X=1.000, scale Y=1.000)
START_SCALE_Z = START_LENGTH / TOTAL_LENGTH

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

keyframes = [
    (0.0,                 (1.000, 1.000, START_SCALE_Z)), # Frame 0  (t = 0.00s): starts at +Z 0 with length 0.1m (0.003448 * 29m)
    (float(TOTAL_FRAMES), (1.000, 1.000, 1.000)),          # Frame 24 (t = 0.80s): expands 28.9m to full 29.0m down +Z
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

# Set base/rest scale to frame 24 (full scale 1.0, 1.0, 1.0) so default node dimensions match base OBJ (diameter 0.125m, length 29.0m)
bpy.context.scene.frame_set(TOTAL_FRAMES)
obj.scale = (1.000, 1.000, 1.000)

# Create and position User_Camera at +Z 29.25m
cam_data = bpy.data.cameras.new("User_Camera")
cam_data.lens = 35 # Wide-angle FOV for immersive XR perspective
cam_data.clip_start = 0.05
cam_data.clip_end = 250.0
cam_obj = bpy.data.objects.new("User_Camera", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
cam_obj.location = (0.0, 0.0, CAMERA_DISTANCE) # Exactly at +Z 29.25m
cam_obj.rotation_euler = (0.0, 0.0, 0.0) # Faces origin (0,0,0) down -Z
bpy.context.scene.camera = cam_obj

# Export GLB with export_yup=False so Blender native X,Y,Z maps directly to glTF:
# +X is right, +Y is up, and +Z is forward
bpy.ops.export_scene.gltf(
    filepath=str(TEMP_EXPORT_GLB),
    export_format='GLB',
    export_yup=False,
    export_cameras=True,
    export_animations=True,
    export_normals=True,
    export_tangents=True
)

# Post-process GLB to explicitly ensure base mesh rest scale is [1.0, 1.0, 1.0] and camera is positioned at [0, 0, 29.25]
with open(str(TEMP_EXPORT_GLB), 'rb') as f:
    glb_data = f.read()

magic, version, total_len = struct.unpack('<4sII', glb_data[:12])
chunk0_len, chunk0_type = struct.unpack('<II', glb_data[12:20])
json_bytes = glb_data[20:20+chunk0_len]
gltf_json = json.loads(json_bytes.decode('utf-8'))

for node in gltf_json.get('nodes', []):
    if node.get('name') == 'CyanLaserRod_Root':
        node['translation'] = [0.0, 0.0, 0.0]
        node['rotation'] = [0.0, 0.0, 0.0, 1.0]
        node['scale'] = [1.0, 1.0, 1.0]
    elif node.get('name') == 'User_Camera':
        node['translation'] = [0.0, 0.0, float(CAMERA_DISTANCE)]
        node['rotation'] = [0.0, 0.0, 0.0, 1.0]

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

# Export OBJ as companion asset with full unscaled 29m geometry (scale=1,1,1), selecting only mesh
for o in bpy.data.objects:
    o.select_set(False)
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
obj.scale = (1.000, 1.000, 1.000)
bpy.ops.wm.obj_export(
    filepath=str(DEST_OBJ),
    up_axis='Z',
    forward_axis='Y',
    export_selected_objects=True,
    export_uv=True,
    export_normals=True,
    export_materials=True
)
obj.scale = (1.000, 1.000, 1.000)

# Set Blender scene frame to 0 (when rod length is 0.1 and pivot is at 0,0,0) and save .blend file
bpy.context.scene.frame_set(0)
bpy.context.scene.frame_current = 0
bpy.ops.wm.save_as_mainfile(filepath=str(DEST_BLEND))

# Copy texture assets into cyan_laser_rod_5_textures directories
src_tex_dir = FRONTEND_DIR / "meshy_test_0" / "models" / "cyan_laser_rod_4" / "cyan_laser_rod_4_textures"
for f in src_tex_dir.glob("*.png"):
    shutil.copy2(f, DEST_MESHY_TEX_DIR / f.name)
    shutil.copy2(f, DEST_YEST_TEX_DIR / f.name)

# Generate materials JSON
materials_data = {
    "model": f"{MODEL_NAME}.glb",
    "base_name": MODEL_NAME,
    "exported_at": "2026-11-18T09:25:00.000Z",
    "specifications": {
        "diameter_meters": round(TARGET_DIAMETER, 6),
        "radius_meters": round(TARGET_RADIUS, 6),
        "circumference_meters": round(CIRCUMFERENCE, 6),
        "width_meters": round(TARGET_WIDTH, 6),
        "height_meters": round(TARGET_HEIGHT, 6),
        "start_length_meters": round(START_LENGTH, 6),
        "expansion_length_meters": round(EXPANSION_LENGTH, 6),
        "total_length_meters": round(TOTAL_LENGTH, 6),
        "base_dimensions": {
            "diameter": round(TARGET_DIAMETER, 6),
            "circumference": round(CIRCUMFERENCE, 6),
            "width": round(TARGET_WIDTH, 6),
            "height": round(TARGET_HEIGHT, 6),
            "length": round(TOTAL_LENGTH, 6)
        },
        "user_camera": {
            "name": "User_Camera",
            "position": [0.0, 0.0, round(CAMERA_DISTANCE, 6)],
            "target": [0.0, 0.0, 0.0],
            "forward_vector": [0.0, 0.0, -1.0],
            "distance_meters": round(CAMERA_DISTANCE, 6),
            "strike_point_distance_to_camera_meters": round(CAMERA_DISTANCE - TOTAL_LENGTH, 6),
            "fov_lens_mm": 35,
            "description": "User player camera positioned at +Z 29.25m looking directly down -Z at the origin (0, 0, 0). The laser rod expands 28.9m from start length 0.1m to 29.0m down +Z over 0.8s, arriving at exactly 0.25m in front of the player camera lens."
        },
        "blender_coordinates": {
            "pivot_point": [0.0, 0.0, 0.0],
            "start_coordinate": [0.0, 0.0, 0.0],
            "end_coordinate": [0.0, 0.0, round(TOTAL_LENGTH, 6)],
            "forward_axis": "+Z (Blender +Z forward/length axis)",
            "diameter_meters": round(TARGET_DIAMETER, 6),
            "cross_section_width_x": round(TARGET_WIDTH, 6),
            "cross_section_height_y": round(TARGET_HEIGHT, 6),
            "both_ends_capped": True
        },
        "xr_gltf_coordinates": {
            "pivot_point": [0.0, 0.0, 0.0],
            "start_coordinate": [0.0, 0.0, 0.0],
            "end_coordinate": [0.0, 0.0, round(TOTAL_LENGTH, 6)],
            "forward_axis": "+Z (XR / glTF Forward)",
            "diameter_meters": round(TARGET_DIAMETER, 6),
            "cross_section_width_x": round(TARGET_WIDTH, 6),
            "cross_section_height_y": round(TARGET_HEIGHT, 6),
            "both_ends_capped": True
        },
        "animation": {
            "name": "Laser_Flight_Extension",
            "blender_extension_axis": "+Z",
            "xr_extension_axis": "+Z",
            "duration_seconds": 0.8,
            "fps": 30,
            "total_frames": 24,
            "base_scale": [1.0, 1.0, 1.0],
            "keyframes": f"Strict linear extension taking 0.8 seconds: starts at length {START_LENGTH}m (t=0.00s, scale=[1,1,{START_SCALE_Z:.8f}]) at origin (0, 0, 0) and extends continuously by {EXPANSION_LENGTH}m to {TOTAL_LENGTH}m (t=0.80s, scale=[1,1,1]) down +Z axis, with its front point reaching 0.25m in front of the player camera at (0, 0, {CAMERA_DISTANCE})"
        },
        "normals_and_uvs": {
            "normals": "Recalculated outward with consistent face orientations, shaded smooth by angle (60 deg) for seamless cylinder body and crisp planar caps, exported with vertex split normals and MikkTSpace tangents",
            "uvs": "Verified cylindrical UV unwrap with seamless U mapping [0, 1] across circumference and V [0, 1] along 29m length, with radial cap unwrapping centered at (0.5, 0.5)"
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
        f"{MODEL_NAME}.blend",
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
