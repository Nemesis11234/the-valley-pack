#!/usr/bin/env python3
"""scripts/extra_mods.json의 모드를 pack/mods에 추가 (없을 때만). CI에서 pack 폴더 안에서 실행.

사용법: (저장소 루트에서) python3 scripts/add_extra_mods.py pack
"""
import json
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = {"User-Agent": "the-valley-pack/1.0 (github.com/Nemesis11234/the-valley-pack)"}


def api(path):
    req = urllib.request.Request("https://api.modrinth.com/v2/" + path, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def main():
    pack = Path(sys.argv[1]).resolve()
    cfg = json.loads((ROOT / "scripts" / "extra_mods.json").read_text(encoding="utf-8"))
    for m in cfg.get("modrinth", []):
        project = api("project/" + m["slug"])
        pid = project["id"]
        already = [p for p in (pack / "mods").glob("*.pw.toml") if f'mod-id = "{pid}"' in p.read_text(encoding="utf-8")]
        if already:
            print(f"  = {m['slug']}: 이미 있음 ({already[0].name})")
            continue
        q = urllib.parse.urlencode({"loaders": '["forge"]', "game_versions": '["1.20.1"]'})
        versions = api(f"project/{pid}/version?{q}")
        match = [v for v in versions if v["version_number"] == m["version"]]
        if not match:
            print(f"  ! {m['slug']}: 버전 {m['version']}을 못 찾음. 있는 버전: {[v['version_number'] for v in versions[:5]]}")
            sys.exit(1)
        vid = match[0]["id"]
        print(f"  + {m['slug']} {m['version']} ({vid})")
        subprocess.run(["packwiz", "-y", "modrinth", "add", "--project-id", pid, "--version-id", vid], cwd=pack, check=True)


if __name__ == "__main__":
    main()
