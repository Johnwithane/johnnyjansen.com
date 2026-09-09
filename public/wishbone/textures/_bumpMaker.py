import os
import sys
from PIL import Image, ImageEnhance

# --- CONFIGURATION ---
CONTRAST_FACTOR = 5.0 
# ---------------------

def create_bump_maps_in_folder():
    # FIXED: This now finds the path where this script file actually lives
    # instead of where the terminal is currently pointing.
    folder_path = os.path.dirname(os.path.abspath(__file__))
    
    files = os.listdir(folder_path)
    
    count = 0
    print(f"Scanning folder: {folder_path}...")

    for filename in files:
        if filename.lower().endswith(".jpg") or filename.lower().endswith(".jpeg"):
            
            if "_BUMP" not in filename:
                
                try:
                    name_part, ext_part = os.path.splitext(filename)
                    output_filename = f"{name_part}_BUMP{ext_part}"
                    
                    input_path = os.path.join(folder_path, filename)
                    output_path = os.path.join(folder_path, output_filename)
                    
                    img = Image.open(input_path)
                    gray_img = img.convert("L")
                    
                    enhancer = ImageEnhance.Contrast(gray_img)
                    bump_map = enhancer.enhance(CONTRAST_FACTOR)
                    
                    bump_map.save(output_path)
                    print(f"[OK] Created: {output_filename}")
                    count += 1
                    
                except Exception as e:
                    print(f"[ERROR] Could not process {filename}: {e}")

    print(f"\nDone! Processed {count} images.")

if __name__ == "__main__":
    create_bump_maps_in_folder()