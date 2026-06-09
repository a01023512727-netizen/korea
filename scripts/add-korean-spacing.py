#!/usr/bin/env python3
"""Add Korean spacing to exam question/option text using Kiwi."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATA_PATH = ROOT / "exam-data.json"

OPTION_PREFIX = re.compile(r"^([①②③④])")
MARKER_PREFIX = re.compile(r"^([ㄱㄴㄷㄹㅁㅂ]:)")


COMPOUND_FIXES = [
    ("과/ 와", "과/와"),
    ("헌법 재판 소", "헌법재판소"),
    ("헌법재판 소", "헌법재판소"),
    ("국무 회의", "국무회의"),
    ("보훈 선 양", "보훈선양"),
    ("경비업 법", "경비업법"),
    ("형사 소송법", "형사소송법"),
    ("행정 안전부", "행정안전부"),
    ("선거 관리 위원회", "선거관리위원회"),
    ("중앙 선거 관리 위원회", "중앙선거관리위원회"),
    ("헌법 재판소", "헌법재판소"),
    ("군사 분계선", "군사분계선"),
    ("사회 적", "사회적"),
    ("특수 계급", "특수계급"),
    ("상 관습법", "상관습법"),
    ("체결 ㆍ공포", "체결ㆍ공포"),
    ("권리 ㆍ의무", "권리ㆍ의무"),
    ("선박 ㆍ항공기", "선박ㆍ항공기"),
    ("보상 ㆍ보호", "보상ㆍ보호"),
    ("제대 군인", "제대군인"),
    ("국가 보훈 부", "국가보훈부"),
    ("행정 각부", "행정각부"),
    ("국무 위원", "국무위원"),
    ("지방 의회", "지방의회"),
    ("부속 도서", "부속도서"),
    ("영전 수여", "영전수여"),
]


def fix_punctuation(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\(\s+\)", "( )", text)
    text = re.sub(r"^([①②③④])(?=\S)", r"\1 ", text)
    text = re.sub(r"ㄱ\s*:\s*", "ㄱ: ", text)
    text = re.sub(r"ㄴ\s*:\s*", "ㄴ: ", text)
    text = re.sub(r"ㄷ\s*:\s*", "ㄷ: ", text)
    text = re.sub(r"ㄹ\s*:\s*", "ㄹ: ", text)
    text = re.sub(r"ㅁ\s*:\s*", "ㅁ: ", text)
    text = re.sub(r"ㅂ\s*:\s*", "ㅂ: ", text)
    text = re.sub(r"\s+,", ",", text)
    text = re.sub(r"\s+\.", ".", text)
    text = re.sub(r"\s+\?", "?", text)
    text = re.sub(r"하여야한다", "하여야 한다", text)
    text = re.sub(r"거쳐야한다", "거쳐야 한다", text)
    text = re.sub(r"재판하여야하는가", "재판하여야 하는가", text)

    for wrong, right in COMPOUND_FIXES:
        text = text.replace(wrong, right)

    return text.strip()


def space_segment(text: str, kiwi) -> str:
    if not text.strip():
        return text
    if re.fullmatch(r"[\dA-Za-z]+", text.strip()):
        return text.strip()
    return kiwi.space(text.strip())


def space_text(text: str, kiwi) -> str:
    if not text:
        return text

    prefix = ""
    body = text

    m = OPTION_PREFIX.match(text)
    if m:
        prefix = m.group(1) + " "
        body = text[m.end():]

    m2 = MARKER_PREFIX.match(body)
    marker = ""
    if m2:
        marker = m2.group(1) + " "
        body = body[m2.end():]

    spaced = space_segment(body, kiwi)
    return fix_punctuation(f"{prefix}{marker}{spaced}")


def process_exam(data: dict, kiwi) -> dict:
    for q in data["questions"]:
        q["text"] = space_text(q["text"], kiwi)
        q["options"] = [space_text(opt, kiwi) for opt in q["options"]]
    return data


def main() -> None:
    import sys
    from kiwipiepy import Kiwi

    data_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DATA_PATH
    kiwi = Kiwi()
    data = json.loads(data_path.read_text(encoding="utf-8"))
    data = process_exam(data, kiwi)
    data_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated spacing in {data_path}")


if __name__ == "__main__":
    main()
