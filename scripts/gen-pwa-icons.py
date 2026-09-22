import math
import os
import struct
import zlib

SIZE = 512  # default; overridden per target


def lerp(a, b, t):
    return a + (b - a) * t


def rounded_rect_dist(x, y, w, h, r):
    cx = min(max(x, r), w - r)
    cy = min(max(y, r), h - r)
    dx = x - cx
    dy = y - cy
    return math.hypot(dx, dy) - r


def sq_dist_to_segment(px, py, ax, ay, bx, by):
    abx = bx - ax
    aby = by - ay
    apx = px - ax
    apy = py - ay
    ab2 = abx * abx + aby * aby
    t = 0.0 if ab2 == 0 else max(0.0, min(1.0, (apx * abx + apy * aby) / ab2))
    dx = px - (ax + abx * t)
    dy = py - (ay + aby * t)
    return dx * dx + dy * dy


def make_frame(px, py, gradient_top, gradient_bottom, bg_alpha):
    t = py / SIZE
    cr_regular = 0.5
    cx, cy = px / SIZE, py / SIZE
    top = tuple(lerp(gradient_top[i], gradient_bottom[i], t) for i in range(3))
    return (round(top[0]), round(top[1]), round(top[2]), round(bg_alpha))


def write_png(path, pixels, width, height):
    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    def clamp8(v):
        return 0 if v < 0 else 255 if v > 255 else int(v)

    raw = b"".join(
        b"\x00"
        + b"".join(
            struct.pack("BBBB", *(clamp8(v) for v in pixels[y * width + x])) for x in range(width)
        )
        for y in range(height)
    )
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    with open(path, "wb") as f:
        f.write(png)


def render(path, maskable, size):
    global SIZE
    SIZE = size
    MASK_SAFE = 0.72
    GRAD_TOP = (147, 91, 246)
    GRAD_BOT = (88, 37, 191)

    def in_safe(px, py):
        if not maskable:
            return True
        c = SIZE / 2
        return max(abs(px - c), abs(py - c)) <= (SIZE * MASK_SAFE) / 2

    pulse = [(0.12, 0.50), (0.22, 0.50), (0.28, 0.36), (0.36, 0.62), (0.44, 0.42), (0.52, 0.58), (0.64, 0.30), (0.72, 0.58), (0.88, 0.50)]
    pts = [[x * SIZE, y * SIZE, 0.0] for x, y in pulse]

    pixels = []
    radius = SIZE // 2 if maskable else int(SIZE * 0.5)
    margin = 0 if maskable else int(SIZE * 0.02)
    half = 8 if maskable else 14
    for py in range(SIZE):
        for px in range(SIZE):
            if not maskable:
                d = rounded_rect_dist(px, py, SIZE, SIZE, radius)
                if d > 0:
                    pixels.append((0, 0, 0, 0))
                    continue
            r, g, b, a = make_frame(px, py, GRAD_TOP, GRAD_BOT, 255)
            wx, wy, ww = px + 0.5, py + 0.5, 0.0
            if in_safe(wx, wy):
                min_d = 1e18
                for i in range(len(pts) - 1):
                    dist = sq_dist_to_segment(wx, wy, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])
                    min_d = min(min_d, dist)
                if min_d < half * half:
                    ww = max(0.0, 1.0 - (math.sqrt(min_d) - half * 0.35) / (half * 0.65))
                for p in pts:
                    dd = (wx - p[0]) ** 2 + (wy - p[1]) ** 2
                    if dd < (half * 1.6) ** 2:
                        ww = max(ww, max(0.0, 1.0 - (math.sqrt(dd) - half * 0.5) / (half * 0.9)))
            if ww > 0:
                r = round(lerp(r, 255, ww))
                g = round(lerp(g, 255, ww))
                b = round(lerp(b, 255, ww))
            pixels.append((r, g, b, a))
    write_png(path, pixels, SIZE, SIZE)


def main():
    out = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
    os.makedirs(out, exist_ok=True)
    for name, maskable, size in [("icon-512.png", False, 512), ("icon-192.png", False, 192), ("maskable-512.png", True, 512)]:
        render(os.path.join(out, name), maskable, size)
        print("wrote", name)


if __name__ == "__main__":
    main()