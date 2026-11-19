import bpy
import bmesh
import json
import math
import shutil
import struct
from pathlib import Path
from mathutils import Vector

# -----------------------------------------------------------------------------
# Configuration & Paths
# -----------------------------------------------------------------------------
FRONTEND_DIR = Path(r"C:\Users\lyftu\gemini_3\updated_html_js_0\calmchessgames_frontend")
SRC_GLB = FRONTEND_DIR / "wormhole0" / "scene_images" / "screen_decals_spider_web_overlay.glb"

OUT_DIR_SCENE = FRONTEND_DIR / "wormhole0" / "scene_images"
OUT_GLB = OUT_DIR_SCENE / "screen_decals_spider_web_overlay_5.glb"
OUT_JSON = OUT_DIR_SCENE / "screen_decals_spider_web_overlay_5_materials.json"

MODEL_DIR = FRONTEND_DIR / "meshy_test_0" / "models" / "screen_decals_spider_web_overlay_5"
MODEL_BLEND = MODEL_DIR / "screen_decals_spider_web_overlay_5.blend"
MODEL_GLB = MODEL_DIR / "screen_decals_spider_web_overlay_5.glb"
MODEL_JSON = MODEL_DIR / "screen_decals_spider_web_overlay_5_materials.json"

MODEL_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR_SCENE.mkdir(parents=True, exist_ok=True)

# -----------------------------------------------------------------------------
# Concave Outward Visor Geometry Parameters (Blender Z-up -> glTF Y-up)
#   Blender (x, y, z) exports to glTF (x, z, -y) with export_yup=True.
#   Sphere center in Blender: (0.0, 0.45, 0.0) -> glTF (0.0, 0.0, -0.45).
#   Outer glass radius R_OUTER = 1.5500 m -> center apex at Y = +2.0000 m
#   (glTF Z = -2.0000 m), exact farthest point = 2.0000 m from (0, 0, 0).
#   Edges at X = ±0.80 m, Z_b = ±0.45 m curve back by ~0.3010 m (Y = 1.6990 m).
# -----------------------------------------------------------------------------
WIDTH = 1.60
HEIGHT = 0.90
HALF_W = WIDTH / 2.0
HALF_H = HEIGHT / 2.0

Y_CENTER = 0.45
R_OUTER = 1.5500
SPHERE_CENTER = Vector((0.0, Y_CENTER, 0.0))

GLASS_THICKNESS = 0.0008
R_GLASS_OUTER = R_OUTER                      # 1.55000 m
R_GLASS_INNER = R_OUTER - GLASS_THICKNESS    # 1.54920 m
R_WEB_SCREEN = 1.54880
R_LASER_BASE = 1.54840
R_MISSILE_BASE = 1.54810
R_LAYER_STEP = 0.00003
R_WEB_CORE = 1.54760

SCREEN_SEG_X = 64
SCREEN_SEG_Z = 36
CORE_SEG = 24
DECAL_SEG = 16

BORDER_OBJECT_NAMES = {
    "Frame_005m_Thick",
    "Solid_Front_Panel",
    "Solid_Back_Panel",
    "Cyan_Cyber_Accents",
}
BORDER_MATERIAL_NAMES = {
    "M_Solid_Frame",
    "M_Solid_Front_Panel",
    "M_Solid_Back_Panel",
    "M_Cyan_Accent",
}


def project_to_visor(x: float, z: float, r_layer: float) -> Vector:
    """Project planar (x, z) onto concentric visor sphere of radius r_layer."""
    rad_sq = R_OUTER * R_OUTER - x * x - z * z
    if rad_sq <= 0.0:
        raise ValueError(f"Point ({x:.5f}, {z:.5f}) falls outside visor sphere radius {R_OUTER}")
    dy_out = math.sqrt(rad_sq)
    scale = r_layer / R_OUTER
    return Vector((x * scale, Y_CENTER + dy_out * scale, z * scale))


def build_curved_glass_mesh(name: str) -> bpy.types.Mesh:
    """Create watertight curved translucent glass shell (outer + inner + perimeter rim)."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    outer_grid = []
    inner_grid = []
    for i in range(SCREEN_SEG_X + 1):
        u = i / SCREEN_SEG_X
        x = -HALF_W + u * WIDTH
        col_out = []
        col_in = []
        for j in range(SCREEN_SEG_Z + 1):
            v = j / SCREEN_SEG_Z
            z = -HALF_H + v * HEIGHT
            col_out.append(bm.verts.new(project_to_visor(x, z, R_GLASS_OUTER)))
            col_in.append(bm.verts.new(project_to_visor(x, z, R_GLASS_INNER)))
        outer_grid.append(col_out)
        inner_grid.append(col_in)

    def make_quad(verts, uvs, smooth=True):
        face = bm.faces.new(verts)
        face.smooth = smooth
        for loop, uv in zip(face.loops, uvs):
            loop[uv_layer].uv = uv
        return face

    # Outer and inner curved surfaces
    for i in range(SCREEN_SEG_X):
        u0 = i / SCREEN_SEG_X
        u1 = (i + 1) / SCREEN_SEG_X
        for j in range(SCREEN_SEG_Z):
            v0 = j / SCREEN_SEG_Z
            v1 = (j + 1) / SCREEN_SEG_Z

            # Outer surface (normal away from pilot / +Y_b)
            make_quad(
                [outer_grid[i][j], outer_grid[i][j + 1], outer_grid[i + 1][j + 1], outer_grid[i + 1][j]],
                [(u0, v0), (u0, v1), (u1, v1), (u1, v0)],
                smooth=True,
            )
            # Inner surface (normal toward pilot / -Y_b)
            make_quad(
                [inner_grid[i][j], inner_grid[i + 1][j], inner_grid[i + 1][j + 1], inner_grid[i][j + 1]],
                [(u0, v0), (u1, v0), (u1, v1), (u0, v1)],
                smooth=True,
            )

    # Stitch 4 perimeter rim walls to form a closed watertight manifold
    # Bottom edge (j = 0)
    for i in range(SCREEN_SEG_X):
        u0 = i / SCREEN_SEG_X
        u1 = (i + 1) / SCREEN_SEG_X
        make_quad(
            [outer_grid[i][0], outer_grid[i + 1][0], inner_grid[i + 1][0], inner_grid[i][0]],
            [(u0, 0.0), (u1, 0.0), (u1, 0.0), (u0, 0.0)],
            smooth=False,
        )
    # Top edge (j = SCREEN_SEG_Z)
    for i in range(SCREEN_SEG_X):
        u0 = i / SCREEN_SEG_X
        u1 = (i + 1) / SCREEN_SEG_X
        make_quad(
            [outer_grid[i + 1][SCREEN_SEG_Z], outer_grid[i][SCREEN_SEG_Z], inner_grid[i][SCREEN_SEG_Z], inner_grid[i + 1][SCREEN_SEG_Z]],
            [(u1, 1.0), (u0, 1.0), (u0, 1.0), (u1, 1.0)],
            smooth=False,
        )
    # Left edge (i = 0)
    for j in range(SCREEN_SEG_Z):
        v0 = j / SCREEN_SEG_Z
        v1 = (j + 1) / SCREEN_SEG_Z
        make_quad(
            [outer_grid[0][j + 1], outer_grid[0][j], inner_grid[0][j], inner_grid[0][j + 1]],
            [(0.0, v1), (0.0, v0), (0.0, v0), (0.0, v1)],
            smooth=False,
        )
    # Right edge (i = SCREEN_SEG_X)
    for j in range(SCREEN_SEG_Z):
        v0 = j / SCREEN_SEG_Z
        v1 = (j + 1) / SCREEN_SEG_Z
        make_quad(
            [outer_grid[SCREEN_SEG_X][j], outer_grid[SCREEN_SEG_X][j + 1], inner_grid[SCREEN_SEG_X][j + 1], inner_grid[SCREEN_SEG_X][j]],
            [(1.0, v0), (1.0, v1), (1.0, v1), (1.0, v0)],
            smooth=False,
        )

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    return mesh


def build_curved_sheet_mesh(
    name: str,
    p00: tuple,
    p10: tuple,
    p11: tuple,
    p01: tuple,
    seg_u: int,
    seg_v: int,
    r_layer: float,
    pivot: Vector,
) -> bpy.types.Mesh:
    """Build a subdivided curved decal sheet with normals facing SPHERE_CENTER."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    grid = []
    for i in range(seg_u + 1):
        u = i / seg_u
        col = []
        for j in range(seg_v + 1):
            v = j / seg_v
            # Bilinear interpolation of planar (x, z) from UV corners
            x = (
                (1.0 - u) * (1.0 - v) * p00[0]
                + u * (1.0 - v) * p10[0]
                + u * v * p11[0]
                + (1.0 - u) * v * p01[0]
            )
            z = (
                (1.0 - u) * (1.0 - v) * p00[1]
                + u * (1.0 - v) * p10[1]
                + u * v * p11[1]
                + (1.0 - u) * v * p01[1]
            )
            world_pt = project_to_visor(x, z, r_layer)
            col.append(bm.verts.new(world_pt - pivot))
        grid.append(col)

    local_sphere_center = SPHERE_CENTER - pivot

    for i in range(seg_u):
        u0 = i / seg_u
        u1 = (i + 1) / seg_u
        for j in range(seg_v):
            v0 = j / seg_v
            v1 = (j + 1) / seg_v
            face = bm.faces.new([grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]])
            face.smooth = True
            for loop, uv in zip(face.loops, [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]):
                loop[uv_layer].uv = uv
            face.normal_update()
            inward_dir = local_sphere_center - face.calc_center_median()
            if face.normal.dot(inward_dir) < 0.0:
                face.normal_flip()

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    return mesh


def extract_uv_corners_xz(obj: bpy.types.Object) -> dict:
    """Extract world-space (x, z) coordinates for UV corners (0,0), (1,0), (1,1), (0,1)."""
    mesh = obj.data
    uv_layer = mesh.uv_layers.active
    if uv_layer is None:
        raise RuntimeError(f"Object {obj.name} has no active UV layer")

    uv_data = uv_layer.data
    targets = {
        (0, 0): Vector((0.0, 0.0)),
        (1, 0): Vector((1.0, 0.0)),
        (1, 1): Vector((1.0, 1.0)),
        (0, 1): Vector((0.0, 1.0)),
    }

    best = {}
    for poly in mesh.polygons:
        for loop_idx in poly.loop_indices:
            uv = Vector(uv_data[loop_idx].uv[:2])
            vert_idx = mesh.loops[loop_idx].vertex_index
            world_co = obj.matrix_world @ mesh.vertices[vert_idx].co
            for key, t_uv in targets.items():
                dist = (uv - t_uv).length
                if key not in best or dist < best[key][0]:
                    best[key] = (dist, vert_idx, (world_co.x, world_co.z))

    used_verts = set()
    corners = {}
    for key in [(0, 0), (1, 0), (1, 1), (0, 1)]:
        dist, v_idx, xz = best[key]
        if dist > 0.05:
            raise RuntimeError(f"Object {obj.name} UV corner {key} too far from expected UV (dist={dist:.4f})")
        if v_idx in used_verts:
            raise RuntimeError(f"Object {obj.name} UV corner {key} collided on vertex {v_idx}")
        used_verts.add(v_idx)
        corners[key] = xz

    return corners


def replace_object_mesh(obj: bpy.types.Object, new_mesh: bpy.types.Mesh):
    """Replace obj.data while preserving its material slots."""
    old_mesh = obj.data
    mats = list(old_mesh.materials)
    for m in mats:
        new_mesh.materials.append(m)
    obj.data = new_mesh
    if old_mesh.users == 0:
        bpy.data.meshes.remove(old_mesh)


def patch_glb_translucency(path: Path):
    """Ensure alphaMode=BLEND, doubleSided=True, and translucent glass baseColorFactor."""
    with open(path, "rb") as f:
        data = f.read()

    if len(data) < 20 or data[:4] != b"glTF":
        raise RuntimeError(f"Invalid GLB file: {path}")

    magic, version, _total_len = struct.unpack("<4sII", data[:12])
    json_len, json_type = struct.unpack("<II", data[12:20])
    if json_type != 0x4E4F534A:
        raise RuntimeError(f"Invalid GLB JSON chunk in {path}")

    json_bytes = data[20 : 20 + json_len]
    bin_chunk = data[20 + json_len :]
    gltf = json.loads(json_bytes.decode("utf-8"))

    for mat in gltf.get("materials", []):
        mat_name = mat.get("name", "")
        mat["alphaMode"] = "BLEND"
        mat["doubleSided"] = True
        pbr = mat.setdefault("pbrMetallicRoughness", {})
        if "Glass" in mat_name:
            pbr["baseColorFactor"] = [0.92, 0.96, 1.0, 0.22]

    new_json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    pad = (4 - (len(new_json_bytes) % 4)) % 4
    new_json_bytes += b" " * pad

    new_total_len = 12 + 8 + len(new_json_bytes) + len(bin_chunk)
    new_header = struct.pack("<4sII", magic, version, new_total_len)
    new_chunk0_hdr = struct.pack("<II", len(new_json_bytes), json_type)

    with open(path, "wb") as f:
        f.write(new_header + new_chunk0_hdr + new_json_bytes + bin_chunk)

    print(f"Patched GLB alpha blending & translucency: {path} ({new_total_len} bytes)")


def main():
    if not SRC_GLB.exists():
        raise FileNotFoundError(f"Source GLB not found: {SRC_GLB}")

    # Step 1: Copy source GLB to target _5.glb
    shutil.copy2(SRC_GLB, OUT_GLB)
    print(f"Copied {SRC_GLB} -> {OUT_GLB}")

    # Step 2: Reset Blender & import copied GLB
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(OUT_GLB))
    bpy.context.view_layer.update()

    # Step 3: Rename root object
    root_obj = None
    for o in bpy.data.objects:
        if "Root" in o.name or o.parent is None:
            root_obj = o
            break
    if root_obj is None:
        raise RuntimeError("Could not find imported root object")

    root_obj.name = "screen_decals_spider_web_overlay_5_Root"
    root_obj.location = (0.0, 0.0, 0.0)
    root_obj.rotation_mode = 'XYZ'
    root_obj.rotation_euler = (0.0, 0.0, 0.0)
    root_obj.scale = (1.0, 1.0, 1.0)

    # Step 4: Remove all border objects, meshes, materials, and unused frame textures
    for border_name in BORDER_OBJECT_NAMES:
        obj = bpy.data.objects.get(border_name)
        if obj is not None:
            old_mesh = obj.data if obj.type == 'MESH' else None
            bpy.data.objects.remove(obj, do_unlink=True)
            if old_mesh is not None and old_mesh.users == 0:
                bpy.data.meshes.remove(old_mesh)
            print(f"Removed border object: {border_name}")

    for mat_name in BORDER_MATERIAL_NAMES:
        mat = bpy.data.materials.get(mat_name)
        if mat is not None:
            bpy.data.materials.remove(mat, do_unlink=True)
            print(f"Removed border material: {mat_name}")

    for img in list(bpy.data.images):
        if img.users == 0 or img.name.startswith("texture_0"):
            bpy.data.images.remove(img, do_unlink=True)

    # Step 5: Rebuild Translucent_Clear_Screen as concave outward curved glass
    obj_glass = bpy.data.objects.get("Translucent_Clear_Screen")
    if obj_glass is None:
        raise RuntimeError("Translucent_Clear_Screen not found in imported GLB")
    mesh_glass = build_curved_glass_mesh("Mesh_Translucent_Screen")
    replace_object_mesh(obj_glass, mesh_glass)
    obj_glass.location = (0.0, 0.0, 0.0)
    obj_glass.rotation_mode = 'XYZ'
    obj_glass.rotation_euler = (0.0, 0.0, 0.0)
    obj_glass.scale = (1.0, 1.0, 1.0)

    # Step 6: Rebuild Decal_BrokenSpiderWeb_Screen spanning full 1.60m x 0.90m curved visor
    obj_web_screen = bpy.data.objects.get("Decal_BrokenSpiderWeb_Screen")
    if obj_web_screen is None:
        raise RuntimeError("Decal_BrokenSpiderWeb_Screen not found in imported GLB")
    mesh_web_screen = build_curved_sheet_mesh(
        "Mesh_Decal_BrokenSpiderWeb_Screen",
        (-HALF_W, -HALF_H),
        (HALF_W, -HALF_H),
        (HALF_W, HALF_H),
        (-HALF_W, HALF_H),
        SCREEN_SEG_X,
        SCREEN_SEG_Z,
        R_WEB_SCREEN,
        Vector((0.0, 0.0, 0.0)),
    )
    replace_object_mesh(obj_web_screen, mesh_web_screen)
    obj_web_screen.location = (0.0, 0.0, 0.0)
    obj_web_screen.rotation_mode = 'XYZ'
    obj_web_screen.rotation_euler = (0.0, 0.0, 0.0)
    obj_web_screen.scale = (1.0, 1.0, 1.0)

    # Step 7: Rebuild the 17 localized decals conformed to concentric visor layers
    decal_specs = [("Decal_BrokenSpiderWeb_Core", R_WEB_CORE, CORE_SEG)]
    for idx in range(1, 9):
        decal_specs.append((f"Decal_LaserBurn_{idx:02d}", R_LASER_BASE - (idx - 1) * R_LAYER_STEP, DECAL_SEG))
    for idx in range(1, 9):
        decal_specs.append((f"Decal_MissileStrike_{idx:02d}", R_MISSILE_BASE - (idx - 1) * R_LAYER_STEP, DECAL_SEG))

    for obj_name, r_layer, seg in decal_specs:
        obj = bpy.data.objects.get(obj_name)
        if obj is None:
            raise RuntimeError(f"Expected decal object not found: {obj_name}")
        corners = extract_uv_corners_xz(obj)
        cx = 0.25 * (corners[(0, 0)][0] + corners[(1, 0)][0] + corners[(1, 1)][0] + corners[(0, 1)][0])
        cz = 0.25 * (corners[(0, 0)][1] + corners[(1, 0)][1] + corners[(1, 1)][1] + corners[(0, 1)][1])
        pivot = project_to_visor(cx, cz, r_layer)

        new_mesh = build_curved_sheet_mesh(
            f"Mesh_{obj_name}",
            corners[(0, 0)],
            corners[(1, 0)],
            corners[(1, 1)],
            corners[(0, 1)],
            seg,
            seg,
            r_layer,
            pivot,
        )
        replace_object_mesh(obj, new_mesh)
        obj.location = pivot
        obj.rotation_mode = 'XYZ'
        obj.rotation_euler = (0.0, 0.0, 0.0)
        obj.scale = (1.0, 1.0, 1.0)

    # Step 8: Purge any remaining orphans and assert scene inventory
    bpy.data.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    bpy.context.view_layer.update()

    assert len(bpy.data.objects) == 20, f"Expected 20 objects, got {len(bpy.data.objects)}"
    assert len(bpy.data.materials) == 4, f"Expected 4 materials, got {len(bpy.data.materials)}"
    print(
        f"Scene ready: {len(bpy.data.objects)} objects, "
        f"{len(bpy.data.materials)} materials, {len(bpy.data.images)} images"
    )

    # Step 9: Save .blend file
    bpy.ops.wm.save_as_mainfile(filepath=str(MODEL_BLEND))
    print(f"Saved Blend file: {MODEL_BLEND}")

    # Step 10: Export GLB
    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active = root_obj
    bpy.ops.export_scene.gltf(
        filepath=str(OUT_GLB),
        export_format='GLB',
        use_selection=True,
        export_apply=False,
        export_materials='EXPORT',
        export_image_format='AUTO',
        export_draco_mesh_compression_enable=False,
    )
    print(f"Exported GLB: {OUT_GLB}")

    # Step 11: Patch GLB translucency & alpha blending
    patch_glb_translucency(OUT_GLB)

    # Step 12: Copy GLB to meshy_test_0 model directory
    shutil.copy2(OUT_GLB, MODEL_GLB)
    print(f"Copied GLB -> {MODEL_GLB}")

    # Step 13: Write companion metadata JSON
    registry = {
        "model": "screen_decals_spider_web_overlay_5.glb",
        "base_name": "screen_decals_spider_web_overlay_5",
        "description": (
            "Borderless concave-outward XR cockpit translucent visor overlay "
            "(1.60m x 0.90m) curving back from its 2.0m apex, with full-screen "
            "broken spider web decal, focal core decal, and 16 targetable laser "
            "burn / missile strike decals"
        ),
        "dimensions": {
            "width_meters": WIDTH,
            "height_meters": HEIGHT,
            "border_width_meters": 0.0,
            "glass_thickness_meters": GLASS_THICKNESS,
            "curvature_radius_meters": R_OUTER,
            "curve_depth_meters": 0.301,
            "farthest_point_from_origin_meters": 2.0,
            "apex_position_gltf": [0.0, 0.0, -2.0],
            "aspect_ratio": "16:9",
        },
        "components": {
            "root": "screen_decals_spider_web_overlay_5_Root",
            "glass_screen": "Translucent_Clear_Screen",
            "spider_web_full_screen": "Decal_BrokenSpiderWeb_Screen",
            "spider_web_focal_core": "Decal_BrokenSpiderWeb_Core",
        },
        "spider_web_decals": [
            "Decal_BrokenSpiderWeb_Screen",
            "Decal_BrokenSpiderWeb_Core",
        ],
    }

    for json_path in (OUT_JSON, MODEL_JSON):
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(registry, f, indent=2)
        print(f"Wrote metadata JSON: {json_path}")

    print("\n--- SCREEN_DECALS_SPIDER_WEB_OVERLAY_5 GENERATED SUCCESSFULLY ---")


if __name__ == "__main__":
    main()
