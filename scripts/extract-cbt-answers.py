#!/usr/bin/env python3
"""Extract answer keys from cbtbank.kr exam pages."""
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

ctx = ssl.create_default_context()


def fetch_answers(slug: str) -> list[int]:
    url = f"https://cbtbank.kr/exam/{slug}"
    page = urllib.request.urlopen(url, context=ctx).read().decode("utf-8", "ignore")
    blocks = re.findall(
        r'question-num="(\d+)".*?<ol class="circlednumbers" correct="(\d)"',
        page,
        re.S,
    )
    if not blocks:
        blocks = re.findall(r'question-num="(\d+)"[^>]*>.*?correct="(\d)"', page, re.S)
    answers = {}
    for num, ans in blocks:
        answers[int(num)] = int(ans)
    if not answers:
        raise ValueError(f"No answers found for {slug}")
    max_num = max(answers)
    return [answers[i] for i in range(1, max_num + 1)]


def main():
    slug = sys.argv[1]
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else None
    answers = fetch_answers(slug)
    print(f"{slug}: {len(answers)} answers")
    if out:
        out.write_text(json.dumps(answers, ensure_ascii=False), encoding="utf-8")
        print(f"Wrote {out}")


if __name__ == "__main__":
    main()
