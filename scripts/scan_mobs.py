#!/usr/bin/env python3
"""팩에 들어 있는 모드 jar에서 몬스터 기본 능력치(체력·공격력·방어력 등)를 뽑는다.

1.20.1 Forge jar는 SRG 이름을 쓰므로, 속성 빌더에 넘기는 상수를 javap 바이트코드에서 읽는다.
  Attributes.MAX_HEALTH = f_22276_ 처럼 필드 이름으로 속성을 구분한다.

사용법: python3 scripts/scan_mobs.py <pack 폴더> <모드 메타파일 이름...>
  예: python3 scripts/scan_mobs.py pack dragons-den irons-spells-n-spellbooks
출력: mob-stats.json, mob-stats.md
"""
import json
import re
import subprocess
import sys
import tempfile
import tomllib
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

ATTR = {
    "f_22276_": "체력",
    "f_22281_": "공격력",
    "f_22284_": "방어력",
    "f_22285_": "방어강도",
    "f_22279_": "이동속도",
    "f_22278_": "넉백저항",
    "f_22277_": "추적거리",
}
NEEDLE = b"f_22276_"  # MAX_HEALTH를 쓰는 클래스만 분석

NUM = re.compile(
    r"(?:ldc2?_w|ldc)\s+#\d+\s+//\s+(?:double|float)\s+([-\d.E]+)[df]?"
    r"|dconst_([01])|fconst_([012])"
    r"|(?:bipush|sipush)\s+(-?\d+)|iconst_(m1|[0-5])"
)


def download(meta: Path, dest: Path) -> Path:
    d = tomllib.loads(meta.read_text(encoding="utf-8"))
    fn = d["filename"]
    dl = d.get("download", {})
    if dl.get("url"):
        url = dl["url"]
    else:
        fid = int(d["update"]["curseforge"]["file-id"])
        url = f"https://mediafilez.forgecdn.net/files/{fid // 1000}/{fid % 1000}/{urllib.parse.quote(fn)}"
    out = dest / fn
    req = urllib.request.Request(url, headers={"User-Agent": "Nemesis11234/the-valley-pack (mob scan)"})
    with urllib.request.urlopen(req, timeout=300) as r:
        out.write_bytes(r.read())
    return out


def scan_jar(jar: Path, work: Path):
    results = {}
    with zipfile.ZipFile(jar) as z:
        names = [n for n in z.namelist() if n.endswith(".class")]
        hits = [n for n in names if NEEDLE in z.read(n)]
        if not hits:
            return results
        cdir = work / jar.stem
        for n in hits:
            z.extract(n, cdir)
    for n in hits:
        cls = cdir / n
        try:
            code = subprocess.run(["javap", "-c", "-p", str(cls)], capture_output=True, text=True, timeout=60).stdout
        except subprocess.TimeoutExpired:
            continue
        lines = code.splitlines()
        stats = {}
        for i, line in enumerate(lines):
            m = re.search(r"getstatic\s+#\d+\s+//\s+Field\s+\S*Attributes\.(f_\d+_)", line)
            if not m or m.group(1) not in ATTR:
                continue
            # 다음 몇 줄 안에 오는 숫자 상수가 값
            for nxt in lines[i + 1:i + 4]:
                v = NUM.search(nxt)
                if v:
                    g = v.groups()
                    val = float(g[0]) if g[0] else float(g[1] or g[2] or g[3] or (-1 if g[4] == "m1" else g[4]))
                    stats.setdefault(ATTR[m.group(1)], val)
                    break
        if "체력" in stats:
            results[n[:-6].replace("/", ".")] = stats
    return results


def main():
    pack = Path(sys.argv[1])
    mods = sys.argv[2:]
    all_stats = {}
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        for m in mods:
            meta = pack / "mods" / f"{m}.pw.toml"
            try:
                jar = download(meta, tmp)
                res = scan_jar(jar, tmp)
                all_stats[m] = res
                print(f"{m}: 몬스터 {len(res)}종")
            except Exception as e:  # noqa: BLE001
                print(f"{m}: 실패 {e}")
                all_stats[m] = {"_error": str(e)}
    Path("mob-stats.json").write_text(json.dumps(all_stats, ensure_ascii=False, indent=2), encoding="utf-8")

    cols = ["체력", "공격력", "방어력", "방어강도", "이동속도", "넉백저항"]
    md = ["# 몬스터 기본 능력치 (모드 jar에서 추출)", ""]
    for m, res in all_stats.items():
        md.append(f"## {m}")
        if "_error" in res:
            md.append(f"실패: {res['_error']}")
            continue
        md.append("| 클래스 | " + " | ".join(cols) + " |")
        md.append("|---|" + "---|" * len(cols))
        for cls, s in sorted(res.items(), key=lambda kv: -kv[1].get("체력", 0)):
            md.append(f"| {cls.split('.')[-1]} | " + " | ".join(f"{s[c]:g}" if c in s else "" for c in cols) + " |")
        md.append("")
    Path("mob-stats.md").write_text("\n".join(md), encoding="utf-8")


if __name__ == "__main__":
    main()
