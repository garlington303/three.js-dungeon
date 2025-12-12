from PIL import Image
import sys
import os

INPUT = sys.argv[1] if len(sys.argv) > 1 else 'src/assets/enemies/draugr_attack.png'
OUTDIR = sys.argv[2] if len(sys.argv) > 2 else 'src/assets/enemies/draugr_frames'
COLUMNS = 4
ROWS = 4
FUZZ = 30  # color distance threshold (0-255)

os.makedirs(OUTDIR, exist_ok=True)

im = Image.open(INPUT).convert('RGBA')
W, H = im.size
fw = W // COLUMNS
fh = H // ROWS

def is_near_white(r,g,b,th=FUZZ):
    return (255 - r) <= th and (255 - g) <= th and (255 - b) <= th

frame = 0
for row in range(ROWS):
    for col in range(COLUMNS):
        left = col * fw
        upper = row * fh
        right = left + fw
        lower = upper + fh
        crop = im.crop((left, upper, right, lower))
        pixels = crop.load()
        for y in range(crop.size[1]):
            for x in range(crop.size[0]):
                r,g,b,a = pixels[x,y]
                if is_near_white(r,g,b):
                    pixels[x,y] = (r,g,b,0)
        out_path = os.path.join(OUTDIR, f'frame_{frame:02d}.png')
        crop.save(out_path)
        print('Wrote', out_path)
        frame += 1

print('Done. Wrote', frame, 'frames.')
