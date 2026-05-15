"""
Generate pixel-art PNG assets for the tile-based PixiJS workspace.
All tiles are 32x32 pixels, RimWorld/sim-game style.
"""
from PIL import Image, ImageDraw

TILE = 32
ASSETS_DIR = "static/workspace/assets"


def floor_tile():
    """Stone/concrete floor tile with subtle grid lines."""
    img = Image.new("RGBA", (TILE, TILE), (45, 50, 60, 255))
    draw = ImageDraw.Draw(img)
    # Subtle texture variation
    for y in range(0, TILE, 4):
        for x in range(0, TILE, 4):
            shade = 45 + ((x * 7 + y * 13) % 10)
            draw.rectangle([x, y, x + 3, y + 3], fill=(shade, shade + 5, shade + 12, 255))
    # Grid lines (subtle)
    draw.line([(0, 0), (TILE - 1, 0)], fill=(35, 40, 48, 180), width=1)
    draw.line([(0, 0), (0, TILE - 1)], fill=(35, 40, 48, 180), width=1)
    # Highlight edge
    draw.line([(TILE - 1, 0), (TILE - 1, TILE - 1)], fill=(55, 60, 70, 100), width=1)
    draw.line([(0, TILE - 1), (TILE - 1, TILE - 1)], fill=(55, 60, 70, 100), width=1)
    img.save(f"{ASSETS_DIR}/floor.png")


def wall_tile():
    """Dark brick/concrete wall block."""
    img = Image.new("RGBA", (TILE, TILE), (60, 65, 80, 255))
    draw = ImageDraw.Draw(img)
    # Brick pattern
    brick_h = 8
    brick_w = 16
    for row in range(TILE // brick_h):
        offset = (row % 2) * (brick_w // 2)
        for col in range(-1, TILE // brick_w + 1):
            x = col * brick_w + offset
            y = row * brick_h
            # Brick body
            shade = 55 + ((row * 3 + col * 7) % 15)
            draw.rectangle([x + 1, y + 1, x + brick_w - 2, y + brick_h - 2],
                           fill=(shade, shade + 5, shade + 15, 255))
            # Mortar lines
            draw.line([(x, y), (x + brick_w, y)], fill=(40, 42, 50, 255), width=1)
            draw.line([(x, y), (x, y + brick_h)], fill=(40, 42, 50, 255), width=1)
    # Top highlight
    draw.line([(0, 0), (TILE - 1, 0)], fill=(80, 85, 100, 200), width=1)
    # Shadow at bottom
    draw.line([(0, TILE - 1), (TILE - 1, TILE - 1)], fill=(30, 32, 40, 200), width=1)
    img.save(f"{ASSETS_DIR}/wall.png")


def desk_tile():
    """Wooden desk with monitor, top-down view."""
    img = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Desk surface (wood brown)
    draw.rectangle([2, 4, 29, 27], fill=(100, 70, 40, 255))
    draw.rectangle([3, 5, 28, 26], fill=(120, 85, 50, 255))
    # Wood grain lines
    for i in range(5, 26, 4):
        draw.line([(4, i), (27, i)], fill=(105, 75, 42, 180), width=1)
    # Monitor (dark rectangle)
    draw.rectangle([8, 7, 23, 16], fill=(20, 22, 35, 255))
    # Screen glow
    draw.rectangle([9, 8, 22, 15], fill=(40, 80, 120, 255))
    # Keyboard
    draw.rectangle([10, 19, 22, 23], fill=(50, 52, 60, 255))
    img.save(f"{ASSETS_DIR}/desk.png")


def chair_tile():
    """Office chair, top-down view."""
    img = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Chair base (dark circle)
    draw.ellipse([6, 6, 25, 25], fill=(40, 45, 70, 255))
    # Seat cushion
    draw.ellipse([8, 8, 23, 23], fill=(55, 60, 90, 255))
    # Center detail
    draw.ellipse([12, 12, 19, 19], fill=(65, 70, 105, 255))
    # Armrests
    draw.rectangle([4, 13, 7, 18], fill=(35, 38, 55, 255))
    draw.rectangle([24, 13, 27, 18], fill=(35, 38, 55, 255))
    img.save(f"{ASSETS_DIR}/chair.png")


def table_tile():
    """Meeting table, top-down view (larger, round-ish)."""
    img = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Table surface (rounded rectangle)
    draw.rounded_rectangle([2, 2, 29, 29], radius=6, fill=(70, 55, 35, 255))
    draw.rounded_rectangle([4, 4, 27, 27], radius=5, fill=(90, 70, 45, 255))
    # Surface detail
    draw.rounded_rectangle([6, 6, 25, 25], radius=4, fill=(100, 80, 50, 255))
    # Center highlight
    draw.ellipse([12, 12, 19, 19], fill=(110, 88, 55, 200))
    img.save(f"{ASSETS_DIR}/table.png")


def sofa_tile():
    """Couch/sofa, top-down view."""
    img = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Sofa back
    draw.rounded_rectangle([2, 2, 29, 10], radius=3, fill=(100, 40, 60, 255))
    # Seat cushions
    draw.rounded_rectangle([3, 10, 15, 28], radius=3, fill=(130, 55, 80, 255))
    draw.rounded_rectangle([16, 10, 28, 28], radius=3, fill=(125, 50, 75, 255))
    # Armrests
    draw.rounded_rectangle([1, 4, 4, 28], radius=2, fill=(85, 35, 50, 255))
    draw.rounded_rectangle([27, 4, 30, 28], radius=2, fill=(85, 35, 50, 255))
    # Cushion detail
    draw.line([(9, 12), (9, 26)], fill=(110, 45, 65, 150), width=1)
    draw.line([(22, 12), (22, 26)], fill=(110, 45, 65, 150), width=1)
    img.save(f"{ASSETS_DIR}/sofa.png")


def agent_tile():
    """Character sprite, top-down RPG style."""
    img = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Shadow
    draw.ellipse([8, 26, 23, 31], fill=(0, 0, 0, 60))
    # Body (shirt)
    draw.rounded_rectangle([10, 14, 21, 27], radius=3, fill=(0, 180, 160, 255))
    # Arms
    draw.rectangle([7, 16, 10, 24], fill=(0, 160, 140, 255))
    draw.rectangle([21, 16, 24, 24], fill=(0, 160, 140, 255))
    # Head
    draw.ellipse([11, 3, 20, 14], fill=(220, 185, 150, 255))
    # Hair
    draw.ellipse([10, 2, 21, 9], fill=(60, 40, 25, 255))
    # Eyes
    draw.rectangle([13, 8, 14, 10], fill=(30, 30, 40, 255))
    draw.rectangle([17, 8, 18, 10], fill=(30, 30, 40, 255))
    # Legs
    draw.rectangle([11, 27, 14, 31], fill=(50, 50, 70, 255))
    draw.rectangle([17, 27, 20, 31], fill=(50, 50, 70, 255))
    img.save(f"{ASSETS_DIR}/agent.png")


if __name__ == "__main__":
    floor_tile()
    wall_tile()
    desk_tile()
    chair_tile()
    table_tile()
    sofa_tile()
    agent_tile()
    print("All assets generated in", ASSETS_DIR)
