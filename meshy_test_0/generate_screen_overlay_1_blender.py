import bpy
import bmesh
import math
import os
import shutil
import json
import struct
from pathlib import Path

# Paths
FRONTEND_DIR = Path(r"C:\Users\lyftu\gemini_3\updated_html_js_0\calmchessgames_frontend")
MODEL_NAME = "screen_overlay_1"
OUT_DIR = FRONTEND_DIR / "meshy_test_0" / "models" / MODEL_NAME
OUT_TEX_DIR = OUT_DIR / f"{MODEL_NAME}_textures"
YEST_TEX_DIR = FRONTEND_DIR / "meshy_yest_0" / "models" / MODEL_NAME / f"{MODEL_NAME}_textures"

OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_TEX_DIR.mkdir(parents=True, exist_ok=True)
YEST_TEX_DIR.mkdir(parents=True, exist_ok=True)

GLB_PATH = OUT_DIR / f"{MODEL_NAME}.glb"
BLEND_PATH = OUT_DIR / f"{MODEL_NAME}.blend"
OBJ_PATH = OUT_DIR / f"{MODEL_NAME}.obj"
MTL_PATH = OUT_DIR / f"{MODEL_NAME}.mtl"
JSON_PATH = OUT_DIR / f"{MODEL_NAME}_materials.json"

print(f"Creating {MODEL_NAME} in {OUT_DIR}...")

# Reset Blender
bpy.ops.wm.read_factory_settings(use_empty=True)
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
for m in list(bpy.data.meshes):
    bpy.data.meshes.remove(m, do_unlink=True)
for mat in list(bpy.data.materials):
    bpy.data.materials.remove(mat, do_unlink=True)

# -------------------------------------------------------------------------
# Dimensions (Meters, XR mobile scale 16:9 full-screen overlay)
# -------------------------------------------------------------------------
WIDTH = 1.60       # X width: 1.60 m
HEIGHT = 0.90      # Z height: 0.90 m (in Blender Z is Up, exported to glTF Y is Up)
THICKNESS = 0.005  # Y depth: 0.005 m (in Blender Y is Depth, exported to glTF Z is Depth)
BORDER_X = 0.035   # 35mm side frame border
BORDER_Z = 0.030   # 30mm top/bottom frame border

HALF_W = WIDTH / 2.0        # 0.80 m
HALF_H = HEIGHT / 2.0       # 0.45 m
HALF_T = THICKNESS / 2.0    # 0.0025 m

INNER_HALF_W = HALF_W - BORDER_X # 0.765 m
INNER_HALF_H = HALF_H - BORDER_Z # 0.420 m

# -------------------------------------------------------------------------
# Create Materials
# -------------------------------------------------------------------------
def create_pbr_material(name, base_color, metallic=0.0, roughness=0.5, alpha=1.0, transmission=0.0, emission=None):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    
    bsdf.inputs['Base Color'].default_value = base_color
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Alpha'].default_value = alpha
    
    if 'Transmission Weight' in bsdf.inputs:
        bsdf.inputs['Transmission Weight'].default_value = transmission
    elif 'Transmission' in bsdf.inputs:
        bsdf.inputs['Transmission'].default_value = transmission
        
    if emission and 'Emission Color' in bsdf.inputs:
        bsdf.inputs['Emission Color'].default_value = emission[0]
        if 'Emission Strength' in bsdf.inputs:
            bsdf.inputs['Emission Strength'].default_value = emission[1]
            
    if alpha < 1.0 or transmission > 0.0:
        mat.blend_method = 'BLEND'
        mat.shadow_method = 'NONE' if hasattr(mat, 'shadow_method') else None
        
    return mat

# 1. Translucent Clear Glass Screen Material
mat_glass = create_pbr_material(
    name="M_Translucent_Clear_Glass",
    base_color=(0.90, 0.95, 1.0, 0.22), # Subtle ice-blue crystal tint
    metallic=0.05,
    roughness=0.03, # High gloss optical clarity
    alpha=0.25,
    transmission=0.92
)

# 2. Solid Outer Frame Material (0.005m thick frame)
mat_frame = create_pbr_material(
    name="M_Solid_Frame",
    base_color=(0.12, 0.14, 0.18, 1.0), # Sleek dark aerospace titanium alloy
    metallic=0.85,
    roughness=0.28
)

# 3. Solid Front Panel Material
mat_front_panel = create_pbr_material(
    name="M_Solid_Front_Panel",
    base_color=(0.08, 0.10, 0.14, 1.0), # Matte obsidian front bezel
    metallic=0.75,
    roughness=0.22
)

# 4. Solid Back Panel Material
mat_back_panel = create_pbr_material(
    name="M_Solid_Back_Panel",
    base_color=(0.07, 0.08, 0.11, 1.0), # Structural rear housing
    metallic=0.65,
    roughness=0.35
)

# 5. Accent Cyan Cyber Trim Material (Emissive indicators)
mat_cyan_accent = create_pbr_material(
    name="M_Cyan_Accent",
    base_color=(0.0, 0.94, 1.0, 1.0),
    metallic=0.1,
    roughness=0.15,
    emission=((0.0, 0.94, 1.0, 1.0), 3.0)
)

# -------------------------------------------------------------------------
# 1. Build Translucent Clear Screen (Manifold 0.005m thick solid glass slab)
# -------------------------------------------------------------------------
mesh_glass = bpy.data.meshes.new("Mesh_Translucent_Screen")
bm_glass = bmesh.new()

# Create 8 vertices for the glass slab box (-HALF_W..HALF_W, -HALF_T..HALF_T, -HALF_H..HALF_H)
# Slightly offset within the frame or full screen overlay
bmesh.ops.create_cube(bm_glass, size=1.0)
# Scale to exact dimensions: Width=1.58m, Thickness=0.005m, Height=0.88m
bmesh.ops.scale(bm_glass, vec=(WIDTH - 0.004, THICKNESS - 0.0004, HEIGHT - 0.004), verts=bm_glass.verts)

bm_glass.to_mesh(mesh_glass)
bm_glass.free()

obj_glass = bpy.data.objects.new("Translucent_Clear_Screen", mesh_glass)
obj_glass.data.materials.append(mat_glass)
bpy.context.collection.objects.link(obj_glass)

# -------------------------------------------------------------------------
# 2. Build .005m Thick Frame
# Outer: [-HALF_W, HALF_W] x [-HALF_T, HALF_T] x [-HALF_H, HALF_H]
# Inner cutout: [-INNER_HALF_W, INNER_HALF_W] x [-HALF_T, HALF_T] x [-INNER_HALF_H, INNER_HALF_H]
# -------------------------------------------------------------------------
mesh_frame = bpy.data.meshes.new("Mesh_Frame_005m")
bm_frame = bmesh.new()

# Create frame profile in X-Z plane, then extrude along Y by THICKNESS
outer_pts = [
    (-HALF_W, -HALF_H),
    ( HALF_W, -HALF_H),
    ( HALF_W,  HALF_H),
    (-HALF_W,  HALF_H)
]

inner_pts = [
    (-INNER_HALF_W, -INNER_HALF_H),
    ( INNER_HALF_W, -INNER_HALF_H),
    ( INNER_HALF_W,  INNER_HALF_H),
    (-INNER_HALF_W,  INNER_HALF_H)
]

# Build 4 perimeter trapezoid faces at front (Y = +HALF_T) and back (Y = -HALF_T)
# Bottom, Right, Top, Left
for y_pos in (-HALF_T, HALF_T):
    v_out = [bm_frame.verts.new((x, y_pos, z)) for x, z in outer_pts]
    v_in  = [bm_frame.verts.new((x, y_pos, z)) for x, z in inner_pts]
    
    # 4 quad faces
    for i in range(4):
        i_next = (i + 1) % 4
        if y_pos > 0:
            bm_frame.faces.new([v_out[i], v_out[i_next], v_in[i_next], v_in[i]])
        else:
            bm_frame.faces.new([v_out[i_next], v_out[i], v_in[i], v_in[i_next]])

# Connect side walls: outer perimeter and inner perimeter
bm_frame.verts.ensure_lookup_table()
# The first 8 verts are y = -HALF_T, next 8 are y = +HALF_T
for i in range(4):
    i_next = (i + 1) % 4
    # Outer side walls
    v_b1 = bm_frame.verts[i]
    v_b2 = bm_frame.verts[i_next]
    v_f1 = bm_frame.verts[8 + i]
    v_f2 = bm_frame.verts[8 + i_next]
    bm_frame.faces.new([v_b1, v_b2, v_f2, v_f1])
    
    # Inner side walls (aperture rim)
    v_ib1 = bm_frame.verts[4 + i]
    v_ib2 = bm_frame.verts[4 + i_next]
    v_if1 = bm_frame.verts[12 + i]
    v_if2 = bm_frame.verts[12 + i_next]
    bm_frame.faces.new([v_ib2, v_ib1, v_if1, v_if2])

# Recalculate normals
bmesh.ops.recalc_face_normals(bm_frame, faces=bm_frame.faces)

bm_frame.to_mesh(mesh_frame)
bm_frame.free()

obj_frame = bpy.data.objects.new("Frame_005m_Thick", mesh_frame)
obj_frame.data.materials.append(mat_frame)
bpy.context.collection.objects.link(obj_frame)

# -------------------------------------------------------------------------
# 3. Build Solid Front Panel (Solid front bezel plates, telemetry bar & corner mounts)
# Placed on the front face (Y = +HALF_T)
# -------------------------------------------------------------------------
mesh_front = bpy.data.meshes.new("Mesh_Solid_Front_Panel")
bm_front = bmesh.new()

# Top HUD header bar and bottom telemetry bar
PANEL_DEPTH = 0.0015 # 1.5mm forward relief
FRONT_Y = HALF_T

def add_box(bm, x_min, x_max, y_min, y_max, z_min, z_max):
    verts = [
        bm.verts.new((x_min, y_min, z_min)),
        bm.verts.new((x_max, y_min, z_min)),
        bm.verts.new((x_max, y_max, z_min)),
        bm.verts.new((x_min, y_max, z_min)),
        bm.verts.new((x_min, y_min, z_max)),
        bm.verts.new((x_max, y_min, z_max)),
        bm.verts.new((x_max, y_max, z_max)),
        bm.verts.new((x_min, y_max, z_max)),
    ]
    bm.faces.new([verts[0], verts[1], verts[2], verts[3]]) # bottom
    bm.faces.new([verts[4], verts[7], verts[6], verts[5]]) # top
    bm.faces.new([verts[0], verts[4], verts[5], verts[1]]) # front
    bm.faces.new([verts[2], verts[6], verts[7], verts[3]]) # back
    bm.faces.new([verts[0], verts[3], verts[7], verts[4]]) # left
    bm.faces.new([verts[1], verts[5], verts[6], verts[2]]) # right

# Solid Top Front Panel Bar
add_box(bm_front, -HALF_W + 0.02, HALF_W - 0.02, FRONT_Y, FRONT_Y + PANEL_DEPTH, HALF_H - 0.038, HALF_H + 0.002)
# Solid Bottom Front Panel Bar
add_box(bm_front, -HALF_W + 0.02, HALF_W - 0.02, FRONT_Y, FRONT_Y + PANEL_DEPTH, -HALF_H - 0.002, -HALF_H + 0.038)
# Left & Right Solid Front Wing Brackets
add_box(bm_front, -HALF_W - 0.002, -HALF_W + 0.038, FRONT_Y, FRONT_Y + PANEL_DEPTH, -0.18, 0.18)
add_box(bm_front,  HALF_W - 0.038,  HALF_W + 0.002, FRONT_Y, FRONT_Y + PANEL_DEPTH, -0.18, 0.18)

bmesh.ops.recalc_face_normals(bm_front, faces=bm_front.faces)
bm_front.to_mesh(mesh_front)
bm_front.free()

obj_front = bpy.data.objects.new("Solid_Front_Panel", mesh_front)
obj_front.data.materials.append(mat_front_panel)
bpy.context.collection.objects.link(obj_front)

# -------------------------------------------------------------------------
# 4. Build Solid Back Panel (Solid rear structural casing plate)
# Placed on the back face (Y = -HALF_T)
# -------------------------------------------------------------------------
mesh_back = bpy.data.meshes.new("Mesh_Solid_Back_Panel")
bm_back = bmesh.new()

BACK_Y = -HALF_T
# Solid Back Upper Panel Housing
add_box(bm_back, -HALF_W + 0.015, HALF_W - 0.015, BACK_Y - PANEL_DEPTH, BACK_Y, HALF_H - 0.045, HALF_H + 0.002)
# Solid Back Lower Panel Housing
add_box(bm_back, -HALF_W + 0.015, HALF_W - 0.015, BACK_Y - PANEL_DEPTH, BACK_Y, -HALF_H - 0.002, -HALF_H + 0.045)
# Left & Right Rear Structural Mounts
add_box(bm_back, -HALF_W - 0.002, -HALF_W + 0.045, BACK_Y - PANEL_DEPTH, BACK_Y, -HALF_H + 0.045, HALF_H - 0.045)
add_box(bm_back,  HALF_W - 0.045,  HALF_W + 0.002, BACK_Y - PANEL_DEPTH, BACK_Y, -HALF_H + 0.045, HALF_H - 0.045)

bmesh.ops.recalc_face_normals(bm_back, faces=bm_back.faces)
bm_back.to_mesh(mesh_back)
bm_back.free()

obj_back = bpy.data.objects.new("Solid_Back_Panel", mesh_back)
obj_back.data.materials.append(mat_back_panel)
bpy.context.collection.objects.link(obj_back)

# -------------------------------------------------------------------------
# 5. Build Cyan Cyber Accent Trim
# -------------------------------------------------------------------------
mesh_accent = bpy.data.meshes.new("Mesh_Cyan_Accents")
bm_accent = bmesh.new()
ACCENT_Y = FRONT_Y + PANEL_DEPTH + 0.0003
ACCENT_T = 0.0006

# Sleek horizontal indicator stripes on front top & bottom panels
add_box(bm_accent, -0.45, 0.45, ACCENT_Y, ACCENT_Y + ACCENT_T, HALF_H - 0.022, HALF_H - 0.019)
add_box(bm_accent, -0.30, 0.30, ACCENT_Y, ACCENT_Y + ACCENT_T, -HALF_H + 0.019, -HALF_H + 0.022)

# Corner targeting chevrons
CHEV_LEN = 0.045
CHEV_THICK = 0.003
# Top-Left Chevron
add_box(bm_accent, -INNER_HALF_W + 0.01, -INNER_HALF_W + 0.01 + CHEV_LEN, ACCENT_Y, ACCENT_Y + ACCENT_T, INNER_HALF_H - 0.01 - CHEV_THICK, INNER_HALF_H - 0.01)
add_box(bm_accent, -INNER_HALF_W + 0.01, -INNER_HALF_W + 0.01 + CHEV_THICK, ACCENT_Y, ACCENT_Y + ACCENT_T, INNER_HALF_H - 0.01 - CHEV_LEN, INNER_HALF_H - 0.01)
# Top-Right Chevron
add_box(bm_accent,  INNER_HALF_W - 0.01 - CHEV_LEN, INNER_HALF_W - 0.01, ACCENT_Y, ACCENT_Y + ACCENT_T, INNER_HALF_H - 0.01 - CHEV_THICK, INNER_HALF_H - 0.01)
add_box(bm_accent,  INNER_HALF_W - 0.01 - CHEV_THICK, INNER_HALF_W - 0.01, ACCENT_Y, ACCENT_Y + ACCENT_T, INNER_HALF_H - 0.01 - CHEV_LEN, INNER_HALF_H - 0.01)
# Bottom-Left Chevron
add_box(bm_accent, -INNER_HALF_W + 0.01, -INNER_HALF_W + 0.01 + CHEV_LEN, ACCENT_Y, ACCENT_Y + ACCENT_T, -INNER_HALF_H + 0.01, -INNER_HALF_H + 0.01 + CHEV_THICK)
add_box(bm_accent, -INNER_HALF_W + 0.01, -INNER_HALF_W + 0.01 + CHEV_THICK, ACCENT_Y, ACCENT_Y + ACCENT_T, -INNER_HALF_H + 0.01, -INNER_HALF_H + 0.01 + CHEV_LEN)
# Bottom-Right Chevron
add_box(bm_accent,  INNER_HALF_W - 0.01 - CHEV_LEN, INNER_HALF_W - 0.01, ACCENT_Y, ACCENT_Y + ACCENT_T, -INNER_HALF_H + 0.01, -INNER_HALF_H + 0.01 + CHEV_THICK)
add_box(bm_accent,  INNER_HALF_W - 0.01 - CHEV_THICK, INNER_HALF_W - 0.01, ACCENT_Y, ACCENT_Y + ACCENT_T, -INNER_HALF_H + 0.01, -INNER_HALF_H + 0.01 + CHEV_LEN)

bmesh.ops.recalc_face_normals(bm_accent, faces=bm_accent.faces)
bm_accent.to_mesh(mesh_accent)
bm_accent.free()

obj_accent = bpy.data.objects.new("Cyan_Accents", mesh_accent)
obj_accent.data.materials.append(mat_cyan_accent)
bpy.context.collection.objects.link(obj_accent)

# -------------------------------------------------------------------------
# Create Parent Empty Hierarchy for XR Engine Integration
# -------------------------------------------------------------------------
empty_root = bpy.data.objects.new("Screen_Overlay_1_Root", None)
bpy.context.collection.objects.link(empty_root)

for child in (obj_glass, obj_frame, obj_front, obj_back, obj_accent):
    child.parent = empty_root

# Select all
bpy.ops.object.select_all(action='DESELECT')
for o in (empty_root, obj_glass, obj_frame, obj_front, obj_back, obj_accent):
    o.select_set(True)
bpy.context.view_layer.objects.active = empty_root

# Save .blend project
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
print(f"Saved Blend file: {BLEND_PATH}")

# Export glTF / GLB
bpy.ops.export_scene.gltf(
    filepath=str(GLB_PATH),
    export_format='GLB',
    use_selection=True,
    export_apply=False,
    export_materials='EXPORT',
    export_image_format='AUTO',
    export_draco_mesh_compression_enable=False
)
print(f"Exported GLB: {GLB_PATH}")

# Export OBJ / MTL
bpy.ops.wm.obj_export(
    filepath=str(OBJ_PATH),
    export_selected_objects=True,
    export_materials=True
)
print(f"Exported OBJ: {OBJ_PATH}")

print("Blender asset generation complete!")
