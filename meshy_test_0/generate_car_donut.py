import bpy
import bmesh
import math
import mathutils
import os

print("=== Red Race Car Donut Animation Generator ===")
bpy.ops.wm.read_factory_settings(use_empty=True)

fbx_input = r"C:\Users\lyftu\gemini_3\updated_html_js_0\calmchessgames_frontend\meshy_test_0\models\red_race_car.fbx"
print(f"Importing base FBX: {fbx_input}...")
bpy.ops.import_scene.fbx(filepath=fbx_input)

car = bpy.data.objects.get("Mesh_0")
if not car:
    raise RuntimeError("Mesh_0 not found in FBX")

# Keep reference to materials
original_materials = [slot.material for slot in car.material_slots if slot.material]
print(f"Found {len(original_materials)} materials.")

# Wheel definitions: (Name, center, y_min, y_max)
wheel_defs = {
    "Wheel_FL": (mathutils.Vector((-0.571, -0.351, -0.076)), -0.44, -0.26),
    "Wheel_FR": (mathutils.Vector((-0.572, 0.354, -0.081)), 0.26, 0.44),
    "Wheel_RL": (mathutils.Vector((0.613, -0.362, -0.067)), -0.44, -0.26),
    "Wheel_RR": (mathutils.Vector((0.610, 0.363, -0.069)), 0.26, 0.44),
}

wheel_objects = {}

for w_name, (w_center, y_min, y_max) in wheel_defs.items():
    new_mesh = car.data.copy()
    new_mesh.name = f"{w_name}_Mesh"
    w_obj = bpy.data.objects.new(w_name, new_mesh)
    bpy.context.scene.collection.objects.link(w_obj)
    
    bm = bmesh.new()
    bm.from_mesh(new_mesh)
    faces_to_remove = []
    for f in bm.faces:
        c = f.calc_center_median()
        dist_xz = ((c.x - w_center.x)**2 + (c.z - w_center.z)**2)**0.5
        if not (dist_xz <= 0.22 and y_min <= c.y <= y_max):
            faces_to_remove.append(f)
    bmesh.ops.delete(bm, geom=faces_to_remove, context='FACES_ONLY')
    isolated_verts = [v for v in bm.verts if not v.link_faces]
    bmesh.ops.delete(bm, geom=isolated_verts, context='VERTS')
    
    # Translate geometry so origin is at center
    bmesh.ops.translate(bm, vec=-w_center, verts=bm.verts)
    bm.to_mesh(new_mesh)
    bm.free()
    new_mesh.update()
    
    w_obj.location = w_center
    wheel_objects[w_name] = w_obj
    print(f"Extracted {w_name} ({len(w_obj.data.vertices)} verts)")

# Clean chassis mesh
bm = bmesh.new()
bm.from_mesh(car.data)
chassis_faces_to_remove = []
for f in bm.faces:
    c = f.calc_center_median()
    for w_name, (w_center, y_min, y_max) in wheel_defs.items():
        dist_xz = ((c.x - w_center.x)**2 + (c.z - w_center.z)**2)**0.5
        if dist_xz <= 0.22 and y_min <= c.y <= y_max:
            chassis_faces_to_remove.append(f)
            break
bmesh.ops.delete(bm, geom=chassis_faces_to_remove, context='FACES_ONLY')
isolated_verts = [v for v in bm.verts if not v.link_faces]
bmesh.ops.delete(bm, geom=isolated_verts, context='VERTS')
bm.to_mesh(car.data)
bm.free()
car.data.update()
car.name = "Car_Chassis"

# Create Steering Rack object at front axle center
front_axle_center = mathutils.Vector((-0.5715, 0.0, -0.0785))
steering_rack = bpy.data.objects.new("Steering_Rack", None)
steering_rack.empty_display_type = 'ARROWS'
steering_rack.empty_display_size = 0.2
steering_rack.location = front_axle_center
bpy.context.scene.collection.objects.link(steering_rack)

# Create Root Donut Pivot
donut_root = bpy.data.objects.new("Donut_Root", None)
donut_root.empty_display_type = 'PLAIN_AXES'
donut_root.empty_display_size = 0.5
bpy.context.scene.collection.objects.link(donut_root)

# Parent hierarchy
car.parent = donut_root
steering_rack.parent = car
wheel_objects["Wheel_FL"].parent = steering_rack
wheel_objects["Wheel_FR"].parent = steering_rack
wheel_objects["Wheel_RL"].parent = car
wheel_objects["Wheel_RR"].parent = car

# Adjust local origins relative to parent
wheel_objects["Wheel_FL"].location = wheel_defs["Wheel_FL"][0] - front_axle_center
wheel_objects["Wheel_FR"].location = wheel_defs["Wheel_FR"][0] - front_axle_center
wheel_objects["Wheel_RL"].location = wheel_defs["Wheel_RL"][0]
wheel_objects["Wheel_RR"].location = wheel_defs["Wheel_RR"][0]
steering_rack.location = front_axle_center

print("Hierarchy built successfully.")

# Setup Tire Smoke Material
smoke_mat = bpy.data.materials.new(name="Tire_Smoke_Puff_Mat")
smoke_mat.use_nodes = True
nodes = smoke_mat.node_tree.nodes
principled = nodes.get("Principled BSDF")
principled.inputs["Base Color"].default_value = (0.93, 0.94, 0.97, 1.0)
principled.inputs["Roughness"].default_value = 0.95
if "Alpha" in principled.inputs:
    principled.inputs["Alpha"].default_value = 0.72
if hasattr(smoke_mat, "blend_method"):
    smoke_mat.blend_method = 'BLEND'

# Create base smoke puff mesh
bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.18)
for v in bm.verts:
    disp = 1.0 + 0.32 * math.sin(v.co.x * 14.0) * math.cos(v.co.y * 14.0) * math.sin(v.co.z * 14.0)
    v.co *= disp
smoke_mesh = bpy.data.meshes.new("Tire_Smoke_Mesh")
bm.to_mesh(smoke_mesh)
bm.free()
smoke_mesh.update()
smoke_mesh.materials.append(smoke_mat)

# Create 8 smoke puffs for Left Rear, 8 for Right Rear
num_puffs = 8
smoke_puffs_rl = []
smoke_puffs_rr = []

for i in range(num_puffs):
    p_rl = bpy.data.objects.new(f"Smoke_RL_{i:02d}", smoke_mesh)
    p_rr = bpy.data.objects.new(f"Smoke_RR_{i:02d}", smoke_mesh)
    bpy.context.scene.collection.objects.link(p_rl)
    bpy.context.scene.collection.objects.link(p_rr)
    smoke_puffs_rl.append(p_rl)
    smoke_puffs_rr.append(p_rr)

# Setup Animation
TOTAL_FRAMES = 120
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = TOTAL_FRAMES

# Kinematic constants
L = 1.183 # distance between front and rear axles
R_front = 0.40 # radius of front axle circle
R_rear = 1.35  # radius of rear axle circle
cos_gamma = (R_front**2 + R_rear**2 - L**2) / (2 * R_front * R_rear)
gamma = math.acos(cos_gamma)

# Steering rack angle: pivoted to the left (+Z rotation by 28 deg)
steer_angle = math.radians(28.0)
steering_rack.rotation_euler = (0, 0, steer_angle)
steering_rack.keyframe_insert(data_path="rotation_euler", frame=1)
steering_rack.keyframe_insert(data_path="rotation_euler", frame=TOTAL_FRAMES)

# Precalculate tire world positions for smoke emitter
rl_world_pos_list = []
rr_world_pos_list = []

for frame in range(1, TOTAL_FRAMES + 1):
    u = (frame - 1) / float(TOTAL_FRAMES)
    phi = -2.0 * math.pi * u  # Clockwise rotation
    
    # Front axle world position (tight inner circle)
    xf = R_front * math.cos(phi)
    yf = R_front * math.sin(phi)
    
    # Rear axle world position (wide outer circle, lagging in clockwise motion)
    phi_rear = phi + gamma
    xr = R_rear * math.cos(phi_rear)
    yr = R_rear * math.sin(phi_rear)
    
    # Direction vector from rear to front (car forward heading)
    dx = xf - xr
    dy = yf - yr
    yaw = math.atan2(dy, dx)
    
    # Chassis position: put car origin at midpoint
    # Car forward axis is -X, so rotation yaw needs alignment:
    # If local -X points along (dx, dy), then yaw_rot = yaw + pi
    yaw_rot = yaw + math.pi
    
    # Centrifugal roll (lean away from center) and power squat
    roll = math.radians(3.2)  # lean outward
    squat = math.radians(1.4) # rear squats down
    
    # Car chassis placement
    # Front axle is at local x = -0.5715, rear axle at local x = +0.6115
    # World position of car origin:
    t_mid = 0.5715 / L
    x_car = xf - t_mid * dx
    y_car = yf - t_mid * dy
    z_car = 0.0
    
    car.location = (x_car, y_car, z_car)
    car.rotation_euler = (squat, roll, yaw_rot)
    car.keyframe_insert(data_path="location", frame=frame)
    car.keyframe_insert(data_path="rotation_euler", frame=frame)
    
    # Front wheels roll (spin around local Y axis matching travel speed)
    # Front axle traveled circumference ~ 2.51m, radius ~0.18m
    front_roll_angle = - 2.0 * math.pi * 2.22 * u
    wheel_objects["Wheel_FL"].rotation_euler = (0, front_roll_angle, 0)
    wheel_objects["Wheel_FR"].rotation_euler = (0, front_roll_angle, 0)
    wheel_objects["Wheel_FL"].keyframe_insert(data_path="rotation_euler", frame=frame)
    wheel_objects["Wheel_FR"].keyframe_insert(data_path="rotation_euler", frame=frame)
    
    # Rear wheels burnout spin (12 full revolutions of wheelspin)
    rear_spin_angle = - 2.0 * math.pi * 12.0 * u
    wheel_objects["Wheel_RL"].rotation_euler = (0, rear_spin_angle, 0)
    wheel_objects["Wheel_RR"].rotation_euler = (0, rear_spin_angle, 0)
    wheel_objects["Wheel_RL"].keyframe_insert(data_path="rotation_euler", frame=frame)
    wheel_objects["Wheel_RR"].keyframe_insert(data_path="rotation_euler", frame=frame)
    
    # Compute world coordinates of the rear tire contact patches at this frame
    # Car rotation matrix
    mat_rot = mathutils.Euler((squat, roll, yaw_rot)).to_matrix()
    pos_car = mathutils.Vector((x_car, y_car, z_car))
    
    # Local positions of rear tires at ground contact
    rl_ground = mathutils.Vector((0.613, -0.362, -0.255))
    rr_ground = mathutils.Vector((0.610, 0.363, -0.255))
    
    rl_w = pos_car + mat_rot @ rl_ground
    rr_w = pos_car + mat_rot @ rr_ground
    rl_world_pos_list.append(rl_w)
    rr_world_pos_list.append(rr_w)

# Animate Smoke Puffs
puff_lifespan = 36 # frames (0.30 of the 120-frame cycle)

for i in range(num_puffs):
    p_rl = smoke_puffs_rl[i]
    p_rr = smoke_puffs_rr[i]
    
    # Birth frame offset (staggered evenly)
    spawn_frame = int(round(i * (TOTAL_FRAMES / float(num_puffs)))) + 1
    
    for frame in range(1, TOTAL_FRAMES + 1):
        # Calculate age in frames modulo TOTAL_FRAMES
        age = (frame - spawn_frame) % TOTAL_FRAMES
        
        if age < puff_lifespan:
            tau = age / float(puff_lifespan) # 0 to 1
            
            # Expansion curve: quickly grows, then slowly billows
            scale_factor = 0.15 + 1.65 * math.sin(tau * math.pi * 0.95)
            
            # Position: spawned at the tire's position at spawn_frame
            birth_idx = (spawn_frame - 1) % TOTAL_FRAMES
            rl_birth = rl_world_pos_list[birth_idx]
            rr_birth = rr_world_pos_list[birth_idx]
            
            # Add centrifugal outward drift and upward billowing rise
            drift_dist = 0.35 * tau
            # Outward vector from center (0, 0)
            rl_radial = mathutils.Vector((rl_birth.x, rl_birth.y, 0)).normalized()
            rr_radial = mathutils.Vector((rr_birth.x, rr_birth.y, 0)).normalized()
            
            rl_pos = rl_birth + rl_radial * drift_dist + mathutils.Vector((0, 0, 0.22 * tau))
            rr_pos = rr_birth + rr_radial * drift_dist + mathutils.Vector((0, 0, 0.22 * tau))
            
            p_rl.location = rl_pos
            p_rr.location = rr_pos
            p_rl.scale = (scale_factor, scale_factor, scale_factor)
            p_rr.scale = (scale_factor, scale_factor, scale_factor)
        else:
            # Inactive / hidden
            p_rl.scale = (0.001, 0.001, 0.001)
            p_rr.scale = (0.001, 0.001, 0.001)
            # Park at ground
            birth_idx = (spawn_frame - 1) % TOTAL_FRAMES
            p_rl.location = rl_world_pos_list[birth_idx]
            p_rr.location = rr_world_pos_list[birth_idx]
            
        p_rl.keyframe_insert(data_path="location", frame=frame)
        p_rl.keyframe_insert(data_path="scale", frame=frame)
        p_rr.keyframe_insert(data_path="location", frame=frame)
        p_rr.keyframe_insert(data_path="scale", frame=frame)

print("Keyframes successfully generated.")

# Add Burnout Skid Mark Ring on Ground
bm = bmesh.new()
# Circular ribbon for rear tire donut mark
skid_segs = 64
r_in = R_rear - 0.25
r_out = R_rear + 0.25
z_ground = -0.258

for s in range(skid_segs):
    ang1 = 2.0 * math.pi * (s / float(skid_segs))
    ang2 = 2.0 * math.pi * ((s + 1) / float(skid_segs))
    
    v1 = bm.verts.new((r_in * math.cos(ang1), r_in * math.sin(ang1), z_ground))
    v2 = bm.verts.new((r_out * math.cos(ang1), r_out * math.sin(ang1), z_ground))
    v3 = bm.verts.new((r_out * math.cos(ang2), r_out * math.sin(ang2), z_ground))
    v4 = bm.verts.new((r_in * math.cos(ang2), r_in * math.sin(ang2), z_ground))
    bm.faces.new((v1, v2, v3, v4))

skid_mesh = bpy.data.meshes.new("Donut_Skid_Marks")
bm.to_mesh(skid_mesh)
bm.free()
skid_mesh.update()

skid_obj = bpy.data.objects.new("Donut_Skid_Marks", skid_mesh)
bpy.context.scene.collection.objects.link(skid_obj)

skid_mat = bpy.data.materials.new(name="Rubber_Skid_Mat")
skid_mat.use_nodes = True
nodes = skid_mat.node_tree.nodes
principled = nodes.get("Principled BSDF")
principled.inputs["Base Color"].default_value = (0.05, 0.05, 0.05, 1.0)
principled.inputs["Roughness"].default_value = 0.98
if "Alpha" in principled.inputs:
    principled.inputs["Alpha"].default_value = 0.65
if hasattr(skid_mat, "blend_method"):
    skid_mat.blend_method = 'BLEND'
skid_obj.data.materials.append(skid_mat)

# Export Outputs
out_dir = r"C:\Users\lyftu\gemini_3\updated_html_js_0\calmchessgames_frontend\meshy_test_0\models"
os.makedirs(out_dir, exist_ok=True)

fbx_out = os.path.join(out_dir, "red_race_car_donut_animated.fbx")
glb_out = os.path.join(out_dir, "red_race_car_donut_animated.glb")

print(f"Exporting animated FBX to {fbx_out}...")
bpy.ops.export_scene.fbx(
    filepath=fbx_out,
    use_selection=False,
    bake_anim=True,
    bake_anim_use_all_bones=True,
    bake_anim_use_nla_strips=False,
    bake_anim_use_all_actions=False,
    bake_anim_step=1.0,
    bake_anim_simplify_factor=1.0
)

print(f"Exporting animated GLB to {glb_out}...")
bpy.ops.export_scene.gltf(
    filepath=glb_out,
    export_format='GLB',
    export_animations=True,
    export_current_frame=False
)

# Also update red_race_car.fbx and red_race_car.glb for direct compatibility
main_fbx = os.path.join(out_dir, "red_race_car.fbx")
main_glb = os.path.join(out_dir, "red_race_car.glb")
import shutil
shutil.copy2(fbx_out, main_fbx)
shutil.copy2(glb_out, main_glb)
print("Updated primary red_race_car.fbx and red_race_car.glb")

# Also copy into models/red_race_car/ structure required by skill
sub_model_dir = os.path.join(out_dir, "red_race_car")
sub_tex_dir = os.path.join(sub_model_dir, "red_race_car_textures")
os.makedirs(sub_tex_dir, exist_ok=True)
shutil.copy2(fbx_out, os.path.join(sub_model_dir, "red_race_car.fbx"))
shutil.copy2(glb_out, os.path.join(sub_model_dir, "red_race_car.glb"))

# Copy textures to sub_tex_dir
for item in os.listdir(out_dir):
    if item.endswith(".png") or item.endswith(".jpg"):
        shutil.copy2(os.path.join(out_dir, item), os.path.join(sub_tex_dir, item))

print("=== All generation and exports complete successfully! ===")
