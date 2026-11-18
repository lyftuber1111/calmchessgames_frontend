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
SRC_MODEL_NAME = "screen_decals_overlay_3"
MODEL_NAME = "screen_decals_spider_web_overlay_4"
DIR_NAME = "screen_decals_spider_web_overlay_4"
ALIAS_DIR_NAME = "screen_decals__spider_web_overlay_4"

SRC_GLB = FRONTEND_DIR / "meshy_test_0" / "models" / SRC_MODEL_NAME / f"{SRC_MODEL_NAME}.glb"

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

print(f"Generating {MODEL_NAME} from {SRC_GLB}...")

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
# Import Base Model (screen_decals_overlay_3.glb)
# -----------------------------------------------------------------------------
print(f"Importing base GLB: {SRC_GLB}")
bpy.ops.import_scene.gltf(filepath=str(SRC_GLB))

# Find imported root object and components
root_obj = None
for o in bpy.data.objects:
    if "Root" in o.name or o.parent is None:
        root_obj = o
        break

if not root_obj:
    root_obj = bpy.data.objects.new(f"{MODEL_NAME}_Root", None)
    bpy.context.collection.objects.link(root_obj)
else:
    root_obj.name = f"{MODEL_NAME}_Root"

# -----------------------------------------------------------------------------
# Setup PBR Material for Broken Spider Web Decal
# -----------------------------------------------------------------------------
diffuse_path = OUT_TEX_DIR / "decal_spider_web_diffuse.png"
normal_path = OUT_TEX_DIR / "decal_spider_web_normal.png"
roughness_path = OUT_TEX_DIR / "decal_spider_web_roughness.png"

mat_spider_web = bpy.data.materials.new(name="M_Broken_Spider_Web_Decal")
mat_spider_web.use_nodes = True
nodes = mat_spider_web.node_tree.nodes
links = mat_spider_web.node_tree.links
nodes.clear()

node_out = nodes.new(type='ShaderNodeOutputMaterial')
node_out.location = (450, 0)

bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
bsdf.location = (0, 0)
links.new(bsdf.outputs['BSDF'], node_out.inputs['Surface'])

bsdf.inputs['Base Color'].default_value = (1.0, 1.0, 1.0, 1.0)
bsdf.inputs['Metallic'].default_value = 0.05
bsdf.inputs['Roughness'].default_value = 0.25
bsdf.inputs['Alpha'].default_value = 1.0

# Connect Diffuse (Base Color & Alpha)
if diffuse_path.exists():
    tex_diff = nodes.new(type='ShaderNodeTexImage')
    tex_diff.location = (-450, 150)
    img_diff = bpy.data.images.load(str(diffuse_path))
    tex_diff.image = img_diff
    links.new(tex_diff.outputs['Color'], bsdf.inputs['Base Color'])
    links.new(tex_diff.outputs['Alpha'], bsdf.inputs['Alpha'])

# Connect Roughness
if roughness_path.exists():
    tex_rou = nodes.new(type='ShaderNodeTexImage')
    tex_rou.location = (-450, -120)
    img_rou = bpy.data.images.load(str(roughness_path))
    img_rou.colorspace_settings.name = 'Non-Color'
    tex_rou.image = img_rou
    links.new(tex_rou.outputs['Color'], bsdf.inputs['Roughness'])

# Connect Normal Map
if normal_path.exists():
    tex_nor = nodes.new(type='ShaderNodeTexImage')
    tex_nor.location = (-650, -350)
    img_nor = bpy.data.images.load(str(normal_path))
    img_nor.colorspace_settings.name = 'Non-Color'
    tex_nor.image = img_nor

    node_nor_map = nodes.new(type='ShaderNodeNormalMap')
    node_nor_map.location = (-350, -350)
    links.new(tex_nor.outputs['Color'], node_nor_map.inputs['Color'])
    links.new(node_nor_map.outputs['Normal'], bsdf.inputs['Normal'])

mat_spider_web.blend_method = 'BLEND'
if hasattr(mat_spider_web, 'shadow_method'):
    mat_spider_web.shadow_method = 'NONE'

# -----------------------------------------------------------------------------
# Helper: Create Planar Decal Quad with UV Mapping
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

# -----------------------------------------------------------------------------
# 1. Add Full-Screen Broken Spider Web Decal Mesh
# -----------------------------------------------------------------------------
# Dimensions matching the overlay screen glass (1.596m x 0.896m)
SCREEN_WIDTH = 1.596
SCREEN_HEIGHT = 0.896
DECAL_Y = 0.00315  # Placed just in front of glass surface (glass is 0.0025m)

mesh_web_screen = create_decal_quad("Decal_BrokenSpiderWeb_Screen", SCREEN_WIDTH, SCREEN_HEIGHT)
obj_web_screen = bpy.data.objects.new("Decal_BrokenSpiderWeb_Screen", mesh_web_screen)
obj_web_screen.location = (0.0, DECAL_Y, 0.0)
obj_web_screen.data.materials.append(mat_spider_web)
bpy.context.collection.objects.link(obj_web_screen)
obj_web_screen.parent = root_obj

print(f"Created master full-screen decal mesh: Decal_BrokenSpiderWeb_Screen ({SCREEN_WIDTH}m x {SCREEN_HEIGHT}m at Y={DECAL_Y})")

# -----------------------------------------------------------------------------
# 2. Add Secondary Core Fracture Spider Web Decal Mesh (Zone A Epicenter)
# -----------------------------------------------------------------------------
# Allows developers to toggle either the entire overlay screen web or an isolated impact core
CORE_WIDTH = 0.52
CORE_HEIGHT = 0.52
mesh_web_core = create_decal_quad("Decal_BrokenSpiderWeb_Core", CORE_WIDTH, CORE_HEIGHT)
obj_web_core = bpy.data.objects.new("Decal_BrokenSpiderWeb_Core", mesh_web_core)
obj_web_core.location = (-0.18, DECAL_Y + 0.0001, 0.08)
obj_web_core.data.materials.append(mat_spider_web)
bpy.context.collection.objects.link(obj_web_core)
obj_web_core.parent = root_obj

print(f"Created secondary focal core decal mesh: Decal_BrokenSpiderWeb_Core")

# -----------------------------------------------------------------------------
# Save .blend file
# -----------------------------------------------------------------------------
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
print(f"Saved Blend file: {BLEND_PATH}")

# -----------------------------------------------------------------------------
# Export GLB
# -----------------------------------------------------------------------------
# Select all objects under root
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active = root_obj

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

# -----------------------------------------------------------------------------
# Export OBJ / MTL
# -----------------------------------------------------------------------------
bpy.ops.wm.obj_export(
    filepath=str(OBJ_PATH),
    export_selected_objects=True,
    export_materials=True
)
print(f"Exported OBJ: {OBJ_PATH}")

# -----------------------------------------------------------------------------
# Post-Process GLB for Reliable WebXR Translucency & Alpha Blending
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

patch_glb_translucency(GLB_PATH)

# Mirror files to alias directory
for ext in [".glb", ".blend", ".obj", ".mtl"]:
    src = OUT_DIR / f"{MODEL_NAME}{ext}"
    if src.exists():
        shutil.copy2(src, ALIAS_DIR / src.name)

# -----------------------------------------------------------------------------
# Materials & Decal Registry JSON
# -----------------------------------------------------------------------------
registry = {
    "model_name": MODEL_NAME,
    "directory": DIR_NAME,
    "glb_path": f"./meshy_test_0/models/{DIR_NAME}/{MODEL_NAME}.glb",
    "blend_path": f"./meshy_test_0/models/{DIR_NAME}/{MODEL_NAME}.blend",
    "description": "XR Mobile Game Translucent Screen Overlay with Full-Screen Broken Spider Web Decal, 0.005m thick frame, solid front/back panels, and 16 targetable laser burn / missile strike decals",
    "dimensions": {
        "width_meters": 1.60,
        "height_meters": 0.90,
        "frame_thickness_meters": 0.005,
        "aspect_ratio": "16:9"
    },
    "components": {
        "root": f"{MODEL_NAME}_Root",
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
    ],
    "code_targeting_examples": {
        "threejs_toggle_spiderweb": "const web = scene.getObjectByName('Decal_BrokenSpiderWeb_Screen'); web.visible = !web.visible;",
        "threejs_turn_off_spiderweb": "scene.getObjectByName('Decal_BrokenSpiderWeb_Screen').visible = false;",
        "threejs_turn_on_spiderweb": "scene.getObjectByName('Decal_BrokenSpiderWeb_Screen').visible = true;",
        "unity_csharp_toggle": "GameObject web = transform.Find(\"Decal_BrokenSpiderWeb_Screen\").gameObject; web.SetActive(!web.activeSelf);",
        "unreal_blueprint_toggle": "Find Component by Class / Tag 'Decal_BrokenSpiderWeb_Screen' -> Set Visibility (false/true)",
        "global_ui_helper": "window.toggleDecalMesh('Decal_BrokenSpiderWeb_Screen', false);"
    }
}

with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(registry, f, indent=2)

shutil.copy2(JSON_PATH, ALIAS_DIR / JSON_PATH.name)
print(f"Saved Registry JSON: {JSON_PATH}")

print("\n--- ALL ASSETS FOR SCREEN_DECALS_SPIDER_WEB_OVERLAY_4 GENERATED SUCCESSFULLY ---")
