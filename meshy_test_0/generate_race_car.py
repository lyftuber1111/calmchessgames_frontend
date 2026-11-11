import os
import sys
import time
import json
import urllib.request
import urllib.error

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

def main():
    prompt = "A sleek modern red race car, aerodynamic GT sports racing car with glossy vibrant red body, black aerodynamic front splitter, large rear wing spoiler, alloy rims with performance racing slick tires, highly detailed"
    print(f"Starting Meshy Text-to-3D generation...")
    print(f"Prompt: {prompt}\n")

    # Step 1: Preview
    preview_payload = {
        "mode": "preview",
        "prompt": prompt,
        "ai_model": "latest",
        "should_remesh": True
    }
    
    print("Submitting Preview Task...")
    preview_res = make_request(BASE_URL, method="POST", data=preview_payload)
    preview_task_id = preview_res.get("result")
    print(f"Preview task started! ID: {preview_task_id}")

    preview_result = poll_task(preview_task_id, "Preview")
    with open("preview_result.json", "w", encoding="utf-8") as f:
        json.dump(preview_result, f, indent=2)

    # Step 2: Refine
    refine_payload = {
        "mode": "refine",
        "preview_task_id": preview_task_id,
        "enable_pbr": True
    }
    
    print("\nSubmitting Refine Task...")
    refine_res = make_request(BASE_URL, method="POST", data=refine_payload)
    refine_task_id = refine_res.get("result")
    print(f"Refine task started! ID: {refine_task_id}")

    final_result = poll_task(refine_task_id, "Refine")
    with open("final_result.json", "w", encoding="utf-8") as f:
        json.dump(final_result, f, indent=2)

    # Step 3: Download assets
    print("\nDownloading generated 3D assets...")
    os.makedirs("models", exist_ok=True)

    # Download model formats
    model_urls = final_result.get("model_urls", {})
    for fmt, url in model_urls.items():
        if url:
            ext = fmt if "." not in fmt else fmt.split(".")[-1]
            fname = f"models/red_race_car.{ext}"
            download_file(url, fname)

    # Download thumbnail if available
    thumb_url = final_result.get("thumbnail_url")
    if thumb_url:
        download_file(thumb_url, "models/thumbnail.png")

    # Download texture urls if available
    texture_urls = final_result.get("texture_urls", [])
    if isinstance(texture_urls, list):
        for idx, tex_set in enumerate(texture_urls):
            if isinstance(tex_set, dict):
                for tex_type, url in tex_set.items():
                    if url:
                        download_file(url, f"models/texture_{idx}_{tex_type}.png")

    print("\nGeneration and download complete!")

if __name__ == "__main__":
    main()
