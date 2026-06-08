"""Strip line-number prefixes from read-dump.txt -> exam-source.txt"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
src = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "read-dump.txt"
dst = ROOT / "exam-source.txt"

text = src.read_text(encoding="utf-8")
lines = []
for line in text.splitlines():
    cleaned = re.sub(r"^\s*\d+\|", "", line)
    lines.append(cleaned)

dst.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {dst} ({len(lines)} lines)")
