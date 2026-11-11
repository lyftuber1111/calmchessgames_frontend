import os
import sys
import time
import json
import urllib.request
import urllib.error
import struct
import numpy as np

API_KEY = os.environ.get("MESHY_API_KEY")
if not API_KEY:
    print("ERROR: MESHY_API_KEY environment variable is not set.")
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
        print(f"HTTP Error {e.code}: {e.reason}\nBody: {error_body}")
        raise

def download_file(url, target_path):
    print(f"Downloading {url} -> {target_path} ...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp, open(target_path, "wb") as f:
        f.write(resp.read())
    print(f"Saved: {target_path} ({os.path.getsize(target_path)} bytes)")

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

def rescale_glb_to_dimensions(src_glb_path, dst_glb_path, target_x=2.8, target_y=2.8, target_z=2.8):
    """
    Reads a GLB file, locates the POSITION vertex attribute accessor,
    and scales the 3D vertices so the bounding box is exactly target_x x target_y x target_z (2.8m x 2.8m x 2.8m),
    centered at the origin.
    """
    print(f"\nRescaling GLB: {src_glb_path} -> target dimensions ({target_x}m x {target_y}m x {target_z}m)...")
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

    # Find position accessor(s)
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
                    # Contiguous array of Nx3 float32
                    verts = np.frombuffer(bin_data, dtype=np.float32, count=count * 3, offset=byte_offset).reshape((count, 3))
                    min_coords = verts.min(axis=0)
                    max_coords = verts.max(axis=0)
                    current_size = max_coords - min_coords
                    print(f"Original Min: {min_coords}, Max: {max_coords}, Size: {current_size}")

                    # Center around origin
                    center = (min_coords + max_coords) / 2.0
                    centered_verts = verts - center

                    # Scale to target dimensions 2.8m x 2.8m x 2.8m
                    # If any axis size is close to 0, prevent div by zero
                    scale_factors = np.zeros(3, dtype=np.float32)
                    target_dims = np.array([target_x, target_y, target_z], dtype=np.float32)

                    for i in range(3):
                        if current_size[i] > 1e-4:
                            scale_factors[i] = target_dims[i] / current_size[i]
                        else:
                            scale_factors[i] = 1.0

                    # Apply scaling
                    new_verts = centered_verts * scale_factors
                    new_min = new_verts.min(axis=0)
                    new_max = new_verts.max(axis=0)
                    new_size = new_max - new_min
                    print(f"Rescaled Min: {new_min}, Max: {new_max}, Size: {new_size}")

                    # Write back to bin_data
                    bin_data[byte_offset:byte_offset + count * 12] = new_verts.tobytes()

                    # Update accessor min/max
                    pos_acc["min"] = [float(new_min[0]), float(new_min[1]), float(new_min[2])]
                    pos_acc["max"] = [float(new_max[0]), float(new_max[1]), float(new_max[2])]
                else:
                    # Interleaved
                    print(f"Handling interleaved buffer (stride={byte_stride})...")
                    all_coords = []
                    for i in range(count):
                        off = byte_offset + i * byte_stride
                        x, y, z = struct.unpack_from("<3f", bin_data, off)
                        all_coords.append([x, y, z])
                    coords_arr = np.array(all_coords, dtype=np.float32)
                    min_coords = coords_arr.min(axis=0)
                    max_coords = coords_arr.max(axis=0)
                    current_size = max_coords - min_coords
                    center = (min_coords + max_coords) / 2.0
                    centered = coords_arr - center

                    scale_factors = np.zeros(3, dtype=np.float32)
                    target_dims = np.array([target_x, target_y, target_z], dtype=np.float32)
                    for ax in range(3):
                        scale_factors[ax] = target_dims[ax] / current_size[ax] if current_size[ax] > 1e-4 else 1.0

                    new_coords = centered * scale_factors
                    for i in range(count):
                        off = byte_offset + i * byte_stride
                        struct.pack_into("<3f", bin_data, off, float(new_coords[i, 0]), float(new_coords[i, 1]), float(new_coords[i, 2]))

                    new_min = new_coords.min(axis=0)
                    new_max = new_coords.max(axis=0)
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

    # Assemble GLB
    with open(dst_glb_path, "wb") as f_out:
        f_out.write(struct.pack("<4sII", b'glTF', 2, new_total_len))
        f_out.write(struct.pack("<II", new_chunk0_len, 0x4E4F534A))
        f_out.write(updated_json_bytes)
        f_out.write(struct.pack("<II", new_chunk1_len, 0x004E4942))
        f_out.write(bin_data)

    print(f"Successfully generated rescaled GLB: {dst_glb_path} ({os.path.getsize(dst_glb_path)} bytes)")

def main():
    prompt = (
        "A sci-fi futuristic recon drone with glowing red neon lights, "
        "high-tech aerodynamic spherical armored scout body, glowing red sensor optics, "
        "red glowing thrusters and red energy conduits, intricate sci-fi paneling, "
        "hard surface surveillance drone, optimized for WebXR game engine"
    )
    print("==================================================")
    print("Meshy Text-to-3D: Sci-Fi Red Glowing Recon Drone")
    print(f"Prompt: {prompt}")
    print("Target WebXR Polycount: ~28,000 vertices (remeshed triangle topology)")
    print("Target Dimensions: 2.8m x 2.8m x 2.8m")
    print("==================================================")

    # Step 1: Preview Task
    preview_payload = {
        "mode": "preview",
        "prompt": prompt,
        "ai_model": "latest",
        "should_remesh": True,
        "target_polycount": 28000,
        "topology": "triangle"
    }

    print("\nSubmitting Preview Task to Meshy API...")
    preview_res = make_request(BASE_URL, method="POST", data=preview_payload)
    preview_task_id = preview_res.get("result")
    print(f"Preview task started! ID: {preview_task_id}")

    preview_result = poll_task(preview_task_id, "Preview")
    os.makedirs("output", exist_ok=True)
    with open("output/preview_result.json", "w", encoding="utf-8") as f:
        json.dump(preview_result, f, indent=2)

    # Step 2: Refine Task (PBR textures, materials)
    refine_payload = {
        "mode": "refine",
        "preview_task_id": preview_task_id,
        "enable_pbr": True
    }

    print("\nSubmitting Refine Task to Meshy API...")
    refine_res = make_request(BASE_URL, method="POST", data=refine_payload)
    refine_task_id = refine_res.get("result")
    print(f"Refine task started! ID: {refine_task_id}")

    final_result = poll_task(refine_task_id, "Refine")
    with open("output/final_result.json", "w", encoding="utf-8") as f:
        json.dump(final_result, f, indent=2)

    # Step 3: Download Assets
    raw_glb_path = "output/recon_drone_raw.glb"
    model_urls = final_result.get("model_urls", {})
    glb_url = model_urls.get("glb")
    if not glb_url:
        raise RuntimeError("No GLB URL in final Meshy result")

    download_file(glb_url, raw_glb_path)

    # Download thumbnail
    thumb_url = final_result.get("thumbnail_url")
    if thumb_url:
        download_file(thumb_url, "output/recon_drone_thumbnail.png")

    # Download textures
    texture_urls = final_result.get("texture_urls", [])
    if isinstance(texture_urls, list):
        for idx, tex_set in enumerate(texture_urls):
            if isinstance(tex_set, dict):
                for tex_type, url in tex_set.items():
                    if url:
                        download_file(url, f"output/texture_{idx}_{tex_type}.png")

    # Step 4: Rescale to exactly 2.8m x 2.8m x 2.8m
    scaled_glb_path = "output/recon_drone_2.8m.glb"
    rescale_glb_to_dimensions(raw_glb_path, scaled_glb_path, target_x=2.8, target_y=2.8, target_z=2.8)

    print("\n=== Generation and Rescaling Complete ===")

if __name__ == "__main__":
    main()
