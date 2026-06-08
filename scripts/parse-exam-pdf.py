#!/usr/bin/env python3
"""Parse 경비지도사 기출 PDF text export into exam-data.json."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "exam-data.json"

OPTION_RE = re.compile(r"^[①②③④]")
QUESTION_INLINE_RE = re.compile(r"^(\d+)\.\s+(.+)")
QUESTION_ONLY_RE = re.compile(r"^(\d+)\.$")
SUBJECT_RE = re.compile(r"^제\d+과목:")
PAGE_RE = re.compile(r"^--\s+\d+\s+of\s+\d+\s+--")
HEADER_RE = re.compile(r"^\d{4}년도.*일반경비지도사")


def normalize_line(line: str) -> str:
    line = line.replace("\t", " ")
    return re.sub(r" +", " ", line.strip())


def parse_text(text: str) -> dict:
    lines = [normalize_line(l) for l in text.splitlines() if normalize_line(l)]
    lines = [l for l in lines if not PAGE_RE.match(l) and not HEADER_RE.match(l)]

    exam_title = "제27회 일반경비지도사 1차 시험 (A형)"
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
        else:
            if current["text"]:
                current["text"] += " " + line
            else:
                current["text"] = line

    if current:
        questions.append(current)

    return {
        "title": exam_title,
        "subtitle": "1차 1교시 · 일반경비 (법학개론 + 민간경비론)",
        "source": "1차 1교시(일반경비) (1).pdf",
        "questions": questions,
    }


def main():
    source_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "exam-source.txt"
    if not source_path.exists():
        print(f"Source not found: {source_path}", file=sys.stderr)
        sys.exit(1)

    text = source_path.read_text(encoding="utf-8")
    data = parse_text(text)
    OUT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(data['questions'])} questions to {OUT_PATH}")


if __name__ == "__main__":
    main()
