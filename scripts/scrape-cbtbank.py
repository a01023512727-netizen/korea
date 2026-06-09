import json
import re
import ssl
import urllib.request
from pathlib import Path

ctx = ssl.create_default_context()


def fetch(slug: str) -> str:
    url = f"https://cbtbank.kr/exam/{slug}"
    return urllib.request.urlopen(url, context=ctx).read().decode("utf-8", "ignore")


for slug in ["ph20241109", "ph20251115"]:
    page = fetch(slug)
    out = Path(__file__).parent / f"cbt-{slug}.html"
    out.write_text(page, encoding="utf-8")
    print(slug, len(page))
    for m in re.finditer(r"correct[^<]{0,40}", page, re.I):
        print(" ", m.group(0)[:60])
    json_blocks = re.findall(r"\{[^{}]*answer[^{}]*\}", page, re.I)
    print("json blocks", len(json_blocks))
