import os
import base64
import json

# Configuration
IMAGE_EXTS = ('.png', '.jpg', '.jpeg', '.webp')
OUTPUT_FILENAME = 'assets.js'

def image_to_base64(path):
    try:
        with open(path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            ext = os.path.splitext(path)[1].lower()
            mime = 'image/png' if ext == '.png' else 'image/jpeg'
            return f"data:{mime};base64,{encoded_string}"
    except Exception as e:
        print(f"Error converting {path}: {e}")
        return None

assets = {}

# 1. GET SCRIPT LOCATION
# This ensures we look in 'wishbone/' regardless of where you run the command from
base_dir = os.path.dirname(os.path.abspath(__file__))
textures_dir = os.path.join(base_dir, "textures")
logo_path = os.path.join(base_dir, "Wishbone_Logo.png")
output_path = os.path.join(base_dir, OUTPUT_FILENAME)

print(f"Script location: {base_dir}")
print(f"Scanning for textures in: {textures_dir}...")

# 2. Convert the Logo
if os.path.exists(logo_path):
    print("Found Logo...")
    # We store the key as just the filename to match your HTML
    assets["Wishbone_Logo.png"] = image_to_base64(logo_path)
else:
    print(f"[WARNING] Logo not found at {logo_path}")

# 3. Convert Textures
count = 0
if os.path.exists(textures_dir):
    for root, dirs, files in os.walk(textures_dir):
        for file in files:
            if file.lower().endswith(IMAGE_EXTS):
                full_path = os.path.join(root, file)
                
                # Create the relative path key for JS (e.g., "textures/wood/wood-accoya_Color.jpg")
                # We calculate this relative to the 'wishbone' folder
                rel_path = os.path.relpath(full_path, base_dir).replace("\\", "/")
                
                print(f"Converting {rel_path}...")
                b64 = image_to_base64(full_path)
                if b64:
                    assets[rel_path] = b64
                    count += 1
else:
    print(f"[ERROR] Textures folder not found at {textures_dir}")

# 4. Write to JS file
if count > 0:
    js_content = f"const LOCAL_ASSETS = {json.dumps(assets, indent=4)};"
    
    with open(output_path, "w") as f:
        f.write(js_content)
    
    print(f"\nSUCCESS! Encoded {count} files.")
    print(f"File saved to: {output_path}")
else:
    print("\nNo files were encoded. Check paths.")