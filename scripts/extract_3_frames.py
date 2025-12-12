from PIL import Image
import sys
import os

INPUT = sys.argv[1] if len(sys.argv) > 1 else 'src/assets/resources/hands/hand_spritesheet.png'
OUTDIR = sys.argv[2] if len(sys.argv) > 2 else 'src/assets/resources/hands/frames'
COLUMNS = 3
ROWS = 1

os.makedirs(OUTDIR, exist_ok=True)

im = Image.open(INPUT).convert('RGBA')
W, H = im.size
fw = W // COLUMNS
fh = H // ROWS

frame = 0
for row in range(ROWS):
    for col in range(COLUMNS):
        left = col * fw
        upper = row * fh
        right = left + fw
        lower = upper + fh
        crop = im.crop((left, upper, right, lower))
        out_path = os.path.join(OUTDIR, f'frame_{frame:02d}.png')
        crop.save(out_path)
        print(f'Extracted frame {frame} to {out_path}')
        frame += 1

print(f'\nDone. Extracted {frame} frames.')
