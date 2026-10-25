#!/usr/bin/env python3
"""Side-by-side comparison: one reference panel from vision_rev02 next to one or more renders.

Why this exists: vision_rev02 is ONE sheet with eight panels. A reviewer (human or agent) needs a
single image that shows the reference panel and the render at the same width, so that visual
deviations can be named concretely instead of being judged from memory or from assertions.

Needs only Pillow (pip install pillow). No network, no API calls, nothing is sent anywhere.

Examples (run from the repo root; works the same in PowerShell/CMD):
  python tools/visual-check/compare_panel.py --list
  python tools/visual-check/compare_panel.py --panel 7 --render path/to/library-Nemo-375.png
  python tools/visual-check/compare_panel.py --panel 7 --render before.png --render after.png --label before --label after
  python tools/visual-check/compare_panel.py --panel 1 --render home-default-375.png --trim-top 32
  python tools/visual-check/compare_panel.py --dump-panels docs/design/reference-panels
"""
import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]

# Panel frames measured on the original 1214x1295 sheet (x0, x1) per column and (y0, y1) per row.
# They are stored in sheet pixels and rescaled, so a higher-resolution export of the same sheet works.
BASE_SIZE = (1214, 1295)
COLS = [(8, 303), (315, 606), (617, 909), (920, 1209)]
ROWS = [(9, 745), (766, 1292)]
INSET = 3  # cut the thin phone-frame edge and neighbouring pixels

# Reading order: top row 1-4, bottom row 5-8 (same numbering as docs/design/vision-rev02-screen-contracts.md).
PANEL_NAMES = {
    1: "Hem", 2: "Utveckling", 3: "Dagens framsteg", 4: "Daglig checklista",
    5: "Logga", 6: "Träning", 7: "Kunskap", 8: "Insikter",
}

GUIDE_COLOR = (230, 0, 110)
PAD = 16
HEADER_H = 52
FOOTER_H = 56


def find_reference(explicit):
    if explicit:
        path = Path(explicit)
    else:
        candidates = [ROOT / "vision_rev02.jpg", ROOT / "vision_rev02.png"]
        path = next((p for p in candidates if p.exists()), candidates[0])
    if not path.exists():
        raise SystemExit(f"Hittar inte referensbilden: {path}")
    return path


def open_rgb(path):
    """Open an image and flatten any transparency onto white."""
    path = Path(path)
    if not path.exists():
        raise SystemExit(f"Hittar inte bilden: {path}")
    img = Image.open(path)
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        flat = Image.new("RGB", img.size, (255, 255, 255))
        flat.paste(img, mask=img.getchannel("A"))
        return flat
    return img.convert("RGB")


def panel_box(number, sheet_size):
    if number not in PANEL_NAMES:
        raise SystemExit("Panelnummer måste vara 1-8.")
    col, row = (number - 1) % 4, (number - 1) // 4
    sx, sy = sheet_size[0] / BASE_SIZE[0], sheet_size[1] / BASE_SIZE[1]
    x0, x1 = COLS[col]
    y0, y1 = ROWS[row]
    return (round((x0 + INSET) * sx), round((y0 + INSET) * sy),
            round((x1 - INSET) * sx), round((y1 - INSET) * sy))


def warn_if_sheet_differs(sheet_size):
    base_ratio = BASE_SIZE[0] / BASE_SIZE[1]
    if abs(sheet_size[0] / sheet_size[1] - base_ratio) / base_ratio > 0.02:
        print("Varning: referensarkets proportioner skiljer sig från det uppmätta arket. "
              "Kontrollera beskärningen eller ange --box x0,y0,x1,y1.")


def load_font(size):
    for name in ("DejaVuSans.ttf", "arial.ttf", "segoeui.ttf", "Arial.ttf",
                 "/System/Library/Fonts/Supplemental/Arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    try:
        return ImageFont.load_default(size=size)
    except TypeError:  # Pillow older than 10.1
        return ImageFont.load_default()


def fit_text(draw, text, font, max_width):
    """Shorten text with an ellipsis so it fits max_width."""
    if draw.textlength(text, font=font) <= max_width:
        return text
    while text and draw.textlength(text + "...", font=font) > max_width:
        text = text[:-1]
    return text + "..."


def wrap_text(draw, text, font, max_width):
    lines, line = [], ""
    for word in text.split():
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=font) <= max_width or not line:
            line = trial
        else:
            lines.append(line)
            line = word
    return lines + [line] if line else lines


def scale_to_width(img, width):
    """Same width for every panel: layout is width-driven, so component sizes become comparable."""
    height = max(1, round(img.height * width / img.width))
    return img.resize((width, height), Image.LANCZOS)


def add_guides(img):
    """Faint horizontal lines every 10 % of the height, so vertical rhythm can be compared by position."""
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    font = load_font(max(10, img.height // 70))
    for step in range(1, 10):
        y = round(img.height * step / 10)
        draw.line([(0, y), (img.width, y)], fill=GUIDE_COLOR + (70,), width=1)
        label = f"{step * 10}"
        w = draw.textlength(label, font=font)
        draw.rectangle([0, y - 1, w + 6, y + font.size + 2], fill=(255, 255, 255, 190))
        draw.text((3, y), label, fill=GUIDE_COLOR + (255,), font=font)
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


def compose(panels, panel_width, guides):
    """panels: list of (label, image). Returns one composite image, all panels scaled to panel_width."""
    prepared = []
    for label, img in panels:
        scaled = scale_to_width(img, panel_width)
        prepared.append((label, add_guides(scaled) if guides else scaled))
    tallest = max(img.height for _, img in prepared)
    width = PAD + sum(img.width + PAD for _, img in prepared)
    canvas = Image.new("RGB", (width, HEADER_H + tallest + FOOTER_H), (255, 255, 255))
    draw = ImageDraw.Draw(canvas)
    label_font, note_font = load_font(17), load_font(13)
    x = PAD
    for label, img in prepared:
        draw.text((x, 14), fit_text(draw, label, label_font, img.width), fill=(20, 20, 20), font=label_font)
        canvas.paste(img, (x, HEADER_H))
        draw.rectangle([x - 1, HEADER_H - 1, x + img.width, HEADER_H + img.height], outline=(150, 150, 150))
        x += img.width + PAD
    note = ("Alla paneler har samma bredd, så storlekar är jämförbara. Rosa linjer = var 10:e procent av respektive bilds höjd. "
            "Referensen har statusfält och telefonram, renderingen har inte det: jämför ordning, proportioner och täthet, inte exakta pixlar.")
    for index, line in enumerate(wrap_text(draw, note, note_font, width - 2 * PAD)[:3]):
        draw.text((PAD, HEADER_H + tallest + 8 + index * 17), line, fill=(90, 90, 90), font=note_font)
    return canvas


def crop_reference(ref_path, number, box_override):
    sheet = open_rgb(ref_path)
    if box_override:
        box = tuple(box_override)
    else:
        warn_if_sheet_differs(sheet.size)
        box = panel_box(number, sheet.size)
    if not (0 <= box[0] < box[2] <= sheet.width and 0 <= box[1] < box[3] <= sheet.height):
        raise SystemExit("Beskärningen måste ligga inom referensbilden.")
    return sheet.crop(box)


def parse_box(text):
    try:
        values = [int(v) for v in text.split(",")]
    except ValueError:
        values = []
    if len(values) != 4 or values[2] <= values[0] or values[3] <= values[1]:
        raise argparse.ArgumentTypeError("--box ska vara x0,y0,x1,y1 i referensbildens pixlar")
    return values


def default_output(first_render, number):
    first = Path(first_render)
    return first.with_name(f"compare-panel{number}-{first.stem}.png")


def run_list(ref_path):
    sheet = open_rgb(ref_path)
    print(f"Referens: {ref_path} ({sheet.width}x{sheet.height})")
    for number, name in PANEL_NAMES.items():
        print(f"  Panel {number}: {name:<18} beskärning {panel_box(number, sheet.size)}")


def run_dump(ref_path, directory):
    sheet = open_rgb(ref_path)
    warn_if_sheet_differs(sheet.size)
    out_dir = Path(directory)
    out_dir.mkdir(parents=True, exist_ok=True)
    for number, name in PANEL_NAMES.items():
        target = out_dir / f"panel-{number:02d}.png"
        sheet.crop(panel_box(number, sheet.size)).save(target)
        print(f"Panel {number} ({name}) -> {target}")


def run_compare(args, ref_path):
    if args.label and len(args.label) != len(args.render):
        raise SystemExit("Ange lika många --label som --render, eller inga alls.")
    if len(args.render) > 3:
        raise SystemExit("Högst tre renderingar per jämförelse.")
    name = PANEL_NAMES[args.panel]
    panels = [(f"REFERENS: panel {args.panel} {name}", crop_reference(ref_path, args.panel, args.box))]
    for index, render_path in enumerate(args.render):
        img = open_rgb(render_path)
        if args.trim_top:
            if args.trim_top >= img.height:
                raise SystemExit("--trim-top är större än bildens höjd.")
            img = img.crop((0, args.trim_top, img.width, img.height))
        label = args.label[index] if args.label else Path(render_path).stem
        panels.append((f"RENDER: {label} ({img.width}x{img.height})", img))
    out = Path(args.out) if args.out else default_output(args.render[0], args.panel)
    inputs = [Path(ref_path).resolve(), *(Path(path).resolve() for path in args.render)]
    if out.resolve() in inputs:
        raise SystemExit("Utfilen får inte skriva över referensen eller en rendering.")
    out.parent.mkdir(parents=True, exist_ok=True)
    compose(panels, args.width, not args.no_guides).save(out)
    print(f"Jämförelsebild sparad: {out}")


def build_parser():
    parser = argparse.ArgumentParser(
        description="Jämför en referenspanel ur vision_rev02 med en eller flera renderingar, sida vid sida.")
    parser.add_argument("--panel", type=int, help="Referenspanel 1-8 (läsordning: övre raden 1-4, nedre 5-8)")
    parser.add_argument("--render", action="append", default=[], help="Skärmdump att jämföra (kan anges upp till 3 gånger)")
    parser.add_argument("--label", action="append", default=[], help="Rubrik per rendering, t.ex. before/after")
    parser.add_argument("--out", help="Utfil (standard: bredvid första renderingen)")
    parser.add_argument("--ref", help="Referensark (standard: vision_rev02.jpg, annars vision_rev02.png i repots rot)")
    parser.add_argument("--box", type=parse_box, help="Egen beskärning av referensen: x0,y0,x1,y1")
    parser.add_argument("--trim-top", type=int, default=0, help="Skär bort N pixlar överst på renderingen (t.ex. 32 för reviewbannern)")
    parser.add_argument("--width", type=int, default=375, help="Gemensam panelbredd i pixlar (standard 375 = 1:1 för 375-renderingar)")
    parser.add_argument("--no-guides", action="store_true", help="Utan procentlinjer")
    parser.add_argument("--list", action="store_true", help="Visa paneler och beskärningar")
    parser.add_argument("--dump-panels", metavar="MAPP", help="Spara alla åtta referenspaneler som separata bilder")
    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    if args.width <= 0:
        parser.error("--width måste vara större än noll.")
    if args.trim_top < 0:
        parser.error("--trim-top får inte vara negativt.")
    ref_path = find_reference(args.ref)
    if args.list:
        return run_list(ref_path)
    if args.dump_panels:
        return run_dump(ref_path, args.dump_panels)
    if args.panel is None or not args.render:
        parser.error("Ange --panel och minst en --render (eller använd --list / --dump-panels).")
    if args.panel not in PANEL_NAMES:
        parser.error("--panel måste vara 1-8.")
    run_compare(args, ref_path)


if __name__ == "__main__":
    main()
