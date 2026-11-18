import bpy
import bmesh
import math
import os
import shutil
import json
import struct
from pathlib import Path

# -----------------------------------------------------------------------------
# Configuration & Paths
# -----------------------------------------------------------------------------
FRONTEND_DIR = Path(r"C:\Users\lyftu\gemini_3\updated_html_js_0\calmchessgames_frontend")
MODEL_NAME = "screen_decals_overlay_3"
DIR_NAME = "screen_decals_overlay_3"
ALIAS_DIR_NAME = "screen_decals__overlay_3"

OUT_DIR = FRONTEND_DIR / "meshy_test_0" / "models" / DIR_NAME
OUT_TEX_DIR = OUT_DIR / f"{MODEL_NAME}_textures"
YEST_TEX_DIR = FRONTEND_DIR / "meshy_yest_0" / "models" / DIR_NAME / f"{MODEL_NAME}_textures"

ALIAS_DIR = FRONTEND_DIR / "meshy_test_0" / "models" / ALIAS_DIR_NAME
ALIAS_TEX_DIR = ALIAS_DIR / f"{MODEL_NAME}_textures"

for d in (OUT_DIR, OUT_TEX_DIR, YEST_TEX_DIR, ALIAS_DIR, ALIAS_TEX_DIR):
    d.mkdir(parents=True, exist_ok=True)

GLB_PATH = OUT_DIR / f"{MODEL_NAME}.glb"
BLEND_PATH = OUT_DIR / f"{MODEL_NAME}.blend"
OBJ_PATH = OUT_DIR / f"{MODEL_NAME}.obj"
MTL_PATH = OUT_DIR / f"{MODEL_NAME}.mtl"
JSON_PATH = OUT_DIR / f"{MODEL_NAME}_materials.json"

print(f"Generating {MODEL_NAME} in {OUT_DIR}...")

# -----------------------------------------------------------------------------
# Reset Blender to Factory State
# -----------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
for m in list(bpy.data.meshes):
    bpy.data.meshes.remove(m, do_unlink=True)
for mat in list(bpy.data.materials):
    bpy.data.materials.remove(mat, do_unlink=True)
for img in list(bpy.data.images):
    bpy.data.images.remove(img, do_unlink=True)

# -----------------------------------------------------------------------------
# Dimensions (Meters, XR mobile scale 16:9 full-screen overlay)
# -----------------------------------------------------------------------------
WIDTH = 1.60       # X width: 1.60 m
HEIGHT = 0.90      # Z height: 0.90 m
THICKNESS = 0.005  # Y depth: 0.005 m (5 mm)
BORDER_X = 0.040   # 40mm side frame border
BORDER_Z = 0.035   # 35mm top/bottom frame border

HALF_W = WIDTH / 2.0        # 0.80 m
HALF_H = HEIGHT / 2.0       # 0.45 m
HALF_T = THICKNESS / 2.0    # 0.0025 m

INNER_HALF_W = HALF_W - BORDER_X # 0.760 m
INNER_HALF_H = HALF_H - BORDER_Z # 0.415 m

# -----------------------------------------------------------------------------
# Helper: Setup PBR Material with Textures
# -----------------------------------------------------------------------------
def create_textured_material(name, diffuse_path=None, normal_path=None, roughness_path=None,
                             base_color=(1, 1, 1, 1), metallic=0.0, roughness=0.5,
                             alpha=1.0, transmission=0.0, emission=None, is_transparent=False):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_out.location = (400, 0)
    
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)
    links.new(bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    
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

    # Diffuse Texture
    if diffuse_path and Path(diffuse_path).exists():
        tex_diff = nodes.new(type='ShaderNodeTexImage')
        tex_diff.location = (-400, 150)
        img = bpy.data.images.load(str(diffuse_path))
        tex_diff.image = img
        links.new(tex_diff.outputs['Color'], bsdf.inputs['Base Color'])
        if is_transparent:
            links.new(tex_diff.outputs['Alpha'], bsdf.inputs['Alpha'])

    # Roughness Texture
    if roughness_path and Path(roughness_path).exists():
        tex_rou = nodes.new(type='ShaderNodeTexImage')
        tex_rou.location = (-400, -150)
        img_rou = bpy.data.images.load(str(roughness_path))
        img_rou.colorspace_settings.name = 'Non-Color'
        tex_rou.image = img_rou
        links.new(tex_rou.outputs['Color'], bsdf.inputs['Roughness'])

    # Normal Map Texture
    if normal_path and Path(normal_path).exists():
        tex_nor = nodes.new(type='ShaderNodeTexImage')
        tex_nor.location = (-600, -350)
        img_nor = bpy.data.images.load(str(normal_path))
        img_nor.colorspace_settings.name = 'Non-Color'
        tex_nor.image = img_nor
        
        node_nor_map = nodes.new(type='ShaderNodeNormalMap')
        node_nor_map.location = (-300, -350)
        links.new(tex_nor.outputs['Color'], node_nor_map.inputs['Color'])
        links.new(node_nor_map.outputs['Normal'], bsdf.inputs['Normal'])

    if is_transparent or alpha < 1.0 or transmission > 0.0:
        mat.blend_method = 'BLEND'
        if hasattr(mat, 'shadow_method'):
            mat.shadow_method = 'NONE'

    return mat

# -----------------------------------------------------------------------------
# Create Scene Materials
# -----------------------------------------------------------------------------
tex_bc_path = OUT_TEX_DIR / "texture_0_base_color.png"
tex_met_path = OUT_TEX_DIR / "texture_0_metallic.png"
tex_rou_path = OUT_TEX_DIR / "texture_0_roughness.png"
tex_nor_path = OUT_TEX_DIR / "texture_0_normal.png"

# 1. Translucent Clear Glass Screen
mat_glass = create_textured_material(
    name="M_Translucent_Clear_Glass",
    base_color=(0.92, 0.96, 1.0, 0.18),
    metallic=0.03,
    roughness=0.03,
    alpha=0.22,
    transmission=0.92,
    is_transparent=True
)

# 2. Solid Outer Frame (0.005m thick frame)
mat_frame = create_textured_material(
    name="M_Solid_Frame",
    diffuse_path=tex_bc_path,
    roughness_path=tex_rou_path,
    normal_path=tex_nor_path,
    base_color=(0.14, 0.16, 0.20, 1.0),
    metallic=0.85,
    roughness=0.28
)

# 3. Solid Front Panel
mat_front_panel = create_textured_material(
    name="M_Solid_Front_Panel",
    base_color=(0.09, 0.11, 0.15, 1.0),
    metallic=0.72,
    roughness=0.24
)

# 4. Solid Back Panel
mat_back_panel = create_textured_material(
    name="M_Solid_Back_Panel",
    base_color=(0.07, 0.08, 0.11, 1.0),
    metallic=0.65,
    roughness=0.35
)

# 5. Emissive Cyan Cyber Accent Trim
mat_cyan_accent = create_textured_material(
    name="M_Cyan_Accent",
    base_color=(0.0, 0.94, 1.0, 1.0),
    metallic=0.1,
    roughness=0.12,
    emission=((0.0, 0.94, 1.0, 1.0), 3.5)
)

# 6. Blackened Laser Burn Decal Material (NO radiating lines)
burn_diff_path = OUT_TEX_DIR / "decal_laser_burn_diffuse.png"
burn_rou_path = OUT_TEX_DIR / "decal_laser_burn_roughness.png"
burn_nor_path = OUT_TEX_DIR / "decal_laser_burn_normal.png"
mat_laser_burn = create_textured_material(
    name="M_Laser_Burn_Decal_NoLines",
    diffuse_path=burn_diff_path,
    roughness_path=burn_rou_path,
    normal_path=burn_nor_path,
    base_color=(1.0, 1.0, 1.0, 1.0),
    metallic=0.05,
    roughness=0.88,
    is_transparent=True
)

# 7. Blackened Missile Strike Decal Material (NO radiating lines)
strike_diff_path = OUT_TEX_DIR / "decal_missile_strike_diffuse.png"
strike_rou_path = OUT_TEX_DIR / "decal_missile_strike_roughness.png"
strike_nor_path = OUT_TEX_DIR / "decal_missile_strike_normal.png"
mat_missile_strike = create_textured_material(
    name="M_Missile_Strike_Decal_NoLines",
    diffuse_path=strike_diff_path,
    roughness_path=strike_rou_path,
    normal_path=strike_nor_path,
    base_color=(1.0, 1.0, 1.0, 1.0),
    metallic=0.08,
    roughness=0.92,
    is_transparent=True
)

# -----------------------------------------------------------------------------
# 1. Build Translucent Clear Screen (0.005m thick glass panel)
# -----------------------------------------------------------------------------
mesh_glass = bpy.data.meshes.new("Mesh_Translucent_Screen")
bm_glass = bmesh.new()
bmesh.ops.create_cube(bm_glass, size=1.0)
bmesh.ops.scale(bm_glass, vec=(WIDTH - 0.004, THICKNESS - 0.0004, HEIGHT - 0.004), verts=bm_glass.verts)

uv_layer = bm_glass.loops.layers.uv.new("UVMap")
for face in bm_glass.faces:
    for loop in face.loops:
        v = loop.vert
        u = (v.co.x / WIDTH) + 0.5
        w = (v.co.z / HEIGHT) + 0.5
        loop[uv_layer].uv = (u, w)

bm_glass.to_mesh(mesh_glass)
bm_glass.free()

obj_glass = bpy.data.objects.new("Translucent_Clear_Screen", mesh_glass)
obj_glass.data.materials.append(mat_glass)
bpy.context.collection.objects.link(obj_glass)

# -----------------------------------------------------------------------------
# 2. Build .005m Thick Frame
# -----------------------------------------------------------------------------
mesh_frame = bpy.data.meshes.new("Mesh_Frame_005m")
bm_frame = bmesh.new()

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

for y_pos in (-HALF_T, HALF_T):
    v_out = [bm_frame.verts.new((x, y_pos, z)) for x, z in outer_pts]
    v_in  = [bm_frame.verts.new((x, y_pos, z)) for x, z in inner_pts]
    for i in range(4):
        i_next = (i + 1) % 4
        if y_pos > 0:
            bm_frame.faces.new([v_out[i], v_out[i_next], v_in[i_next], v_in[i]])
        else:
            bm_frame.faces.new([v_out[i_next], v_out[i], v_in[i], v_in[i_next]])

bm_frame.verts.ensure_lookup_table()
for i in range(4):
    i_next = (i + 1) % 4
    v_b1 = bm_frame.verts[i]
    v_b2 = bm_frame.verts[i_next]
    v_f1 = bm_frame.verts[8 + i]
    v_f2 = bm_frame.verts[8 + i_next]
    bm_frame.faces.new([v_b1, v_b2, v_f2, v_f1])
    
    v_ib1 = bm_frame.verts[4 + i]
    v_ib2 = bm_frame.verts[4 + i_next]
    v_if1 = bm_frame.verts[12 + i]
    v_if2 = bm_frame.verts[12 + i_next]
    bm_frame.faces.new([v_ib2, v_ib1, v_if1, v_if2])

bmesh.ops.recalc_face_normals(bm_frame, faces=bm_frame.faces)
bm_frame.to_mesh(mesh_frame)
bm_frame.free()

obj_frame = bpy.data.objects.new("Frame_005m_Thick", mesh_frame)
obj_frame.data.materials.append(mat_frame)
bpy.context.collection.objects.link(obj_frame)

# -----------------------------------------------------------------------------
# 3. Build Solid Front Panel (Solid front bezel plates & armor brackets)
# -----------------------------------------------------------------------------
mesh_front = bpy.data.meshes.new("Mesh_Solid_Front_Panel")
bm_front = bmesh.new()

PANEL_RELIEF = 0.0016
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
    bm.faces.new([verts[0], verts[1], verts[2], verts[3]])
    bm.faces.new([verts[4], verts[7], verts[6], verts[5]])
    bm.faces.new([verts[0], verts[4], verts[5], verts[1]])
    bm.faces.new([verts[2], verts[6], verts[7], verts[3]])
    bm.faces.new([verts[0], verts[3], verts[7], verts[4]])
    bm.faces.new([verts[1], verts[5], verts[6], verts[2]])

add_box(bm_front, -HALF_W + 0.02, HALF_W - 0.02, FRONT_Y, FRONT_Y + PANEL_RELIEF, HALF_H - 0.040, HALF_H + 0.002)
add_box(bm_front, -HALF_W + 0.02, HALF_W - 0.02, FRONT_Y, FRONT_Y + PANEL_RELIEF, -HALF_H - 0.002, -HALF_H + 0.040)
add_box(bm_front, -HALF_W - 0.002, -HALF_W + 0.040, FRONT_Y, FRONT_Y + PANEL_RELIEF, -0.22, 0.22)
add_box(bm_front,  HALF_W - 0.040,  HALF_W + 0.002, FRONT_Y, FRONT_Y + PANEL_RELIEF, -0.22, 0.22)

bmesh.ops.recalc_face_normals(bm_front, faces=bm_front.faces)
bm_front.to_mesh(mesh_front)
bm_front.free()

obj_front = bpy.data.objects.new("Solid_Front_Panel", mesh_front)
obj_front.data.materials.append(mat_front_panel)
bpy.context.collection.objects.link(obj_front)

# -----------------------------------------------------------------------------
# 4. Build Solid Back Panel (Solid rear structural casing & mounting plates)
# -----------------------------------------------------------------------------
mesh_back = bpy.data.meshes.new("Mesh_Solid_Back_Panel")
bm_back = bmesh.new()

BACK_Y = -HALF_T
add_box(bm_back, -HALF_W + 0.015, HALF_W - 0.015, BACK_Y - PANEL_RELIEF, BACK_Y, HALF_H - 0.046, HALF_H + 0.002)
add_box(bm_back, -HALF_W + 0.015, HALF_W - 0.015, BACK_Y - PANEL_RELIEF, BACK_Y, -HALF_H - 0.002, -HALF_H + 0.046)
add_box(bm_back, -HALF_W - 0.002, -HALF_W + 0.046, BACK_Y - PANEL_RELIEF, BACK_Y, -HALF_H + 0.046, HALF_H - 0.046)
add_box(bm_back,  HALF_W - 0.046,  HALF_W + 0.002, BACK_Y - PANEL_RELIEF, BACK_Y, -HALF_H + 0.046, HALF_H - 0.046)

bmesh.ops.recalc_face_normals(bm_back, faces=bm_back.faces)
bm_back.to_mesh(mesh_back)
bm_back.free()

obj_back = bpy.data.objects.new("Solid_Back_Panel", mesh_back)
obj_back.data.materials.append(mat_back_panel)
bpy.context.collection.objects.link(obj_back)

# -----------------------------------------------------------------------------
# 5. Build Cyan Cyber Accents (Telemetry Chevrons & HUD Guidelines)
# -----------------------------------------------------------------------------
mesh_accent = bpy.data.meshes.new("Mesh_Cyan_Accents")
bm_accent = bmesh.new()
ACCENT_Y = FRONT_Y + PANEL_RELIEF + 0.0003
ACCENT_T = 0.0006

add_box(bm_accent, -0.48, 0.48, ACCENT_Y, ACCENT_Y + ACCENT_T, HALF_H - 0.024, HALF_H - 0.021)
add_box(bm_accent, -0.32, 0.32, ACCENT_Y, ACCENT_Y + ACCENT_T, -HALF_H + 0.021, -HALF_H + 0.024)

CHEV_LEN = 0.045
CHEV_THICK = 0.003
add_box(bm_accent, -INNER_HALF_W + 0.01, -INNER_HALF_W + 0.01 + CHEV_LEN, ACCENT_Y, ACCENT_Y + ACCENT_T, INNER_HALF_H - 0.01 - CHEV_THICK, INNER_HALF_H - 0.01)
add_box(bm_accent, -INNER_HALF_W + 0.01, -INNER_HALF_W + 0.01 + CHEV_THICK, ACCENT_Y, ACCENT_Y + ACCENT_T, INNER_HALF_H - 0.01 - CHEV_LEN, INNER_HALF_H - 0.01)
add_box(bm_accent,  INNER_HALF_W - 0.01 - CHEV_LEN, INNER_HALF_W - 0.01, ACCENT_Y, ACCENT_Y + ACCENT_T, INNER_HALF_H - 0.01 - CHEV_THICK, INNER_HALF_H - 0.01)
add_box(bm_accent,  INNER_HALF_W - 0.01 - CHEV_THICK, INNER_HALF_W - 0.01, ACCENT_Y, ACCENT_Y + ACCENT_T, INNER_HALF_H - 0.01 - CHEV_LEN, INNER_HALF_H - 0.01)
add_box(bm_accent, -INNER_HALF_W + 0.01, -INNER_HALF_W + 0.01 + CHEV_LEN, ACCENT_Y, ACCENT_Y + ACCENT_T, -INNER_HALF_H + 0.01, -INNER_HALF_H + 0.01 + CHEV_THICK)
add_box(bm_accent, -INNER_HALF_W + 0.01, -INNER_HALF_W + 0.01 + CHEV_THICK, ACCENT_Y, ACCENT_Y + ACCENT_T, -INNER_HALF_H + 0.01, -INNER_HALF_H + 0.01 + CHEV_LEN)
add_box(bm_accent,  INNER_HALF_W - 0.01 - CHEV_LEN, INNER_HALF_W - 0.01, ACCENT_Y, ACCENT_Y + ACCENT_T, -INNER_HALF_H + 0.01, -INNER_HALF_H + 0.01 + CHEV_THICK)
add_box(bm_accent,  INNER_HALF_W - 0.01 - CHEV_THICK, INNER_HALF_W - 0.01, ACCENT_Y, ACCENT_Y + ACCENT_T, -INNER_HALF_H + 0.01, -INNER_HALF_H + 0.01 + CHEV_LEN)

bmesh.ops.recalc_face_normals(bm_accent, faces=bm_accent.faces)
bm_accent.to_mesh(mesh_accent)
bm_accent.free()

obj_accent = bpy.data.objects.new("Cyan_Cyber_Accents", mesh_accent)
obj_accent.data.materials.append(mat_cyan_accent)
bpy.context.collection.objects.link(obj_accent)

# -----------------------------------------------------------------------------
# 6. Build Targetable Decals (WITHOUT Radiating Lines)
# -----------------------------------------------------------------------------
DECAL_Y = HALF_T + 0.0006

def create_decal_mesh(name, width, height):
    mesh = bpy.data.meshes.new(f"Mesh_{name}")
    bm = bmesh.new()
    hw = width / 2.0
    hh = height / 2.0
    
    v1 = bm.verts.new((-hw, 0.0, -hh))
    v2 = bm.verts.new(( hw, 0.0, -hh))
    v3 = bm.verts.new(( hw, 0.0,  hh))
    v4 = bm.verts.new((-hw, 0.0,  hh))
    
    face = bm.faces.new([v1, v2, v3, v4])
    
    uv_layer = bm.loops.layers.uv.new("UVMap")
    uvs = [(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)]
    for i, loop in enumerate(face.loops):
        loop[uv_layer].uv = uvs[i]
        
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    return mesh

# Same balanced pseudo-random distribution across the 16:9 screen
laser_burn_configs = [
    ("Decal_LaserBurn_01", -0.52,  0.27,   24, 0.16),
    ("Decal_LaserBurn_02",  0.46,  0.08,  -45, 0.18),
    ("Decal_LaserBurn_03", -0.36, -0.25,   80, 0.15),
    ("Decal_LaserBurn_04", -0.20,  0.14,  115, 0.19),
    ("Decal_LaserBurn_05",  0.58,  0.29,  -18, 0.17),
    ("Decal_LaserBurn_06",  0.34, -0.23,  140, 0.14),
    ("Decal_LaserBurn_07",  0.06,  0.24,  -65, 0.18),
    ("Decal_LaserBurn_08", -0.06, -0.30,   50, 0.16),
]

missile_strike_configs = [
    ("Decal_MissileStrike_01", -0.14, -0.04,   35, 0.28),
    ("Decal_MissileStrike_02",  0.30,  0.22,  -80, 0.25),
    ("Decal_MissileStrike_03", -0.58, -0.10,  150, 0.26),
    ("Decal_MissileStrike_04",  0.60, -0.16,   70, 0.24),
    ("Decal_MissileStrike_05", -0.34,  0.31,  -25, 0.26),
    ("Decal_MissileStrike_06",  0.52, -0.27,  165, 0.23),
    ("Decal_MissileStrike_07", -0.62, -0.27, -110, 0.22),
    ("Decal_MissileStrike_08",  0.18,  0.32,   55, 0.24),
]

decal_objects = []

for name, cx, cz, rot_deg, size in laser_burn_configs:
    mesh = create_decal_mesh(name, size, size)
    obj = bpy.data.objects.new(name, mesh)
    obj.location = (cx, DECAL_Y, cz)
    obj.rotation_euler = (0.0, math.radians(rot_deg), 0.0)
    obj.data.materials.append(mat_laser_burn)
    bpy.context.collection.objects.link(obj)
    decal_objects.append(obj)

for name, cx, cz, rot_deg, size in missile_strike_configs:
    mesh = create_decal_mesh(name, size, size)
    obj = bpy.data.objects.new(name, mesh)
    obj.location = (cx, DECAL_Y + 0.0001, cz)
    obj.rotation_euler = (0.0, math.radians(rot_deg), 0.0)
    obj.data.materials.append(mat_missile_strike)
    bpy.context.collection.objects.link(obj)
    decal_objects.append(obj)

print(f"Instantiated {len(decal_objects)} targetable decal mesh objects for {MODEL_NAME}.")

# -----------------------------------------------------------------------------
# 7. Parent Hierarchy Under Root Empty
# -----------------------------------------------------------------------------
empty_root = bpy.data.objects.new("Screen_Decals_Overlay_3_Root", None)
bpy.context.collection.objects.link(empty_root)

all_components = [obj_glass, obj_frame, obj_front, obj_back, obj_accent] + decal_objects

for child in all_components:
    child.parent = empty_root

bpy.ops.object.select_all(action='DESELECT')
empty_root.select_set(True)
for o in all_components:
    o.select_set(True)
bpy.context.view_layer.objects.active = empty_root

# Save .blend file
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
print(f"Saved Blend file: {BLEND_PATH}")

# Export GLB
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

# -----------------------------------------------------------------------------
# 8. Post-Process GLB for Reliable WebXR Translucency
# -----------------------------------------------------------------------------
def patch_glb_translucency(path):
    with open(path, "rb") as f:
        data = f.read()

    if len(data) < 20 or data[:4] != b"glTF":
        return

    magic, version, total_len = struct.unpack("<4sII", data[:12])
    json_len, json_type = struct.unpack("<II", data[12:20])

    if json_type != 0x4E4F534A:
        return

    json_bytes = data[20:20 + json_len]
    bin_chunk = data[20 + json_len:]
    gltf = json.loads(json_bytes.decode("utf-8"))

    for mat in gltf.get("materials", []):
        mat_name = mat.get("name", "")
        if "Glass" in mat_name or "Decal" in mat_name:
            mat["alphaMode"] = "BLEND"
            mat["doubleSided"] = True
            pbr = mat.get("pbrMetallicRoughness", {})
            if "baseColorFactor" in pbr and "Glass" in mat_name:
                pbr["baseColorFactor"] = [0.92, 0.96, 1.0, 0.22]

    new_json_bytes = json.dumps(gltf, separators=(',', ':')).encode("utf-8")
    pad = (4 - (len(new_json_bytes) % 4)) % 4
    new_json_bytes += b" " * pad

    new_total_len = 12 + 8 + len(new_json_bytes) + len(bin_chunk)
    new_header = struct.pack("<4sII", magic, version, new_total_len)
    new_chunk0_hdr = struct.pack("<II", len(new_json_bytes), json_type)

    with open(path, "wb") as f:
        f.write(new_header + new_chunk0_hdr + new_json_bytes + bin_chunk)
    print(f"Patched GLB with double-sided alpha blending: {path} ({new_total_len} bytes)")

patch_glb_translucency(GLB_PATH)

# Mirror files to alias directory
for ext in [".glb", ".blend", ".obj", ".mtl"]:
    src = OUT_DIR / f"{MODEL_NAME}{ext}"
    if src.exists():
        shutil.copy2(src, ALIAS_DIR / src.name)

# -----------------------------------------------------------------------------
# 9. Materials & Decal Registry JSON
# -----------------------------------------------------------------------------
registry = {
    "model_name": MODEL_NAME,
    "directory": DIR_NAME,
    "glb_path": f"./meshy_test_0/models/{DIR_NAME}/{MODEL_NAME}.glb",
    "blend_path": f"./meshy_test_0/models/{DIR_NAME}/{MODEL_NAME}.blend",
    "description": "Translucent clear full screen overlay .005m thick frame with solid front and back panels and 16 targetable laser burn / missile strike decals without radiating lines",
    "dimensions": {
        "width_meters": WIDTH,
        "height_meters": HEIGHT,
        "frame_thickness_meters": THICKNESS,
        "aspect_ratio": "16:9"
    },
    "components": {
        "root": "Screen_Decals_Overlay_3_Root",
        "glass_screen": "Translucent_Clear_Screen",
        "frame": "Frame_005m_Thick",
        "front_panel": "Solid_Front_Panel",
        "back_panel": "Solid_Back_Panel",
        "cyber_accents": "Cyan_Cyber_Accents"
    },
    "laser_burn_decals": [cfg[0] for cfg in laser_burn_configs],
    "missile_strike_decals": [cfg[0] for cfg in missile_strike_configs],
    "decal_style": {
        "radiating_lines": False,
        "effect": "Smooth organic smoky soot clouds, heavy carbon crater pit, molten thermal breach"
    },
    "code_targeting_examples": {
        "threejs_toggle_single": "const decal = scene.getObjectByName('Decal_LaserBurn_01'); decal.visible = !decal.visible;",
        "threejs_toggle_burns": "scene.traverse(obj => { if (obj.name.startsWith('Decal_LaserBurn_')) obj.visible = false; });",
        "threejs_toggle_strikes": "scene.traverse(obj => { if (obj.name.startsWith('Decal_MissileStrike_')) obj.visible = false; });",
        "unity_csharp": "GameObject decal = transform.Find(\"Decal_LaserBurn_01\").gameObject; decal.SetActive(false);"
    }
}

with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(registry, f, indent=2)

shutil.copy2(JSON_PATH, ALIAS_DIR / JSON_PATH.name)
print(f"Saved Registry JSON: {JSON_PATH}")

print("\n--- ALL ASSETS FOR SCREEN_DECALS_OVERLAY_3 GENERATED SUCCESSFULLY ---")
