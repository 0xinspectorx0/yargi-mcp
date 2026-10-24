"""Generate PWA icons for Yargı MCP Mobile"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Create image with high quality
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Outer circle / rounded rectangle background with gradient effect
    # Background: Deep navy blue (#0f172a to #1e3a8a)
    r = size // 10
    draw.rounded_rectangle([0, 0, size, size], radius=r, fill=(15, 23, 42, 255))
    
    # Inner circular glowing badge
    center = size // 2
    inner_radius = int(size * 0.42)
    draw.ellipse(
        [center - inner_radius, center - inner_radius, center + inner_radius, center + inner_radius],
        fill=(30, 58, 138, 255),
        outline=(234, 179, 8, 220), # Gold ring
        width=max(2, size // 60)
    )
    
    # Draw Scales of Justice / Balance symbol
    # Gold color: #eab308 -> (234, 179, 8)
    gold = (245, 158, 11, 255)
    gold_light = (253, 224, 71, 255)
    
    # Central pillar
    pillar_top = int(size * 0.22)
    pillar_bot = int(size * 0.72)
    beam_y = int(size * 0.35)
    stroke = max(3, size // 40)
    
    # Top finial / circle
    finial_r = max(4, size // 30)
    draw.ellipse([center - finial_r, pillar_top - finial_r, center + finial_r, pillar_top + finial_r], fill=gold_light)
    
    # Vertical pillar
    draw.line([(center, pillar_top), (center, pillar_bot)], fill=gold, width=stroke)
    
    # Base triangle/pedestal
    base_w = int(size * 0.25)
    draw.polygon([
        (center - base_w, pillar_bot + stroke * 2),
        (center + base_w, pillar_bot + stroke * 2),
        (center, pillar_bot - stroke)
    ], fill=gold)
    
    # Horizontal balance beam
    beam_half = int(size * 0.28)
    draw.line([(center - beam_half, beam_y), (center + beam_half, beam_y)], fill=gold_light, width=stroke)
    
    # Left and right pans
    pan_w = int(size * 0.14)
    pan_drop = int(size * 0.18)
    
    for side in [-1, 1]:
        anchor_x = center + (side * beam_half)
        pan_center_x = anchor_x
        pan_y = beam_y + pan_drop
        
        # Strings
        str_stroke = max(1, size // 100)
        draw.line([(anchor_x, beam_y), (pan_center_x - pan_w, pan_y)], fill=(203, 213, 225, 200), width=str_stroke)
        draw.line([(anchor_x, beam_y), (pan_center_x + pan_w, pan_y)], fill=(203, 213, 225, 200), width=str_stroke)
        
        # Pan arc
        draw.arc(
            [pan_center_x - pan_w, pan_y - stroke, pan_center_x + pan_w, pan_y + pan_w // 2],
            start=0, end=180, fill=gold, width=stroke
        )
        # Pan chord
        draw.line([(pan_center_x - pan_w, pan_y), (pan_center_x + pan_w, pan_y)], fill=gold_light, width=str_stroke)
        
    out_path = os.path.join("mobile_app", "static", "icons", filename)
    img.save(out_path, "PNG")
    print(f"Generated {out_path} ({size}x{size})")

create_icon(64, "favicon.png")
create_icon(180, "apple-touch-icon.png")
create_icon(192, "icon-192.png")
create_icon(512, "icon-512.png")
