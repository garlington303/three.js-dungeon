from PIL import Image
import os

INDIR = 'src/assets/enemies/draugr_frames'
THRESHOLD = 240

for fname in os.listdir(INDIR):
    if not fname.endswith('.png'):
        continue
    
    path = os.path.join(INDIR, fname)
    im = Image.open(path).convert('RGBA')
    pixels = im.load()
    
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b, a = pixels[x, y]
            if r > THRESHOLD and g > THRESHOLD and b > THRESHOLD:
                pixels[x, y] = (r, g, b, 0)
    
    im.save(path, optimize=True)
    print(f'Processed {fname}')

print('Done!')
