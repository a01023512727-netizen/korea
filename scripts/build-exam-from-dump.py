#!/usr/bin/env python3
"""Build exam-data.json from PDF text dump with optional answer key."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / "scripts"

OPTION_RE = re.compile(r"^[①②③④]")
QUESTION_INLINE_RE = re.compile(r"^(\d+)\.\s*(.+)")
QUESTION_ONLY_RE = re.compile(r"^(\d+)\.$")
SUBJECT_RE = re.compile(r"^제\d+과목:")
PAGE_RE = re.compile(r"^\d{4}년도.*\(\s*\d+\s*-\s*\d+\s*\)")
HEADER_RE = re.compile(r"^\d{4}년도")


def normalize_line(line: str) -> str:
    line = line.replace("\t", " ")
    return re.sub(r" +", " ", line.strip())


def parse_dump(text: str, meta: dict) -> dict:
    lines = [normalize_line(l) for l in text.splitlines() if normalize_line(l)]
    lines = [l for l in lines if not PAGE_RE.match(l) and not HEADER_RE.match(l)]

    subject = ""
    questions = []
    current = None
    current_option = None

    for line in lines:
        if SUBJECT_RE.match(line):
            subject = line.replace(" ", "")
            continue

        m_inline = QUESTION_INLINE_RE.match(line)
        m_only = QUESTION_ONLY_RE.match(line)

        if m_inline or m_only:
            if current:
                questions.append(current)
            num = int((m_inline or m_only).group(1))
            text_part = m_inline.group(2).strip() if m_inline else ""
            current = {
                "number": num,
                "subject": subject,
                "text": text_part,
                "options": [],
            }
            current_option = None
            continue

        if current is None:
            continue

        if OPTION_RE.match(line):
            current["options"].append(line)
            current_option = len(current["options"]) - 1
            continue

        if current_option is not None:
            current["options"][current_option] += " " + line
        elif current["text"]:
            current["text"] += " " + line
        else:
            current["text"] = line

    if current:
        questions.append(current)

    return {
        "title": meta["title"],
        "subtitle": meta.get("subtitle", ""),
        "source": meta.get("source", ""),
        "questions": questions,
    }


def strip_option_prefix(text: str) -> str:
    return re.sub(r"^[①②③④]\s*", "", text)


def is_inverted_question(text: str) -> bool:
    return bool(re.search(r"옳지\s*않은|아닌\s*것|해당하지\s*않는|포함되지\s*않는|틀린\s*것", text))


def build_notes(question: dict, answer: int) -> list[str]:
    inverted = is_inverted_question(question["text"])
    notes = []
    for i, opt in enumerate(question["options"], 1):
        body = strip_option_prefix(opt)
        if i == answer:
            notes.append(f"정답. {body}")
        elif inverted:
            notes.append(f"오답. {body} 법적으로는 맞는 설명일 수 있으나, 이 문제는 「옳지 않은 것」을 고르는 문제이다.")
        else:
            notes.append(f"오답. {body}")
    return notes


def build_answers(exam_data: dict, answers: list[int], exam_label: str) -> dict:
    if len(answers) != len(exam_data["questions"]):
        raise ValueError(
            f"Answer count {len(answers)} != question count {len(exam_data['questions'])}"
        )

    result = {"version": 1, "exam": exam_label, "answers": {}}
    for q, ans in zip(exam_data["questions"], answers):
        result["answers"][str(q["number"])] = {
            "answer": ans,
            "notes": build_notes(q, ans),
        }
    return result


def main():
    if len(sys.argv) < 4:
        print("Usage: build-exam-from-dump.py <dump.txt> <out-dir> <meta.json> [answers.json]")
        sys.exit(1)

    dump_path = Path(sys.argv[1])
    out_dir = ROOT / sys.argv[2]
    meta = json.loads(Path(sys.argv[3]).read_text(encoding="utf-8"))
    text = dump_path.read_text(encoding="utf-8")
    exam_data = parse_dump(text, meta)

    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "exam-data.json").write_text(
        json.dumps(exam_data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Wrote {len(exam_data['questions'])} questions -> {out_dir / 'exam-data.json'}")

    if len(sys.argv) >= 5:
        answers = json.loads(Path(sys.argv[4]).read_text(encoding="utf-8"))
        answers_data = build_answers(exam_data, answers, meta.get("examLabel", meta["title"]))
        (out_dir / "exam-answers.json").write_text(
            json.dumps(answers_data, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"Wrote answers -> {out_dir / 'exam-answers.json'}")


if __name__ == "__main__":
    main()
