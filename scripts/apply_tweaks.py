#!/usr/bin/env python3
"""가져온 팩에 우리 쪽 변경을 덮어쓴다.

1. 저장소의 pack-extra/ 내용을 pack/에 그대로 복사 (추가 스크립트 등)
2. scripts/tweaks.json의 문자열 치환 적용 (이미 바뀌어 있으면 통과, 둘 다 없으면 실패)

사용법: (저장소 루트에서) python3 scripts/apply_tweaks.py pack
"""
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    pack = Path(sys.argv[1]).resolve()
    extra = ROOT / "pack-extra"
    if extra.is_dir():
        for src in extra.rglob("*"):
            if src.is_file():
                dest = pack / src.relative_to(extra)
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dest)
                print(f"  + {dest.relative_to(pack).as_posix()}")

    tweaks = json.loads((ROOT / "scripts" / "tweaks.json").read_text(encoding="utf-8"))
    failed = False
    for t in tweaks["replace"]:
        p = pack / t["file"]
        raw = p.read_bytes().decode("utf-8")
        find, repl = t["find"], t["with"]
        # 원본이 CRLF 줄바꿈이면 그에 맞춰서 찾는다
        if find not in raw and "\r\n" in raw:
            find, repl = find.replace("\n", "\r\n"), repl.replace("\n", "\r\n")
        label = t.get("why") or f"{t['find'][:40]} → {t['with'][:40]}"
        if find in raw:
            p.write_bytes(raw.replace(find, repl).encode("utf-8"))
            print(f"  ~ {t['file']}: {label}")
        elif repl in raw:
            print(f"  = {t['file']}: 이미 적용됨")
        else:
            print(f"  ! {t['file']}: '{t['find']}'를 찾지 못함 (팩이 바뀐 듯, tweaks.json 확인 필요)")
            failed = True
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
