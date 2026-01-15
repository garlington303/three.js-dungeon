"""
Create horizontal spritesheet for pistol weapon from individual frames.
Processes PISTOL1.png through PISTOL9.png (9 frames total) for fire + reload animation.
"""
from PIL import Image
import os
import json

FRAMES_DIR = 'src/assets/weapons/pistol/frames'
OUTPUT_IMAGE = 'src/assets/weapons/pistol/pistol_fire.png'
OUTPUT_METADATA = 'src/assets/weapons/pistol/pistol_metadata.json'

# Get pistol frames (PISTOL1 through PISTOL9 based on attached images)
frame_files = [f'PISTOL{i}.png' for i in range(1, 10)]
frames = []

print('Loading frames...')
for filename in frame_files:
    path = os.path.join(FRAMES_DIR, filename)
    if os.path.exists(path):
        img = Image.open(path).convert('RGBA')
        frames.append(img)
        print(f'  Loaded {filename}: {img.size[0]}x{img.size[1]}')
    else:
        print(f'  Warning: {filename} not found, skipping')

if not frames:
    print('ERROR: No frames found!')
    exit(1)

print(f'\nTotal frames loaded: {len(frames)}')

# Find max dimensions to ensure all frames fit
max_width = max(f.width for f in frames)
max_height = max(f.height for f in frames)
print(f'Max frame dimensions: {max_width}x{max_height}')

# Create horizontal strip spritesheet
sheet_width = max_width * len(frames)
sheet_height = max_height
spritesheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))

print('\nCreating spritesheet...')
metadata = {
    'weapon': 'pistol',
    'frameCount': len(frames),
    'frameWidth': max_width,
    'frameHeight': max_height,
    'sheetWidth': sheet_width,
    'sheetHeight': sheet_height,
    'frames': []
}

# Paste frames horizontally, centered vertically if different heights
for idx, frame in enumerate(frames):
    x = idx * max_width
    # Center frame vertically within the cell
    y = (max_height - frame.height) // 2
    
    # Paste with transparency preserved
    spritesheet.paste(frame, (x, y), frame)
    
    metadata['frames'].append({
        'index': idx,
        'filename': frame_files[idx],
        'x': x,
        'y': y,
        'width': max_width,
        'height': max_height,
        'originalWidth': frame.width,
        'originalHeight': frame.height
    })
    
    print(f'  Frame {idx}: {frame_files[idx]} at ({x}, {y})')

# Save spritesheet
print(f'\nSaving spritesheet to {OUTPUT_IMAGE}...')
spritesheet.save(OUTPUT_IMAGE, 'PNG', optimize=True)
print(f'Spritesheet saved: {sheet_width}x{sheet_height} ({len(frames)} frames)')

# Save metadata
print(f'Saving metadata to {OUTPUT_METADATA}...')
with open(OUTPUT_METADATA, 'w') as f:
    json.dump(metadata, f, indent=2)
print('Metadata saved.')

print(f'\n✓ Success! Created {len(frames)}-frame horizontal spritesheet.')
print(f'  Image: {OUTPUT_IMAGE}')
print(f'  Metadata: {OUTPUT_METADATA}')
