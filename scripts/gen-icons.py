#!/usr/bin/env python3
"""Generate ShopiThread MY app icons (16/32/48/128).

Concept: shopping bag (trapezoid, Shopee) whose body is a CSV/spreadsheet
grid, wrapped by a Threads-style looping thread. Orange -> violet gradient.
"""
from PIL import Image, ImageDraw, ImageFilter
import math

S = 1024


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_gradient_bg(size):
    c1, c2 = (255, 106, 61), (124, 58, 237)  # #ff6a3d -> #7c3aed
    small = Image.new('RGB', (64, 64))
    px = small.load()
    for y in range(64):
        for x in range(64):
            t = (x + y) / (2 * 63)
            px[x, y] = lerp(c1, c2, t)
    return small.resize((size, size), Image.BILINEAR)


def rounded_trapezoid_points(l, t, r, b, taper, radius, seg=14):
    """Polygon points for a trapezoid (top edge inset by `taper` each side) with rounded corners."""
    tl, tr_, br, bl = (l + taper, t), (r - taper, t), (r, b), (l, b)

    def quad(p0, p1, p2, n=seg):
        return [((1 - i / n) ** 2 * p0[0] + 2 * (i / n) * (1 - i / n) * p1[0] + (i / n) ** 2 * p2[0],
                 (1 - i / n) ** 2 * p0[1] + 2 * (i / n) * (1 - i / n) * p1[1] + (i / n) ** 2 * p2[1])
                for i in range(n + 1)]

    def toward(p_from, p_to, dist):
        dx, dy = p_to[0] - p_from[0], p_to[1] - p_from[1]
        d = math.hypot(dx, dy)
        return (p_from[0] + dx * dist / d, p_from[1] + dy * dist / d)

    pts = []
    corners = [(tl, bl, tr_), (tr_, br, tl), (br, bl, tr_), (bl, tl, br)]
    # walk edges: tl -> tr -> br -> bl -> tl, rounding each corner
    path = [tl, tr_, br, bl, tl]
    for i in range(4):
        a, corner, nxt = path[i], path[i + 1], path[(i + 2) % 4] if i == 3 else path[i + 2]
    # simpler explicit walk
    pts = []
    seq = [tl, tr_, br, bl]
    for i in range(4):
        p_prev = seq[i - 1]
        p_corner = seq[i]
        p_next = seq[(i + 1) % 4]
        r = min(radius, math.hypot(p_corner[0] - p_prev[0], p_corner[1] - p_prev[1]) / 2.2,
                math.hypot(p_next[0] - p_corner[0], p_next[1] - p_corner[1]) / 2.2)
        start = toward(p_corner, p_prev, r)
        end = toward(p_corner, p_next, r)
        pts.extend(quad(start, p_corner, end))
    return pts


img = make_gradient_bg(S).convert('RGBA')

mask = Image.new('L', (S, S), 0)
md = ImageDraw.Draw(mask)
md.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=255)

# soft top-left glow
glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse([S * 0.05, -S * 0.25, S * 0.75, S * 0.45], fill=(255, 255, 255, 40))
glow = glow.filter(ImageFilter.GaussianBlur(60))
img = Image.alpha_composite(img, glow)
d = ImageDraw.Draw(img)

# ---- shopping bag: white rounded trapezoid ----
bag_l, bag_t, bag_r, bag_b = int(S * 0.245), int(S * 0.40), int(S * 0.755), int(S * 0.82)
taper = int(S * 0.045)
bag_pts = rounded_trapezoid_points(bag_l, bag_t, bag_r, bag_b, taper, radius=int(S * 0.06))

sh = Image.new('RGBA', (S, S), (0, 0, 0, 0))
sd = ImageDraw.Draw(sh)
sd.polygon([(x + 10, y + 18) for x, y in bag_pts], fill=(0, 0, 0, 70))
sh = sh.filter(ImageFilter.GaussianBlur(24))
img = Image.alpha_composite(img, sh)
d = ImageDraw.Draw(img)
d.polygon(bag_pts, fill=(255, 255, 255, 255))

# ---- handle: thick arc whose ends dive INTO the bag top (bag-read, not padlock) ----
hw = int(S * 0.055)
hl, ht, hr = int(S * 0.36), int(S * 0.155), int(S * 0.64)
hb = int(S * 0.46)  # ends land below the bag top edge -> attached look
d.arc([hl, ht, hr, hb], start=205, end=335, fill=(255, 255, 255, 255), width=hw)
# round caps at the handle ends
for ang in (205, 335):
    a = math.radians(ang)
    cx = (hl + hr) / 2 + math.cos(a) * (hr - hl) / 2
    cy = (ht + hb) / 2 + math.sin(a) * (hb - ht) / 2
    r = hw / 2
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255, 255))

# ---- CSV spreadsheet rows inside the bag ----
orange = (255, 106, 61, 255)
violet = (124, 58, 237, 255)
gw = int(S * 0.036)
pad_x, pad_y = int(S * 0.075), int(S * 0.09)
inner_l, inner_t = bag_l + pad_x, bag_t + pad_y
inner_r, inner_b = bag_r - pad_x, bag_b - pad_y
row_h = (inner_b - inner_t) / 3

# row separators (spreadsheet lines)
for i in (1, 2):
    y = inner_t + i * row_h
    d.line([(inner_l, y), (inner_r, y)], fill=orange, width=gw)

# data bars: one per row, varying widths/colors like CSV values
bar_h = int(S * 0.055)
bar_r = int(S * 0.024)
rows = [
    (inner_t + row_h * 0.5, 0.62, violet),
    (inner_t + row_h * 1.5, 0.46, orange),
    (inner_t + row_h * 2.5, 0.30, orange),
]
for cy, frac, color in rows:
    bx0 = inner_l
    bx1 = inner_l + (inner_r - inner_l) * frac
    d.rounded_rectangle([bx0, cy - bar_h / 2, bx1, cy + bar_h / 2], radius=bar_r, fill=color)

# ---- Threads-style looping thread (halo + violet core) ----
def bezier(pts_ctrl, steps=420):
    out = []
    for i in range(steps + 1):
        t = i / steps
        p = list(pts_ctrl)
        while len(p) > 1:
            p = [((1 - t) * p[j][0] + t * p[j + 1][0], (1 - t) * p[j][1] + t * p[j + 1][1])
                 for j in range(len(p) - 1)]
        out.append(p[0])
    return out

thread_ctrl = [
    (S * 0.085, S * 0.875),
    (S * 0.15, S * 0.72), (S * 0.56, S * 0.985), (S * 0.71, S * 0.86),
    (S * 0.815, S * 0.64), (S * 0.83, S * 0.42), (S * 0.70, S * 0.30),
    (S * 0.56, S * 0.17), (S * 0.80, S * 0.115), (S * 0.815, S * 0.26),
    (S * 0.705, S * 0.315),
]
pts = bezier(thread_ctrl)

def draw_polyline(draw, points, color, width):
    draw.line(points, fill=color, width=width, joint='curve')

draw_polyline(d, pts, (255, 255, 255, 255), int(S * 0.05))
draw_polyline(d, pts, (109, 40, 217, 255), int(S * 0.027))

ex, ey = pts[-1]
d.ellipse([ex - S * 0.034, ey - S * 0.034, ex + S * 0.034, ey + S * 0.034], fill=(255, 255, 255, 255))
d.ellipse([ex - S * 0.017, ey - S * 0.017, ex + S * 0.017, ey + S * 0.017], fill=(109, 40, 217, 255))

# ---- clip to rounded square & export ----
out = Image.composite(img, Image.new('RGBA', (S, S), (0, 0, 0, 0)), mask)

for size in (128, 48, 32, 16):
    out.resize((size, size), Image.LANCZOS).convert('RGBA').save(f'icons/icon{size}.png')
    out.resize((size, size), Image.LANCZOS).convert('RGBA').save(f'docs/icons/icon{size}.png')

out.resize((256, 256), Image.LANCZOS).save('/tmp/opencode/icon-preview-256.png')
out.resize((64, 64), Image.LANCZOS).save('/tmp/opencode/icon-preview-64.png')
print('icons written')
