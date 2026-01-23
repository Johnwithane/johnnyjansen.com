import os
import base64
import json

# Configuration
# extensions to look for
IMAGE_EXTS = ('.png', '.jpg', '.jpeg')
# Output file
OUTPUT_FILE = 'assets.js'

def image_to_base64(path):
    with open(path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        # Determine mime type
        ext = os.path.splitext(path)[1].lower()
        mime = 'image/png' if ext == '.png' else 'image/jpeg'
        return f"data:{mime};base64,{encoded_string}"

assets = {}

print("Scanning for assets...")

# 1. Convert the Logo (root directory)
if os.path.exists("Wishbone_Logo.png"):
    print("Found Logo...")
    assets["Wishbone_Logo.png"] = image_to_base64("Wishbone_Logo.png")

# 2. Convert Textures (recursively in textures/ folder)
for root, dirs, files in os.walk("textures"):
    for file in files:
        if file.lower().endswith(IMAGE_EXTS):
            # Create a key that matches the path format in your JS
            # e.g., "textures/wood/wood-accoya_Color.jpg"
            file_path = os.path.join(root, file).replace("\\", "/")
            print(f"Converting {file_path}...")
            assets[file_path] = image_to_base64(file_path)

# 3. Write to JS file
js_content = f"const LOCAL_ASSETS = {json.dumps(assets, indent=4)};"

with open(OUTPUT_FILE, "w") as f:
    f.write(js_content)

print(f"\nDone! Copy the content of {OUTPUT_FILE} into your HTML file.")