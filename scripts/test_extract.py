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
    assert raw[0]["red"] == ["c"]
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
