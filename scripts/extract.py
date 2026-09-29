"""Turn `questions igazete.pdf` into data/questions.json, public/q/*.webp and a report.

Correct answers are the options printed in red in the PDF. Run from the repo root:
    python scripts/extract.py
"""
from __future__ import annotations

import hashlib
import io
import json
import re
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "questions igazete.pdf"
SKIP_LINES = {"RESTRICTED", "IKINYARWANDA"}
Q_START = re.compile(r"^(\d{1,3})(?:\s*[.)]\s*|(?=[A-Z]))(\S.*)$")
Q_BARE = re.compile(r"^(\d{1,3})\s*[.)]\s*$")
OPT_START = re.compile(r"^\(?\s*([a-dA-D])\s*[.)]\s*(.*)$")
MAX_IMG_WIDTH = 480
KEYS = "abcdefghij"


@dataclass
class Line:
    text: str = ""
    red: bool = False
    image: dict | None = None
    owner: str | None = None  # option key an image belongs to, from page geometry


def clean(text: str) -> str:
    """The PDF font maps the apostrophe to U+FFFD; in this text it is always an apostrophe."""
    return text.replace("�", "’")


def is_red(color: int) -> bool:
    r, g, b = (color >> 16) & 255, (color >> 8) & 255, color & 255
    return r >= 0xB0 and g <= 0x60 and b <= 0x60


def parse_lines(lines: list[Line]) -> list[dict]:
    """Group lines into raw questions in document order."""
    questions: list[dict] = []
    cur: dict | None = None
    for ln in lines:
        if ln.image:
            if cur is None:
                continue
            if ln.owner:
                opt = next((o for o in cur["options"] if o["key"] == ln.owner), None)
                if opt is not None:
                    opt.setdefault("image", ln.image)
                else:
                    cur.setdefault("pending", {})[ln.owner] = ln.image
            else:
                target = cur["options"][-1] if cur["options"] else cur
                target.setdefault("image", ln.image)
            continue
        t = ln.text.strip()
        if not t or t in SKIP_LINES or t.isdigit():
            continue
        m = Q_START.match(t) or Q_BARE.match(t)
        if m and (cur is None or len(cur["options"]) >= 2):
            text = m[2].strip() if m.lastindex == 2 else ""
            cur = {"num": int(m[1]), "text": text, "options": [], "red": []}
            questions.append(cur)
            continue
        if cur is None:
            continue
        m = OPT_START.match(t)
        if m:
            key = m[1].lower()
            option = {"key": key, "text": m[2].strip()}
            if key in cur.get("pending", {}):
                option["image"] = cur["pending"].pop(key)
            cur["options"].append(option)
            if ln.red:
                cur["red"].append(len(cur["options"]) - 1)
            continue
        if cur["options"]:
            last = cur["options"][-1]
            last["text"] = f"{last['text']} {t}".strip()
            if ln.red:
                cur["red"].append(len(cur["options"]) - 1)
        else:
            cur["text"] = f"{cur['text']} {t}".strip()
    return questions


def finalize(raw: list[dict], overrides: dict) -> tuple[list[dict], list[str]]:
    """Validate raw questions, apply overrides, return (questions, report lines)."""
    out: list[dict] = []
    report: list[str] = []
    prev_num = None
    for idx, q in enumerate(raw, start=1):
        label = f"- #{idx} (printed {q['num']})"
        ov = overrides.get(str(idx), {})
        if prev_num is not None and q["num"] != prev_num + 1:
            report.append(f"{label}: note: numbering jumps from {prev_num} to {q['num']}")
        prev_num = q["num"]
        if ov.get("exclude"):
            report.append(f"{label}: excluded by override")
            continue
        options = ov.get("options")
        if options is None:
            printed = "".join(o["key"] for o in q["options"])
            options = [{**o, "key": KEYS[i]} for i, o in enumerate(q["options"])]
            if printed != KEYS[: len(printed)]:
                report.append(f"{label}: note: option labels printed as '{printed}', renumbered by position")
        red = sorted({KEYS[i] for i in q["red"]})
        text = ov.get("text", q["text"]).strip()
        answer = ov.get("answer") or (red[0] if len(red) == 1 else None)
        problems = []
        if not 2 <= len(options) <= 4:
            problems.append(f"{len(options)} options")
        if answer is None:
            problems.append(f"{len(red)} red options {red}")
        elif answer not in [o["key"] for o in options]:
            problems.append(f"answer {answer} is not among the options")
        if problems:
            report.append(f"{label}: EXCLUDED: {', '.join(problems)}: {text[:70]}")
            continue
        item = {"id": idx, "num": q["num"], "text": text, "options": options, "answer": answer}
        if "image" in q:
            item["image"] = q["image"]
        out.append(item)
    return out, report


def save_image(data: bytes, out_dir: Path) -> dict:
    from PIL import Image

    im = Image.open(io.BytesIO(data))
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, "white")
        bg.paste(im, mask=im.split()[-1])
        im = bg
    else:
        im = im.convert("RGB")
    if im.width > MAX_IMG_WIDTH:
        im = im.resize((MAX_IMG_WIDTH, round(im.height * MAX_IMG_WIDTH / im.width)), Image.LANCZOS)
    name = hashlib.sha1(im.tobytes()).hexdigest()[:12] + ".webp"
    out_dir.mkdir(parents=True, exist_ok=True)
    im.save(out_dir / name, "WEBP", quality=80, method=6)
    return {"src": f"/q/{name}", "w": im.width, "h": im.height}


LABEL = re.compile(r"^\(?\s*([a-dA-D])\s*[.)]")


def read_pdf(path: Path, img_dir: Path) -> list[Line]:
    import pymupdf

    lines: list[Line] = []
    doc = pymupdf.open(path)
    for page in doc:
        texts: list[tuple[tuple, Line, str | None]] = []
        images: list[tuple[tuple, tuple]] = []
        for block in page.get_text("dict")["blocks"]:
            if block["type"] == 1:
                x0, y0, x1, y1 = block["bbox"]
                if (x1 - x0) < 8 or (y1 - y0) < 8 or (x1 - x0) * (y1 - y0) < 400:
                    continue  # bullets, rules
                if y0 < 50 or y1 > page.rect.height - 40:
                    continue  # header/footer decoration
                images.append(((x0, y0, x1, y1), block["image"]))
                continue
            for line in block["lines"]:
                spans = line["spans"]
                text = clean("".join(s["text"] for s in spans))
                red = any(s["text"].strip() and is_red(s["color"]) for s in spans)
                m = LABEL.match(text.strip())
                texts.append((tuple(line["bbox"]), Line(text=text, red=red), m[1].lower() if m else None))

        items: list[tuple[float, float, Line]] = []
        for bbox, line, _ in texts:
            items.append((round(bbox[1] / 4), bbox[0], line))
        for (x0, y0, x1, y1), data in images:
            owner, best, label_box = None, 60.0, None
            for box, _, key in texts:
                if key is None:
                    continue
                lx0, ly0, lx1, ly1 = box
                centre = (ly0 + ly1) / 2
                gap = x0 - lx1
                if y0 <= centre <= y1 + 2 and -6 <= gap < best:
                    owner, best, label_box = key, gap, box
            line = Line(image=save_image(data, img_dir), owner=owner)
            if label_box:
                # Sit right after the label line so the next question's stem cannot jump ahead.
                items.append((round(label_box[1] / 4), label_box[2] + 0.5, line))
            else:
                items.append((round(y1 / 4), x0, line))
        items.sort(key=lambda it: (it[0], it[1]))
        lines.extend(line for _, _, line in items)
    return lines


def main() -> None:
    overrides_path = ROOT / "data" / "overrides.json"
    overrides = json.loads(overrides_path.read_text(encoding="utf-8")) if overrides_path.exists() else {}
    img_dir = ROOT / "public" / "q"
    if img_dir.exists():
        for old in img_dir.glob("*.webp"):
            old.unlink()
    raw = parse_lines(read_pdf(PDF, img_dir))
    questions, report = finalize(raw, overrides)
    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data" / "questions.json").write_text(
        json.dumps(questions, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    with_images = sum(1 for q in questions if q.get("image") or any(o.get("image") for o in q["options"]))
    body = "\n".join(report) if report else "Nothing to report."
    (ROOT / "data" / "extract-report.md").write_text(
        f"# Extraction report\n\n{len(raw)} questions found, {len(questions)} kept, "
        f"{with_images} with images.\n\n{body}\n",
        encoding="utf-8",
    )
    print(f"{len(raw)} found, {len(questions)} kept, {with_images} with images, {len(report)} report lines")


if __name__ == "__main__":
    main()
