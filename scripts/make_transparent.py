"""
Remove white backgrounds from PNG files and make them transparent.

Usage:
    python scripts/make_transparent.py <input.png>
    python scripts/make_transparent.py <input.png> <output.png>
    python scripts/make_transparent.py <input.png> --threshold 240
"""
from PIL import Image
import sys
import os

def remove_white_background(input_path, output_path=None, threshold=240):
    """
    Remove white/near-white pixels and make them transparent.
    
    Args:
        input_path: Path to input PNG file
        output_path: Path to output PNG file (defaults to overwriting input)
        threshold: RGB value threshold (0-255) for considering a pixel "white"
    """
    if not os.path.exists(input_path):
        print(f'Error: File not found: {input_path}')
        return False
    
    print(f'Processing {input_path}...')
    
    # Load image and convert to RGBA
    im = Image.open(input_path).convert('RGBA')
    pixels = im.load()
    width, height = im.size
    
    # Count transparent pixels
    transparent_count = 0
    
    # Process each pixel
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # If pixel is near-white, make it transparent
            if r > threshold and g > threshold and b > threshold:
                pixels[x, y] = (r, g, b, 0)
                transparent_count += 1
    
    # Save result
    output_path = output_path or input_path
    im.save(output_path, optimize=True)
    
    total_pixels = width * height
    percent = (transparent_count / total_pixels) * 100
    
    print(f'✓ Done! Made {transparent_count:,} pixels transparent ({percent:.1f}%)')
    print(f'✓ Saved to: {output_path}')
    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = None
    threshold = 240
    
    # Parse optional arguments
    if len(sys.argv) > 2:
        if sys.argv[2] == '--threshold':
            threshold = int(sys.argv[3]) if len(sys.argv) > 3 else 240
        elif not sys.argv[2].startswith('--'):
            output_path = sys.argv[2]
    
    if len(sys.argv) > 3 and sys.argv[2] != '--threshold':
        if sys.argv[3] == '--threshold':
            threshold = int(sys.argv[4]) if len(sys.argv) > 4 else 240
    
    success = remove_white_background(input_path, output_path, threshold)
    sys.exit(0 if success else 1)
