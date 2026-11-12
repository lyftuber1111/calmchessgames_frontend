import os
import sys
import time
import json
import urllib.request
import urllib.error
import struct
import shutil
from pathlib import Path
import numpy as np

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
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
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

def scale_glb(src_glb_path, dst_glb_path, scale_factor=0.75):
    """
    Reads GLB file, scales all POSITION vertex coordinates by scale_factor (0.75x),
    updates accessor min/max bounds, and repacks valid GLB.
    """
    print(f"\nRescaling GLB: {src_glb_path} -> {dst_glb_path} with scale {scale_factor}x...")
    with open(src_glb_path, "rb") as f:
        data = f.read()

    # GLB Header
    magic, version, total_length = struct.unpack("<4sII", data[:12])
    if magic != b'glTF':
        raise ValueError("Not a valid glTF/GLB file")

    # Chunk 0: JSON
    chunk0_len, chunk0_type = struct.unpack("<II", data[12:20])
    json_bytes = data[20:20 + chunk0_len]
    gltf_json = json.loads(json_bytes.decode("utf-8"))

    # Chunk 1: BIN
    bin_header_offset = 20 + chunk0_len
    chunk1_len, chunk1_type = struct.unpack("<II", data[bin_header_offset:bin_header_offset + 8])
    bin_data = bytearray(data[bin_header_offset + 8:bin_header_offset + 8 + chunk1_len])

    accessors = gltf_json.get("accessors", [])
    buffer_views = gltf_json.get("bufferViews", [])

    for mesh in gltf_json.get("meshes", []):
        for prim in mesh.get("primitives", []):
            attrs = prim.get("attributes", {})
            if "POSITION" in attrs:
                pos_acc_idx = attrs["POSITION"]
                pos_acc = accessors[pos_acc_idx]
                bv_idx = pos_acc["bufferView"]
                bv = buffer_views[bv_idx]

                byte_offset = bv.get("byteOffset", 0) + pos_acc.get("byteOffset", 0)
                count = pos_acc["count"]
                byte_stride = bv.get("byteStride", 12)

                print(f"Mesh position count: {count}, stride: {byte_stride}, byteOffset: {byte_offset}")

                if byte_stride == 12 or byte_stride == 0:
                    verts = np.frombuffer(bin_data, dtype=np.float32, count=count * 3, offset=byte_offset).reshape((count, 3))
                    min_coords = verts.min(axis=0)
                    max_coords = verts.max(axis=0)
                    orig_size = max_coords - min_coords
                    print(f"Original Min: {min_coords}, Max: {max_coords}, Size: {orig_size}")

                    scaled_verts = verts * np.float32(scale_factor)
                    new_min = scaled_verts.min(axis=0)
                    new_max = scaled_verts.max(axis=0)
                    new_size = new_max - new_min
                    print(f"Rescaled (0.75x) Min: {new_min}, Max: {new_max}, Size: {new_size}")

                    bin_data[byte_offset:byte_offset + count * 12] = scaled_verts.tobytes()
                    pos_acc["min"] = [float(new_min[0]), float(new_min[1]), float(new_min[2])]
                    pos_acc["max"] = [float(new_max[0]), float(new_max[1]), float(new_max[2])]
                else:
                    print(f"Handling interleaved buffer (stride={byte_stride})...")
                    all_coords = []
                    for i in range(count):
                        off = byte_offset + i * byte_stride
                        x, y, z = struct.unpack_from("<3f", bin_data, off)
                        all_coords.append([x, y, z])
                    coords_arr = np.array(all_coords, dtype=np.float32)
                    min_coords = coords_arr.min(axis=0)
                    max_coords = coords_arr.max(axis=0)
                    print(f"Original Min: {min_coords}, Max: {max_coords}")

                    scaled_coords = coords_arr * np.float32(scale_factor)
                    new_min = scaled_coords.min(axis=0)
                    new_max = scaled_coords.max(axis=0)
                    print(f"Rescaled (0.75x) Min: {new_min}, Max: {new_max}")

                    for i in range(count):
                        off = byte_offset + i * byte_stride
                        struct.pack_into("<3f", bin_data, off, float(scaled_coords[i, 0]), float(scaled_coords[i, 1]), float(scaled_coords[i, 2]))

                    pos_acc["min"] = [float(new_min[0]), float(new_min[1]), float(new_min[2])]
                    pos_acc["max"] = [float(new_max[0]), float(new_max[1]), float(new_max[2])]

    # Encode updated JSON chunk with 4-byte alignment
    updated_json_bytes = json.dumps(gltf_json, separators=(',', ':')).encode("utf-8")
    json_pad = (4 - (len(updated_json_bytes) % 4)) % 4
    updated_json_bytes += b' ' * json_pad
    new_chunk0_len = len(updated_json_bytes)

    # Pad binary chunk to 4-byte boundary
    bin_pad = (4 - (len(bin_data) % 4)) % 4
    bin_data += b'\x00' * bin_pad
    new_chunk1_len = len(bin_data)

    new_total_len = 12 + 8 + new_chunk0_len + 8 + new_chunk1_len

    with open(dst_glb_path, "wb") as f_out:
        f_out.write(struct.pack("<4sII", b'glTF', 2, new_total_len))
        f_out.write(struct.pack("<II", new_chunk0_len, 0x4E4F534A))
        f_out.write(updated_json_bytes)
        f_out.write(struct.pack("<II", new_chunk1_len, 0x004E4942))
        f_out.write(bin_data)

    print(f"Saved scaled GLB: {dst_glb_path} ({os.path.getsize(dst_glb_path)} bytes)")

def scale_and_link_obj(src_obj_path, dst_obj_path, mtl_name="phase_interceptor.mtl", scale_factor=0.75):
    """
    Scales OBJ vertices by scale_factor and ensures mtllib points to mtl_name.
    """
    if not os.path.exists(src_obj_path):
        return
    print(f"Rescaling OBJ: {src_obj_path} -> {dst_obj_path}...")
    with open(src_obj_path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()

    new_lines = []
    has_mtllib = False
    for line in lines:
        if line.startswith("v "):
            parts = line.strip().split()
            if len(parts) >= 4:
                x = float(parts[1]) * scale_factor
                y = float(parts[2]) * scale_factor
                z = float(parts[3]) * scale_factor
                new_lines.append(f"v {x:.6f} {y:.6f} {z:.6f}\n")
            else:
                new_lines.append(line)
        elif line.startswith("mtllib "):
            new_lines.append(f"mtllib {mtl_name}\n")
            has_mtllib = True
        else:
            new_lines.append(line)

    if not has_mtllib:
        new_lines.insert(0, f"mtllib {mtl_name}\n")

    with open(dst_obj_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
    print(f"Saved scaled OBJ: {dst_obj_path}")

def update_mtl_texture_links(src_mtl_path, dst_mtl_path, texture_rel_dir="phase_interceptor_textures"):
    """
    Updates MTL file texture references to point directly to relative texture folder.
    """
    if not os.path.exists(src_mtl_path):
        # Create a default MTL if none exists
        content = (
            "# Phase Interceptor Material\n"
            "newmtl Material_PhaseInterceptor\n"
            "Ns 250.000000\n"
            "Ka 1.000000 1.000000 1.000000\n"
            "Ks 0.500000 0.500000 0.500000\n"
            "Ke 0.000000 0.000000 0.000000\n"
            "Ni 1.500000\n"
            "d 1.000000\n"
            "illum 2\n"
            f"map_Kd {texture_rel_dir}/texture_0_base_color.png\n"
            f"map_Pm {texture_rel_dir}/texture_0_metallic.png\n"
            f"map_Pr {texture_rel_dir}/texture_0_roughness.png\n"
            f"map_Bump {texture_rel_dir}/texture_0_normal.png\n"
            f"norm {texture_rel_dir}/texture_0_normal.png\n"
        )
        with open(dst_mtl_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Created default MTL with relative texture links: {dst_mtl_path}")
        return

    with open(src_mtl_path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()

    new_lines = []
    for line in lines:
        stripped = line.strip()
        tokens = stripped.split()
        if len(tokens) >= 2 and tokens[0] in ("map_Kd", "map_Ks", "map_Bump", "bump", "norm", "map_Pm", "map_Pr", "map_Ke", "map_d"):
            tex_file = os.path.basename(tokens[-1])
            new_lines.append(f"{tokens[0]} {texture_rel_dir}/{tex_file}\n")
        else:
            new_lines.append(line)

    with open(dst_mtl_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
    print(f"Saved linked MTL: {dst_mtl_path}")

def main():
    model_name = "phase_interceptor"
    user_prompt = "white armored Phase Interceptor High-agility corridor skirmisher equipped with a polarized light cyan shield. demensions are Scale: 0.75x"
    
    # Detailed prompt for Meshy AI
    detailed_prompt = (
        "A white armored Phase Interceptor spaceship, high-agility corridor skirmisher starfighter, "
        "pristine sleek white futuristic ceramic composite armor plating, polarized light cyan energy shield barrier "
        "and light cyan glowing power emitters, aerodynamic interceptor chassis with agile maneuver thrusters, "
        "dual rapid-fire corridor blasters, glowing cyan accents, hard surface sci-fi mechanical details, "
        "compact proportions, game ready 3D asset, 8k resolution textures"
    )

    base_repo_dir = Path("C:/Users/lyftu/gemini_3/updated_html_js_0/calmchessgames_frontend")
    model_dir = base_repo_dir / "meshy_test_0" / "models" / model_name
    texture_dir = model_dir / f"{model_name}_textures"
    fallback_texture_dir = base_repo_dir / "meshy_yest_0" / "models" / model_name / f"{model_name}_textures"

    model_dir.mkdir(parents=True, exist_ok=True)
    texture_dir.mkdir(parents=True, exist_ok=True)
    fallback_texture_dir.mkdir(parents=True, exist_ok=True)

    print("==================================================")
    print(f"Meshy 3D Generation Pipeline: {model_name}")
    print(f"User Prompt: {user_prompt}")
    print(f"Meshy Prompt: {detailed_prompt}")
    print(f"Target Model Directory: {model_dir}")
    print(f"Target Texture Directory: {texture_dir}")
    print(f"Target Dimensions: Scale 0.75x")
    print("==================================================")

    # 1. Preview Stage
    preview_payload = {
        "mode": "preview",
        "prompt": detailed_prompt,
        "art_style": "realistic",
        "ai_model": "latest",
        "topology": "triangle",
        "target_polycount": 30000,
        "should_remesh": True
    }

    print("\n[Step 1] Submitting Preview Task to Meshy API...")
    preview_res = make_request(BASE_URL, method="POST", data=preview_payload)
    preview_task_id = preview_res.get("result")
    print(f"Preview task started! ID: {preview_task_id}")

    preview_result = poll_task(preview_task_id, "Preview")
    with open(model_dir / "preview_result.json", "w", encoding="utf-8") as f:
        json.dump(preview_result, f, indent=2)

    # 2. Refine Stage
    refine_payload = {
        "mode": "refine",
        "preview_task_id": preview_task_id,
        "enable_pbr": True
    }

    print("\n[Step 2] Submitting Refine Task to Meshy API...")
    refine_res = make_request(BASE_URL, method="POST", data=refine_payload)
    refine_task_id = refine_res.get("result")
    print(f"Refine task started! ID: {refine_task_id}")

    final_result = poll_task(refine_task_id, "Refine")
    with open(model_dir / "final_result.json", "w", encoding="utf-8") as f:
        json.dump(final_result, f, indent=2)

    # 3. Download Models
    print("\n[Step 3] Downloading Model Assets...")
    model_urls = final_result.get("model_urls", {})
    raw_glb_path = model_dir / f"{model_name}_raw.glb"
    scaled_glb_path = model_dir / f"{model_name}.glb"

    if "glb" in model_urls and model_urls["glb"]:
        download_file(model_urls["glb"], raw_glb_path)
        scale_glb(raw_glb_path, scaled_glb_path, scale_factor=0.75)

    raw_obj_path = model_dir / f"{model_name}_raw.obj"
    scaled_obj_path = model_dir / f"{model_name}.obj"
    if "obj" in model_urls and model_urls["obj"]:
        download_file(model_urls["obj"], raw_obj_path)
        scale_and_link_obj(raw_obj_path, scaled_obj_path, mtl_name=f"{model_name}.mtl", scale_factor=0.75)

    raw_mtl_path = model_dir / f"{model_name}_raw.mtl"
    linked_mtl_path = model_dir / f"{model_name}.mtl"
    if "mtl" in model_urls and model_urls["mtl"]:
        download_file(model_urls["mtl"], raw_mtl_path)
        update_mtl_texture_links(raw_mtl_path, linked_mtl_path, texture_rel_dir=f"{model_name}_textures")
    else:
        update_mtl_texture_links(raw_mtl_path, linked_mtl_path, texture_rel_dir=f"{model_name}_textures")

    if "fbx" in model_urls and model_urls["fbx"]:
        download_file(model_urls["fbx"], model_dir / f"{model_name}.fbx")

    if "usdz" in model_urls and model_urls["usdz"]:
        download_file(model_urls["usdz"], model_dir / f"{model_name}.usdz")

    if "stl" in model_urls and model_urls["stl"]:
        download_file(model_urls["stl"], model_dir / f"{model_name}.stl")

    # 4. Download Textures & Materials
    print("\n[Step 4] Downloading Textures & Materials...")
    if "thumbnail_url" in final_result and final_result["thumbnail_url"]:
        thumb_path = texture_dir / "thumbnail.png"
        download_file(final_result["thumbnail_url"], thumb_path)
        shutil.copy2(thumb_path, fallback_texture_dir / "thumbnail.png")

    texture_urls = final_result.get("texture_urls", [])
    downloaded_textures = []
    if isinstance(texture_urls, list):
        for idx, tex_set in enumerate(texture_urls):
            if isinstance(tex_set, dict):
                for tex_type, url in tex_set.items():
                    if url:
                        tex_file_name = f"texture_{idx}_{tex_type}.png" if len(texture_urls) > 1 else f"texture_0_{tex_type}.png"
                        # Standardize base color name
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
                        downloaded_textures.append(tex_file_name)

    # 5. Create Materials & Links Descriptor JSON
    materials_json_path = model_dir / f"{model_name}_materials.json"
    materials_data = {
        "model": f"{model_name}.glb",
        "baseName": model_name,
        "description": user_prompt,
        "scale": 0.75,
        "dimensions": "Scale: 0.75x",
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
    print(f"Saved material manifest: {materials_json_path}")

    print("\n==================================================")
    print(f"Successfully created 3D Model: {model_name}")
    print(f"Path: ./meshy_test_0/models/{model_name}/{model_name}.glb (Scale: 0.75x)")
    print(f"Textures: ./meshy_test_0/models/{model_name}/{model_name}_textures")
    print("==================================================")

if __name__ == "__main__":
    main()
