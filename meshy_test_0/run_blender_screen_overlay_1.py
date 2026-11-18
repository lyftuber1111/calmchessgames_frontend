
import bpy
import bmesh
import math
from pathlib import Path

out_dir = Path(r"C:\Users\lyftu\gemini_3\updated_html_js_0\calmchessgames_frontend\meshy_test_0\models\screen_overlay_1")
glb_path = out_dir / "screen_overlay_1.glb"
blend_path = out_dir / "screen_overlay_1.blend"
obj_path = out_dir / "screen_overlay_1.obj"

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
HEIGHT = 0.90      # Z height: 0.90 m
THICKNESS = 0.005  # Y depth: 0.005 m (.005m thick frame!)
BORDER_X = 0.035   # 35mm side frame border
BORDER_Z = 0.030   # 30mm top/bottom frame border

HALF_W = WIDTH / 2.0        # 0.80 m
HALF_H = HEIGHT / 2.0       # 0.45 m
HALF_T = THICKNESS / 2.0    # 0.0025 m

INNER_HALF_W = HALF_W - BORDER_X # 0.765 m
INNER_HALF_H = HALF_H - BORDER_Z # 0.420 m

# -------------------------------------------------------------------------
# Materials Creation
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
        if hasattr(mat, 'use_transparent_shadow'):
            mat.use_transparent_shadow = True
            
    return mat

mat_glass = create_pbr_material(
    name="M_Translucent_Clear_Glass",
    base_color=(0.92, 0.96, 1.0, 0.20),
    metallic=0.05,
    roughness=0.03,
    alpha=0.22,
    transmission=0.95
)

mat_frame = create_pbr_material(
    name="M_Solid_Frame",
    base_color=(0.14, 0.16, 0.20, 1.0),
    metallic=0.85,
    roughness=0.28
)

mat_front_panel = create_pbr_material(
    name="M_Solid_Front_Panel",
    base_color=(0.08, 0.10, 0.14, 1.0),
    metallic=0.75,
    roughness=0.22
)

mat_back_panel = create_pbr_material(
    name="M_Solid_Back_Panel",
    base_color=(0.07, 0.08, 0.11, 1.0),
    metallic=0.65,
    roughness=0.35
)

mat_cyan_accent = create_pbr_material(
    name="M_Cyan_Accent",
    base_color=(0.0, 0.94, 1.0, 1.0),
    metallic=0.1,
    roughness=0.15,
    emission=((0.0, 0.94, 1.0, 1.0), 3.0)
)

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

# 1. Translucent Clear Screen (Manifold 0.005m thick solid glass slab)
mesh_glass = bpy.data.meshes.new("Mesh_Translucent_Screen")
bm_glass = bmesh.new()
bmesh.ops.create_cube(bm_glass, size=1.0)
bmesh.ops.scale(bm_glass, vec=(WIDTH - 0.004, THICKNESS - 0.0004, HEIGHT - 0.004), verts=bm_glass.verts)
bmesh.ops.recalc_face_normals(bm_glass, faces=bm_glass.faces)
bm_glass.to_mesh(mesh_glass)
bm_glass.free()

obj_glass = bpy.data.objects.new("Translucent_Clear_Screen", mesh_glass)
obj_glass.data.materials.append(mat_glass)
bpy.context.collection.objects.link(obj_glass)

# 2. .005m Thick Frame
mesh_frame = bpy.data.meshes.new("Mesh_Frame_005m")
bm_frame = bmesh.new()

outer_pts = [(-HALF_W, -HALF_H), (HALF_W, -HALF_H), (HALF_W, HALF_H), (-HALF_W, HALF_H)]
inner_pts = [(-INNER_HALF_W, -INNER_HALF_H), (INNER_HALF_W, -INNER_HALF_H), (INNER_HALF_W, INNER_HALF_H), (-INNER_HALF_W, INNER_HALF_H)]

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

# 3. Solid Front Panel
mesh_front = bpy.data.meshes.new("Mesh_Solid_Front_Panel")
bm_front = bmesh.new()
PANEL_DEPTH = 0.0015
FRONT_Y = HALF_T

# Solid Front Top Bar
add_box(bm_front, -HALF_W + 0.02, HALF_W - 0.02, FRONT_Y, FRONT_Y + PANEL_DEPTH, HALF_H - 0.040, HALF_H + 0.001)
# Solid Front Bottom Bar
add_box(bm_front, -HALF_W + 0.02, HALF_W - 0.02, FRONT_Y, FRONT_Y + PANEL_DEPTH, -HALF_H - 0.001, -HALF_H + 0.040)
# Solid Left & Right Front Brackets
add_box(bm_front, -HALF_W - 0.001, -HALF_W + 0.040, FRONT_Y, FRONT_Y + PANEL_DEPTH, -0.20, 0.20)
add_box(bm_front,  HALF_W - 0.040,  HALF_W + 0.001, FRONT_Y, FRONT_Y + PANEL_DEPTH, -0.20, 0.20)

bmesh.ops.recalc_face_normals(bm_front, faces=bm_front.faces)
bm_front.to_mesh(mesh_front)
bm_front.free()

obj_front = bpy.data.objects.new("Solid_Front_Panel", mesh_front)
obj_front.data.materials.append(mat_front_panel)
bpy.context.collection.objects.link(obj_front)

# 4. Solid Back Panel
mesh_back = bpy.data.meshes.new("Mesh_Solid_Back_Panel")
bm_back = bmesh.new()
BACK_Y = -HALF_T

# Solid Back Top Housing
add_box(bm_back, -HALF_W + 0.015, HALF_W - 0.015, BACK_Y - PANEL_DEPTH, BACK_Y, HALF_H - 0.045, HALF_H + 0.001)
# Solid Back Bottom Housing
add_box(bm_back, -HALF_W + 0.015, HALF_W - 0.015, BACK_Y - PANEL_DEPTH, BACK_Y, -HALF_H - 0.001, -HALF_H + 0.045)
# Solid Back Left & Right Mounting Plates
add_box(bm_back, -HALF_W - 0.001, -HALF_W + 0.045, BACK_Y - PANEL_DEPTH, BACK_Y, -HALF_H + 0.045, HALF_H - 0.045)
add_box(bm_back,  HALF_W - 0.045,  HALF_W + 0.001, BACK_Y - PANEL_DEPTH, BACK_Y, -HALF_H + 0.045, HALF_H - 0.045)

bmesh.ops.recalc_face_normals(bm_back, faces=bm_back.faces)
bm_back.to_mesh(mesh_back)
bm_back.free()

obj_back = bpy.data.objects.new("Solid_Back_Panel", mesh_back)
obj_back.data.materials.append(mat_back_panel)
bpy.context.collection.objects.link(obj_back)

# 5. Cyan Cyber Accent Trims
mesh_accent = bpy.data.meshes.new("Mesh_Cyan_Accents")
bm_accent = bmesh.new()
ACCENT_Y = FRONT_Y + PANEL_DEPTH + 0.0003
ACCENT_T = 0.0006

add_box(bm_accent, -0.45, 0.45, ACCENT_Y, ACCENT_Y + ACCENT_T, HALF_H - 0.024, HALF_H - 0.020)
add_box(bm_accent, -0.30, 0.30, ACCENT_Y, ACCENT_Y + ACCENT_T, -HALF_H + 0.020, -HALF_H + 0.024)

CHEV_LEN = 0.050
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
# UV Smart Project on all meshes
# -------------------------------------------------------------------------
all_mesh_objs = [obj_glass, obj_frame, obj_front, obj_back, obj_accent]
for o in all_mesh_objs:
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(island_margin=0.01)
    bpy.ops.object.mode_set(mode='OBJECT')

# Root Empty Parent
empty_root = bpy.data.objects.new("Screen_Overlay_1_Root", None)
bpy.context.collection.objects.link(empty_root)

for child in all_mesh_objs:
    child.parent = empty_root

bpy.ops.object.select_all(action='DESELECT')
for o in [empty_root] + all_mesh_objs:
    o.select_set(True)
bpy.context.view_layer.objects.active = empty_root

# Save .blend
bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
print(f"Saved: {blend_path}")

# Export GLB
bpy.ops.export_scene.gltf(
    filepath=str(glb_path),
    export_format='GLB',
    use_selection=True,
    export_apply=False,
    export_materials='EXPORT',
    export_image_format='AUTO'
)
print(f"Exported GLB: {glb_path}")

# Export OBJ
bpy.ops.wm.obj_export(
    filepath=str(obj_path),
    export_selected_objects=True,
    export_materials=True
)
print(f"Exported OBJ: {obj_path}")
