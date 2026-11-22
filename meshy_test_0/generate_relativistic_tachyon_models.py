import os
import sys
import time
import json
import shutil
import urllib.request
import urllib.error
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
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 MeshySkill/1.0"})
    with urllib.request.urlopen(req) as resp, open(target, "wb") as f:
        f.write(resp.read())
    print(f"  Saved: {target.name} ({target.stat().st_size} bytes)")

def poll_all_tasks(task_dict, stage_name):
    """
    task_dict: { model_name: task_id }
    Polls all tasks concurrently until all have completed.
    Returns: { model_name: result_data }
    """
    print(f"\n=======================================================")
    print(f"Monitoring Concurrent {stage_name} Tasks ({len(task_dict)} models)")
    print(f"=======================================================")
    start_time = time.time()
    pending = dict(task_dict)
    results = {}

    while pending:
        time.sleep(5)
        elapsed = int(time.time() - start_time)
        status_line = []

        for model_name, task_id in list(pending.items()):
            try:
                data = make_request(f"{BASE_URL}/{task_id}")
                status = data.get("status")
                progress = data.get("progress", 0)
                status_line.append(f"{model_name[:14]}:{progress}%")

                if status == "SUCCEEDED":
                    print(f"[{elapsed:3d}s] SUCCESS: {model_name} {stage_name} completed!")
                    results[model_name] = data
                    del pending[model_name]
                elif status in ("FAILED", "CANCELED", "EXPIRED"):
                    err = data.get("task_error", {})
                    raise RuntimeError(f"Task {task_id} for {model_name} failed with {status}: {err}")
            except Exception as e:
                print(f"Polling warning for {model_name}: {e}")

        if pending:
            print(f"[{elapsed:3d}s] {stage_name} Progress: {' | '.join(status_line)}")

    return results

def process_completed_model(model_name, prompt, final_result, base_dir="C:/Users/lyftu/gemini_3/updated_html_js_0/calmchessgames_frontend"):
    print(f"\n-------------------------------------------------------")
    print(f"Processing and Linking Completed Model: {model_name}")
    print(f"-------------------------------------------------------")
    base_path = Path(base_dir)
    model_dir = base_path / "meshy_test_0" / "models" / model_name
    texture_dir = model_dir / f"{model_name}_textures"
    fallback_texture_dir = base_path / "meshy_yest_0" / "models" / model_name / f"{model_name}_textures"

    model_dir.mkdir(parents=True, exist_ok=True)
    texture_dir.mkdir(parents=True, exist_ok=True)
    fallback_texture_dir.mkdir(parents=True, exist_ok=True)

    with open(model_dir / "final_result.json", "w", encoding="utf-8") as f:
        json.dump(final_result, f, indent=2)

    # 1. Download 3D Models
    glb_path = model_dir / f"{model_name}.glb"
    model_urls = final_result.get("model_urls", {})
    if "glb" in model_urls and model_urls["glb"]:
        download_file(model_urls["glb"], glb_path)
    if "obj" in model_urls and model_urls["obj"]:
        download_file(model_urls["obj"], model_dir / f"{model_name}.obj")
    if "mtl" in model_urls and model_urls["mtl"]:
        download_file(model_urls["mtl"], model_dir / f"{model_name}.mtl")
    if "fbx" in model_urls and model_urls["fbx"]:
        download_file(model_urls["fbx"], model_dir / f"{model_name}.fbx")

    # 2. Download Textures & Materials
    materials_dict = {}
    if "thumbnail_url" in final_result and final_result["thumbnail_url"]:
        thumb_path = texture_dir / "thumbnail.png"
        download_file(final_result["thumbnail_url"], thumb_path)
        shutil.copy2(thumb_path, fallback_texture_dir / "thumbnail.png")
        shutil.copy2(thumb_path, model_dir / "thumbnail.png")
        materials_dict["thumbnail"] = f"./meshy_test_0/models/{model_name}/{model_name}_textures/thumbnail.png"

    texture_urls = final_result.get("texture_urls", [])
    if isinstance(texture_urls, list):
        for idx, tex_set in enumerate(texture_urls):
            if isinstance(tex_set, dict):
                for tex_type, url in tex_set.items():
                    if url:
                        canon_name = tex_type
                        if tex_type in ("base_color", "baseColor", "diffuse"):
                            canon_name = "base_color"
                        elif tex_type in ("metallic", "metalness"):
                            canon_name = "metallic"
                        elif tex_type in ("normal", "normalMap"):
                            canon_name = "normal"
                        elif tex_type in ("roughness",):
                            canon_name = "roughness"
                        elif tex_type in ("emissive", "emission"):
                            canon_name = "emissive"

                        file_name = f"texture_{idx}_{canon_name}.png"
                        dest_file = texture_dir / file_name
                        download_file(url, dest_file)
                        shutil.copy2(dest_file, fallback_texture_dir / file_name)
                        shutil.copy2(dest_file, model_dir / file_name)
                        materials_dict[f"texture_{idx}_{canon_name}"] = f"./meshy_test_0/models/{model_name}/{model_name}_textures/{file_name}"

    # 3. Write Materials Manifest JSON linking textures
    materials_json_path = model_dir / f"{model_name}_materials.json"
    materials_metadata = {
        "model": f"{model_name}.glb",
        "baseName": model_name,
        "description": prompt,
        "topology": "triangle",
        "target_polycount": 20000,
        "device_targets": ["mobile", "desktop", "vr", "arcore"],
        "exported_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime()),
        "destination": f"./meshy_test_0/models/{model_name}",
        "textures_directory": f"./meshy_test_0/models/{model_name}/{model_name}_textures",
        "fallback_textures_directory": f"./meshy_yest_0/models/{model_name}/{model_name}_textures",
        "materials": materials_dict,
        "companion_files": [f.name for f in model_dir.iterdir() if f.is_file()]
    }
    with open(materials_json_path, "w", encoding="utf-8") as f:
        json.dump(materials_metadata, f, indent=2)

    # 4. Deploy GLB to WebXR stage directories
    stage_dirs = [
        base_path / "wormhole0" / "desktop" / "warp_origin_images",
        base_path / "wormhole0" / "mobile" / "warp_origin_images",
        base_path / "wormhole0" / "vr" / "warp_origin_images",
        base_path / "wormhole0" / "arcore" / "warp_origin_images",
        base_path / "wormhole0" / "scene_images",
    ]
    for sdir in stage_dirs:
        sdir.mkdir(parents=True, exist_ok=True)
        target_glb = sdir / f"{model_name}.glb"
        shutil.copy2(glb_path, target_glb)
        print(f"  Deployed to: {target_glb}")

def main():
    models_to_create = [
        {
            "id": "A",
            "name": "relativistic_reinforced_hull",
            "prompt": (
                "A reinforced hull of an advanced starship traversing relativistic space at near-light velocity. "
                "Heavy multi-layered tungsten-titanium ablative armor plating, forward deflection bow with reinforced bulkheads, "
                "angled relativistic particle deflection baffles, sub-light ion thrust nozzles, glowing cyan relativistic energy conduits, "
                "hard surface sci-fi 3D game asset, optimized low-to-mid poly triangle topology for mobile, desktop, VR, and ARCore WebXR."
            )
        },
        {
            "id": "B",
            "name": "reinforced_particle_shield",
            "prompt": (
                "A reinforced particle shield defensive barrier and forcefield generator matrix for a relativistic spacecraft. "
                "Translucent glowing crystalline hexagonal particle shield plates, energy dispersal emitter nodes, "
                "high-frequency particle shield projectors, pulsating cyan and amber energy barrier grid, "
                "hard surface sci-fi 3D game asset, optimized low-to-mid poly triangle topology for mobile, desktop, VR, and ARCore WebXR."
            )
        },
        {
            "id": "C",
            "name": "tachyon_lance",
            "prompt": (
                "A high-tech Tachyon Lance weapon projectile and emitter spear engineered to pierce reinforced particle shields in relativistic space. "
                "Sleek linear accelerator lance barrel, glowing violet and electric purple superluminal phase particle coils, "
                "sharp focused armor-piercing lance tip, hard surface sci-fi 3D game asset, "
                "optimized low-to-mid poly triangle topology for mobile, desktop, VR, and ARCore WebXR."
            )
        },
        {
            "id": "D",
            "name": "tachyon_lance_pierced_shield",
            "prompt": (
                "A reinforced particle shield barrier pierced and punctured by a Tachyon Lance impact. "
                "Shattered glowing hexagonal energy shield grid, superluminal violet tachyon lance penetrating through the breach "
                "into reinforced starship hull plating, radial fracture cracks, high-energy plasma sparks and ionization flare, "
                "hard surface sci-fi 3D game asset, optimized low-to-mid poly triangle topology for mobile, desktop, VR, and ARCore WebXR."
            )
        }
    ]

    print("=" * 80)
    print("Meshy 3D Model Generation Pipeline")
    print("Traversing Relativistic Space: Reinforced Hull, Particle Shields & Tachyon Lance")
    print("=" * 80)
    for m in models_to_create:
        print(f"[{m['id']}] {m['name']}:\n    {m['prompt']}\n")

    # Step 1: Submit all Preview tasks concurrently
    print("\n>>> Submitting Preview Tasks for all models concurrently...")
    preview_tasks = {}
    for m in models_to_create:
        payload = {
            "mode": "preview",
            "prompt": m["prompt"],
            "art_style": "realistic",
            "ai_model": "latest",
            "topology": "triangle",
            "target_polycount": 20000,
            "should_remesh": True
        }
        res = make_request(BASE_URL, method="POST", data=payload)
        task_id = res.get("result")
        preview_tasks[m["name"]] = task_id
        print(f"Started Preview for {m['name']}: {task_id}")

    # Step 2: Poll all Preview tasks until SUCCEEDED
    preview_results = poll_all_tasks(preview_tasks, "Preview")

    # Step 3: Submit Refine tasks concurrently
    print("\n>>> Submitting Refine Tasks for all models concurrently...")
    refine_tasks = {}
    for m in models_to_create:
        prev_task_id = preview_tasks[m["name"]]
        payload = {
            "mode": "refine",
            "preview_task_id": prev_task_id,
            "enable_pbr": True
        }
        res = make_request(BASE_URL, method="POST", data=payload)
        task_id = res.get("result")
        refine_tasks[m["name"]] = task_id
        print(f"Started Refine for {m['name']}: {task_id}")

    # Step 4: Poll all Refine tasks until SUCCEEDED
    refine_results = poll_all_tasks(refine_tasks, "Refine")

    # Step 5: Process, download, link, and deploy
    for m in models_to_create:
        final_data = refine_results[m["name"]]
        process_completed_model(m["name"], m["prompt"], final_data)

    print("\n=======================================================")
    print("ALL 4 3D MODELS SUCCESSFULLY GENERATED, LINKED & DEPLOYED!")
    print("=======================================================")

if __name__ == "__main__":
    main()
