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
    print(f"Downloading {url} -> {target} ...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 MeshySkill/1.0"})
    with urllib.request.urlopen(req) as resp, open(target, "wb") as f:
        f.write(resp.read())
    print(f"Saved: {target} ({target.stat().st_size} bytes)")

def poll_task(task_id, stage_name, model_name=""):
    print(f"\n--- Monitoring {stage_name} Task for '{model_name}' ({task_id}) ---")
    start_time = time.time()
    last_progress = -1
    while True:
        status_data = make_request(f"{BASE_URL}/{task_id}")
        status = status_data.get("status")
        progress = status_data.get("progress", 0)

        if progress != last_progress:
            elapsed = int(time.time() - start_time)
            print(f"[{elapsed:3d}s] Model: {model_name} | Stage: {stage_name} | Status: {status} | Progress: {progress}%")
            last_progress = progress

        if status == "SUCCEEDED":
            print(f"Task {task_id} SUCCEEDED!")
            return status_data
        elif status in ("FAILED", "CANCELED", "EXPIRED"):
            err = status_data.get("task_error", {})
            raise RuntimeError(f"Task {task_id} ended with status: {status}. Error details: {err}")

        time.sleep(5)

def generate_meshy_asset(model_name, prompt, base_dir="C:/Users/lyftu/gemini_3/updated_html_js_0/calmchessgames_frontend"):
    print(f"\n{'='*70}")
    print(f"Initiating 3D Asset Generation Pipeline for: {model_name}")
    print(f"Prompt: {prompt}")
    print(f"{'='*70}")

    base_path = Path(base_dir)
    model_dir = base_path / "meshy_test_0" / "models" / model_name
    texture_dir = model_dir / f"{model_name}_textures"
    fallback_texture_dir = base_path / "meshy_yest_0" / "models" / model_name / f"{model_name}_textures"

    model_dir.mkdir(parents=True, exist_ok=True)
    texture_dir.mkdir(parents=True, exist_ok=True)
    fallback_texture_dir.mkdir(parents=True, exist_ok=True)

    # 1. Preview Task
    preview_payload = {
        "mode": "preview",
        "prompt": prompt,
        "art_style": "realistic",
        "should_remesh": True
    }
    print(f"Submitting Preview Task for '{model_name}'...")
    preview_res = make_request(BASE_URL, method="POST", data=preview_payload)
    preview_task_id = preview_res.get("result")
    print(f"Preview task ID: {preview_task_id}")

    preview_result = poll_task(preview_task_id, "Preview", model_name)
    with open(model_dir / "preview_result.json", "w", encoding="utf-8") as f:
        json.dump(preview_result, f, indent=2)

    # 2. Refine Task
    refine_payload = {
        "mode": "refine",
        "preview_task_id": preview_task_id,
        "enable_pbr": True
    }
    print(f"\nSubmitting Refine Task for '{model_name}'...")
    refine_res = make_request(BASE_URL, method="POST", data=refine_payload)
    refine_task_id = refine_res.get("result")
    print(f"Refine task ID: {refine_task_id}")

    final_result = poll_task(refine_task_id, "Refine", model_name)
    with open(model_dir / "final_result.json", "w", encoding="utf-8") as f:
        json.dump(final_result, f, indent=2)

    # 3. Download Models
    model_urls = final_result.get("model_urls", {})
    if "glb" in model_urls and model_urls["glb"]:
        download_file(model_urls["glb"], model_dir / f"{model_name}.glb")
    if "obj" in model_urls and model_urls["obj"]:
        download_file(model_urls["obj"], model_dir / f"{model_name}.obj")
    if "mtl" in model_urls and model_urls["mtl"]:
        download_file(model_urls["mtl"], model_dir / f"{model_name}.mtl")
    if "fbx" in model_urls and model_urls["fbx"]:
        download_file(model_urls["fbx"], model_dir / f"{model_name}.fbx")

    # 4. Download Textures & Materials
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
                        # Also copy to model root for direct loader compatibility
                        shutil.copy2(dest_file, model_dir / file_name)
                        materials_dict[f"texture_{idx}_{canon_name}"] = f"./meshy_test_0/models/{model_name}/{model_name}_textures/{file_name}"

    # 5. Link Materials in <model_name>_materials.json
    materials_json_path = model_dir / f"{model_name}_materials.json"
    materials_metadata = {
        "model": f"{model_name}.glb",
        "baseName": model_name,
        "description": prompt,
        "exported_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime()),
        "destination": f"./meshy_test_0/models/{model_name}",
        "textures_directory": f"./meshy_test_0/models/{model_name}/{model_name}_textures",
        "fallback_textures_directory": f"./meshy_yest_0/models/{model_name}/{model_name}_textures",
        "materials": materials_dict,
        "companion_files": [f.name for f in model_dir.iterdir() if f.is_file()]
    }

    with open(materials_json_path, "w", encoding="utf-8") as f:
        json.dump(materials_metadata, f, indent=2)

    print(f"\nCompleted Generation and Linking for: {model_name}")
    print(f"Model path: {model_dir / f'{model_name}.glb'}")
    print(f"Texture path: {texture_dir}")
    print(f"Fallback texture path: {fallback_texture_dir}")
    print(f"Materials metadata: {materials_json_path}")
    return model_dir

def main():
    models_to_create = [
        {
            "name": "small_cyan_missile",
            "prompt": (
                "A compact high-tech small cyan missile weapon for an XR sci-fi game, "
                "glowing neon cyan energy conduits, aerodynamic sleek metallic fuselage, "
                "forward sensor tracking dome, micro stabilizer guidance fins, "
                "rear ion thruster exhaust nozzle, intricate sci-fi paneling, hard surface 3D game asset, glb"
            )
        },
        {
            "name": "enemy_missile",
            "prompt": (
                "A menacing hostile heavy enemy missile weapon for an XR sci-fi game, "
                "glowing crimson red and fiery orange thermal warhead with hazard warning stripes, "
                "dark heavy titanium armor plating, dual forward guidance probes, aggressive swept-back fins, "
                "industrial rocket booster exhaust nozzle, hard surface sci-fi 3D game asset, glb"
            )
        }
    ]

    for model_info in models_to_create:
        generate_meshy_asset(model_info["name"], model_info["prompt"])

    print("\nAll models successfully generated and textured!")

if __name__ == "__main__":
    main()
