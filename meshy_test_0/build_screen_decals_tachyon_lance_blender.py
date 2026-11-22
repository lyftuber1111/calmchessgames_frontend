"""Create screen_decals_tachyon_lance.blend by copying screen_decals_spider_web_overlay_4.blend
and replacing all decals with high-contrast Tachyon Lance piercing decals.

Preserves all 18 mesh names expected by wormhole0/js/object_pool.js:
  - Decal_LaserBurn_01..08       -> M_Tachyon_Lance_Pierce_Glancing_Decal (non-lethal glancing hit)
  - Decal_MissileStrike_01..08   -> M_Tachyon_Lance_Pierce_Heavy_Decal    (non-lethal heavy hit)
  - Decal_BrokenSpiderWeb_Core   -> M_Tachyon_Lance_Core_Breach_Decal     (core breach)
  - Decal_BrokenSpiderWeb_Screen -> M_Tachyon_Lance_FullScreen_Shatter_Decal (full-screen shatter)
"""

import json
import shutil
import struct
from pathlib import Path

import bpy
from mathutils import Vector


FRONTEND_DIR = Path(r"C:\Users\lyftu\gemini_3\updated_html_js_0\calmchessgames_frontend")
SRC_BLEND = (
    FRONTEND_DIR
    / "meshy_test_0"
    / "models"
    / "screen_decals_spider_web_overlay_4"
    / "screen_decals_spider_web_overlay_4.blend"
)

MODEL_NAME = "screen_decals_tachyon_lance"
OUT_DIR = FRONTEND_DIR / "meshy_test_0" / "models" / MODEL_NAME
TEX_DIR = OUT_DIR / f"{MODEL_NAME}_textures"
YEST_TEX_DIR = FRONTEND_DIR / "meshy_yest_0" / "models" / MODEL_NAME / f"{MODEL_NAME}_textures"

for d in (OUT_DIR, TEX_DIR, YEST_TEX_DIR):
    d.mkdir(parents=True, exist_ok=True)

BLEND_PATH = OUT_DIR / f"{MODEL_NAME}.blend"
GLB_PATH = OUT_DIR / f"{MODEL_NAME}.glb"
FBX_PATH = OUT_DIR / f"{MODEL_NAME}.fbx"
OBJ_PATH = OUT_DIR / f"{MODEL_NAME}.obj"
MTL_PATH = OUT_DIR / f"{MODEL_NAME}.mtl"
JSON_PATH = OUT_DIR / f"{MODEL_NAME}_materials.json"


def load_image_safe(path: Path, colorspace="sRGB"):
    img = bpy.data.images.load(str(path), check_existing=True)
    img.colorspace_settings.name = colorspace
    return img


def build_tachyon_decal_material(
    mat_name: str,
    diff_path: Path,
    norm_path: Path,
    rough_path: Path,
    emission_strength: float = 1.6,
):
    """Create a high-contrast Principled BSDF decal material glowing cleanly on black."""
    mat = bpy.data.materials.new(name=mat_name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out_node = nodes.new(type="ShaderNodeOutputMaterial")
    out_node.location = (520, 0)

    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    bsdf.location = (80, 0)
    links.new(bsdf.outputs["BSDF"], out_node.inputs["Surface"])

    bsdf.inputs["Base Color"].default_value = (1.0, 1.0, 1.0, 1.0)
    bsdf.inputs["Metallic"].default_value = 0.05
    bsdf.inputs["Roughness"].default_value = 0.22
    bsdf.inputs["Alpha"].default_value = 1.0

    if diff_path.exists():
        tex_diff = nodes.new(type="ShaderNodeTexImage")
        tex_diff.location = (-440, 200)
        tex_diff.image = load_image_safe(diff_path, "sRGB")
        tex_diff.extension = "CLIP"
        links.new(tex_diff.outputs["Color"], bsdf.inputs["Base Color"])
        links.new(tex_diff.outputs["Alpha"], bsdf.inputs["Alpha"])
        if "Emission Color" in bsdf.inputs:
            links.new(tex_diff.outputs["Color"], bsdf.inputs["Emission Color"])
            if "Emission Strength" in bsdf.inputs:
                bsdf.inputs["Emission Strength"].default_value = emission_strength

    if rough_path.exists():
        tex_rou = nodes.new(type="ShaderNodeTexImage")
        tex_rou.location = (-440, -100)
        tex_rou.image = load_image_safe(rough_path, "Non-Color")
        tex_rou.extension = "CLIP"
        links.new(tex_rou.outputs["Color"], bsdf.inputs["Roughness"])

    if norm_path.exists():
        tex_nor = nodes.new(type="ShaderNodeTexImage")
        tex_nor.location = (-680, -340)
        tex_nor.image = load_image_safe(norm_path, "Non-Color")
        tex_nor.extension = "CLIP"

        nor_map = nodes.new(type="ShaderNodeNormalMap")
        nor_map.location = (-360, -340)
        nor_map.inputs["Strength"].default_value = 1.15
        links.new(tex_nor.outputs["Color"], nor_map.inputs["Color"])
        links.new(nor_map.outputs["Normal"], bsdf.inputs["Normal"])

    if hasattr(mat, "blend_method"):
        mat.blend_method = "BLEND"
    if hasattr(mat, "surface_render_method"):
        mat.surface_render_method = "BLENDED"
    if hasattr(mat, "use_backface_culling"):
        mat.use_backface_culling = False
    if hasattr(mat, "shadow_method"):
        mat.shadow_method = "NONE"

    return mat


def relink_frame_material():
    """Point M_Solid_Frame textures to screen_decals_tachyon_lance_textures/."""
    mat_frame = bpy.data.materials.get("M_Solid_Frame")
    if not mat_frame or not mat_frame.use_nodes:
        return
    for node in mat_frame.node_tree.nodes:
        if node.type == "TEX_IMAGE" and node.image:
            fname = Path(bpy.path.abspath(node.image.filepath)).name
            if not fname:
                fname = Path(node.image.name).name
            candidate = TEX_DIR / fname
            if candidate.exists():
                cs = node.image.colorspace_settings.name
                node.image = load_image_safe(candidate, cs)


def patch_glb_blending(glb_path: Path):
    """Ensure alphaMode='BLEND' and doubleSided=True on glass & all Tachyon decal materials."""
    data = glb_path.read_bytes()
    if len(data) < 20 or data[:4] != b"glTF":
        return

    magic, version, total_len = struct.unpack("<4sII", data[:12])
    json_len, json_type = struct.unpack("<II", data[12:20])
    if json_type != 0x4E4F534A:
        return

    gltf = json.loads(data[20 : 20 + json_len].decode("utf-8"))
    bin_chunk = data[20 + json_len :]

    for mat in gltf.get("materials", []):
        m_name = mat.get("name", "")
        if any(tag in m_name for tag in ("Glass", "Tachyon", "Decal", "Spider", "Web")):
            mat["alphaMode"] = "BLEND"
            mat["doubleSided"] = True
            pbr = mat.setdefault("pbrMetallicRoughness", {})
            if "Glass" in m_name:
                pbr["baseColorFactor"] = [0.92, 0.96, 1.0, 0.22]
            else:
                pbr["baseColorFactor"] = [1.0, 1.0, 1.0, 1.0]

    new_json = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    pad = (4 - (len(new_json) % 4)) % 4
    new_json += b" " * pad

    new_total = 12 + 8 + len(new_json) + len(bin_chunk)
    new_hdr = struct.pack("<4sII", magic, version, new_total)
    new_c0 = struct.pack("<II", len(new_json), json_type)
    glb_path.write_bytes(new_hdr + new_c0 + new_json + bin_chunk)


def normalize_mtl_paths(mtl_path: Path):
    """Ensure .mtl references relative texture paths inside screen_decals_tachyon_lance_textures/."""
    if not mtl_path.exists():
        return
    lines = mtl_path.read_text(encoding="utf-8").splitlines()
    out_lines = []
    for line in lines:
        stripped = line.strip()
        if any(stripped.startswith(k) for k in ("map_Kd", "map_Bump", "map_bump", "map_Ns", "map_Pm", "map_Pr", "map_d", "map_Ke", "bump")):
            parts = line.split(None, 1)
            if len(parts) == 2:
                key, val = parts[0], parts[1].strip()
                # Extract filename from possible options (-bm etc.) or path
                tokens = val.split()
                tex_token = tokens[-1].replace("\\", "/")
                fname = Path(tex_token).name
                if (TEX_DIR / fname).exists():
                    tokens[-1] = f"{MODEL_NAME}_textures/{fname}"
                    line = f"{key} {' '.join(tokens)}"
        out_lines.append(line)
    mtl_path.write_text("\n".join(out_lines) + "\n", encoding="utf-8")


def render_decal_preview(filename: str, show_screen: bool, show_core: bool):
    """Render visor decal combination on pure #000000 black background (for visual verification)."""
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"

    if scene.world is None:
        scene.world = bpy.data.worlds.new("BlackSpaceWorld")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.0, 0.0, 0.0, 1.0)
        bg.inputs["Strength"].default_value = 1.0

    # Toggle visibility strictly for render preview (do NOT save blend after this!)
    for obj in bpy.data.objects:
        if obj.name in ("Solid_Front_Panel", "Solid_Back_Panel", "Translucent_Clear_Screen"):
            obj.hide_render = True
        elif obj.name == "Decal_BrokenSpiderWeb_Screen":
            obj.hide_render = not show_screen
        elif obj.name == "Decal_BrokenSpiderWeb_Core":
            obj.hide_render = not show_core
        elif obj.name.startswith("Decal_LaserBurn_") or obj.name.startswith("Decal_MissileStrike_"):
            obj.hide_render = False

    # Setup front-facing camera looking at the visor (+Y front face, so camera sits at +Y looking -Y)
    for o in list(bpy.data.objects):
        if o.type in ("LIGHT", "CAMERA"):
            bpy.data.objects.remove(o, do_unlink=True)

    ldata = bpy.data.lights.new("VisorLight", type="AREA")
    ldata.energy = 80.0
    ldata.size = 2.5
    lobj = bpy.data.objects.new("VisorLight", ldata)
    bpy.context.collection.objects.link(lobj)
    lobj.location = (0.4, 2.0, 0.6)
    lobj.rotation_euler = (Vector((0, 0, 0)) - Vector(lobj.location)).to_track_quat("-Z", "Y").to_euler()

    cdata = bpy.data.cameras.new("VisorCam")
    cdata.lens = 38.0
    cobj = bpy.data.objects.new("VisorCam", cdata)
    bpy.context.collection.objects.link(cobj)
    cobj.location = (0.0, 2.05, 0.0)
    cobj.rotation_euler = (Vector((0, 0, 0)) - Vector(cobj.location)).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cobj

    out_png = TEX_DIR / filename
    scene.render.filepath = str(out_png)
    try:
        bpy.ops.render.render(write_still=True)
        print(f"[PREVIEW] Rendered {out_png}")
    except Exception as exc:
        print(f"[PREVIEW WARNING] EEVEE render failed for {filename}: {exc}")


def main():
    if not SRC_BLEND.exists():
        raise FileNotFoundError(f"Source blend not found: {SRC_BLEND}")

    print(f"Opening exact source blend: {SRC_BLEND}")
    bpy.ops.wm.open_mainfile(filepath=str(SRC_BLEND))

    # Rename root Empty cleanly
    root_obj = None
    for obj in bpy.data.objects:
        if obj.type == "EMPTY" or "Root" in obj.name:
            root_obj = obj
            break
    if root_obj is None:
        root_obj = bpy.data.objects.new(f"{MODEL_NAME}_Root", None)
        bpy.context.collection.objects.link(root_obj)
    else:
        root_obj.name = f"{MODEL_NAME}_Root"

    # Relink frame material images into screen_decals_tachyon_lance_textures/
    relink_frame_material()

    # Create 4 new Tachyon Lance decal materials
    mat_glancing = build_tachyon_decal_material(
        "M_Tachyon_Lance_Pierce_Glancing_Decal",
        TEX_DIR / "decal_tachyon_pierce_glancing_diffuse.png",
        TEX_DIR / "decal_tachyon_pierce_glancing_normal.png",
        TEX_DIR / "decal_tachyon_pierce_glancing_roughness.png",
        emission_strength=1.6,
    )
    mat_heavy = build_tachyon_decal_material(
        "M_Tachyon_Lance_Pierce_Heavy_Decal",
        TEX_DIR / "decal_tachyon_pierce_heavy_diffuse.png",
        TEX_DIR / "decal_tachyon_pierce_heavy_normal.png",
        TEX_DIR / "decal_tachyon_pierce_heavy_roughness.png",
        emission_strength=1.7,
    )
    mat_core = build_tachyon_decal_material(
        "M_Tachyon_Lance_Core_Breach_Decal",
        TEX_DIR / "decal_tachyon_core_breach_diffuse.png",
        TEX_DIR / "decal_tachyon_core_breach_normal.png",
        TEX_DIR / "decal_tachyon_core_breach_roughness.png",
        emission_strength=1.8,
    )
    mat_screen = build_tachyon_decal_material(
        "M_Tachyon_Lance_FullScreen_Shatter_Decal",
        TEX_DIR / "decal_tachyon_screen_shatter_diffuse.png",
        TEX_DIR / "decal_tachyon_screen_shatter_normal.png",
        TEX_DIR / "decal_tachyon_screen_shatter_roughness.png",
        emission_strength=1.6,
    )

    # Reassign materials on all 18 preserved decal objects (keeping exact mesh names!)
    reassigned = {"glancing": 0, "heavy": 0, "core": 0, "screen": 0}
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        if obj.name.startswith("Decal_LaserBurn_"):
            obj.data.materials.clear()
            obj.data.materials.append(mat_glancing)
            reassigned["glancing"] += 1
        elif obj.name.startswith("Decal_MissileStrike_"):
            obj.data.materials.clear()
            obj.data.materials.append(mat_heavy)
            reassigned["heavy"] += 1
        elif obj.name == "Decal_BrokenSpiderWeb_Core":
            obj.data.materials.clear()
            obj.data.materials.append(mat_core)
            reassigned["core"] += 1
        elif obj.name == "Decal_BrokenSpiderWeb_Screen":
            obj.data.materials.clear()
            obj.data.materials.append(mat_screen)
            reassigned["screen"] += 1

    print(f"Reassigned decal materials: {reassigned}")

    # Purge orphaned spider-web/burn/missile materials & images
    for old_mat_name in ("M_Broken_Spider_Web_Decal", "M_Laser_Burn_Decal_NoLines", "M_Missile_Strike_Decal_NoLines"):
        old_m = bpy.data.materials.get(old_mat_name)
        if old_m and old_m.users == 0:
            bpy.data.materials.remove(old_m)
    bpy.data.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)

    # Save first to establish new BLEND_PATH directory, make paths relative, then export disk-backed GLB/FBX/OBJ
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    bpy.ops.file.make_paths_relative()

    bpy.ops.object.select_all(action="SELECT")
    bpy.context.view_layer.objects.active = root_obj

    bpy.ops.export_scene.gltf(
        filepath=str(GLB_PATH),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=False,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_draco_mesh_compression_enable=False,
    )
    patch_glb_blending(GLB_PATH)

    bpy.ops.export_scene.fbx(
        filepath=str(FBX_PATH),
        use_selection=True,
        axis_forward="-Z",
        axis_up="Y",
        apply_scale_options="FBX_SCALE_ALL",
        mesh_smooth_type="FACE",
        path_mode="COPY",
        embed_textures=True,
    )

    bpy.ops.wm.obj_export(
        filepath=str(OBJ_PATH),
        export_selected_objects=True,
        export_materials=True,
        forward_axis="NEGATIVE_Z",
        up_axis="Y",
        path_mode="RELATIVE",
    )
    normalize_mtl_paths(MTL_PATH)

    # Pack all textures into .blend so it is 100% self-contained, and re-save .blend cleanly
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))

    # Write materials & decals registry JSON
    total_verts = sum(len(o.data.vertices) for o in bpy.data.objects if o.type == "MESH")
    total_tris = sum(sum(max(0, len(p.vertices) - 2) for p in o.data.polygons) for o in bpy.data.objects if o.type == "MESH")
    registry = {
        "model_name": MODEL_NAME,
        "source_blend_copied_from": "screen_decals_spider_web_overlay_4.blend",
        "directory": f"meshy_test_0/models/{MODEL_NAME}",
        "files": {
            "blend": f"./meshy_test_0/models/{MODEL_NAME}/{MODEL_NAME}.blend",
            "glb": f"./meshy_test_0/models/{MODEL_NAME}/{MODEL_NAME}.glb",
            "fbx": f"./meshy_test_0/models/{MODEL_NAME}/{MODEL_NAME}.fbx",
            "obj": f"./meshy_test_0/models/{MODEL_NAME}/{MODEL_NAME}.obj",
            "mtl": f"./meshy_test_0/models/{MODEL_NAME}/{MODEL_NAME}.mtl",
        },
        "stats": {"total_vertices": total_verts, "total_triangles": total_tris},
        "description": "Copied from screen_decals_spider_web_overlay_4.blend with all spider-web, laser-burn, and missile-strike decals replaced by high-contrast Tachyon Lance piercing decals for black backgrounds.",
        "decal_mapping": {
            "non_lethal_glancing_hits": [f"Decal_LaserBurn_{i:02d}" for i in range(1, 9)],
            "non_lethal_heavy_hits": [f"Decal_MissileStrike_{i:02d}" for i in range(1, 9)],
            "core_breach_replaced_spiderweb_core": "Decal_BrokenSpiderWeb_Core",
            "fullscreen_shatter_replaced_spiderweb_screen": "Decal_BrokenSpiderWeb_Screen",
        },
        "materials": [m.name for m in bpy.data.materials],
    }
    JSON_PATH.write_text(json.dumps(registry, indent=2), encoding="utf-8")

    print(f"[DONE] Saved {BLEND_PATH} + GLB/FBX/OBJ ({total_verts} verts, {total_tris} tris)")

    # Render preview PNGs on pure black (without saving render visibility state back to .blend)
    render_decal_preview("preview_nonlethal_decals_black.png", show_screen=False, show_core=False)
    render_decal_preview("preview_all_decals_black.png", show_screen=True, show_core=True)


if __name__ == "__main__":
    main()
