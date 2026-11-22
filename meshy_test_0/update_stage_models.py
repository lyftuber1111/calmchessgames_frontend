from pathlib import Path

stages = [
    ('desktop', 'desktop/warp_origin_images'),
    ('mobile', 'mobile/warp_origin_images'),
    ('vr', 'vr/warp_origin_images'),
    ('arcore', 'arcore/warp_origin_images'),
]

base = Path('C:/Users/lyftu/gemini_3/updated_html_js_0/calmchessgames_frontend/wormhole0')

for stage, img_prefix in stages:
    for fname in [f'{stage}/event_horizon.js', f'{stage}/event_horizon_{stage}.js']:
        fpath = base / fname
        if not fpath.exists():
            continue
        text = fpath.read_text(encoding='utf-8')
        
        # update weapon model_url
        old_wpn = '"special_fx_type": "overlay"'
        new_wpn = f'"special_fx_type": "overlay",\n        "model_url": "{img_prefix}/tachyon_lance.glb",\n        "graphic_object": "{img_prefix}/tachyon_lance.glb"'
        if old_wpn in text and f'"{img_prefix}/tachyon_lance.glb"' not in text:
            text = text.replace(old_wpn, new_wpn, 1)

        # update special_fx_file for tachyon_lance
        text = text.replace('"special_fx_file": "scene_images/screen_decals_spider_web_overlay_4.glb"', '"special_fx_file": "scene_images/tachyon_lance_pierced_shield.glb"', 1)

        # update enemy model_3d_url
        for needle in ['"model_3d_url": ""', '"model_3d_url": \'\'']:
            if needle in text:
                replacement = f'"model_3d_url": "{img_prefix}/relativistic_reinforced_hull.glb",\n        "shield_model_url": "{img_prefix}/reinforced_particle_shield.glb",\n        "pierced_shield_fx": "scene_images/tachyon_lance_pierced_shield.glb"'
                text = text.replace(needle, replacement, 1)
                break
        
        fpath.write_text(text, encoding='utf-8')
        print('Successfully updated:', fname)
