import os
import sys
import time
import json
import math
import shutil
import urllib.request
import urllib.error
import struct
from pathlib import Path

API_KEY = os.environ.get("MESHY_API_KEY")
if not API_KEY:
    print("ERROR: MESHY_API_KEY environment variable is not set.", file=sys.stderr)
    sys.exit(1)

BASE_URL = "https://api.meshy.ai/openapi/v2/text-to-3d"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def make_request(url, method="GET", data=None):
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"HTTP Error {e.code}: {e.reason}\nBody: {error_body}", file=sys.stderr)
        raise

def download_file(url, target_path):
    target = Path(target_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {url} -> {target} ...")
    req = urllib.request.Request(url, headers={"User-Agent": "MeshySkill/1.0"})
    with urllib.request.urlopen(req) as resp, open(target, "wb") as f:
        f.write(resp.read())
    print(f"Saved: {target} ({target.stat().st_size} bytes)")

def poll_task(task_id, stage_name):
    print(f"\n--- Monitoring {stage_name} Task ({task_id}) ---")
    start_time = time.time()
    last_progress = -1
    while True:
        status_data = make_request(f"{BASE_URL}/{task_id}")
        status = status_data.get("status")
        progress = status_data.get("progress", 0)

        if progress != last_progress:
            elapsed = int(time.time() - start_time)
            print(f"[{elapsed:3d}s] Stage: {stage_name} | Status: {status} | Progress: {progress}%")
            last_progress = progress

        if status == "SUCCEEDED":
            print(f"Task {task_id} SUCCEEDED!")
            return status_data
        elif status in ("FAILED", "CANCELED", "EXPIRED"):
            err = status_data.get("task_error", {})
            raise RuntimeError(f"Task {task_id} ended with status: {status}. Error details: {err}")

        time.sleep(5)

def build_animated_cyan_laser_rod_glb(output_path, radius, length, duration_sec=1.0, num_segments=32, texture_files=None):
    """
    Constructs a glTF 2.0 binary (.glb) representing:
    - A smooth cylindrical cyan laser rod
    - Cross section: circle with circumference 0.5m -> radius = 0.5 / (2*pi) ~= 0.079577 m
    - Starts at coordinate (0, 0, 0) and extends along the +Z axis (+Z forward)
    - Full extended length: 5.0m (from z=0 to z=5)
    - Keyframe animation over duration_sec (1.0 second):
        t = 0.0s: laser rod starts at (0,0,0) with length 0 (scale z = 0)
        t = 1.0s: laser rod extends 5m along +Z axis to (0,0,5) (scale z = 1)
    - PBR Metallic-Roughness cyan laser material with intense cyan emission
    """
    print(f"\nConstructing Animated Cyan Laser Rod GLB -> {output_path}")
    print(f"Parameters: Radius={radius:.6f}m (Circumference={2*math.pi*radius:.4f}m), Length={length:.2f}m, Duration={duration_sec}s, +Z Forward")

    # Geometry generation:
    # Cylinder along +Z axis from z=0 to z=length
    # Radial vertices around circumference
    # Two rings of vertices: ring 0 at z=0, ring 1 at z=length
    # Plus end caps: base at z=0 (normal -Z), tip at z=length (normal +Z)

    positions = []
    normals = []
    uvs = []
    indices = []

    # Side wall
    # We create num_segments + 1 vertices per ring for clean UV unwrapping (u from 0 to 1)
    for ring_idx, z in enumerate([0.0, length]):
        v = 0.0 if ring_idx == 0 else 1.0
        for i in range(num_segments + 1):
            theta = (2.0 * math.pi * i) / num_segments
            x = radius * math.cos(theta)
            y = radius * math.sin(theta)
            nx = math.cos(theta)
            ny = math.sin(theta)
            nz = 0.0
            u = i / num_segments
            positions.append([x, y, z])
            normals.append([nx, ny, nz])
            uvs.append([u, v])

    # Side indices (two triangles per quad)
    ring0_start = 0
    ring1_start = num_segments + 1
    for i in range(num_segments):
        p0 = ring0_start + i
        p1 = ring0_start + i + 1
        p2 = ring1_start + i
        p3 = ring1_start + i + 1
        indices.extend([p0, p2, p1])
        indices.extend([p1, p2, p3])

    # Base Cap at z = 0 (normal [0, 0, -1])
    base_center_idx = len(positions)
    positions.append([0.0, 0.0, 0.0])
    normals.append([0.0, 0.0, -1.0])
    uvs.append([0.5, 0.5])

    base_ring_start = len(positions)
    for i in range(num_segments + 1):
        theta = (2.0 * math.pi * i) / num_segments
        x = radius * math.cos(theta)
        y = radius * math.sin(theta)
        positions.append([x, y, 0.0])
        normals.append([0.0, 0.0, -1.0])
        uvs.append([0.5 + 0.5 * math.cos(theta), 0.5 + 0.5 * math.sin(theta)])

    for i in range(num_segments):
        indices.extend([base_center_idx, base_ring_start + i + 1, base_ring_start + i])

    # Tip Cap at z = length (normal [0, 0, 1])
    tip_center_idx = len(positions)
    positions.append([0.0, 0.0, length])
    normals.append([0.0, 0.0, 1.0])
    uvs.append([0.5, 0.5])

    tip_ring_start = len(positions)
    for i in range(num_segments + 1):
        theta = (2.0 * math.pi * i) / num_segments
        x = radius * math.cos(theta)
        y = radius * math.sin(theta)
        positions.append([x, y, length])
        normals.append([0.0, 0.0, 1.0])
        uvs.append([0.5 + 0.5 * math.cos(theta), 0.5 + 0.5 * math.sin(theta)])

    for i in range(num_segments):
        indices.extend([tip_center_idx, tip_ring_start + i, tip_ring_start + i + 1])

    pos_bytes = bytearray()
    for p in positions:
        pos_bytes.extend(struct.pack("<3f", p[0], p[1], p[2]))

    norm_bytes = bytearray()
    for n in normals:
        norm_bytes.extend(struct.pack("<3f", n[0], n[1], n[2]))

    uv_bytes = bytearray()
    for uv in uvs:
        uv_bytes.extend(struct.pack("<2f", uv[0], uv[1]))

    idx_bytes = bytearray()
    for idx in indices:
        idx_bytes.extend(struct.pack("<H", idx))  # unsigned short (16-bit)

    # Pad each to 4-byte boundary
    def pad4(b):
        pad_len = (4 - (len(b) % 4)) % 4
        return b + b'\x00' * pad_len

    # Animation data:
    # Keyframe times: 0.0s, 0.25s, 0.5s, 0.75s, 1.0s
    anim_times = [0.0, 0.25, 0.5, 0.75, 1.0]
    time_bytes = bytearray()
    for t in anim_times:
        time_bytes.extend(struct.pack("<f", float(t)))

    # Node scale animation:
    # At t=0: scale is [1.0, 1.0, 0.0] (rod starts at 0,0,0 with length 0)
    # At t=1: scale is [1.0, 1.0, 1.0] (rod extends 5m along +Z axis)
    # Note: radius along X and Y remains exactly 1.0 * radius (circumference = 0.5m)
    scale_bytes = bytearray()
    for t in anim_times:
        z_scale = t / duration_sec
        scale_bytes.extend(struct.pack("<3f", 1.0, 1.0, float(z_scale)))

    # Compute bounding boxes
    min_pos = [min(p[0] for p in positions), min(p[1] for p in positions), min(p[2] for p in positions)]
    max_pos = [max(p[0] for p in positions), max(p[1] for p in positions), max(p[2] for p in positions)]

    # Assemble Binary Buffer
    bin_buffer = bytearray()
    bv_defs = []

    def add_buffer_view(data, target=None):
        offset = len(bin_buffer)
        padded = pad4(data)
        bin_buffer.extend(padded)
        bv = {
            "buffer": 0,
            "byteOffset": offset,
            "byteLength": len(data)
        }
        if target:
            bv["target"] = target
        bv_defs.append(bv)
        return len(bv_defs) - 1

    idx_bv = add_buffer_view(idx_bytes, 34963)     # ELEMENT_ARRAY_BUFFER
    pos_bv = add_buffer_view(pos_bytes, 34962)     # ARRAY_BUFFER
    norm_bv = add_buffer_view(norm_bytes, 34962)   # ARRAY_BUFFER
    uv_bv = add_buffer_view(uv_bytes, 34962)       # ARRAY_BUFFER
    time_bv = add_buffer_view(time_bytes)          # Animation time input
    scale_bv = add_buffer_view(scale_bytes)        # Animation scale output

    # Accessors
    accessors = [
        # 0: INDICES
        {
            "bufferView": idx_bv,
            "byteOffset": 0,
            "componentType": 5123, # UNSIGNED_SHORT
            "count": len(indices),
            "type": "SCALAR",
            "min": [min(indices)],
            "max": [max(indices)]
        },
        # 1: POSITION
        {
            "bufferView": pos_bv,
            "byteOffset": 0,
            "componentType": 5126, # FLOAT
            "count": len(positions),
            "type": "VEC3",
            "min": min_pos,
            "max": max_pos
        },
        # 2: NORMAL
        {
            "bufferView": norm_bv,
            "byteOffset": 0,
            "componentType": 5126, # FLOAT
            "count": len(normals),
            "type": "VEC3"
        },
        # 3: TEXCOORD_0
        {
            "bufferView": uv_bv,
            "byteOffset": 0,
            "componentType": 5126, # FLOAT
            "count": len(uvs),
            "type": "VEC2"
        },
        # 4: ANIMATION TIME INPUT
        {
            "bufferView": time_bv,
            "byteOffset": 0,
            "componentType": 5126, # FLOAT
            "count": len(anim_times),
            "type": "SCALAR",
            "min": [min(anim_times)],
            "max": [max(anim_times)]
        },
        # 5: ANIMATION SCALE OUTPUT
        {
            "bufferView": scale_bv,
            "byteOffset": 0,
            "componentType": 5126, # FLOAT
            "count": len(anim_times),
            "type": "VEC3"
        }
    ]

    # Material: Glowing vibrant cyan laser beam
    material = {
        "name": "CyanLaserBeamMaterial",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.0, 1.0, 1.0, 1.0], # Cyan
            "metallicFactor": 0.1,
            "roughnessFactor": 0.2
        },
        "emissiveFactor": [0.0, 1.0, 1.0], # High cyan emission
        "alphaMode": "OPAQUE",
        "doubleSided": True
    }

    gltf_json = {
        "asset": {
            "version": "2.0",
            "generator": "Antigravity Meshy Cyan Laser Pipeline"
        },
        "scenes": [
            {
                "name": "DefaultScene",
                "nodes": [0]
            }
        ],
        "scene": 0,
        "nodes": [
            {
                "name": "CyanLaserRod_Root",
                "children": [1]
            },
            {
                "name": "CyanLaserBeam_AnimatedNode",
                "mesh": 0,
                "scale": [1.0, 1.0, 0.0]  # Initial scale at t=0
            }
        ],
        "meshes": [
            {
                "name": "CyanLaserBeamMesh",
                "primitives": [
                    {
                        "attributes": {
                            "POSITION": 1,
                            "NORMAL": 2,
                            "TEXCOORD_0": 3
                        },
                        "indices": 0,
                        "material": 0,
                        "mode": 4 # TRIANGLES
                    }
                ]
            }
        ],
        "materials": [
            material
        ],
        "animations": [
            {
                "name": "LaserExtendAlongZ",
                "samplers": [
                    {
                        "input": 4, # Time
                        "interpolation": "LINEAR",
                        "output": 5 # Scale
                    }
                ],
                "channels": [
                    {
                        "sampler": 0,
                        "target": {
                            "node": 1,
                            "path": "scale"
                        }
                    }
                ]
            }
        ],
        "accessors": accessors,
        "bufferViews": bv_defs,
        "buffers": [
            {
                "byteLength": len(bin_buffer)
            }
        ]
    }

    # Assemble GLB
    json_bytes = json.dumps(gltf_json, separators=(',', ':')).encode("utf-8")
    json_pad = (4 - (len(json_bytes) % 4)) % 4
    json_bytes += b' ' * json_pad
    chunk0_len = len(json_bytes)

    bin_pad = (4 - (len(bin_buffer) % 4)) % 4
    bin_buffer += b'\x00' * bin_pad
    chunk1_len = len(bin_buffer)

    total_len = 12 + 8 + chunk0_len + 8 + chunk1_len

    with open(output_path, "wb") as f_out:
        f_out.write(struct.pack("<4sII", b'glTF', 2, total_len))
        f_out.write(struct.pack("<II", chunk0_len, 0x4E4F534A)) # JSON
        f_out.write(json_bytes)
        f_out.write(struct.pack("<II", chunk1_len, 0x004E4942)) # BIN
        f_out.write(bin_buffer)

    print(f"Successfully generated animated GLB: {output_path} ({os.path.getsize(output_path)} bytes)")

def export_obj_and_mtl(obj_path, mtl_path, radius, length, num_segments=32):
    """Generates companion OBJ and MTL models"""
    print(f"Exporting companion OBJ/MTL -> {obj_path}, {mtl_path}")
    mtl_filename = Path(mtl_path).name

    with open(mtl_path, "w", encoding="utf-8") as f_mtl:
        f_mtl.write("# Material for Cyan Laser Rod\n")
        f_mtl.write("newmtl CyanLaserMaterial\n")
        f_mtl.write("Ka 0.0 0.8 0.8\n")
        f_mtl.write("Kd 0.0 1.0 1.0\n")
        f_mtl.write("Ks 0.2 0.9 0.9\n")
        f_mtl.write("Ke 0.0 1.0 1.0\n") # Emissive cyan
        f_mtl.write("Ns 100.0\n")
        f_mtl.write("d 1.0\n")
        f_mtl.write("illum 2\n")

    with open(obj_path, "w", encoding="utf-8") as f_obj:
        f_obj.write(f"# Cyan Laser Rod (+Z Forward, circumference 0.5m, length {length}m)\n")
        f_obj.write(f"mtllib {mtl_filename}\n")
        f_obj.write("o CyanLaserRod\n")

        # Vertices
        # Ring 0 (z=0)
        for i in range(num_segments):
            theta = (2.0 * math.pi * i) / num_segments
            x = radius * math.cos(theta)
            y = radius * math.sin(theta)
            f_obj.write(f"v {x:.6f} {y:.6f} 0.000000\n")
        # Ring 1 (z=length)
        for i in range(num_segments):
            theta = (2.0 * math.pi * i) / num_segments
            x = radius * math.cos(theta)
            y = radius * math.sin(theta)
            f_obj.write(f"v {x:.6f} {y:.6f} {length:.6f}\n")
        # Center points for caps
        f_obj.write("v 0.000000 0.000000 0.000000\n") # 2*num_segments + 1
        f_obj.write(f"v 0.000000 0.000000 {length:.6f}\n") # 2*num_segments + 2

        f_obj.write("usemtl CyanLaserMaterial\n")
        f_obj.write("s 1\n")

        # Side faces
        for i in range(num_segments):
            next_i = (i + 1) % num_segments
            v1 = i + 1
            v2 = next_i + 1
            v3 = num_segments + next_i + 1
            v4 = num_segments + i + 1
            f_obj.write(f"f {v1} {v2} {v3} {v4}\n")

        # Base cap (facing -Z)
        base_center = 2 * num_segments + 1
        for i in range(num_segments):
            next_i = (i + 1) % num_segments
            f_obj.write(f"f {base_center} {next_i + 1} {i + 1}\n")

        # Tip cap (facing +Z)
        tip_center = 2 * num_segments + 2
        for i in range(num_segments):
            next_i = (i + 1) % num_segments
            f_obj.write(f"f {tip_center} {num_segments + i + 1} {num_segments + next_i + 1}\n")

def main():
    model_name = "cyan_laser_rod"
    base_dir = Path("C:/Users/lyftu/gemini_3/updated_html_js_0/calmchessgames_frontend")
    model_dir = base_dir / "meshy_test_0" / "models" / model_name
    texture_dir = model_dir / f"{model_name}_textures"
    fallback_texture_dir = base_dir / "meshy_yest_0" / "models" / model_name / f"{model_name}_textures"

    model_dir.mkdir(parents=True, exist_ok=True)
    texture_dir.mkdir(parents=True, exist_ok=True)
    fallback_texture_dir.mkdir(parents=True, exist_ok=True)

    user_prompt = "A glowing animated cyan rod that looks like a laser beam, glowing neon cyan energy cylinder beam, sci-fi futuristic plasma laser rod, vibrant cyan emissive core"
    print(f"=== Meshy 3D Generation Pipeline for {model_name} ===")
    print(f"Prompt: {user_prompt}\n")

    # 1. Preview Stage
    preview_payload = {
        "mode": "preview",
        "prompt": user_prompt,
        "art_style": "realistic",
        "should_remesh": True
    }
    print("[Step 1] Submitting Meshy Preview Task...")
    preview_res = make_request(BASE_URL, method="POST", data=preview_payload)
    preview_task_id = preview_res.get("result")
    print(f"Preview Task ID: {preview_task_id}")
    preview_result = poll_task(preview_task_id, "Preview")

    with open(model_dir / "preview_result.json", "w", encoding="utf-8") as f:
        json.dump(preview_result, f, indent=2)

    # 2. Refine Stage
    refine_payload = {
        "mode": "refine",
        "preview_task_id": preview_task_id,
        "enable_pbr": True
    }
    print("\n[Step 2] Submitting Meshy Refine Task...")
    refine_res = make_request(BASE_URL, method="POST", data=refine_payload)
    refine_task_id = refine_res.get("result")
    print(f"Refine Task ID: {refine_task_id}")
    final_result = poll_task(refine_task_id, "Refine")

    with open(model_dir / "final_result.json", "w", encoding="utf-8") as f:
        json.dump(final_result, f, indent=2)

    # 3. Download Meshy 3D Models and Textures
    print("\n[Step 3] Downloading Meshy Assets...")
    model_urls = final_result.get("model_urls", {})
    if "glb" in model_urls and model_urls["glb"]:
        download_file(model_urls["glb"], model_dir / f"{model_name}_meshy_raw.glb")
    if "obj" in model_urls and model_urls["obj"]:
        download_file(model_urls["obj"], model_dir / f"{model_name}_meshy_raw.obj")
    if "mtl" in model_urls and model_urls["mtl"]:
        download_file(model_urls["mtl"], model_dir / f"{model_name}_meshy_raw.mtl")

    # Download Textures
    if "thumbnail_url" in final_result and final_result["thumbnail_url"]:
        thumb_path = texture_dir / "thumbnail.png"
        download_file(final_result["thumbnail_url"], thumb_path)
        shutil.copy2(thumb_path, fallback_texture_dir / "thumbnail.png")

    texture_urls = final_result.get("texture_urls", [])
    if isinstance(texture_urls, list):
        for idx, tex_set in enumerate(texture_urls):
            if isinstance(tex_set, dict):
                for tex_type, url in tex_set.items():
                    if url:
                        tex_file_name = f"texture_0_{tex_type}.png"
                        if tex_type in ("base_color", "baseColor", "diffuse"):
                            tex_file_name = "texture_0_base_color.png"
                        elif tex_type in ("metallic", "metalness"):
                            tex_file_name = "texture_0_metallic.png"
                        elif tex_type in ("normal", "normalMap"):
                            tex_file_name = "texture_0_normal.png"
                        elif tex_type in ("roughness",):
                            tex_file_name = "texture_0_roughness.png"

                        dest_tex = texture_dir / tex_file_name
                        download_file(url, dest_tex)
                        shutil.copy2(dest_tex, fallback_texture_dir / tex_file_name)

    # 4. Generate Animated GLB strictly following specifications:
    # - Circumference = 0.5m -> radius = 0.5 / (2*pi) ~= 0.079577 m
    # - Starts at (0, 0, 0) and extends 5m along +Z axis over 1 second period (+Z is forward)
    circumference = 0.5
    radius = circumference / (2.0 * math.pi)
    target_length = 5.0
    duration = 1.0

    animated_glb_path = model_dir / f"{model_name}.glb"
    build_animated_cyan_laser_rod_glb(animated_glb_path, radius=radius, length=target_length, duration_sec=duration)

    # 5. Generate OBJ and MTL
    obj_path = model_dir / f"{model_name}.obj"
    mtl_path = model_dir / f"{model_name}.mtl"
    export_obj_and_mtl(obj_path, mtl_path, radius=radius, length=target_length)

    # 6. Save materials and descriptor JSON
    materials_json_path = model_dir / f"{model_name}_materials.json"
    materials_data = {
        "model": f"{model_name}.glb",
        "baseName": model_name,
        "description": user_prompt,
        "specifications": {
            "circumference": "0.5m",
            "radius": f"{radius:.6f}m",
            "diameter": f"{2*radius:.6f}m",
            "start_coordinate": [0.0, 0.0, 0.0],
            "end_coordinate": [0.0, 0.0, target_length],
            "axis": "+Z (forward)",
            "length": f"{target_length}m",
            "animation_duration": f"{duration}s",
            "animation_type": "LaserExtendAlongZ (0s to 1s linear scale along +Z)"
        },
        "exported_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime()),
        "destination": f"./meshy_test_0/models/{model_name}",
        "textures_directory": f"./meshy_test_0/models/{model_name}/{model_name}_textures",
        "fallback_textures_directory": f"./meshy_yest_0/models/{model_name}/{model_name}_textures",
        "materials": {
            "base_color": f"./meshy_test_0/models/{model_name}/{model_name}_textures/texture_0_base_color.png",
            "metallic": f"./meshy_test_0/models/{model_name}/{model_name}_textures/texture_0_metallic.png",
            "normal": f"./meshy_test_0/models/{model_name}/{model_name}_textures/texture_0_normal.png",
            "roughness": f"./meshy_test_0/models/{model_name}/{model_name}_textures/texture_0_roughness.png",
            "thumbnail": f"./meshy_test_0/models/{model_name}/{model_name}_textures/thumbnail.png"
        },
        "companion_files": [f for f in os.listdir(model_dir) if f != f"{model_name}_materials.json" and os.path.isfile(model_dir / f)]
    }

    with open(materials_json_path, "w", encoding="utf-8") as f:
        json.dump(materials_data, f, indent=2)

    print("\n==================================================")
    print(f"Successfully generated: {model_name}")
    print(f"GLB Model: {animated_glb_path}")
    print(f"OBJ Model: {obj_path}")
    print(f"Materials JSON: {materials_json_path}")
    print(f"Textures: {texture_dir}")
    print("==================================================")

if __name__ == "__main__":
    main()
