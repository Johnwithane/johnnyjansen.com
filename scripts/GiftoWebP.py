import os
import subprocess
import json

def get_video_dimensions(file_path):
    """
    Get the dimensions of a video/image file using ffprobe.
    
    :param file_path: Path to the input file
    :return: Tuple of (width, height) or None if failed
    """
    try:
        result = subprocess.run([
            'ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_streams', file_path
        ], capture_output=True, text=True, check=True)
        
        data = json.loads(result.stdout)
        for stream in data['streams']:
            if stream['codec_type'] == 'video':
                return int(stream['width']), int(stream['height'])
        return None
    except (subprocess.CalledProcessError, json.JSONDecodeError, KeyError):
        return None

def calculate_resize_dimensions(original_width, original_height, max_width, max_height):
    """
    Calculate new dimensions while maintaining aspect ratio.
    
    :param original_width: Original width
    :param original_height: Original height
    :param max_width: Maximum allowed width
    :param max_height: Maximum allowed height
    :return: Tuple of (new_width, new_height)
    """
    # Calculate the scaling factor for both dimensions
    width_scale = max_width / original_width
    height_scale = max_height / original_height
    
    # Use the smaller scale to ensure we don't exceed either limit
    scale = min(width_scale, height_scale)
    
    # Calculate new dimensions
    new_width = int(original_width * scale)
    new_height = int(original_height * scale)
    
    # Ensure dimensions are even (some codecs prefer this)
    new_width = new_width if new_width % 2 == 0 else new_width - 1
    new_height = new_height if new_height % 2 == 0 else new_height - 1
    
    return new_width, new_height

def convert_files_to_webp(folder_path, file_extension, quality=75, max_width=None, max_height=None, fps=None):
    """
    Convert all specified files in a folder (including subfolders) to WEBP format.

    :param folder_path: Path to the root folder.
    :param file_extension: File extension to convert (e.g., '.gif', '.mp4', etc.).
    :param quality: Quality setting (0-100, where 0 is lowest quality/highest compression)
    :param max_width: Maximum width (optional)
    :param max_height: Maximum height (optional)
    :param fps: Target frame rate (optional)
    """
    for root, _, files in os.walk(folder_path):
        for file in files:
            if file.lower().endswith(file_extension):
                input_path = os.path.join(root, file)
                
                # Create the new file name with a suffix to ensure uniqueness
                base_name = os.path.splitext(file)[0]
                if len(base_name) > 50:
                    shortened_name = base_name[:40] + '...' + base_name[-10:]
                else:
                    shortened_name = base_name
                webp_path = os.path.join(root, shortened_name + '.webp')

                try:
                    # Build FFmpeg command
                    cmd = ['ffmpeg', '-i', input_path]
                    
                    # Build video filter chain
                    filters = []
                    
                    # Add resize filter if dimensions are specified
                    if max_width or max_height:
                        dimensions = get_video_dimensions(input_path)
                        if dimensions:
                            orig_width, orig_height = dimensions
                            
                            # Use original dimensions if no limits specified
                            target_max_width = max_width if max_width else orig_width
                            target_max_height = max_height if max_height else orig_height
                            
                            new_width, new_height = calculate_resize_dimensions(
                                orig_width, orig_height, target_max_width, target_max_height
                            )
                            
                            print(f"Resizing {orig_width}x{orig_height} -> {new_width}x{new_height}")
                            filters.append(f'scale={new_width}:{new_height}')
                    
                    # Add frame rate filter if specified
                    if fps:
                        filters.append(f'fps={fps}')
                        print(f"Setting frame rate to {fps} fps")
                    
                    # Apply filters if any
                    if filters:
                        cmd.extend(['-vf', ','.join(filters)])
                    
                    # Add WebP encoding options
                    cmd.extend([
                        '-c:v', 'libwebp',
                        '-lossless', '0',  # Enable lossy compression
                        '-q:v', str(quality),  # Quality setting
                        '-loop', '0',  # Loop infinitely for animated content
                        '-y',  # Overwrite output file
                        webp_path
                    ])
                    
                    # Run FFmpeg command
                    subprocess.run(cmd, check=True)
                    print(f"Converted: {input_path} -> {webp_path}")
                    
                except FileNotFoundError:
                    print("Error: FFmpeg is not installed or not found in the system PATH.")
                    return
                except subprocess.CalledProcessError as e:
                    print(f"Error converting {input_path}: {e}")

def get_user_settings():
    """
    Get compression and sizing settings from the user.
    
    :return: Dictionary with user settings
    """
    settings = {}
    
    # Quality setting
    print("\n=== COMPRESSION SETTINGS ===")
    print("Quality levels (lower = more compressed):")
    print("10-30: High compression (small files, lower quality)")
    print("40-60: Medium compression (balanced)")
    print("70-90: Low compression (larger files, higher quality)")
    
    while True:
        try:
            quality = int(input("Enter quality (0-100, default 75): ").strip() or "75")
            if 0 <= quality <= 100:
                settings['quality'] = quality
                break
            else:
                print("Please enter a number between 0 and 100.")
        except ValueError:
            print("Please enter a valid number.")
    
    # Resize settings
    print("\n=== RESIZE SETTINGS ===")
    resize_choice = input("Do you want to resize images/videos? (y/n, default n): ").strip().lower()
    
    if resize_choice == 'y':
        print("Leave empty to not limit that dimension.")
        
        while True:
            max_width_input = input("Maximum width (pixels): ").strip()
            if not max_width_input:
                settings['max_width'] = None
                break
            try:
                settings['max_width'] = int(max_width_input)
                break
            except ValueError:
                print("Please enter a valid number or leave empty.")
        
        while True:
            max_height_input = input("Maximum height (pixels): ").strip()
            if not max_height_input:
                settings['max_height'] = None
                break
            try:
                settings['max_height'] = int(max_height_input)
                break
            except ValueError:
                print("Please enter a valid number or leave empty.")
    else:
        settings['max_width'] = None
        settings['max_height'] = None
    
    # Frame rate settings
    print("\n=== FRAME RATE SETTINGS ===")
    fps_choice = input("Do you want to set a specific frame rate? (y/n, default n): ").strip().lower()
    
    if fps_choice == 'y':
        print("Common frame rates: 12 (smooth animation), 15 (good balance), 24 (cinematic), 30 (standard)")
        while True:
            fps_input = input("Target frame rate (fps, leave empty for original): ").strip()
            if not fps_input:
                settings['fps'] = None
                break
            try:
                fps_value = float(fps_input)
                if fps_value > 0:
                    settings['fps'] = fps_value
                    break
                else:
                    print("Please enter a positive number.")
            except ValueError:
                print("Please enter a valid number or leave empty.")
    
    return settings

if __name__ == "__main__":
    # Hardcoded folder path
    folder_to_process = "C:/Users/Johnny/johnnyjansen.com/scripts/source"

    # Prompt the user for the file format
    print("Select the file format to convert:")
    print("1. GIF")
    print("2. MP4")
    print("3. WEBP")
    print("4. MOV")
    print("5. AVI")

    choice = input("Enter the number corresponding to your choice: ").strip()
    file_extension_map = {
        "1": ".gif",
        "2": ".mp4",
        "3": ".webp",
        "4": ".mov",
        "5": ".avi"
    }

    if choice in file_extension_map:
        file_extension = file_extension_map[choice]
        if os.path.isdir(folder_to_process):
            # Get user settings for compression and resizing
            settings = get_user_settings()
            
            print(f"=== CONVERSION SUMMARY ===")
            print(f"Format: {file_extension}")
            print(f"Quality: {settings['quality']}")
            print(f"Max width: {settings['max_width'] or 'No limit'}")
            print(f"Max height: {settings['max_height'] or 'No limit'}")
            print(f"Frame rate: {settings['fps'] or 'Original'} fps")
            
            confirm = input("\nProceed with conversion? (y/n): ").strip().lower()
            if confirm == 'y':
                convert_files_to_webp(
                    folder_to_process, 
                    file_extension,
                    quality=settings['quality'],
                    max_width=settings['max_width'],
                    max_height=settings['max_height'],
                    fps=settings['fps']
                )
            else:
                print("Conversion cancelled.")
        else:
            print(f"Error: The path '{folder_to_process}' is not a valid directory.")
    else:
        print("Invalid choice. Please select a valid number.")