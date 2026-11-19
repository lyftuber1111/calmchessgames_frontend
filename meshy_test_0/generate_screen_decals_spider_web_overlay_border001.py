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
SRC_DIR = FRONTEND_DIR / "meshy_test_0" / "models" / "screen_decals_spider_web_overlay_4"
SRC_DIR_3 = FRONTEND_DIR / "meshy_test_0" / "models" / "screen_decals_overlay_3"

OUT_DIR_4 = FRONTEND_DIR / "meshy_test_0" / "models" / "screen_decals_spider_web_overlay_4"
ALIAS_DIR_4 = FRONTEND_DIR / "meshy_test_0" / "models" / "screen_decals__spider_web_overlay_4"
OUT_DIR_STD = FRONTEND_DIR / "meshy_test_0" / "models" / "screen_decals_spider_web_overlay"

for d in (OUT_DIR_4, ALIAS_DIR_4, OUT_DIR_STD):
    d.mkdir(parents=True, exist_ok=True)

# Texture source paths
spider_tex_dir = SRC_DIR / "screen_decals_spider_web_overlay_4_textures"
overlay3_tex_dir = SRC_DIR_3 / "screen_decals_overlay_3_textures"

def find_file(name, dirs):
    for d in dirs:
        p = d / name
        if p.exists():
            return p
    return None

search_dirs = [SRC_DIR, spider_tex_dir, SRC_DIR_3, overlay3_tex_dir]

web_diff_path = find_file("decal_spider_web_diffuse.png", search_dirs)
web_rou_path = find_file("decal_spider_web_roughness.png", search_dirs)
web_nor_path = find_file("decal_spider_web_normal.png", search_dirs)

burn_diff_path = find_file("decal_laser_burn_diffuse.png", search_dirs)
burn_rou_path = find_file("decal_laser_burn_roughness.png", search_dirs)
burn_nor_path = find_file("decal_laser_burn_normal.png", search_dirs)

strike_diff_path = find_file("decal_missile_strike_diffuse.png", search_dirs)
strike_rou_path = find_file("decal_missile_strike_roughness.png", search_dirs)
strike_nor_path = find_file("decal_missile_strike_normal.png", search_dirs)

frame_bc_path = find_file("texture_0_base_color.png", search_dirs)
frame_rou_path = find_file("texture_0_roughness.png", search_dirs)
frame_nor_path = find_file("texture_0_normal.png", search_dirs)
frame_met_path = find_file("texture_0_metallic.png", search_dirs)

print(f"Web Diffuse: {web_diff_path}")
print(f"Burn Diffuse: {burn_diff_path}")
print(f"Strike Diffuse: {strike_diff_path}")
print(f"Frame Base Color: {frame_bc_path}")

# -----------------------------------------------------------------------------
# Dimensions (Exact 16:9 scale with 0.001m border)
# -----------------------------------------------------------------------------
WIDTH = 1.60       # Same size: 1.60 m total width
HEIGHT = 0.90      # Same size: 0.90 m total height
BORDER = 0.001     # Border is 0.001 meters (1mm)!
THICKNESS = 0.001  # Border thickness is 0.001 meters (1mm)!

HALF_W = WIDTH / 2.0        # 0.80 m
HALF_H = HEIGHT / 2.0       # 0.45 m
HALF_T = THICKNESS / 2.0    # 0.0005 m

INNER_HALF_W = HALF_W - BORDER # 0.799 m
INNER_HALF_H = HALF_H - BORDER # 0.449 m

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
# Material Creation Helper
# -----------------------------------------------------------------------------
def create_textured_material(name, diffuse_path=None, normal_path=None, roughness_path=None,
                             metallic_path=None, base_color=(1, 1, 1, 1), metallic=0.0,
                             roughness=0.5, alpha=1.0, transmission=0.0, emission=None,
                             is_transparent=False):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_out.location = (450, 0)
    
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
        
    if emission:
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = emission[0]
            if 'Emission Strength' in bsdf.inputs:
                bsdf.inputs['Emission Strength'].default_value = emission[1]
        elif 'Emission' in bsdf.inputs:
            bsdf.inputs['Emission'].default_value = emission[0]

    if diffuse_path and Path(diffuse_path).exists():
        tex_diff = nodes.new(type='ShaderNodeTexImage')
        tex_diff.location = (-450, 150)
        img_diff = bpy.data.images.load(str(diffuse_path))
        tex_diff.image = img_diff
        links.new(tex_diff.outputs['Color'], bsdf.inputs['Base Color'])
        if is_transparent and 'Alpha' in tex_diff.outputs:
            links.new(tex_diff.outputs['Alpha'], bsdf.inputs['Alpha'])

    if roughness_path and Path(roughness_path).exists():
        tex_rou = nodes.new(type='ShaderNodeTexImage')
        tex_rou.location = (-450, -120)
        img_rou = bpy.data.images.load(str(roughness_path))
        img_rou.colorspace_settings.name = 'Non-Color'
        tex_rou.image = img_rou
        links.new(tex_rou.outputs['Color'], bsdf.inputs['Roughness'])

    if normal_path and Path(normal_path).exists():
        tex_nor = nodes.new(type='ShaderNodeTexImage')
        tex_nor.location = (-650, -350)
        img_nor = bpy.data.images.load(str(normal_path))
        img_nor.colorspace_settings.name = 'Non-Color'
        tex_nor.image = img_nor
        
        node_nor_map = nodes.new(type='ShaderNodeNormalMap')
        node_nor_map.location = (-350, -350)
        links.new(tex_nor.outputs['Color'], node_nor_map.inputs['Color'])
        links.new(node_nor_map.outputs['Normal'], bsdf.inputs['Normal'])

    if metallic_path and Path(metallic_path).exists():
        tex_met = nodes.new(type='ShaderNodeTexImage')
        tex_met.location = (-450, -350)
        img_met = bpy.data.images.load(str(metallic_path))
        img_met.colorspace_settings.name = 'Non-Color'
        tex_met.image = img_met
        links.new(tex_met.outputs['Color'], bsdf.inputs['Metallic'])

    if is_transparent:
        mat.blend_method = 'BLEND'
        if hasattr(mat, 'shadow_method'):
            mat.shadow_method = 'NONE'

    return mat

# -----------------------------------------------------------------------------
# Materials Instantiation
# -----------------------------------------------------------------------------
mat_glass = create_textured_material(
    name="M_Translucent_Clear_Glass",
    base_color=(0.90, 0.95, 1.0, 0.22),
    metallic=0.03,
    roughness=0.03,
    alpha=0.22,
    transmission=0.92,
    is_transparent=True
)

mat_frame = create_textured_material(
    name="M_Solid_Frame",
    diffuse_path=frame_bc_path,
    roughness_path=frame_rou_path,
    normal_path=frame_nor_path,
    metallic_path=frame_met_path,
    base_color=(0.14, 0.16, 0.20, 1.0),
    metallic=0.85,
    roughness=0.28
)

mat_front_panel = create_textured_material(
    name="M_Solid_Front_Panel",
    base_color=(0.09, 0.11, 0.15, 1.0),
    metallic=0.72,
    roughness=0.24
)

mat_back_panel = create_textured_material(
    name="M_Solid_Back_Panel",
    base_color=(0.07, 0.08, 0.11, 1.0),
    metallic=0.65,
    roughness=0.35
)

mat_cyan_accent = create_textured_material(
    name="M_Cyan_Accent",
    base_color=(0.0, 0.94, 1.0, 1.0),
    metallic=0.1,
    roughness=0.12,
    emission=((0.0, 0.94, 1.0, 1.0), 3.5)
)

mat_spider_web = create_textured_material(
    name="M_Broken_Spider_Web_Decal",
    diffuse_path=web_diff_path,
    roughness_path=web_rou_path,
    normal_path=web_nor_path,
    base_color=(1.0, 1.0, 1.0, 1.0),
    metallic=0.05,
    roughness=0.25,
    alpha=1.0,
    is_transparent=True
)

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
# 1. Build Translucent Screen Glass (Fits snug inside the 0.001m border)
# -----------------------------------------------------------------------------
mesh_glass = bpy.data.meshes.new("Mesh_Translucent_Screen")
bm_glass = bmesh.new()
bmesh.ops.create_cube(bm_glass, size=1.0)
# Scaled to 1.599m x 0.899m, overlapping 0.5mm into the 0.001m border with 0.0008m thickness
GLASS_W = (INNER_HALF_W * 2.0) + (BORDER * 1.0) # 1.599m
GLASS_H = (INNER_HALF_H * 2.0) + (BORDER * 1.0) # 0.899m
GLASS_T = 0.0008 # 0.8mm depth
bmesh.ops.scale(bm_glass, vec=(GLASS_W, GLASS_T, GLASS_H), verts=bm_glass.verts)

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
# 2. Build Frame (1.60m x 0.90m outer, 0.001m border rim on all sides, 0.001m thick)
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

# Create front and back annular border faces
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

# Outer sides and inner sides connecting front and back
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

# Add UV Map to Frame
uv_layer_frame = bm_frame.loops.layers.uv.new("UVMap")
for face in bm_frame.faces:
    for loop in face.loops:
        v = loop.vert
        u = (v.co.x / WIDTH) + 0.5
        w = (v.co.z / HEIGHT) + 0.5
        loop[uv_layer_frame].uv = (u, w)

bmesh.ops.recalc_face_normals(bm_frame, faces=bm_frame.faces)
bm_frame.to_mesh(mesh_frame)
bm_frame.free()

obj_frame = bpy.data.objects.new("Frame_005m_Thick", mesh_frame)
obj_frame.data.materials.append(mat_frame)
bpy.context.collection.objects.link(obj_frame)

# -----------------------------------------------------------------------------
# 3. Solid Front & Back Panel Bezel Brackets (Constrained within the 0.001m border)
# -----------------------------------------------------------------------------
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

# Front Panel
mesh_front = bpy.data.meshes.new("Mesh_Solid_Front_Panel")
bm_front = bmesh.new()
FRONT_Y = HALF_T
PANEL_RELIEF = 0.0002
# Top, Bottom, Left, Right rim strips within 0.001m border
add_box(bm_front, -HALF_W, HALF_W, FRONT_Y, FRONT_Y + PANEL_RELIEF, INNER_HALF_H, HALF_H)
add_box(bm_front, -HALF_W, HALF_W, FRONT_Y, FRONT_Y + PANEL_RELIEF, -HALF_H, -INNER_HALF_H)
add_box(bm_front, -HALF_W, -INNER_HALF_W, FRONT_Y, FRONT_Y + PANEL_RELIEF, -INNER_HALF_H, INNER_HALF_H)
add_box(bm_front,  INNER_HALF_W,  HALF_W, FRONT_Y, FRONT_Y + PANEL_RELIEF, -INNER_HALF_H, INNER_HALF_H)

bmesh.ops.recalc_face_normals(bm_front, faces=bm_front.faces)
bm_front.to_mesh(mesh_front)
bm_front.free()

obj_front = bpy.data.objects.new("Solid_Front_Panel", mesh_front)
obj_front.data.materials.append(mat_front_panel)
bpy.context.collection.objects.link(obj_front)

# Back Panel
mesh_back = bpy.data.meshes.new("Mesh_Solid_Back_Panel")
bm_back = bmesh.new()
BACK_Y = -HALF_T
add_box(bm_back, -HALF_W, HALF_W, BACK_Y - PANEL_RELIEF, BACK_Y, INNER_HALF_H, HALF_H)
add_box(bm_back, -HALF_W, HALF_W, BACK_Y - PANEL_RELIEF, BACK_Y, -HALF_H, -INNER_HALF_H)
add_box(bm_back, -HALF_W, -INNER_HALF_W, BACK_Y - PANEL_RELIEF, BACK_Y, -INNER_HALF_H, INNER_HALF_H)
add_box(bm_back,  INNER_HALF_W,  HALF_W, BACK_Y - PANEL_RELIEF, BACK_Y, -INNER_HALF_H, INNER_HALF_H)

bmesh.ops.recalc_face_normals(bm_back, faces=bm_back.faces)
bm_back.to_mesh(mesh_back)
bm_back.free()

obj_back = bpy.data.objects.new("Solid_Back_Panel", mesh_back)
obj_back.data.materials.append(mat_back_panel)
bpy.context.collection.objects.link(obj_back)

# -----------------------------------------------------------------------------
# 4. Cyan Cyber Accents (Telemetry guidelines and corner indicators)
# -----------------------------------------------------------------------------
mesh_accent = bpy.data.meshes.new("Mesh_Cyan_Accents")
bm_accent = bmesh.new()
ACCENT_Y = FRONT_Y + PANEL_RELIEF + 0.00005
ACCENT_T = 0.0001

# Fine guideline accents near the inner edge of top/bottom border
add_box(bm_accent, -0.48, 0.48, ACCENT_Y, ACCENT_Y + ACCENT_T, INNER_HALF_H - 0.002, INNER_HALF_H - 0.001)
add_box(bm_accent, -0.32, 0.32, ACCENT_Y, ACCENT_Y + ACCENT_T, -INNER_HALF_H + 0.001, -INNER_HALF_H + 0.002)

# Corner targeting indicators
CHEV_LEN = 0.035
CHEV_THICK = 0.001
# Top-Left
add_box(bm_accent, -INNER_HALF_W, -INNER_HALF_W + CHEV_LEN, ACCENT_Y, ACCENT_Y + ACCENT_T, INNER_HALF_H - CHEV_THICK, INNER_HALF_H)
add_box(bm_accent, -INNER_HALF_W, -INNER_HALF_W + CHEV_THICK, ACCENT_Y, ACCENT_Y + ACCENT_T, INNER_HALF_H - CHEV_LEN, INNER_HALF_H)
# Top-Right
add_box(bm_accent,  INNER_HALF_W - CHEV_LEN, INNER_HALF_W, ACCENT_Y, ACCENT_Y + ACCENT_T, INNER_HALF_H - CHEV_THICK, INNER_HALF_H)
add_box(bm_accent,  INNER_HALF_W - CHEV_THICK, INNER_HALF_W, ACCENT_Y, ACCENT_Y + ACCENT_T, INNER_HALF_H - CHEV_LEN, INNER_HALF_H)
# Bottom-Left
add_box(bm_accent, -INNER_HALF_W, -INNER_HALF_W + CHEV_LEN, ACCENT_Y, ACCENT_Y + ACCENT_T, -INNER_HALF_H, -INNER_HALF_H + CHEV_THICK)
add_box(bm_accent, -INNER_HALF_W, -INNER_HALF_W + CHEV_THICK, ACCENT_Y, ACCENT_Y + ACCENT_T, -INNER_HALF_H, -INNER_HALF_H + CHEV_LEN)
# Bottom-Right
add_box(bm_accent,  INNER_HALF_W - CHEV_LEN, INNER_HALF_W, ACCENT_Y, ACCENT_Y + ACCENT_T, -INNER_HALF_H, -INNER_HALF_H + CHEV_THICK)
add_box(bm_accent,  INNER_HALF_W - CHEV_THICK, INNER_HALF_W, ACCENT_Y, ACCENT_Y + ACCENT_T, -INNER_HALF_H, -INNER_HALF_H + CHEV_LEN)

bmesh.ops.recalc_face_normals(bm_accent, faces=bm_accent.faces)
bm_accent.to_mesh(mesh_accent)
bm_accent.free()

obj_accent = bpy.data.objects.new("Cyan_Cyber_Accents", mesh_accent)
obj_accent.data.materials.append(mat_cyan_accent)
bpy.context.collection.objects.link(obj_accent)

# -----------------------------------------------------------------------------
# 5. Helper: Decal Planar Quad
# -----------------------------------------------------------------------------
def create_decal_quad(name, width, height):
    mesh = bpy.data.meshes.new(f"Mesh_{name}")
    bm = bmesh.new()
    hw = width / 2.0
    hh = height / 2.0
    
    # Quad oriented in X-Z plane with normal facing +Y
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

DECAL_BASE_Y = FRONT_Y + 0.00010

# -----------------------------------------------------------------------------
# 6. Full-Screen Broken Spider Web Decal & Epicenter Core Decal
# -----------------------------------------------------------------------------
SCREEN_WIDTH = INNER_HALF_W * 2.0 # 1.598m
SCREEN_HEIGHT = INNER_HALF_H * 2.0 # 0.898m

mesh_web_screen = create_decal_quad("Decal_BrokenSpiderWeb_Screen", SCREEN_WIDTH, SCREEN_HEIGHT)
obj_web_screen = bpy.data.objects.new("Decal_BrokenSpiderWeb_Screen", mesh_web_screen)
obj_web_screen.location = (0.0, DECAL_BASE_Y + 0.00002, 0.0)
obj_web_screen.data.materials.append(mat_spider_web)
bpy.context.collection.objects.link(obj_web_screen)

CORE_WIDTH = 0.52
CORE_HEIGHT = 0.52
mesh_web_core = create_decal_quad("Decal_BrokenSpiderWeb_Core", CORE_WIDTH, CORE_HEIGHT)
obj_web_core = bpy.data.objects.new("Decal_BrokenSpiderWeb_Core", mesh_web_core)
obj_web_core.location = (-0.18, DECAL_BASE_Y + 0.00004, 0.08)
obj_web_core.data.materials.append(mat_spider_web)
bpy.context.collection.objects.link(obj_web_core)

# -----------------------------------------------------------------------------
# 7. 16 Targetable Laser Burn & Missile Strike Decals
# -----------------------------------------------------------------------------
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
    mesh = create_decal_quad(name, size, size)
    obj = bpy.data.objects.new(name, mesh)
    obj.location = (cx, DECAL_BASE_Y + 0.00003, cz)
    obj.rotation_euler = (0.0, math.radians(rot_deg), 0.0)
    obj.data.materials.append(mat_laser_burn)
    bpy.context.collection.objects.link(obj)
    decal_objects.append(obj)

for name, cx, cz, rot_deg, size in missile_strike_configs:
    mesh = create_decal_quad(name, size, size)
    obj = bpy.data.objects.new(name, mesh)
    obj.location = (cx, DECAL_BASE_Y + 0.00003, cz)
    obj.rotation_euler = (0.0, math.radians(rot_deg), 0.0)
    obj.data.materials.append(mat_missile_strike)
    bpy.context.collection.objects.link(obj)
    decal_objects.append(obj)

# -----------------------------------------------------------------------------
# 8. Root Parent & Hierarchy
# -----------------------------------------------------------------------------
root_obj = bpy.data.objects.new("screen_decals_spider_web_overlay_4_Root", None)
bpy.context.collection.objects.link(root_obj)

all_mesh_objs = [
    obj_glass, obj_frame, obj_front, obj_back, obj_accent,
    obj_web_screen, obj_web_core
] + decal_objects

for o in all_mesh_objs:
    o.parent = root_obj

# -----------------------------------------------------------------------------
# 9. Save .blend File
# -----------------------------------------------------------------------------
blend_path_4 = OUT_DIR_4 / "screen_decals_spider_web_overlay_4.blend"
bpy.ops.wm.save_as_mainfile(filepath=str(blend_path_4))
print(f"Saved Blend file: {blend_path_4}")

# -----------------------------------------------------------------------------
# 10. Export GLB
# -----------------------------------------------------------------------------
glb_path_4 = OUT_DIR_4 / "screen_decals_spider_web_overlay_4.glb"
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active = root_obj

bpy.ops.export_scene.gltf(
    filepath=str(glb_path_4),
    export_format='GLB',
    use_selection=True,
    export_apply=False,
    export_materials='EXPORT',
    export_image_format='AUTO',
    export_draco_mesh_compression_enable=False
)
print(f"Exported GLB: {glb_path_4}")

# -----------------------------------------------------------------------------
# 11. Export OBJ / MTL
# -----------------------------------------------------------------------------
obj_path_4 = OUT_DIR_4 / "screen_decals_spider_web_overlay_4.obj"
bpy.ops.wm.obj_export(
    filepath=str(obj_path_4),
    export_selected_objects=True,
    export_materials=True
)
print(f"Exported OBJ: {obj_path_4}")

# -----------------------------------------------------------------------------
# 12. Patch GLB for Alpha Blending & Translucency
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
        if "Glass" in mat_name or "Decal" in mat_name or "Spider" in mat_name or "Web" in mat_name:
            mat["alphaMode"] = "BLEND"
            mat["doubleSided"] = True
            pbr = mat.get("pbrMetallicRoughness", {})
            if "baseColorFactor" in pbr and "Glass" in mat_name:
                pbr["baseColorFactor"] = [0.92, 0.96, 1.0, 0.22]
            elif "baseColorFactor" in pbr and ("Spider" in mat_name or "Web" in mat_name):
                pbr["baseColorFactor"] = [1.0, 1.0, 1.0, 1.0]

    new_json_bytes = json.dumps(gltf, separators=(',', ':')).encode("utf-8")
    pad = (4 - (len(new_json_bytes) % 4)) % 4
    new_json_bytes += b" " * pad

    new_total_len = 12 + 8 + len(new_json_bytes) + len(bin_chunk)
    new_header = struct.pack("<4sII", magic, version, new_total_len)
    new_chunk0_hdr = struct.pack("<II", len(new_json_bytes), json_type)

    with open(path, "wb") as f:
        f.write(new_header + new_chunk0_hdr + new_json_bytes + bin_chunk)
    print(f"Patched GLB with double-sided alpha blending: {path} ({new_total_len} bytes)")

patch_glb_translucency(glb_path_4)

# -----------------------------------------------------------------------------
# 13. Create Registry JSON
# -----------------------------------------------------------------------------
registry = {
    "model": "screen_decals_spider_web_overlay.glb",
    "base_name": "screen_decals_spider_web_overlay",
    "description": "XR Mobile Game Translucent Screen Overlay with Full-Screen Broken Spider Web Decal, 0.001m thin border frame, solid front/back panels, and 16 targetable laser burn / missile strike decals",
    "dimensions": {
        "width_meters": WIDTH,
        "height_meters": HEIGHT,
        "border_width_meters": BORDER,
        "frame_thickness_meters": THICKNESS,
        "inner_width_meters": INNER_HALF_W * 2.0,
        "inner_height_meters": INNER_HALF_H * 2.0,
        "aspect_ratio": "16:9"
    },
    "components": {
        "root": "screen_decals_spider_web_overlay_4_Root",
        "glass_screen": "Translucent_Clear_Screen",
        "frame": "Frame_005m_Thick",
        "front_panel": "Solid_Front_Panel",
        "back_panel": "Solid_Back_Panel",
        "cyber_accents": "Cyan_Cyber_Accents",
        "spider_web_full_screen": "Decal_BrokenSpiderWeb_Screen",
        "spider_web_focal_core": "Decal_BrokenSpiderWeb_Core"
    },
    "spider_web_decals": [
        "Decal_BrokenSpiderWeb_Screen",
        "Decal_BrokenSpiderWeb_Core"
    ]
}

json_path_4 = OUT_DIR_4 / "screen_decals_spider_web_overlay_4_materials.json"
with open(json_path_4, "w", encoding="utf-8") as f:
    json.dump(registry, f, indent=2)

# Copy to alias directory
for ext in [".glb", ".blend", ".obj", ".mtl"]:
    src = OUT_DIR_4 / f"screen_decals_spider_web_overlay_4{ext}"
    if src.exists():
        shutil.copy2(src, ALIAS_DIR_4 / src.name)
shutil.copy2(json_path_4, ALIAS_DIR_4 / json_path_4.name)

# -----------------------------------------------------------------------------
# 14. Distribute to Targets:
# - wormhole0/scene_images/screen_decals_spider_web_overlay.glb
# - wormhole0/scene_images/screen_decals_spider_web_overlay_4.glb
# - wormhole0/warp_origin_images/
# - meshy_test_0/models/screen_decals_spider_web_overlay/
# -----------------------------------------------------------------------------
target_copies = [
    (FRONTEND_DIR / "wormhole0" / "scene_images", "screen_decals_spider_web_overlay.glb", "screen_decals_spider_web_overlay_materials.json"),
    (FRONTEND_DIR / "wormhole0" / "scene_images", "screen_decals_spider_web_overlay_4.glb", "screen_decals_spider_web_overlay_4_materials.json"),
    (FRONTEND_DIR / "wormhole0" / "warp_origin_images", "screen_decals_spider_web_overlay.glb", "screen_decals_spider_web_overlay_materials.json"),
    (FRONTEND_DIR / "wormhole0" / "warp_origin_images", "screen_decals_spider_web_overlay_4.glb", "screen_decals_spider_web_overlay_4_materials.json"),
    (OUT_DIR_STD, "screen_decals_spider_web_overlay.glb", "screen_decals_spider_web_overlay_materials.json"),
    (FRONTEND_DIR / "wormhole0" / "mobile" / "warp_origin_images", "screen_decals_spider_web_overlay.glb", "screen_decals_spider_web_overlay_materials.json"),
    (FRONTEND_DIR / "wormhole0" / "mobile" / "warp_origin_images", "screen_decals_spider_web_overlay_4.glb", "screen_decals_spider_web_overlay_4_materials.json"),
    (FRONTEND_DIR / "wormhole0" / "desktop" / "warp_origin_images", "screen_decals_spider_web_overlay.glb", "screen_decals_spider_web_overlay_materials.json"),
    (FRONTEND_DIR / "wormhole0" / "desktop" / "warp_origin_images", "screen_decals_spider_web_overlay_4.glb", "screen_decals_spider_web_overlay_4_materials.json"),
    (FRONTEND_DIR / "wormhole0" / "vr" / "warp_origin_images", "screen_decals_spider_web_overlay.glb", "screen_decals_spider_web_overlay_materials.json"),
    (FRONTEND_DIR / "wormhole0" / "vr" / "warp_origin_images", "screen_decals_spider_web_overlay_4.glb", "screen_decals_spider_web_overlay_4_materials.json"),
    (FRONTEND_DIR / "wormhole0" / "arcore" / "warp_origin_images", "screen_decals_spider_web_overlay.glb", "screen_decals_spider_web_overlay_materials.json"),
    (FRONTEND_DIR / "wormhole0" / "arcore" / "warp_origin_images", "screen_decals_spider_web_overlay_4.glb", "screen_decals_spider_web_overlay_4_materials.json"),
]

for dst_dir, glb_name, json_name in target_copies:
    dst_dir.mkdir(parents=True, exist_ok=True)
    dst_glb = dst_dir / glb_name
    dst_json = dst_dir / json_name
    shutil.copy2(glb_path_4, dst_glb)
    shutil.copy2(json_path_4, dst_json)
    print(f"Copied to: {dst_glb}")

print("\n--- ALL ASSETS FOR SCREEN_DECALS_SPIDER_WEB_OVERLAY GENERATED AND DISTRIBUTED SUCCESSFULLY ---")
