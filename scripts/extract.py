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


def tidy(text: str, stem: bool = False) -> str:
    """Whitespace, punctuation spacing and quote spacing. Never changes the words themselves."""
    t = re.sub(r"\s+", " ", text.replace("\u00a0", " ")).strip()
    t = re.sub(r"^\)\s*", "", t)  # stray bracket left over from a label
    t = re.sub(r"\s+([,.:;?!])", r"\1", t)
    t = re.sub(r"(?<=[A-Za-z]);(?=[a-z])", "\u2019", t)  # cy;umuhanda -> cy'umuhanda
    t = re.sub(r"(?<=[A-Za-z])([,.:?!])(?=[A-Za-z]{2})", r"\1 ", t)
    t = re.sub(r"\b([A-Za-z]{1,2})\u2019 (?=[a-z])", lambda m: m.group(1) + "\u2019", t)  # cy' ukuri -> cy'ukuri
    t = re.sub(r"(?<=\w)\u201c", " \u201c", t)
    t = re.sub(r"\u201d(?=\w)", "\u201d ", t)
    if stem and t:
        t = t[0].upper() + t[1:]
    return t


def respell(text: str, fixes: dict, changes: list | None = None) -> str:
    """Replace known misspelt words, keeping a leading capital. Changed words are appended to `changes`."""

    def sub(m: re.Match) -> str:
        word = m.group(0)
        new = fixes.get(word.lower())
        if new is None:
            return word
        new = new[0].upper() + new[1:] if word[0].isupper() else new
        if changes is not None:
            changes.append((word, new))
        return new

    return re.sub(r"[A-Za-z]+", sub, text)


def finalize(raw: list[dict], overrides: dict, spelling: dict | None = None) -> tuple[list[dict], list[str]]:
    """Validate raw questions, apply overrides, return (questions, report lines)."""
    out: list[dict] = []
    report: list[str] = []
    prev_num = None
    seen: dict = {}
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
        fixes = spelling or {}

        def clean_text(value: str, is_stem: bool = False) -> str:
            out = tidy(value, stem=is_stem)
            changes: list = []
            fixed = respell(out, fixes, changes)
            for old, new in changes:
                report.append(f"{label}: wording: '{old}' -> '{new}'")
            return fixed

        text = clean_text(ov.get("text", q["text"]), True)
        options = [{**o, "text": clean_text(o["text"])} for o in options]
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
        for opt in item["options"]:
            if opt["text"] and "image" in opt:
                if "image" not in item:
                    item["image"] = opt.pop("image")
                    report.append(f"{label}: note: picture next to option {opt['key']} moved to the question")
                else:
                    report.append(f"{label}: note: option {opt['key']} has both text and a picture, kept as is")
        signature = (
            item["text"].lower(),
            tuple(o["text"].lower() for o in item["options"]),
            item.get("image", {}).get("src"),
            tuple(o.get("image", {}).get("src") for o in item["options"]),
            item["answer"],
        )
        if signature in seen:
            report.append(f"{label}: note: dropped, duplicate of #{seen[signature]}")
            continue
        seen[signature] = idx
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
        stems: list[tuple] = []  # bbox of every line that starts a question
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
                # Only a bare label ("a)") can own a picture; "(a) some text" means the picture above is the question's.
                bare = m and not text.strip()[m.end():].strip()
                texts.append((tuple(line["bbox"]), Line(text=text, red=red), m[1].lower() if bare else None))
                if Q_START.match(text.strip()) or Q_BARE.match(text.strip()):
                    stems.append(tuple(line["bbox"]))

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
                # A picture printed right beside a question's number line belongs to that question.
                stem = next((b for b in stems if y1 - 25 <= (b[1] + b[3]) / 2 <= y1 + 15), None)
                if stem is not None:
                    items.append((round(stem[1] / 4), stem[2] + 0.5, line))
                else:
                    items.append((round(y0 / 4), x0, line))
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
    spelling_path = ROOT / "data" / "spelling.json"
    spelling = json.loads(spelling_path.read_text(encoding="utf-8")) if spelling_path.exists() else {}
    raw = parse_lines(read_pdf(PDF, img_dir))
    questions, report = finalize(raw, overrides, spelling)
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
