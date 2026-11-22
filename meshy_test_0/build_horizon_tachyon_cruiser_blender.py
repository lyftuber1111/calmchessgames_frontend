"""Build WebXR-optimized Horizon Tachyon Cruiser & weapon/shield 3D assets in Blender 5.2.

Outputs into:
  ./meshy_test_0/models/stage_2/Tachyon/
    - horizon_tachyon_cruiser.{blend,glb,fbx,obj,mtl} + _materials.json
    - horizon_tachyon_cruiser_pierced.{blend,glb,fbx,obj,mtl} + _materials.json
    - tachyon_lance.{blend,glb,fbx,obj,mtl} + _materials.json
    - reinforced_particle_shield.{blend,glb,fbx,obj,mtl} + _materials.json
  ./meshy_test_0/models/stage_2/Tachyon/Tachyon_textures/
    - Multi-angle renders on pure #000000 background for visual verification.
"""

import json
import math
import struct
from pathlib import Path

import bpy
import bmesh
from mathutils import Matrix, Vector


FRONTEND_DIR = Path(r"C:\Users\lyftu\gemini_3\updated_html_js_0\calmchessgames_frontend")
OUT_DIR = FRONTEND_DIR / "meshy_test_0" / "models" / "stage_2" / "Tachyon"
TEX_DIR = OUT_DIR / "Tachyon_textures"
OUT_DIR.mkdir(parents=True, exist_ok=True)
TEX_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Scene & Material Helpers
# ---------------------------------------------------------------------------

def reset_scene():
    """Clear Blender scene to an empty factory state."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for coll in (
        bpy.data.objects,
        bpy.data.meshes,
        bpy.data.materials,
        bpy.data.images,
        bpy.data.lights,
        bpy.data.cameras,
    ):
        for item in list(coll):
            coll.remove(item)


def make_material(
    name,
    base_color,
    metallic=0.5,
    roughness=0.3,
    emission_color=None,
    emission_strength=0.0,
    alpha=1.0,
    blended=False,
):
    """Create a Blender 5.2 Principled BSDF material without deprecated sockets."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out_node = nodes.new(type="ShaderNodeOutputMaterial")
    out_node.location = (320, 0)

    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 0)
    links.new(bsdf.outputs["BSDF"], out_node.inputs["Surface"])

    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Alpha"].default_value = alpha

    if emission_color is not None and "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = emission_color
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emission_strength

    if blended:
        if hasattr(mat, "blend_method"):
            mat.blend_method = "BLEND"
        if hasattr(mat, "surface_render_method"):
            mat.surface_render_method = "BLENDED"
        if hasattr(mat, "use_backface_culling"):
            mat.use_backface_culling = False
        if hasattr(mat, "shadow_method"):
            mat.shadow_method = "NONE"

    return mat


def create_palette():
    """Create the high-contrast multi-color sci-fi palette for #000000 space."""
    return {
        "gold": make_material(
            "M_Cruiser_Gold_Armor",
            base_color=(1.0, 0.78, 0.20, 1.0),
            metallic=0.62,
            roughness=0.24,
            emission_color=(0.42, 0.28, 0.04, 1.0),
            emission_strength=0.48,
        ),
        "titanium": make_material(
            "M_Cruiser_Pearl_Titanium",
            base_color=(0.84, 0.89, 0.96, 1.0),
            metallic=0.55,
            roughness=0.26,
            emission_color=(0.15, 0.20, 0.28, 1.0),
            emission_strength=0.42,
        ),
        "cobalt": make_material(
            "M_Cruiser_Cobalt_Trim",
            base_color=(0.10, 0.50, 0.98, 1.0),
            metallic=0.52,
            roughness=0.26,
            emission_color=(0.05, 0.25, 0.52, 1.0),
            emission_strength=0.48,
        ),
        "cyan": make_material(
            "M_Cruiser_Cyan_Engine",
            base_color=(0.12, 0.96, 1.0, 1.0),
            metallic=0.05,
            roughness=0.12,
            emission_color=(0.04, 0.90, 1.0, 1.0),
            emission_strength=3.6,
        ),
        "laser": make_material(
            "M_Cruiser_Laser_Emitter",
            base_color=(1.0, 0.76, 0.16, 1.0),
            metallic=0.20,
            roughness=0.18,
            emission_color=(1.0, 0.65, 0.08, 1.0),
            emission_strength=3.0,
        ),
        "missile": make_material(
            "M_Cruiser_Missile_Warhead",
            base_color=(1.0, 0.24, 0.12, 1.0),
            metallic=0.28,
            roughness=0.24,
            emission_color=(1.0, 0.20, 0.06, 1.0),
            emission_strength=2.2,
        ),
        "shield_shell": make_material(
            "M_Particle_Shield_Shell",
            base_color=(0.20, 0.88, 1.0, 0.09),
            metallic=0.05,
            roughness=0.08,
            emission_color=(0.14, 0.78, 1.0, 1.0),
            emission_strength=0.70,
            alpha=0.09,
            blended=True,
        ),
        "shield_hex": make_material(
            "M_Particle_Shield_HexFrame",
            base_color=(1.0, 0.80, 0.24, 0.78),
            metallic=0.15,
            roughness=0.15,
            emission_color=(1.0, 0.72, 0.14, 1.0),
            emission_strength=2.2,
            alpha=0.78,
            blended=True,
        ),
        "lance_core": make_material(
            "M_Tachyon_Lance_Core",
            base_color=(0.85, 0.18, 1.0, 1.0),
            metallic=0.05,
            roughness=0.10,
            emission_color=(0.82, 0.16, 1.0, 1.0),
            emission_strength=2.5,
        ),
        "lance_tip": make_material(
            "M_Tachyon_Lance_HotTip",
            base_color=(1.0, 0.86, 1.0, 1.0),
            metallic=0.02,
            roughness=0.08,
            emission_color=(1.0, 0.78, 1.0, 1.0),
            emission_strength=3.6,
        ),
        "lance_aura": make_material(
            "M_Tachyon_Lance_Aura",
            base_color=(0.58, 0.16, 0.96, 0.36),
            metallic=0.0,
            roughness=0.12,
            emission_color=(0.58, 0.16, 0.96, 1.0),
            emission_strength=1.6,
            alpha=0.36,
            blended=True,
        ),
        "breach_ring": make_material(
            "M_Tachyon_Breach_Ring",
            base_color=(1.0, 0.24, 0.88, 0.86),
            metallic=0.05,
            roughness=0.12,
            emission_color=(1.0, 0.20, 0.84, 1.0),
            emission_strength=2.6,
            alpha=0.86,
            blended=True,
        ),
    }


# ---------------------------------------------------------------------------
# BMesh Geometry Primitives (All closed manifold meshes + box-projected UVs)
# ---------------------------------------------------------------------------

def assign_box_uvs(bm, scale=0.35):
    """Assign simple box-projected UVs so every exported format has valid UV coords."""
    uv_layer = bm.loops.layers.uv.get("UVMap") or bm.loops.layers.uv.new("UVMap")
    for face in bm.faces:
        n = face.normal
        ax, ay, az = abs(n.x), abs(n.y), abs(n.z)
        for loop in face.loops:
            co = loop.vert.co
            if az >= ax and az >= ay:
                u, v = co.x * scale + 0.5, co.y * scale + 0.5
            elif ax >= ay and ax >= az:
                u, v = co.y * scale + 0.5, co.z * scale + 0.5
            else:
                u, v = co.x * scale + 0.5, co.z * scale + 0.5
            loop[uv_layer].uv = (u, v)


def finalize_bmesh_object(name, bm, materials, parent=None, uv_scale=0.35):
    """Recalculate outward normals, generate UVs, and build a Blender mesh object."""
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    assign_box_uvs(bm, scale=uv_scale)
    mesh = bpy.data.meshes.new(f"Mesh_{name}")
    bm.to_mesh(mesh)
    bm.free()
    for mat in materials:
        mesh.materials.append(mat)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    if parent is not None:
        obj.parent = parent
    return obj


def add_loft(bm, stations, mat_idx=0, cap_start=True, cap_end=True, smooth=False, face_mat_fn=None):
    """Build a closed manifold loft across ordered vertex rings (all same length)."""
    n_sides = len(stations[0])
    rings = []
    for ring_pts in stations:
        rings.append([bm.verts.new(pt) for pt in ring_pts])

    for r_i in range(len(rings) - 1):
        r0 = rings[r_i]
        r1 = rings[r_i + 1]
        for s_i in range(n_sides):
            s_next = (s_i + 1) % n_sides
            f = bm.faces.new([r0[s_i], r0[s_next], r1[s_next], r1[s_i]])
            f.smooth = smooth
            f.material_index = face_mat_fn(r_i, s_i) if face_mat_fn else mat_idx

    if cap_start and len(rings[0]) >= 3:
        f0 = bm.faces.new(list(reversed(rings[0])))
        f0.smooth = False
        f0.material_index = mat_idx
    if cap_end and len(rings[-1]) >= 3:
        f1 = bm.faces.new(list(rings[-1]))
        f1.smooth = False
        f1.material_index = mat_idx
    return rings


def add_box(bm, center, size, mat_idx=0, rot_matrix=None, smooth=False):
    """Add an oriented closed box."""
    cx, cy, cz = center
    hx, hy, hz = size[0] * 0.5, size[1] * 0.5, size[2] * 0.5
    local_pts = [
        Vector((-hx, -hy, -hz)),
        Vector((hx, -hy, -hz)),
        Vector((hx, hy, -hz)),
        Vector((-hx, hy, -hz)),
        Vector((-hx, -hy, hz)),
        Vector((hx, -hy, hz)),
        Vector((hx, hy, hz)),
        Vector((-hx, hy, hz)),
    ]
    c_vec = Vector((cx, cy, cz))
    verts = []
    for p in local_pts:
        wp = (rot_matrix @ p) + c_vec if rot_matrix is not None else p + c_vec
        verts.append(bm.verts.new(wp))

    quads = [
        (0, 3, 2, 1),
        (4, 5, 6, 7),
        (0, 1, 5, 4),
        (1, 2, 6, 5),
        (2, 3, 7, 6),
        (3, 0, 4, 7),
    ]
    for q in quads:
        f = bm.faces.new([verts[i] for i in q])
        f.smooth = smooth
        f.material_index = mat_idx


def add_beveled_prism(bm, poly_xz, y_start, y_end, taper_front=1.0, taper_back=1.0,
                      z_offset_front=0.0, z_offset_back=0.0, mat_idx=0, smooth=False):
    """Extrude an X-Z profile along Y with optional front/back taper."""
    ring_start = [Vector((x * taper_front, y_start, z * taper_front + z_offset_front)) for x, z in poly_xz]
    ring_end = [Vector((x * taper_back, y_end, z * taper_back + z_offset_back)) for x, z in poly_xz]
    return add_loft(bm, [ring_start, ring_end], mat_idx=mat_idx, smooth=smooth)


def add_cylinder_segment(bm, p0, p1, r0, r1, sides=10, mat_idx=0, smooth=True, cap_start=True, cap_end=True):
    """Create a closed tapered cylinder / cone segment from p0 to p1."""
    v0 = Vector(p0)
    v1 = Vector(p1)
    axis = v1 - v0
    if axis.length < 1e-6:
        return
    z_dir = axis.normalized()
    ref = Vector((0, 0, 1)) if abs(z_dir.z) < 0.92 else Vector((1, 0, 0))
    x_dir = z_dir.cross(ref).normalized()
    y_dir = z_dir.cross(x_dir).normalized()

    ring0 = []
    ring1 = []
    for i in range(sides):
        ang = 2.0 * math.pi * i / sides
        ca, sa = math.cos(ang), math.sin(ang)
        radial = x_dir * ca + y_dir * sa
        ring0.append(v0 + radial * r0)
        ring1.append(v1 + radial * r1)

    return add_loft(bm, [ring0, ring1], mat_idx=mat_idx, cap_start=cap_start, cap_end=cap_end, smooth=smooth)


def add_torus_ring(bm, center, normal_axis, major_r, minor_r, major_seg=20, minor_seg=6, mat_idx=0, smooth=True):
    """Add a closed manifold torus / shockwave ring oriented perpendicular to normal_axis."""
    c = Vector(center)
    n = Vector(normal_axis).normalized()
    ref = Vector((0, 0, 1)) if abs(n.z) < 0.92 else Vector((1, 0, 0))
    u = n.cross(ref).normalized()
    v = n.cross(u).normalized()

    rings = []
    for i in range(major_seg):
        theta = 2.0 * math.pi * i / major_seg
        ct, st = math.cos(theta), math.sin(theta)
        radial = u * ct + v * st
        ring_center = c + radial * major_r
        ring_pts = []
        for j in range(minor_seg):
            phi = 2.0 * math.pi * j / minor_seg
            cp, sp = math.cos(phi), math.sin(phi)
            pt = ring_center + radial * (cp * minor_r) + n * (sp * minor_r)
            ring_pts.append(bm.verts.new(pt))
        rings.append(ring_pts)

    for i in range(major_seg):
        i_next = (i + 1) % major_seg
        r0, r1 = rings[i], rings[i_next]
        for j in range(minor_seg):
            j_next = (j + 1) % minor_seg
            f = bm.faces.new([r0[j], r1[j], r1[j_next], r0[j_next]])
            f.smooth = smooth
            f.material_index = mat_idx


# ---------------------------------------------------------------------------
# Cruiser Part Builders (Bow -> -Y, Stern -> +Y, Dorsal -> +Z)
# ---------------------------------------------------------------------------

def build_hull_core(palette, parent):
    """Build main reinforced multi-layered relativistic fuselage & twin prow prongs."""
    mats = [palette["gold"], palette["titanium"], palette["cobalt"], palette["cyan"]]
    bm = bmesh.new()

    # Main central spine stations (8-sided beveled warship cross-section)
    # (y, half_width, z_top, z_bot, bevel_w)
    spine_specs = [
        (-1.95, 0.24, 0.14, -0.14, 0.10),
        (-1.45, 0.42, 0.26, -0.24, 0.18),
        (-0.65, 0.62, 0.36, -0.32, 0.26),
        (0.35, 0.72, 0.40, -0.34, 0.30),
        (1.35, 0.66, 0.36, -0.30, 0.26),
        (2.15, 0.48, 0.26, -0.24, 0.18),
        (2.45, 0.38, 0.20, -0.18, 0.14),
    ]
    stations = []
    for y, hw, zt, zb, bw in spine_specs:
        # 8-point symmetric octagon starting top-right going clockwise around Y
        pts = [
            (bw, y, zt),
            (hw, y, zt * 0.42),
            (hw, y, zb * 0.42),
            (bw, y, zb),
            (-bw, y, zb),
            (-hw, y, zb * 0.42),
            (-hw, y, zt * 0.42),
            (-bw, y, zt),
        ]
        stations.append(pts)

    def spine_mat(r_i, s_i):
        # Gold top/bottom armor ridges, titanium side armor, cobalt recessed flanks
        if s_i in (7, 3):  # top center & bottom center keel
            return 0  # gold
        if s_i in (1, 5):  # horizontal side channels
            return 2  # cobalt
        return 1  # pearl titanium

    add_loft(bm, stations, mat_idx=1, smooth=False, face_mat_fn=spine_mat)

    # Split twin forward armored prow prongs extending to Y = -2.75 m
    for sx in (-1.0, 1.0):
        prow_stations = [
            [
                (sx * 0.20, -2.75, 0.06),
                (sx * 0.34, -2.75, 0.00),
                (sx * 0.28, -2.75, -0.07),
                (sx * 0.14, -2.75, -0.04),
                (sx * 0.12, -2.75, 0.03),
            ],
            [
                (sx * 0.24, -2.25, 0.15),
                (sx * 0.46, -2.25, 0.02),
                (sx * 0.38, -2.25, -0.14),
                (sx * 0.15, -2.25, -0.10),
                (sx * 0.14, -2.25, 0.09),
            ],
            [
                (sx * 0.32, -1.35, 0.26),
                (sx * 0.62, -1.35, 0.05),
                (sx * 0.50, -1.35, -0.20),
                (sx * 0.20, -1.35, -0.18),
                (sx * 0.18, -1.35, 0.18),
            ],
        ]
        if sx < 0:
            prow_stations = [list(reversed(r)) for r in prow_stations]
        add_loft(
            bm,
            prow_stations,
            mat_idx=0,
            smooth=False,
            face_mat_fn=lambda r_i, s_i: 0 if s_i in (0, 1, 4) else 2,
        )

        # Glowing cyan relativistic slipstream slit inside each forward prow cheek
        add_box(bm, (sx * 0.28, -2.05, 0.02), (0.04, 0.85, 0.05), mat_idx=3)

        # Layered ballistic gold flank armor strakes along midship
        add_box(bm, (sx * 0.66, 0.10, 0.12), (0.14, 1.85, 0.16), mat_idx=0)
        add_box(bm, (sx * 0.58, 0.25, -0.18), (0.16, 1.55, 0.12), mat_idx=2)

    # Dorsal & ventral reinforced gold armor spine plates
    add_box(bm, (0.0, -0.95, 0.34), (0.44, 1.20, 0.10), mat_idx=0)
    add_box(bm, (0.0, -0.35, -0.35), (0.40, 1.90, 0.10), mat_idx=0)
    # Forward recessed central cyan sensor / particle collector
    add_box(bm, (0.0, -1.85, 0.04), (0.20, 0.42, 0.12), mat_idx=3)

    return finalize_bmesh_object("Cruiser_Reinforced_Hull_Core", bm, mats, parent=parent)


def build_command_bridge_and_spine(palette, parent):
    """Build raised command citadel, cyan panoramic visor, dorsal fins, and spine ribs."""
    mats = [palette["gold"], palette["titanium"], palette["cobalt"], palette["cyan"]]
    bm = bmesh.new()

    # Command citadel tiered housing (Y = +0.05 to +1.35, Z = +0.34 to +0.76)
    citadel_stations = [
        [
            (0.24, 0.05, 0.60),
            (0.42, 0.05, 0.42),
            (0.44, 0.05, 0.32),
            (-0.44, 0.05, 0.32),
            (-0.42, 0.05, 0.42),
            (-0.24, 0.05, 0.60),
        ],
        [
            (0.28, 0.45, 0.72),
            (0.48, 0.45, 0.46),
            (0.50, 0.45, 0.34),
            (-0.50, 0.45, 0.34),
            (-0.48, 0.45, 0.46),
            (-0.28, 0.45, 0.72),
        ],
        [
            (0.26, 1.05, 0.70),
            (0.44, 1.05, 0.44),
            (0.46, 1.05, 0.32),
            (-0.46, 1.05, 0.32),
            (-0.44, 1.05, 0.44),
            (-0.26, 1.05, 0.70),
        ],
        [
            (0.16, 1.45, 0.50),
            (0.30, 1.45, 0.34),
            (0.32, 1.45, 0.26),
            (-0.32, 1.45, 0.26),
            (-0.30, 1.45, 0.34),
            (-0.16, 1.45, 0.50),
        ],
    ]
    add_loft(
        bm,
        citadel_stations,
        mat_idx=1,
        smooth=False,
        face_mat_fn=lambda r_i, s_i: 0 if s_i in (0, 4, 5) else 1,
    )

    # Recessed glowing cyan panoramic bridge viewport on forward brow
    add_box(bm, (0.0, 0.10, 0.54), (0.50, 0.18, 0.09), mat_idx=3)
    # Gold armored brow canopy over the viewport
    add_box(bm, (0.0, 0.22, 0.65), (0.54, 0.36, 0.07), mat_idx=0)

    # Dual swept dorsal sensor/comms stabilizer fins (reaching Z = +0.92 m)
    for sx in (-1.0, 1.0):
        fin_pts = [
            [
                (sx * 0.24, 0.65, 0.68),
                (sx * 0.30, 0.65, 0.68),
                (sx * 0.42, 0.95, 0.92),
                (sx * 0.36, 0.95, 0.92),
            ],
            [
                (sx * 0.22, 1.35, 0.46),
                (sx * 0.28, 1.35, 0.46),
                (sx * 0.44, 1.55, 0.88),
                (sx * 0.38, 1.55, 0.88),
            ],
        ]
        if sx < 0:
            fin_pts = [list(reversed(r)) for r in fin_pts]
        add_loft(bm, fin_pts, mat_idx=2, smooth=False)
        # Cyan leading-edge strip on dorsal fins
        add_box(bm, (sx * 0.32, 0.86, 0.80), (0.03, 0.26, 0.04), mat_idx=3)

    # 5 segmented dorsal relativistic capacitor spine ribs (glowing cyan cores)
    for idx in range(5):
        y_pos = -0.35 - idx * 0.24
        add_box(bm, (0.0, y_pos, 0.40), (0.28, 0.11, 0.08), mat_idx=2)
        add_box(bm, (0.0, y_pos, 0.44), (0.20, 0.06, 0.04), mat_idx=3)

    return finalize_bmesh_object("Cruiser_Command_Bridge_And_Spine", bm, mats, parent=parent)


def build_wings_and_armor(palette, parent):
    """Build swept delta battle wings with gold edges, titanium plating, and stabilizers."""
    mats = [palette["gold"], palette["titanium"], palette["cobalt"], palette["cyan"]]
    bm = bmesh.new()

    for sx in (-1.0, 1.0):
        # Main wing airfoil lofted from root (|x|=0.58) -> mid (|x|=1.18) -> tip (|x|=1.68)
        wing_stations = [
            [
                (sx * 0.56, -0.95, 0.14),
                (sx * 0.56, 1.10, 0.16),
                (sx * 0.56, 1.35, 0.02),
                (sx * 0.56, 1.10, -0.14),
                (sx * 0.56, -0.95, -0.12),
                (sx * 0.56, -1.25, 0.00),
            ],
            [
                (sx * 1.18, -0.65, 0.12),
                (sx * 1.18, 0.85, 0.12),
                (sx * 1.18, 1.05, 0.00),
                (sx * 1.18, 0.85, -0.11),
                (sx * 1.18, -0.65, -0.10),
                (sx * 1.18, -0.90, 0.00),
            ],
            [
                (sx * 1.66, -0.15, 0.07),
                (sx * 1.66, 0.70, 0.07),
                (sx * 1.66, 0.84, 0.00),
                (sx * 1.66, 0.70, -0.06),
                (sx * 1.66, -0.15, -0.06),
                (sx * 1.66, -0.35, 0.00),
            ],
        ]
        if sx < 0:
            wing_stations = [list(reversed(r)) for r in wing_stations]
        add_loft(
            bm,
            wing_stations,
            mat_idx=1,
            smooth=False,
            face_mat_fn=lambda r_i, s_i: 0 if s_i in (4, 5) else (2 if s_i in (1, 2) else 1),
        )

        # Gold armored wing leading-edge strake (tucked cleanly inside wingtip)
        rot_sweep = Matrix.Rotation(sx * math.radians(-22.0), 3, "Z")
        add_box(bm, (sx * 1.10, -0.78, 0.01), (0.94, 0.14, 0.13), mat_idx=0, rot_matrix=rot_sweep)
        # Cyan relativistic slipstream field emitter strip inset along wing top
        add_box(bm, (sx * 1.12, -0.64, 0.10), (0.82, 0.06, 0.03), mat_idx=3, rot_matrix=rot_sweep)

        # Wingtip canted upper + lower stabilizer blades (reaching X = ±1.75 m)
        rot_up = Matrix.Rotation(sx * math.radians(-22.0), 3, "Y")
        rot_dn = Matrix.Rotation(sx * math.radians(22.0), 3, "Y")
        add_box(bm, (sx * 1.70, 0.30, 0.18), (0.07, 0.86, 0.28), mat_idx=0, rot_matrix=rot_up)
        add_box(bm, (sx * 1.70, 0.30, -0.16), (0.07, 0.78, 0.24), mat_idx=2, rot_matrix=rot_dn)
        add_box(bm, (sx * 1.73, 0.30, 0.01), (0.04, 0.72, 0.05), mat_idx=3)

    return finalize_bmesh_object("Cruiser_Forward_Swept_Wings_And_Armor", bm, mats, parent=parent)


def build_cyan_engine_nacelles(palette, parent):
    """Build twin large outboard warp-ion nacelles & dual stern vernier thrusters."""
    mats = [palette["gold"], palette["titanium"], palette["cobalt"], palette["cyan"]]
    bm = bmesh.new()

    for sx in (-1.0, 1.0):
        nx = sx * 1.05
        nz = 0.04
        # Faceted octagonal engine cowling from intake Y=+0.30 to nozzle Y=+2.35
        add_cylinder_segment(
            bm, (nx, 0.30, nz), (nx, 0.75, nz), 0.20, 0.32, sides=8, mat_idx=0, smooth=False
        )
        add_cylinder_segment(
            bm, (nx, 0.75, nz), (nx, 2.05, nz), 0.32, 0.30, sides=8, mat_idx=1, smooth=False
        )
        # Cobalt armor collar & intake glow ring
        add_cylinder_segment(
            bm, (nx, 0.25, nz), (nx, 0.36, nz), 0.16, 0.21, sides=8, mat_idx=2, smooth=False
        )
        add_cylinder_segment(
            bm, (nx, 0.21, nz), (nx, 0.26, nz), 0.11, 0.15, sides=12, mat_idx=3, smooth=True
        )
        # Slotted cyan cooling vents along nacelle top and outer flank
        add_box(bm, (nx, 1.38, nz + 0.30), (0.14, 0.90, 0.04), mat_idx=3)
        add_box(bm, (nx + sx * 0.30, 1.38, nz), (0.04, 0.90, 0.12), mat_idx=3)
        # Gold armored nacelle ribs
        add_box(bm, (nx, 1.05, nz + 0.31), (0.28, 0.14, 0.06), mat_idx=0)
        add_box(bm, (nx, 1.72, nz + 0.31), (0.28, 0.14, 0.06), mat_idx=0)

        # 16-sided smooth thruster nozzle bell (Y = +2.05 to +2.45)
        add_cylinder_segment(
            bm, (nx, 2.05, nz), (nx, 2.45, nz), 0.29, 0.34, sides=16, mat_idx=2, smooth=True
        )
        # Luminous electric-cyan plasma ring & protruding exhaust plasma plume to Y = +2.75 m
        add_torus_ring(bm, (nx, 2.44, nz), (0, 1, 0), major_r=0.25, minor_r=0.045, major_seg=16, minor_seg=6, mat_idx=3, smooth=True)
        add_cylinder_segment(
            bm, (nx, 2.38, nz), (nx, 2.75, nz), 0.22, 0.03, sides=16, mat_idx=3, smooth=True
        )

    # Twin central stern vernier thrusters at X = ±0.34 m, Y = +2.40 to +2.72 m
    for sx in (-1.0, 1.0):
        vx = sx * 0.34
        add_cylinder_segment(
            bm, (vx, 2.15, 0.02), (vx, 2.48, 0.02), 0.16, 0.18, sides=12, mat_idx=2, smooth=True
        )
        add_cylinder_segment(
            bm, (vx, 2.44, 0.02), (vx, 2.72, 0.02), 0.12, 0.02, sides=12, mat_idx=3, smooth=True
        )

    return finalize_bmesh_object("Cruiser_Cyan_Engine_Nacelles", bm, mats, parent=parent)


def build_laser_mounts(palette, parent):
    """Build twin dorsal dual-barrel laser turrets + ventral prow focus laser cannon."""
    mats = [palette["gold"], palette["titanium"], palette["cobalt"], palette["laser"]]
    bm = bmesh.new()

    # Twin Dorsal-Forward Dual-Barrel Heavy Laser Turrets at X = ±0.92, Y = -1.10, Z = +0.22
    for sx in (-1.0, 1.0):
        tx, ty, tz = sx * 0.92, -1.10, 0.18
        # Armored octagonal turret ring base
        add_cylinder_segment(
            bm, (tx, ty, tz - 0.06), (tx, ty, tz + 0.05), 0.20, 0.17, sides=8, mat_idx=0, smooth=False
        )
        # Titanium gimbal housing
        add_box(bm, (tx, ty, tz + 0.10), (0.24, 0.26, 0.13), mat_idx=1)
        add_box(bm, (tx, ty + 0.04, tz + 0.17), (0.18, 0.16, 0.06), mat_idx=0)
        # Twin parallel laser cannon barrels pointing forward (-Y)
        for bx_off in (-0.065, 0.065):
            bx = tx + bx_off
            bz = tz + 0.11
            # Cobalt cooling jacket
            add_cylinder_segment(
                bm, (bx, ty - 0.08, bz), (bx, ty - 0.34, bz), 0.042, 0.036, sides=10, mat_idx=2, smooth=True
            )
            # Titanium stepped barrel
            add_cylinder_segment(
                bm, (bx, ty - 0.34, bz), (bx, ty - 0.62, bz), 0.030, 0.026, sides=10, mat_idx=1, smooth=True
            )
            # Glowing amber-gold laser emitter muzzle collar & tip
            add_cylinder_segment(
                bm, (bx, ty - 0.60, bz), (bx, ty - 0.72, bz), 0.034, 0.018, sides=10, mat_idx=3, smooth=True
            )

    # Center Ventral Focus Laser/Tachyon Cannon Mount at X = 0.0, Y = -1.50, Z = -0.26
    cx, cy, cz = 0.0, -1.50, -0.26
    add_box(bm, (cx, cy + 0.22, cz + 0.04), (0.30, 0.56, 0.16), mat_idx=2)
    add_box(bm, (cx, cy + 0.18, cz - 0.04), (0.22, 0.44, 0.09), mat_idx=0)
    # Twin side radiator fins
    for sx in (-1.0, 1.0):
        add_box(bm, (cx + sx * 0.17, cy + 0.10, cz), (0.04, 0.36, 0.12), mat_idx=0)
    # Heavy ventral barrel & glowing emitter tip aligned at Y = -1.50 .. -2.05
    add_cylinder_segment(
        bm, (cx, cy + 0.05, cz - 0.01), (cx, cy - 0.42, cz - 0.01), 0.070, 0.055, sides=12, mat_idx=1, smooth=True
    )
    add_cylinder_segment(
        bm, (cx, cy - 0.40, cz - 0.01), (cx, cy - 0.58, cz - 0.01), 0.062, 0.030, sides=12, mat_idx=3, smooth=True
    )

    obj = finalize_bmesh_object("Cruiser_Laser_Mounts", bm, mats, parent=parent)

    # Hardpoint Empties for game weapon muzzle spawning
    hardpoints = [
        ("Hardpoint_Laser_Port", (-0.92, -1.82, 0.29)),
        ("Hardpoint_Laser_Starboard", (0.92, -1.82, 0.29)),
        ("Hardpoint_Laser_Center", (0.0, -1.50, -0.27)),
    ]
    for h_name, loc in hardpoints:
        emp = bpy.data.objects.new(h_name, None)
        emp.empty_display_size = 0.15
        emp.location = loc
        bpy.context.collection.objects.link(emp)
        emp.parent = parent

    return obj


def build_missile_mounts(palette, parent):
    """Build twin outboard 4-tube armored missile pods + twin ventral 2-rail racks."""
    mats = [palette["gold"], palette["titanium"], palette["cobalt"], palette["missile"]]
    bm = bmesh.new()

    # Twin Outboard Wing-Shoulder 4-Tube Missile Launcher Pods (X = ±1.40, Y = -0.25, Z = +0.24)
    for sx in (-1.0, 1.0):
        px, py, pz = sx * 1.40, -0.25, 0.24
        # Titanium pylon connecting pod to wing
        add_box(bm, (px, py + 0.08, pz - 0.11), (0.14, 0.44, 0.14), mat_idx=1)
        # Cobalt main pod housing
        add_box(bm, (px, py, pz), (0.36, 0.58, 0.24), mat_idx=2)
        # Gold angled armored top blast hood
        add_box(bm, (px, py - 0.02, pz + 0.13), (0.38, 0.62, 0.06), mat_idx=0)
        # Crimson-orange illuminated arming indicator strip along outer pod flank
        add_box(bm, (px + sx * 0.19, py, pz + 0.02), (0.03, 0.42, 0.04), mat_idx=3)

        # 2x2 grid of 4 launch tubes with protruding crimson-orange warhead cones
        for dx in (-0.085, 0.085):
            for dz in (-0.055, 0.055):
                tx = px + dx
                tz = pz + dz
                # Tube collar (titanium)
                add_cylinder_segment(
                    bm, (tx, py - 0.24, tz), (tx, py - 0.33, tz), 0.044, 0.044, sides=8, mat_idx=1, smooth=False
                )
                # Protruding warhead nose cone (crimson-orange glowing)
                add_cylinder_segment(
                    bm, (tx, py - 0.31, tz), (tx, py - 0.43, tz), 0.034, 0.008, sides=8, mat_idx=3, smooth=True
                )

    # Twin Ventral Chin-Wing 2-Rail Micro-Missile Racks (X = ±0.50, Y = -0.68, Z = -0.34)
    for sx in (-1.0, 1.0):
        rx, ry, rz = sx * 0.50, -0.68, -0.34
        add_box(bm, (rx, ry + 0.08, rz + 0.05), (0.22, 0.44, 0.06), mat_idx=1)
        for mx_off in (-0.055, 0.055):
            mx = rx + mx_off
            mz = rz - 0.01
            # Missile body
            add_cylinder_segment(
                bm, (mx, ry + 0.22, mz), (mx, ry - 0.14, mz), 0.028, 0.028, sides=8, mat_idx=1, smooth=True
            )
            # Glowing crimson-orange warhead cone
            add_cylinder_segment(
                bm, (mx, ry - 0.14, mz), (mx, ry - 0.24, mz), 0.028, 0.006, sides=8, mat_idx=3, smooth=True
            )

    obj = finalize_bmesh_object("Cruiser_Missile_Mounts", bm, mats, parent=parent)

    for h_name, loc in [
        ("Hardpoint_Missile_Port", (-1.40, -0.68, 0.24)),
        ("Hardpoint_Missile_Starboard", (1.40, -0.68, 0.24)),
    ]:
        emp = bpy.data.objects.new(h_name, None)
        emp.empty_display_size = 0.15
        emp.location = loc
        bpy.context.collection.objects.link(emp)
        emp.parent = parent

    return obj


def build_shield_projectors(palette, parent):
    """Build 4 hull-mounted hexagonal energy shield emitter pylons."""
    mats = [palette["gold"], palette["cobalt"], palette["cyan"], palette["shield_hex"]]
    bm = bmesh.new()

    mounts = [
        ((0.0, -0.45, 0.42), (0.0, -0.45, 0.54)),
        ((0.0, -0.15, -0.38), (0.0, -0.15, -0.50)),
        ((-1.62, 0.25, 0.04), (-1.75, 0.25, 0.04)),
        ((1.62, 0.25, 0.04), (1.75, 0.25, 0.04)),
    ]
    for p_base, p_tip in mounts:
        add_cylinder_segment(bm, p_base, p_tip, 0.11, 0.075, sides=6, mat_idx=0, smooth=False)
        mid = tuple((a + b) * 0.5 for a, b in zip(p_base, p_tip))
        tip_ext = tuple(b + (b - a) * 0.25 for a, b in zip(p_base, p_tip))
        add_cylinder_segment(bm, mid, tip_ext, 0.06, 0.02, sides=6, mat_idx=2, smooth=False)

    return finalize_bmesh_object("Cruiser_Shield_Projectors", bm, mats, parent=parent)


def build_reinforced_particle_shield(palette, parent):
    """Build low-poly geodesic particle shield shell + amber-gold reinforced lattice."""
    # 1. Translucent cyan-blue ellipsoidal shield shell (icosphere subdiv=2 -> 320 tris)
    bm_shell = bmesh.new()
    bmesh.ops.create_icosphere(bm_shell, subdivisions=2, radius=1.0)
    rx, ry, rz = 2.08, 3.05, 1.12
    for v in bm_shell.verts:
        v.co.x *= rx
        v.co.y *= ry
        v.co.z *= rz
    for f in bm_shell.faces:
        f.smooth = True
        f.material_index = 0
    obj_shell = finalize_bmesh_object(
        "Cruiser_Reinforced_Particle_Shield",
        bm_shell,
        [palette["shield_shell"]],
        parent=parent,
        uv_scale=0.2,
    )

    # 2. Luminous amber-gold reinforced structural lattice rings & emitter hex nodes
    bm_hex = bmesh.new()
    # Equatorial + vertical sagittal + lateral coronal structural rib bands
    ellipsoid_rings = [
        ("z", 0.0, 1.005),
        ("x", 0.0, 1.005),
        ("y", 0.0, 1.005),
        ("z", 0.48, 1.005),
        ("z", -0.48, 1.005),
    ]
    major_seg = 24
    minor_seg = 4
    rib_r = 0.022
    for axis, offset, scale_f in ellipsoid_rings:
        ring_centers = []
        ring_normals = []
        for i in range(major_seg):
            ang = 2.0 * math.pi * i / major_seg
            ca, sa = math.cos(ang), math.sin(ang)
            if axis == "z":
                z = offset * rz
                rad_scale = math.sqrt(max(0.05, 1.0 - offset * offset))
                pt = Vector((ca * rx * rad_scale * scale_f, sa * ry * rad_scale * scale_f, z * scale_f))
                nrm = Vector((pt.x / (rx * rx), pt.y / (ry * ry), pt.z / (rz * rz))).normalized()
            elif axis == "x":
                pt = Vector((0.0, ca * ry * scale_f, sa * rz * scale_f))
                nrm = Vector((0.0, pt.y / (ry * ry), pt.z / (rz * rz))).normalized()
            else:
                pt = Vector((ca * rx * scale_f, 0.0, sa * rz * scale_f))
                nrm = Vector((pt.x / (rx * rx), 0.0, pt.z / (rz * rz))).normalized()
            ring_centers.append(pt)
            ring_normals.append(nrm)

        ring_loops = []
        for i in range(major_seg):
            c = ring_centers[i]
            nrm = ring_normals[i]
            nxt = ring_centers[(i + 1) % major_seg]
            prv = ring_centers[(i - 1) % major_seg]
            tang = (nxt - prv).normalized()
            side = nrm.cross(tang).normalized()
            loop_verts = []
            for j in range(minor_seg):
                phi = 2.0 * math.pi * j / minor_seg
                pt = c + (nrm * math.cos(phi) + side * math.sin(phi)) * rib_r
                loop_verts.append(bm_hex.verts.new(pt))
            ring_loops.append(loop_verts)

        for i in range(major_seg):
            i_next = (i + 1) % major_seg
            r0, r1 = ring_loops[i], ring_loops[i_next]
            for j in range(minor_seg):
                j_next = (j + 1) % minor_seg
                f = bm_hex.faces.new([r0[j], r1[j], r1[j_next], r0[j_next]])
                f.smooth = False
                f.material_index = 0

    # Add 6 hexagonal reinforcement node rings at cardinal shell poles
    cardinals = [
        (Vector((0.0, -ry * 1.008, 0.0)), Vector((0.0, -1.0, 0.0))),
        (Vector((0.0, ry * 1.008, 0.0)), Vector((0.0, 1.0, 0.0))),
        (Vector((-rx * 1.008, 0.0, 0.0)), Vector((-1.0, 0.0, 0.0))),
        (Vector((rx * 1.008, 0.0, 0.0)), Vector((1.0, 0.0, 0.0))),
        (Vector((0.0, 0.0, rz * 1.008)), Vector((0.0, 0.0, 1.0))),
        (Vector((0.0, 0.0, -rz * 1.008)), Vector((0.0, 0.0, -1.0))),
    ]
    for pos, nrm in cardinals:
        add_torus_ring(bm_hex, pos, nrm, major_r=0.22, minor_r=0.025, major_seg=6, minor_seg=4, mat_idx=0, smooth=False)

    obj_hex = finalize_bmesh_object(
        "Cruiser_Particle_Shield_HexReinforcement",
        bm_hex,
        [palette["shield_hex"]],
        parent=parent,
        uv_scale=0.25,
    )
    return obj_shell, obj_hex


def build_lance_beam_geometry(bm, p_start, p_end, core_r=0.065, aura_r=0.145, mat_indices=(0, 1, 2), num_helices=3):
    """Add a Tachyon Lance spear shaft, hot core tip, helical energy ribbons, and aura."""
    idx_core, idx_tip, idx_aura = mat_indices
    v_start = Vector(p_start)
    v_end = Vector(p_end)
    axis = v_end - v_start
    length = axis.length
    z_dir = axis.normalized()
    ref = Vector((0, 0, 1)) if abs(z_dir.z) < 0.92 else Vector((1, 0, 0))
    x_dir = z_dir.cross(ref).normalized()
    y_dir = z_dir.cross(x_dir).normalized()

    # Tapered incandescent lance core & tip
    p_mid = v_start + z_dir * (length * 0.72)
    add_cylinder_segment(bm, v_start, p_mid, core_r * 0.75, core_r * 1.05, sides=10, mat_idx=idx_core, smooth=True)
    add_cylinder_segment(bm, p_mid, v_end, core_r * 1.05, 0.008, sides=10, mat_idx=idx_tip, smooth=True)

    # Translucent outer phase slipstream cone
    add_cylinder_segment(bm, v_start, v_end - z_dir * 0.06, aura_r * 0.95, aura_r * 0.28, sides=12, mat_idx=idx_aura, smooth=True)

    # Helical spiraling phase ribbons (closed 4-sided tubes)
    steps = 16
    ribbon_r = core_r * 0.34
    orbit_r = core_r * 1.65
    for h_i in range(num_helices):
        phase0 = (2.0 * math.pi * h_i) / num_helices
        stations = []
        for s in range(steps + 1):
            t = s / steps
            center_pt = v_start.lerp(v_end - z_dir * 0.15, t)
            ang = phase0 + t * 3.5 * math.pi
            rad_scale = math.sin(min(1.0, t * 1.15) * math.pi * 0.85) * 0.75 + 0.35
            orbit_vec = (x_dir * math.cos(ang) + y_dir * math.sin(ang)) * (orbit_r * rad_scale)
            c_pt = center_pt + orbit_vec
            ring = []
            for j in range(4):
                phi = 2.0 * math.pi * j / 4
                off = (x_dir * math.cos(phi) + y_dir * math.sin(phi)) * ribbon_r
                ring.append(c_pt + off)
            stations.append(ring)
        add_loft(bm, stations, mat_idx=idx_core, smooth=True)


def build_tachyon_lance_piercing_fx(palette, parent):
    """Build the piercing Tachyon Lance + shield breach shockwave rings & shards."""
    mats = [
        palette["lance_core"],
        palette["lance_tip"],
        palette["lance_aura"],
        palette["breach_ring"],
        palette["cyan"],
    ]
    bm = bmesh.new()

    # Piercing vector: from exterior (-2.55, -2.85, +0.98) through shield (-1.35, -1.60, +0.42) to (-0.75, -0.95, +0.16)
    p_outer = Vector((-2.55, -2.85, 0.98))
    p_breach = Vector((-1.35, -1.60, 0.42))
    p_inner = Vector((-0.75, -0.95, 0.16))
    lance_axis = (p_inner - p_outer).normalized()

    build_lance_beam_geometry(
        bm,
        p_outer,
        p_inner,
        core_r=0.065,
        aura_r=0.145,
        mat_indices=(0, 1, 2),
        num_helices=3,
    )

    # 3 concentric glowing shield breach shockwave rings centered at p_breach
    for major_r, minor_r, m_idx, off_t in [
        (0.24, 0.024, 3, -0.02),
        (0.42, 0.020, 4, 0.02),
        (0.62, 0.016, 3, 0.06),
    ]:
        add_torus_ring(
            bm,
            p_breach + lance_axis * off_t,
            lance_axis,
            major_r=major_r,
            minor_r=minor_r,
            major_seg=18,
            minor_seg=4,
            mat_idx=m_idx,
            smooth=False,
        )

    # 12 faceted crystalline shield breach shards spraying outward around puncture
    ref = Vector((0, 0, 1)) if abs(lance_axis.z) < 0.92 else Vector((1, 0, 0))
    u = lance_axis.cross(ref).normalized()
    v = lance_axis.cross(u).normalized()
    for i in range(12):
        ang = 2.0 * math.pi * i / 12.0
        radial = (u * math.cos(ang) + v * math.sin(ang)).normalized()
        shard_base = p_breach + radial * (0.20 + (i % 3) * 0.08)
        shard_tip = shard_base + radial * 0.16 - lance_axis * (0.12 + (i % 2) * 0.08)
        add_cylinder_segment(
            bm, shard_base, shard_tip, 0.036, 0.004, sides=4, mat_idx=(3 if i % 2 == 0 else 4), smooth=False
        )

    return finalize_bmesh_object("Tachyon_Lance_Piercing_FX", bm, mats, parent=parent)


def build_standalone_tachyon_lance(palette):
    """Build standalone superluminal Tachyon Lance projectile model (-Y forward)."""
    root = bpy.data.objects.new("Tachyon_Lance_Root", None)
    bpy.context.collection.objects.link(root)

    mats = [
        palette["lance_core"],
        palette["lance_tip"],
        palette["lance_aura"],
        palette["cyan"],
        palette["gold"],
    ]
    bm = bmesh.new()

    # Main lance spear oriented from tail +1.60m to tip -1.60m (total length 3.20m)
    build_lance_beam_geometry(
        bm,
        Vector((0.0, 1.55, 0.0)),
        Vector((0.0, -1.65, 0.0)),
        core_r=0.095,
        aura_r=0.22,
        mat_indices=(0, 1, 2),
        num_helices=3,
    )

    # Armored phase-focusing gold collars & cyan acceleration rings near tail
    for y_pos, r_col in [(0.95, 0.17), (0.35, 0.15)]:
        add_torus_ring(bm, (0.0, y_pos, 0.0), (0, 1, 0), major_r=r_col, minor_r=0.028, major_seg=12, minor_seg=4, mat_idx=4, smooth=False)
        add_torus_ring(bm, (0.0, y_pos - 0.10, 0.0), (0, 1, 0), major_r=r_col * 0.92, minor_r=0.022, major_seg=12, minor_seg=4, mat_idx=3, smooth=True)

    # 4 swept energy stabilizer vanes at tail
    for i in range(4):
        ang = math.pi * 0.25 + i * math.pi * 0.5
        rot = Matrix.Rotation(ang, 3, "Y")
        add_box(bm, (math.cos(ang) * 0.20, 1.15, math.sin(ang) * 0.20), (0.24, 0.58, 0.03), mat_idx=0, rot_matrix=rot)

    obj = finalize_bmesh_object("Tachyon_Lance_Mesh", bm, mats, parent=root)
    return root, [root, obj]


def build_standalone_particle_shield(palette):
    """Build standalone Reinforced Particle Shield assembly."""
    root = bpy.data.objects.new("Reinforced_Particle_Shield_Root", None)
    bpy.context.collection.objects.link(root)
    obj_shell, obj_hex = build_reinforced_particle_shield(palette, root)
    return root, [root, obj_shell, obj_hex]


# ---------------------------------------------------------------------------
# Export & Verification Helpers
# ---------------------------------------------------------------------------

def patch_glb_blending(glb_path: Path):
    """Ensure translucent shield/aura/breach materials in GLB use BLEND + doubleSided."""
    data = glb_path.read_bytes()
    if len(data) < 20 or data[:4] != b"glTF":
        return

    magic, version, total_len = struct.unpack("<4sII", data[:12])
    json_len, json_type = struct.unpack("<II", data[12:20])
    if json_type != 0x4E4F534A:
        return

    gltf = json.loads(data[20 : 20 + json_len].decode("utf-8"))
    bin_chunk = data[20 + json_len :]

    alpha_overrides = {
        "M_Particle_Shield_Shell": [0.20, 0.88, 1.0, 0.09],
        "M_Particle_Shield_HexFrame": [1.0, 0.80, 0.24, 0.78],
        "M_Tachyon_Lance_Aura": [0.58, 0.16, 0.96, 0.36],
        "M_Tachyon_Breach_Ring": [1.0, 0.24, 0.88, 0.86],
    }

    for mat in gltf.get("materials", []):
        m_name = mat.get("name", "")
        if any(tag in m_name for tag in ("Shield", "Aura", "Breach", "Translucent", "Decal")):
            mat["alphaMode"] = "BLEND"
            mat["doubleSided"] = True
            if m_name in alpha_overrides:
                pbr = mat.setdefault("pbrMetallicRoughness", {})
                pbr["baseColorFactor"] = alpha_overrides[m_name]

    new_json = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    pad = (4 - (len(new_json) % 4)) % 4
    new_json += b" " * pad

    new_total = 12 + 8 + len(new_json) + len(bin_chunk)
    new_hdr = struct.pack("<4sII", magic, version, new_total)
    new_c0 = struct.pack("<II", len(new_json), json_type)
    glb_path.write_bytes(new_hdr + new_c0 + new_json + bin_chunk)


def compute_scene_stats(objects):
    """Count total vertices, triangles, and world bounding box across mesh objects."""
    total_verts = 0
    total_tris = 0
    mins = Vector((1e9, 1e9, 1e9))
    maxs = Vector((-1e9, -1e9, -1e9))
    parts = {}

    for o in objects:
        if o.type != "MESH":
            continue
        v_count = len(o.data.vertices)
        t_count = sum(max(0, len(p.vertices) - 2) for p in o.data.polygons)
        total_verts += v_count
        total_tris += t_count
        parts[o.name] = {"vertices": v_count, "triangles": t_count}
        for corner in o.bound_box:
            wc = o.matrix_world @ Vector(corner)
            mins.x = min(mins.x, wc.x)
            mins.y = min(mins.y, wc.y)
            mins.z = min(mins.z, wc.z)
            maxs.x = max(maxs.x, wc.x)
            maxs.y = max(maxs.y, wc.y)
            maxs.z = max(maxs.z, wc.z)

    dims = (maxs - mins) if total_verts > 0 else Vector((0, 0, 0))
    return {
        "total_vertices": total_verts,
        "total_triangles": total_tris,
        "dimensions_blender_m": {
            "x": round(dims.x, 4),
            "y": round(dims.y, 4),
            "z": round(dims.z, 4),
        },
        "parts": parts,
    }


def export_model_bundle(model_name, root_obj, objects, description, palette_names):
    """Save .blend and export .glb, .fbx, .obj/.mtl + materials JSON."""
    blend_path = OUT_DIR / f"{model_name}.blend"
    glb_path = OUT_DIR / f"{model_name}.glb"
    fbx_path = OUT_DIR / f"{model_name}.fbx"
    obj_path = OUT_DIR / f"{model_name}.obj"
    json_path = OUT_DIR / f"{model_name}_materials.json"

    bpy.context.view_layer.update()
    stats = compute_scene_stats(objects)

    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))

    bpy.ops.object.select_all(action="DESELECT")
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = root_obj

    bpy.ops.export_scene.gltf(
        filepath=str(glb_path),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_draco_mesh_compression_enable=False,
    )
    patch_glb_blending(glb_path)

    bpy.ops.export_scene.fbx(
        filepath=str(fbx_path),
        use_selection=True,
        axis_forward="-Z",
        axis_up="Y",
        apply_scale_options="FBX_SCALE_ALL",
        mesh_smooth_type="FACE",
        path_mode="COPY",
        embed_textures=True,
    )

    bpy.ops.wm.obj_export(
        filepath=str(obj_path),
        export_selected_objects=True,
        export_materials=True,
        forward_axis="NEGATIVE_Z",
        up_axis="Y",
        path_mode="RELATIVE",
    )

    meta = {
        "model_name": model_name,
        "description": description,
        "directory": "meshy_test_0/models/stage_2/Tachyon",
        "files": {
            "blend": f"./meshy_test_0/models/stage_2/Tachyon/{model_name}.blend",
            "glb": f"./meshy_test_0/models/stage_2/Tachyon/{model_name}.glb",
            "fbx": f"./meshy_test_0/models/stage_2/Tachyon/{model_name}.fbx",
            "obj": f"./meshy_test_0/models/stage_2/Tachyon/{model_name}.obj",
            "mtl": f"./meshy_test_0/models/stage_2/Tachyon/{model_name}.mtl",
        },
        "stats": stats,
        "materials": palette_names,
        "hardpoints": [o.name for o in objects if o.type == "EMPTY" and "Hardpoint" in o.name],
    }
    json_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(
        f"[EXPORTED] {model_name}: {stats['total_vertices']} verts, "
        f"{stats['total_triangles']} tris, dims={stats['dimensions_blender_m']}"
    )
    return stats


# ---------------------------------------------------------------------------
# Multi-Angle Pure #000000 Black Background Preview Rendering
# ---------------------------------------------------------------------------

def render_black_preview(filename, cam_loc, target_loc=(0.0, 0.0, 0.0), res=(1024, 768)):
    """Render current scene against pure #000000 black background using EEVEE."""
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = res[0]
    scene.render.resolution_y = res[1]
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False

    if scene.world is None:
        scene.world = bpy.data.worlds.new("BlackSpaceWorld")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.0, 0.0, 0.0, 1.0)
        bg.inputs["Strength"].default_value = 1.0

    # Clear previous preview lights/cameras
    for o in list(bpy.data.objects):
        if o.type in ("LIGHT", "CAMERA"):
            bpy.data.objects.remove(o, do_unlink=True)

    # High-contrast 3-point metallic space lighting
    def add_area_light(name, loc, target, energy, color, size):
        ldata = bpy.data.lights.new(name=name, type="AREA")
        ldata.energy = energy
        ldata.color = color
        ldata.size = size
        lobj = bpy.data.objects.new(name, ldata)
        bpy.context.collection.objects.link(lobj)
        lobj.location = loc
        direction = Vector(target) - Vector(loc)
        lobj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    add_area_light("KeyLight", (4.5, -5.5, 4.5), target_loc, energy=520.0, color=(1.0, 0.96, 0.90), size=4.0)
    add_area_light("RimLight", (-5.0, 4.8, 3.8), target_loc, energy=360.0, color=(0.55, 0.85, 1.0), size=4.5)
    add_area_light("FillUnder", (0.5, -4.5, -3.6), target_loc, energy=180.0, color=(0.85, 0.90, 1.0), size=4.0)

    cdata = bpy.data.cameras.new("PreviewCam")
    cdata.lens = 42.0
    cobj = bpy.data.objects.new("PreviewCam", cdata)
    bpy.context.collection.objects.link(cobj)
    cobj.location = cam_loc
    direction = Vector(target_loc) - Vector(cam_loc)
    cobj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scene.camera = cobj

    out_png = TEX_DIR / filename
    scene.render.filepath = str(out_png)
    try:
        bpy.ops.render.render(write_still=True)
        print(f"[PREVIEW] Rendered {out_png}")
    except Exception as exc:
        print(f"[PREVIEW WARNING] EEVEE render failed for {filename}: {exc}")


def build_cruiser_assembly(palette, include_pierce=False):
    """Assemble the Horizon Tachyon Cruiser (+ optional Tachyon Lance pierce FX)."""
    root = bpy.data.objects.new("Horizon_Tachyon_Cruiser_Root", None)
    bpy.context.collection.objects.link(root)

    objs = [
        root,
        build_hull_core(palette, root),
        build_command_bridge_and_spine(palette, root),
        build_wings_and_armor(palette, root),
        build_cyan_engine_nacelles(palette, root),
        build_laser_mounts(palette, root),
        build_missile_mounts(palette, root),
        build_shield_projectors(palette, root),
    ]
    shield_shell, shield_hex = build_reinforced_particle_shield(palette, root)
    objs.extend([shield_shell, shield_hex])

    if include_pierce:
        objs.append(build_tachyon_lance_piercing_fx(palette, root))

    # Append all hardpoint empties created under root
    for o in bpy.data.objects:
        if o.parent == root and o not in objs:
            objs.append(o)

    return root, objs


def main():
    # 1. Horizon Tachyon Cruiser (standard armored + shielded + laser & missile mounts)
    reset_scene()
    pal1 = create_palette()
    root1, objs1 = build_cruiser_assembly(pal1, include_pierce=False)
    stats1 = export_model_bundle(
        "horizon_tachyon_cruiser",
        root1,
        objs1,
        "Horizon Tachyon Cruiser: Relativistic warship with reinforced gold/titanium/cobalt hull, cyan plasma engines, dual laser turrets, ventral focus cannon, 4-tube missile pods, ventral missile racks, and reinforced particle shield.",
        list(m.name for m in pal1.values()),
    )
    render_black_preview("horizon_tachyon_cruiser_front.png", cam_loc=(3.9, -4.7, 2.2), target_loc=(0.0, -0.1, 0.05))
    render_black_preview("horizon_tachyon_cruiser_rear.png", cam_loc=(-3.8, 4.8, 2.0), target_loc=(0.0, 0.2, 0.05))
    # Clear hull-shield temporarily for crisp close-up without shield tint if desired, or keep full view
    if "Cruiser_Reinforced_Particle_Shield" in bpy.data.objects:
        bpy.data.objects["Cruiser_Reinforced_Particle_Shield"].hide_render = True
        bpy.data.objects["Cruiser_Particle_Shield_HexReinforcement"].hide_render = True
        render_black_preview("horizon_tachyon_cruiser_unshielded_weapons.png", cam_loc=(2.7, -3.5, 1.4), target_loc=(0.0, -0.45, 0.0))

    # 2. Horizon Tachyon Cruiser Pierced (shield actively pierced by Tachyon Lance)
    reset_scene()
    pal2 = create_palette()
    root2, objs2 = build_cruiser_assembly(pal2, include_pierce=True)
    stats2 = export_model_bundle(
        "horizon_tachyon_cruiser_pierced",
        root2,
        objs2,
        "Horizon Tachyon Cruiser Pierced: Shielded Horizon Tachyon Cruiser with reinforced particle shield breached by an incoming superluminal Tachyon Lance.",
        list(m.name for m in pal2.values()),
    )
    render_black_preview("horizon_tachyon_cruiser_pierced.png", cam_loc=(-4.2, -4.4, 2.3), target_loc=(-0.55, -0.65, 0.2))

    # 3. Standalone Tachyon Lance
    reset_scene()
    pal3 = create_palette()
    root3, objs3 = build_standalone_tachyon_lance(pal3)
    stats3 = export_model_bundle(
        "tachyon_lance",
        root3,
        objs3,
        "Standalone Superluminal Tachyon Lance projectile with violet-magenta phase helices, incandescent needle tip, and gold/cyan acceleration rings.",
        ["M_Tachyon_Lance_Core", "M_Tachyon_Lance_HotTip", "M_Tachyon_Lance_Aura", "M_Cruiser_Cyan_Engine", "M_Cruiser_Gold_Armor"],
    )
    render_black_preview("tachyon_lance.png", cam_loc=(3.1, -3.5, 1.45), target_loc=(0.0, 0.0, 0.0))

    # 4. Standalone Reinforced Particle Shield
    reset_scene()
    pal4 = create_palette()
    root4, objs4 = build_standalone_particle_shield(pal4)
    stats4 = export_model_bundle(
        "reinforced_particle_shield",
        root4,
        objs4,
        "Standalone Reinforced Particle Shield geodesic cyan barrier with luminous amber-gold lattice ribs and emitter hex nodes.",
        ["M_Particle_Shield_Shell", "M_Particle_Shield_HexFrame"],
    )
    render_black_preview("reinforced_particle_shield.png", cam_loc=(3.8, -4.5, 2.0), target_loc=(0.0, 0.0, 0.0))

    print("\n=== SUMMARY ===")
    for label, st in [
        ("horizon_tachyon_cruiser", stats1),
        ("horizon_tachyon_cruiser_pierced", stats2),
        ("tachyon_lance", stats3),
        ("reinforced_particle_shield", stats4),
    ]:
        print(f"  {label}: {st['total_vertices']} verts | {st['total_triangles']} tris")


if __name__ == "__main__":
    main()
