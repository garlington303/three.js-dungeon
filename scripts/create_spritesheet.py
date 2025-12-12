from PIL import Image
import os

FRAMES_DIR = 'src/assets/enemies/draugr_frames'
OUTPUT = 'src/assets/enemies/draugr_attack.png'
COLS = 4
ROWS = 4

# Load all frame files in order
frame_files = sorted([f for f in os.listdir(FRAMES_DIR) if f.startswith('frame_') and f.endswith('.png')])
frames = [Image.open(os.path.join(FRAMES_DIR, f)).convert('RGBA') for f in frame_files[:16]]

if not frames:
    print('No frames found!')
    exit(1)

# Get dimensions from first frame
frame_width, frame_height = frames[0].size
print(f'Frame size: {frame_width}x{frame_height}')

# Create output spritesheet
sheet_width = frame_width * COLS
sheet_height = frame_height * ROWS
spritesheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))

# Paste frames into grid
for idx, frame in enumerate(frames):
    col = idx % COLS
    row = idx // COLS
    x = col * frame_width
    y = row * frame_height
    spritesheet.paste(frame, (x, y))
    print(f'Pasted frame {idx:02d} at ({x}, {y})')

# Save spritesheet
spritesheet.save(OUTPUT, optimize=True)
print(f'\nSaved spritesheet to {OUTPUT}')
print(f'Spritesheet size: {sheet_width}x{sheet_height}')
print(f'Grid: {COLS}x{ROWS} = {len(frames)} frames')
