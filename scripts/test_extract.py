from extract import Line, finalize, is_red, parse_lines

RED = True


def L(text, red=False):
    return Line(text=text, red=red)


def img(name="/q/x.webp"):
    return Line(image={"src": name, "w": 100, "h": 80})


def test_is_red_accepts_both_reds_and_rejects_green_and_black():
    assert is_red(0xFF0000)
    assert is_red(0xC00000)
    assert not is_red(0x000000)
    assert not is_red(0x00B050)


def test_basic_question_with_red_answer():
    raw = parse_lines([
        L("1. Ikinyabiziga cyose kigomba kugira:"),
        L("a) Umuyobozi"),
        L("b) Umuherekeza"),
        L("(c) A na B ni ibisubizo by'ukuri", RED),
        L("d) Nta gisubizo cy'ukuri kirimo"),
    ])
    qs, report = finalize(raw, {})
    assert len(qs) == 1 and report == []
    q = qs[0]
    assert q["id"] == 1 and q["num"] == 1
    assert q["answer"] == "c"
    assert [o["key"] for o in q["options"]] == ["a", "b", "c", "d"]
    assert q["options"][2]["text"] == "A na B ni ibisubizo by'ukuri"


def test_option_without_space_after_bracket():
    raw = parse_lines([L("1. Q?"), L("a) x"), L("b) y"), L("c)A na B", RED), L("d) z")])
    assert raw[0]["options"][2]["text"] == "A na B"


def test_page_furniture_is_skipped():
    raw = parse_lines([
        L("IKINYARWANDA"), L("1. Q?"), L("a) x"), L("b) y", RED), L("c) z"), L("d) w"),
        L("RESTRICTED"), L("2"), L("2. R?"), L("a) x", RED), L("b) y"), L("c) z"), L("d) w"),
    ])
    assert len(raw) == 2
    assert raw[0]["options"][3]["text"] == "w"


def test_continuation_lines_extend_stem_and_option_and_carry_red():
    raw = parse_lines([
        L("1. Long stem"), L("continues here"),
        L("a) first"), L("b) second"), L("part two", RED), L("c) third"), L("d) fourth"),
    ])
    q = raw[0]
    assert q["text"] == "Long stem continues here"
    assert q["options"][1]["text"] == "second part two"
    qs, _ = finalize(raw, {})
    assert qs[0]["answer"] == "b"


def test_numbering_gap_keeps_both_questions_and_notes_the_gap():
    raw = parse_lines([
        L("1. A?"), L("a) x", RED), L("b) y"),
        L("3. B?"), L("a) x"), L("b) y", RED),
    ])
    qs, report = finalize(raw, {})
    assert [q["num"] for q in qs] == [1, 3]
    assert [q["id"] for q in qs] == [1, 2]
    assert any("jumps from 1 to 3" in r for r in report)


def test_duplicate_number_is_a_new_question():
    raw = parse_lines([
        L("52. A?"), L("a) x", RED), L("b) y"),
        L("52. B?"), L("a) x"), L("b) y", RED),
    ])
    assert len(raw) == 2


def test_stem_image_and_option_image_attach_to_the_right_owner():
    raw = parse_lines([
        L("1. Icyapa?"), img("/q/stem.webp"),
        L("a) x", RED), L("b)"), img("/q/opt.webp"), L("c) z"), L("d) w"),
    ])
    q = raw[0]
    assert q["image"]["src"] == "/q/stem.webp"
    assert q["options"][1]["image"]["src"] == "/q/opt.webp"
    assert "image" not in q["options"][0]


def test_zero_red_is_excluded_and_reported_until_overridden():
    raw = parse_lines([L("1. Q?"), L("a) x"), L("b) y")])
    qs, report = finalize(raw, {})
    assert qs == [] and any("EXCLUDED" in r for r in report)
    qs, report = finalize(raw, {"1": {"answer": "b"}})
    assert qs[0]["answer"] == "b" and report == []


def test_two_red_options_is_a_problem():
    raw = parse_lines([L("1. Q?"), L("a) x", RED), L("b) y", RED)])
    qs, report = finalize(raw, {})
    assert qs == [] and any("2 red" in r for r in report)


def test_exclude_override():
    raw = parse_lines([L("1. Q?"), L("a) x", RED), L("b) y")])
    qs, _ = finalize(raw, {"1": {"exclude": True}})
    assert qs == []


def test_dotted_options_with_and_without_space():
    raw = parse_lines([
        L("220. Niki wakora?"), L("a. Kumanura"), L("         b.Gufungura"), L("c. Gushaka", RED), L("         d. Gukoresha"),
        L("220.Igihe ukurikiwe?"), L("(a) x", RED), L("b) y"),
    ])
    assert len(raw) == 2
    assert [o["key"] for o in raw[0]["options"]] == ["a", "b", "c", "d"]
    assert raw[0]["options"][1]["text"] == "Gufungura"
    assert raw[0]["red"] == [2]
    assert raw[1]["text"] == "Igihe ukurikiwe?"


def test_number_glued_to_uppercase_word_starts_a_question():
    raw = parse_lines([
        L("224. A?"), L("a) x", RED), L("b) y"),
        L("225Wegereye inzira ugomba gukora iki?"), L("a) x"), L("b) y", RED),
    ])
    assert [q["num"] for q in raw] == [224, 225]


def test_number_inside_an_option_is_not_a_new_question():
    raw = parse_lines([
        L("1. Q?"), L("a) x"), L("b) speed limit"), L("50 km/h"), L("c) z", RED),
    ])
    assert len(raw) == 1
    assert raw[0]["options"][1]["text"] == "speed limit 50 km/h"


def test_number_alone_on_its_line_starts_a_question_whose_text_follows():
    raw = parse_lines([
        L("225. A?"), L("a) x"), L("b) y", RED), L("c) z"), L("d) w"),
        L("224."), L("Uri hafi kunyura?"), img("/q/s.webp"), L("a)"), img("/q/a.webp"), L("b)"), img("/q/b.webp"),
    ])
    assert [q["num"] for q in raw] == [225, 224]
    assert raw[1]["text"] == "Uri hafi kunyura?"
    assert raw[1]["image"]["src"] == "/q/s.webp"
    assert raw[1]["options"][0]["image"]["src"] == "/q/a.webp"


def owned(name, key):
    return Line(image={"src": name, "w": 10, "h": 10}, owner=key)


def test_image_with_owner_hint_goes_to_that_option_even_out_of_order():
    raw = parse_lines([
        L("1. Icyapa?"), owned("/q/a.webp", "a"), owned("/q/b.webp", "b"),
        L("a)"), L("b)"), L("c) z", RED), L("d) w"),
    ])
    q = raw[0]
    assert q["options"][0]["image"]["src"] == "/q/a.webp"
    assert q["options"][1]["image"]["src"] == "/q/b.webp"
    assert "image" not in q


def test_owner_hint_when_options_already_exist():
    raw = parse_lines([
        L("1. Icyapa?"), L("a)"), L("b)"), owned("/q/a.webp", "a"), owned("/q/b.webp", "b"),
    ])
    assert raw[0]["options"][0]["image"]["src"] == "/q/a.webp"
    assert raw[0]["options"][1]["image"]["src"] == "/q/b.webp"


def test_replacement_character_becomes_an_apostrophe():
    from extract import clean

    assert clean("w\ufffdimodoka cy\ufffdukuri") == "w\u2019imodoka cy\u2019ukuri"


def test_mislabelled_options_are_renumbered_by_position_and_answer_follows():
    raw = parse_lines([
        L("1. Q?"), L("a) x"), L("a) y", RED), L("b) z"), L("c) w"),
    ])
    qs, report = finalize(raw, {})
    assert [o["key"] for o in qs[0]["options"]] == ["a", "b", "c", "d"]
    assert qs[0]["options"][1]["text"] == "y"
    assert qs[0]["answer"] == "b"
    assert any("renumbered" in r for r in report)


# --- audit fixes ---------------------------------------------------------

def test_stray_closing_bracket_is_removed_from_option_text():
    raw = parse_lines([L("1. Q?"), L("a) x"), L("b) ) y", RED)])
    qs, _ = finalize(raw, {})
    assert qs[0]["options"][1]["text"] == "y"


def test_tidy_fixes_spacing_punctuation_and_quotes():
    from extract import tidy

    assert tidy("Ni iki  ?") == "Ni iki?"
    assert tidy("aha hakurikira :") == "aha hakurikira:"
    assert tidy("umuhanda.ukingirijwe ni") == "umuhanda. ukingirijwe ni"
    assert tidy("cy;umuhanda") == "cy\u2019umuhanda"
    assert tidy("cy\u2019 ukuri") == "cy\u2019ukuri"
    assert tidy("kivuga\u201cugukikira\u201dbitegetswe") == "kivuga \u201cugukikira\u201d bitegetswe"
    assert tidy("m2.70 na 3.5 km") == "m2.70 na 3.5 km"
    assert tidy("  iki cyapa  ", stem=True) == "Iki cyapa"


def test_spelling_map_fixes_words_and_keeps_case_and_apostrophes():
    from extract import respell

    fix = {"ikinyabizaga": "ikinyabiziga", "cyukuri": "cy\u2019ukuri"}
    assert respell("Ikinyabizaga na bw\u2019ikinyabizaga", fix) == "Ikinyabiziga na bw\u2019ikinyabiziga"
    assert respell("nta gisubizo cyukuri", fix) == "nta gisubizo cy\u2019ukuri"
    assert respell("ikinyabiziga", fix) == "ikinyabiziga"


def test_finalize_applies_tidy_and_spelling():
    raw = parse_lines([L("1. iki cyapa gisobanura iki ?"), L("a) ikinyabizaga", RED), L("b) y")])
    qs, report = finalize(raw, {}, {"ikinyabizaga": "ikinyabiziga"})
    assert qs[0]["text"] == "Iki cyapa gisobanura iki?"
    assert qs[0]["options"][0]["text"] == "ikinyabiziga"
    assert any("ikinyabizaga" in r and "ikinyabiziga" in r for r in report)


def test_option_with_text_and_image_moves_the_image_to_the_stem():
    raw = parse_lines([
        L("1. Icyapa?"), L("(a) Birabujijwe", RED), owned("/q/s.webp", "a"), L("b) y"),
    ])
    qs, report = finalize(raw, {})
    assert qs[0]["image"]["src"] == "/q/s.webp"
    assert "image" not in qs[0]["options"][0]
    assert any("moved to the question" in r for r in report)


def test_text_and_image_option_stays_when_the_stem_already_has_a_picture():
    raw = parse_lines([
        L("1. Icyapa?"), img("/q/stem.webp"), L("(a) x", RED), owned("/q/opt.webp", "a"), L("b) y"),
    ])
    qs, report = finalize(raw, {})
    assert qs[0]["image"]["src"] == "/q/stem.webp"
    assert qs[0]["options"][0]["image"]["src"] == "/q/opt.webp"
    assert any("has both text and a picture" in r for r in report)


def test_exact_duplicate_questions_are_dropped_and_reported():
    block = [L("Kunyuranaho bikorerwa:"), L("a) x"), L("b) y", RED)]
    raw = parse_lines([L("9. " + block[0].text), *block[1:], L("176. " + block[0].text), *block[1:]])
    qs, report = finalize(raw, {})
    assert [q["id"] for q in qs] == [1]
    assert any("duplicate of #1" in r for r in report)


def test_same_stem_with_different_options_is_kept():
    raw = parse_lines([
        L("1. Iki cyapa gisobanura iki?"), L("a) x", RED), L("b) y"),
        L("2. Iki cyapa gisobanura iki?"), L("a) p"), L("b) q", RED),
    ])
    qs, _ = finalize(raw, {})
    assert len(qs) == 2


# --- geometry: which pictures belong to the question and which to an option ----

def _make_pdf(tmp_path, draw):
    import io

    import pymupdf
    from PIL import Image

    doc = pymupdf.open()
    page = doc.new_page(width=400, height=500)

    def picture(rect, color):
        buf = io.BytesIO()
        Image.new("RGB", (80, 80), color).save(buf, "PNG")
        page.insert_image(pymupdf.Rect(*rect), stream=buf.getvalue())

    draw(page, picture)
    path = tmp_path / "t.pdf"
    doc.save(path)
    return path


def test_picture_above_a_text_option_belongs_to_the_question(tmp_path):
    from extract import read_pdf

    def draw(page, picture):
        page.insert_text((50, 80), "1. Icyapa gisobanura iki?")
        picture((60, 100, 140, 180), (200, 0, 0))
        page.insert_text((50, 178), "(a) Birabujijwe kuwurenga")
        page.insert_text((50, 200), "(b) Ntihanyurwa")

    raw = parse_lines(read_pdf(_make_pdf(tmp_path, draw), tmp_path / "img"))
    assert raw[0]["image"]["src"].endswith(".webp")
    assert all("image" not in o for o in raw[0]["options"])


def test_pictures_beside_bare_labels_belong_to_those_options(tmp_path):
    from extract import read_pdf

    def draw(page, picture):
        page.insert_text((50, 80), "1. Icyapa?")
        picture((60, 100, 140, 180), (200, 0, 0))
        picture((210, 100, 290, 180), (0, 0, 200))
        page.insert_text((50, 178), "a)")
        page.insert_text((190, 178), "b)")

    raw = parse_lines(read_pdf(_make_pdf(tmp_path, draw), tmp_path / "img"))
    assert "image" not in raw[0]
    assert raw[0]["options"][0]["image"]["src"] != raw[0]["options"][1]["image"]["src"]


def test_picture_printed_just_above_the_next_stem_belongs_to_that_question(tmp_path):
    from extract import read_pdf

    def draw(page, picture):
        page.insert_text((50, 60), "1. First question?")
        page.insert_text((50, 80), "a) x")
        page.insert_text((50, 100), "b) y")
        picture((200, 120, 280, 200), (0, 0, 200))
        page.insert_text((50, 195), "2. Iki cyapa gisobanura iki?")
        page.insert_text((50, 220), "a) p")
        page.insert_text((50, 240), "b) q")

    raw = parse_lines(read_pdf(_make_pdf(tmp_path, draw), tmp_path / "img"))
    assert "image" not in raw[0] and all("image" not in o for o in raw[0]["options"])
    assert raw[1]["image"]["src"].endswith(".webp")


def test_pictures_with_a_transparency_mask_get_a_white_background(tmp_path):
    import io

    import pymupdf
    from PIL import Image

    from extract import read_pdf

    # A red square in the middle, fully transparent around it: the PDF keeps the mask separately.
    im = Image.new("RGBA", (80, 80), (0, 0, 0, 0))
    for x in range(30, 50):
        for y in range(30, 50):
            im.putpixel((x, y), (255, 0, 0, 255))
    buf = io.BytesIO()
    im.save(buf, "PNG")
    doc = pymupdf.open()
    page = doc.new_page(width=400, height=500)
    page.insert_text((50, 80), "1. Icyapa?")
    page.insert_image(pymupdf.Rect(60, 100, 140, 180), stream=buf.getvalue())
    page.insert_text((50, 200), "a) x")
    path = tmp_path / "mask.pdf"
    doc.save(path)

    raw = parse_lines(read_pdf(path, tmp_path / "img"))
    saved = Image.open(tmp_path / "img" / raw[0]["image"]["src"].split("/")[-1]).convert("RGB")
    assert min(saved.getpixel((2, 2))) > 240, "transparent corner must be white, not black"
    assert saved.getpixel((saved.width // 2, saved.height // 2))[0] > 200


def test_meta_lists_the_count_and_every_picture_once():
    from extract import build_meta

    qs = [
        {"id": 1, "image": {"src": "/q/a.webp", "w": 1, "h": 1}, "options": [{"key": "a"}]},
        {"id": 2, "options": [{"key": "a", "image": {"src": "/q/b.webp", "w": 1, "h": 1}}, {"key": "b", "image": {"src": "/q/a.webp", "w": 1, "h": 1}}]},
    ]
    assert build_meta(qs) == {"count": 2, "images": ["/q/a.webp", "/q/b.webp"]}
