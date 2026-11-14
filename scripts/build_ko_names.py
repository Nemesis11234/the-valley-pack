#!/usr/bin/env python3
"""서버가 아는 이름(영어)을 한국어로 바꾸기 위한 표를 만든다.

서버(전용 서버)는 영어 이름만 알아서 방송 채팅에 "Cod", "Skeleton King"처럼 영어가 나옴.
모드 jar 안의 ko_kr.json, 팩의 kubejs/assets/*/lang/ko_kr.json, 마인크래프트 기본 한국어 파일을 모아
번역 키(item.minecraft.cod 등) → 한국어 이름 표를 만든다.

사용법: python3 scripts/build_ko_names.py <서버 폴더> <출력 json>
"""
import glob
import json
import re
import sys
import urllib.request
import zipfile

UA = {"User-Agent": "the-valley-pack/1.0"}
LANG = re.compile(r"assets/[^/]+/lang/ko_kr\.json$")


def keep(k, v):
    return isinstance(v, str) and len(v) <= 60 and (k.startswith(("item.", "block.", "entity.", "effect.", "biome.")) or "advancement" in k)


def load(text):
    try:
        return json.loads(text)
    except Exception:  # noqa: BLE001
        return {}


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def vanilla(version="1.20.1"):
    manifest = json.loads(get("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json"))
    url = [v["url"] for v in manifest["versions"] if v["id"] == version][0]
    index = json.loads(get(json.loads(get(url))["assetIndex"]["url"]))
    h = index["objects"]["minecraft/lang/ko_kr.json"]["hash"]
    return load(get(f"https://resources.download.minecraft.net/{h[:2]}/{h}").decode("utf-8-sig"))


def build(server):
    out = {}
    try:
        for k, v in vanilla().items():
            if keep(k, v):
                out[k] = v
    except Exception as e:  # noqa: BLE001
        print(f"[ko-names] 기본 한국어 파일 못 받음: {e}")
    for jar in sorted(glob.glob(f"{server}/mods/*.jar")):
        try:
            z = zipfile.ZipFile(jar)
        except Exception:  # noqa: BLE001
            continue
        for n in z.namelist():
            if LANG.search(n):
                for k, v in load(z.read(n).decode("utf-8-sig", "replace")).items():
                    if keep(k, v):
                        out[k] = v
    # 팩이 덮어쓴 이름이 최우선
    for f in sorted(glob.glob(f"{server}/kubejs/assets/*/lang/ko_kr.json")):
        for k, v in load(open(f, encoding="utf-8-sig").read()).items():
            if keep(k, v):
                out[k] = v
    # 서식 코드 제거
    return {k: re.sub(r"§.", "", v) for k, v in out.items()}


def main():
    server, dest = sys.argv[1], sys.argv[2]
    names = build(server)
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(names, f, ensure_ascii=False, separators=(",", ":"))
    ent = sum(1 for k in names if k.startswith("entity."))
    print(f"[ko-names] {len(names)}개 (몹 {ent}개) → {dest}")
    for k in ["item.minecraft.cod", "entity.minecraft.zombie", "entity.minecraft.creeper", "block.minecraft.stone"]:
        print(f"[ko-names]   {k} = {names.get(k)}")


if __name__ == "__main__":
    main()
