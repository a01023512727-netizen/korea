#!/usr/bin/env python3
"""Build all exam JSON files from PDF dumps and answer keys."""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / "scripts"
DUMPS = SCRIPTS / "pdf-dumps"
EXAMS = ROOT / "exams"
BUILD = SCRIPTS / "build-exam-from-dump.py"
SPACING = SCRIPTS / "add-korean-spacing.py"
KEYS = SCRIPTS / "answer-keys"

EXAM_SPECS = [
    {
        "id": "27-1",
        "copy_from_root": True,
    },
    {
        "id": "25-1",
        "dump": DUMPS / "2023년 1교시 시험지(일반경비지도사).txt",
        "meta": {
            "title": "제25회 일반경비지도사 1차 시험 (A형)",
            "subtitle": "1차 1교시 · 일반경비 (법학개론 + 민간경비론)",
            "source": "2023년 1교시 시험지(일반경비지도사).pdf",
            "examLabel": "제25회 일반경비지도사 1차 A형",
            "round": 1,
            "session": 25,
            "year": 2023,
            "elective": None,
        },
        "answers": KEYS / "25-1.json",
    },
    {
        "id": "26-1",
        "dump": DUMPS / "제26회 일반경비지도사 1차 1교시 시험지 원본.txt",
        "meta": {
            "title": "제26회 일반경비지도사 1차 시험 (A형)",
            "subtitle": "1차 1교시 · 일반경비 (법학개론 + 민간경비론)",
            "source": "제26회 일반경비지도사 1차 1교시 시험지 원본.pdf",
            "examLabel": "제26회 일반경비지도사 1차 A형",
            "round": 1,
            "session": 26,
            "year": 2024,
            "elective": None,
        },
        "answers": KEYS / "26-1.json",
    },
    {
        "id": "27-2-kyungho",
        "dump": DUMPS / "2차 1교시(일반경비_경호학).txt",
        "meta": {
            "title": "제27회 일반경비지도사 2차 시험 (A형 · 경호학)",
            "subtitle": "2차 1교시 · 경비업법 + 경호학",
            "source": "2차 1교시(일반경비_경호학).pdf",
            "examLabel": "제27회 일반경비지도사 2차 A형 (경호학)",
            "round": 2,
            "session": 27,
            "year": 2025,
            "elective": "경호학",
        },
        "answers": KEYS / "27-2-kyungho.json",
    },
    {
        "id": "26-2-kyungho",
        "dump": DUMPS / "제26회 일반경비지도사 2차 1교시 시험지 원본(경호학).txt",
        "meta": {
            "title": "제26회 일반경비지도사 2차 시험 (A형 · 경호학)",
            "subtitle": "2차 1교시 · 경비업법 + 경호학",
            "source": "제26회 일반경비지도사 2차 1교시 시험지 원본(경호학).pdf",
            "examLabel": "제26회 일반경비지도사 2차 A형 (경호학)",
            "round": 2,
            "session": 26,
            "year": 2024,
            "elective": "경호학",
        },
        "answers": KEYS / "26-2-kyungho.json",
    },
]


def run_spacing(data_path: Path) -> None:
    subprocess.run([sys.executable, str(SPACING), str(data_path)], check=True)


def build_catalog() -> None:
    catalog = {
        "rounds": [
            {
                "id": 1,
                "label": "1차",
                "desc": "법학개론 · 민간경비론 (80문항)",
            },
            {
                "id": 2,
                "label": "2차",
                "desc": "경비업법 + 선택과목 (80문항)",
            },
        ],
        "electives": [
            {"id": "kyungho", "label": "경호학"},
        ],
        "exams": [],
    }

    for spec in EXAM_SPECS:
        exam_id = spec["id"]
        meta_path = EXAMS / exam_id / "meta.json"
        if not meta_path.exists():
            continue
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        data_path = EXAMS / exam_id / "exam-data.json"
        count = len(json.loads(data_path.read_text(encoding="utf-8"))["questions"])
        catalog["exams"].append(
            {
                "id": exam_id,
                "round": meta["round"],
                "session": meta["session"],
                "year": meta["year"],
                "label": f"제{meta['session']}회",
                "title": meta["title"],
                "subtitle": meta.get("subtitle", ""),
                "elective": meta.get("elective"),
                "questionCount": count,
            }
        )

    catalog["exams"].sort(key=lambda e: (-e["session"], e["round"], e.get("elective") or ""))
    (EXAMS / "catalog.json").write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Wrote catalog with {len(catalog['exams'])} exams")


def main():
    EXAMS.mkdir(exist_ok=True)

    for spec in EXAM_SPECS:
        exam_id = spec["id"]
        out_dir = EXAMS / exam_id
        out_dir.mkdir(parents=True, exist_ok=True)

        if spec.get("copy_from_root"):
            shutil.copy2(ROOT / "exam-data.json", out_dir / "exam-data.json")
            shutil.copy2(ROOT / "exam-answers.json", out_dir / "exam-answers.json")
            meta = {
                "id": exam_id,
                "title": "제27회 일반경비지도사 1차 시험 (A형)",
                "subtitle": "1차 1교시 · 일반경비 (법학개론 + 민간경비론)",
                "round": 1,
                "session": 27,
                "year": 2025,
                "elective": None,
                "examLabel": "제27회 일반경비지도사 1차 A형",
            }
            (out_dir / "meta.json").write_text(
                json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            print(f"Copied {exam_id}")
            continue

        meta_path = out_dir / "meta-temp.json"
        meta = {**spec["meta"], "id": exam_id}
        meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

        subprocess.run(
            [
                sys.executable,
                str(BUILD),
                str(spec["dump"]),
                str(out_dir.relative_to(ROOT)),
                str(meta_path),
                str(spec["answers"]),
            ],
            check=True,
            cwd=ROOT,
        )
        meta_path.unlink()
        (out_dir / "meta.json").write_text(
            json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        run_spacing(out_dir / "exam-data.json")
        print(f"Built {exam_id}")

    build_catalog()


if __name__ == "__main__":
    main()
