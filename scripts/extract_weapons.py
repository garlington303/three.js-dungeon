#!/usr/bin/env python3
"""
Extract weapon sprites from Ashes 2063 pk3 file and create spritesheets.
Focuses on firing and reload animations for melee and pistol weapons.
"""

import zipfile
import os
import json
import re
from PIL import Image
from pathlib import Path

# Configuration
PK3_PATH = r"D:\Games (D)\gzDOOM\AshesStandalone\Resources\Ashes2063Enriched2_23.pk3"
OUTPUT_BASE = Path(__file__).parent.parent / "src" / "assets" / "weapons"

def natural_sort_key(filename):
    """Sort filenames naturally (e.g., PISTOL1, PISTOL2, ... PISTOL10, PISTOL11)."""
    parts = re.split(r'(\d+)', filename)
    return [int(p) if p.isdigit() else p.lower() for p in parts]

# Weapons to extract - organized by animation type
WEAPONS = {
    "crowbar": {
        "sources": ["Graphics/crowbar/"],
        "prefix_filter": "PUNG",  # Crowbar attack frames
        "spritesheet_name": "crowbar_attack.png"
    },
    "knife": {
        "sources": ["Graphics/Shiv/"],
        "prefix_filter": None,
        "spritesheet_name": "knife_attack.png"
    },
    "hammer": {
        "sources": ["Graphics/Hammer/"],
        "prefix_filter": "hamm",
        "spritesheet_name": "hammer_attack.png"
    },
    "glock": {
        "sources": ["Graphics/Glock/"],
        "prefix_filter": "glock",  # Main glock frames only
        "spritesheet_name": "glock_fire.png"
    },
    "pistol": {
        "sources": ["Graphics/PISTOL"],
        "prefix_filter": "PISTOL",
        "spritesheet_name": "pistol_fire.png"
    }
}


def extract_frames(pk3_path: str, weapon_config: dict, weapon_name: str, output_dir: Path):
    """Extract individual frames from pk3 for a weapon type."""
    frames_dir = output_dir / weapon_name / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)
    
    extracted_files = []
    
    with zipfile.ZipFile(pk3_path, 'r') as z:
        for source in weapon_config["sources"]:
            for entry in z.namelist():
                # Check if this entry matches our source pattern
                if entry.startswith(source) and entry.lower().endswith('.png'):
                    # Extract the file
                    filename = os.path.basename(entry)
                    if not filename:  # Skip directories
                        continue
                    
                    # Read the image data
                    img_data = z.read(entry)
                    output_path = frames_dir / filename
                    
                    # Write to output
                    with open(output_path, 'wb') as f:
                        f.write(img_data)
                    
                    extracted_files.append({
                        "source": entry,
                        "output": str(output_path),
                        "filename": filename
                    })
                    print(f"  Extracted: {filename}")
    
    return extracted_files


def create_spritesheet(frames_dir: Path, output_path: Path, weapon_name: str, prefix_filter: str = None):
    """Create a horizontal spritesheet from individual frames."""
    # Get all PNG files and sort them naturally (numeric order)
    frame_files = sorted(frames_dir.glob("*.png"), key=lambda x: natural_sort_key(x.name))
    
    # Apply prefix filter if specified
    if prefix_filter:
        frame_files = [f for f in frame_files if f.name.lower().startswith(prefix_filter.lower())]
    
    if not frame_files:
        print(f"  No frames found in {frames_dir}")
        return None
    
    # Load all frames
    frames = []
    for f in frame_files:
        try:
            img = Image.open(f)
            # Ensure RGBA mode for transparency
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            frames.append((f.name, img))
            print(f"  Loaded: {f.name} ({img.size})")
        except Exception as e:
            print(f"  Error loading {f.name}: {e}")
    
    if not frames:
        return None
    
    # Find max dimensions
    max_width = max(img.size[0] for _, img in frames)
    max_height = max(img.size[1] for _, img in frames)
    
    # Create spritesheet (horizontal strip)
    sheet_width = max_width * len(frames)
    sheet_height = max_height
    
    spritesheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    # Paste frames
    metadata = {
        "weapon": weapon_name,
        "frameCount": len(frames),
        "frameWidth": max_width,
        "frameHeight": max_height,
        "sheetWidth": sheet_width,
        "sheetHeight": sheet_height,
        "frames": []
    }
    
    x_offset = 0
    for i, (filename, img) in enumerate(frames):
        # Center the image in its cell if smaller than max
        paste_x = x_offset + (max_width - img.size[0]) // 2
        paste_y = (max_height - img.size[1]) // 2
        
        spritesheet.paste(img, (paste_x, paste_y))
        
        metadata["frames"].append({
            "index": i,
            "filename": filename,
            "x": x_offset,
            "y": 0,
            "width": max_width,
            "height": max_height,
            "originalWidth": img.size[0],
            "originalHeight": img.size[1]
        })
        
        x_offset += max_width
    
    # Save spritesheet
    spritesheet.save(output_path, 'PNG')
    print(f"  Created spritesheet: {output_path} ({sheet_width}x{sheet_height})")
    
    return metadata


def main():
    print("=" * 60)
    print("Weapon Sprite Extractor for Three.js Dungeon")
    print("=" * 60)
    print(f"\nSource: {PK3_PATH}")
    print(f"Output: {OUTPUT_BASE}\n")
    
    # Create output directory
    OUTPUT_BASE.mkdir(parents=True, exist_ok=True)
    
    all_metadata = {}
    
    for weapon_name, config in WEAPONS.items():
        print(f"\n{'=' * 40}")
        print(f"Processing: {weapon_name.upper()}")
        print('=' * 40)
        
        # Extract frames
        print("\nExtracting frames...")
        extracted = extract_frames(PK3_PATH, config, weapon_name, OUTPUT_BASE)
        print(f"  Total extracted: {len(extracted)} files")
        
        # Create spritesheet
        print("\nCreating spritesheet...")
        frames_dir = OUTPUT_BASE / weapon_name / "frames"
        spritesheet_path = OUTPUT_BASE / weapon_name / config["spritesheet_name"]
        
        metadata = create_spritesheet(frames_dir, spritesheet_path, weapon_name, config.get("prefix_filter"))
        
        if metadata:
            all_metadata[weapon_name] = metadata
    
    # Save combined metadata
    metadata_path = OUTPUT_BASE / "weapon_metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(all_metadata, f, indent=2)
    print(f"\n\nSaved metadata to: {metadata_path}")
    
    print("\n" + "=" * 60)
    print("EXTRACTION COMPLETE!")
    print("=" * 60)
    print(f"\nFiles saved to: {OUTPUT_BASE}")
    print("\nSpritesheets created:")
    for weapon_name, meta in all_metadata.items():
        print(f"  - {weapon_name}: {meta['frameCount']} frames, {meta['sheetWidth']}x{meta['sheetHeight']}px")


if __name__ == "__main__":
    main()
