#!/usr/bin/env python3
"""packwiz로 가져온 팩에서 'CurseForge 자동 다운로드 금지' 모드를 처리한다.

1. `packwiz modrinth export` 로그에서 수동 다운로드 목록을 읽는다.
2. 같은 파일(SHA1 동일)이 Modrinth에 있으면 Modrinth 직접 링크로 바꾼다.
3. 없으면 packwiz 목록에서 빼고 manual-mods.json에 적는다 (런처가 안내).

사용법: (pack 폴더에서) python3 ../scripts/postprocess.py export.log
"""
import json
import re
import sys
import tomllib
import urllib.request
from pathlib import Path

PACK = Path.cwd()


def toml_str(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def read_manual_list(log_path: Path, filenames):
    """'이름 (파일명) from URL' 줄을 읽는다. 이름·파일명 모두 괄호를 포함할 수 있어서
    정규식 대신 실제 파일명 목록과 대조해서 자른다."""
    text = log_path.read_text(encoding="utf-8", errors="replace")
    if "manual downloads" not in text:
        return []
    out = []
    for line in text.splitlines():
        line = line.strip()
        m = re.search(r" from (https?://\S+)$", line)
        if not m:
            continue
        head = line[: m.start()]
        url = m.group(1)
        # 가장 긴 파일명부터 맞춰본다
        for fn in sorted(filenames, key=len, reverse=True):
            suffix = f" ({fn})"
            if head.endswith(suffix):
                out.append({"name": head[: -len(suffix)], "file": fn, "url": url})
                break
        else:
            print(f"  ! 파일명을 못 찾은 줄: {line}")
    return out


def index_metafiles():
    by_file = {}
    for p in PACK.rglob("*.pw.toml"):
        try:
            data = tomllib.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        fn = data.get("filename")
        if fn:
            by_file[fn] = (p, data)
    return by_file


def modrinth_lookup(sha1s):
    if not sha1s:
        return {}
    body = json.dumps({"hashes": sha1s, "algorithm": "sha1"}).encode()
    req = urllib.request.Request(
        "https://api.modrinth.com/v2/version_files",
        data=body,
        headers={"Content-Type": "application/json", "User-Agent": "Nemesis11234/the-valley-pack (launcher build)"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


REDIST = json.loads((Path(__file__).parent / "redistributable.json").read_text(encoding="utf-8"))
EXCLUDE = set(json.loads((Path(__file__).parent / "exclude.json").read_text(encoding="utf-8"))["files"])


def strip_pack_refs(names):
    """제외한 파일을 가리키는 팩 설정을 정리한다 (게임 안 경고·리소스팩 오류 방지)."""
    # 1) 팩 자체의 '빠진 모드 알림' 목록
    mmc = PACK / "config" / "missing_mods_checker.json"
    if mmc.exists():
        items = json.loads(mmc.read_text(encoding="utf-8"))
        kept = [x for x in items if not any(re.fullmatch(x.get("pattern", "$^"), n) for n in names)]
        if len(kept) != len(items):
            mmc.write_text(json.dumps(kept, ensure_ascii=False, indent=4) + "\n", encoding="utf-8")
            print(f"  · missing_mods_checker에서 {len(items) - len(kept)}개 제거")
    # 2) 기본 리소스팩 목록
    refs = {f"file/{n}" for n in names}
    rpo = PACK / "config" / "resourcepackoverrides.json"
    if rpo.exists():
        data = json.loads(rpo.read_text(encoding="utf-8"))

        def clean(v):
            if isinstance(v, list):
                return [clean(x) for x in v if not (isinstance(x, str) and x in refs)]
            if isinstance(v, dict):
                return {k: clean(x) for k, x in v.items()}
            return v
        rpo.write_text(json.dumps(clean(data), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    opt = PACK / "configureddefaults" / "options.txt"
    if opt.exists():
        # 줄바꿈이 섞여 있는 파일이라 두 줄의 배열 부분만 바꾸고 나머지는 바이트 그대로 둔다
        raw = opt.read_bytes().decode("utf-8")

        def fix(m):
            try:
                arr = [x for x in json.loads(m.group(2)) if x not in refs]
            except json.JSONDecodeError:
                return m.group(0)
            return m.group(1) + json.dumps(arr, ensure_ascii=False, separators=(",", ":"))
        new = re.sub(r"(?m)^((?:resourcePacks|incompatibleResourcePacks):)(\[[^\r\n]*\])", fix, raw)
        if new != raw:
            opt.write_bytes(new.encode("utf-8"))


def bundle_from_cdn(cf_url: str, filename: str, sha1: str, dest: Path) -> bool:
    """재배포 허용(MIT 등) 파일을 CurseForge CDN에서 받아 팩 폴더에 그대로 넣는다."""
    import hashlib
    import urllib.parse
    m = re.search(r"/files/(\d+)", cf_url)
    if not m:
        return False
    fid = int(m.group(1))
    url = f"https://mediafilez.forgecdn.net/files/{fid // 1000}/{fid % 1000}/{urllib.parse.quote(filename)}"
    req = urllib.request.Request(url, headers={"User-Agent": "Nemesis11234/the-valley-pack (pack build)"})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
    if sha1 and hashlib.sha1(data).hexdigest() != sha1:
        print(f"  ! 해시 불일치: {filename}")
        return False
    dest.write_bytes(data)
    return True


def write_url_metafile(path: Path, data: dict, url: str, sha1: str):
    lines = [
        f"name = {toml_str(data.get('name', ''))}",
        f"filename = {toml_str(data['filename'])}",
        f"side = {toml_str(data.get('side', 'both'))}",
        "",
        "[download]",
        f"url = {toml_str(url)}",
        'hash-format = "sha1"',
        f"hash = {toml_str(sha1)}",
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")


def main():
    log_path = Path(sys.argv[1])
    meta = index_metafiles()
    manual = read_manual_list(log_path, list(meta.keys()))
    print(f"수동 다운로드 대상: {len(manual)}개")

    targets = []
    for m in manual:
        hit = meta.get(m["file"])
        if not hit:
            print(f"  ! 메타파일 없음: {m['file']}")
            continue
        p, data = hit
        dl = data.get("download", {})
        sha1 = dl.get("hash") if dl.get("hash-format") == "sha1" else None
        targets.append((m, p, data, sha1))

    found = modrinth_lookup([t[3] for t in targets if t[3]])

    manual_out = []
    bundled = []
    excluded = []
    switched = 0
    for m, p, data, sha1 in targets:
        ver = found.get(sha1) if sha1 else None
        url = None
        if ver:
            for f in ver.get("files", []):
                if f.get("hashes", {}).get("sha1") == sha1:
                    url = f.get("url")
                    break
        if data["filename"] in EXCLUDE:
            p.unlink()
            excluded.append(data["filename"])
            print(f"  → 팩에서 제외: {data['filename']}")
        elif url:
            write_url_metafile(p, data, url, sha1)
            switched += 1
            print(f"  → Modrinth로 대체: {data['filename']}")
        elif data["filename"] in REDIST and bundle_from_cdn(m["url"], data["filename"], sha1, p.parent / data["filename"]):
            p.unlink()
            bundled.append(data["filename"])
            print(f"  → 저장소에 포함 ({REDIST[data['filename']]['license']}): {data['filename']}")
        else:
            rel_dir = p.parent.relative_to(PACK).as_posix()
            manual_out.append({
                "name": m["name"],
                "fileName": data["filename"],
                "url": m["url"],
                "sha1": sha1,
                "path": rel_dir,
            })
            p.unlink()
            print(f"  → 런처 수동 안내: {data['filename']}")

    # 수동 다운로드 대상이 아니더라도 제외 목록에 있으면 뺀다
    for fn in EXCLUDE - set(excluded):
        hit = meta.get(fn)
        if hit:
            hit[0].unlink()
            excluded.append(fn)
            print(f"  → 팩에서 제외: {fn}")
    if excluded:
        strip_pack_refs(excluded)

    (PACK / "manual-mods.json").write_text(json.dumps(manual_out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    summary = f"Modrinth로 대체 {switched}개, 저장소에 포함 {len(bundled)}개, 제외 {len(excluded)}개, 수동 다운로드 {len(manual_out)}개"
    print(summary)
    gh = Path(sys.argv[2]) if len(sys.argv) > 2 else None
    if gh:
        with gh.open("a", encoding="utf-8") as f:
            f.write(f"### 팩 변환 결과\n\n{summary}\n\n")
            for x in manual_out:
                f.write(f"- {x['name']} (`{x['fileName']}`)\n")


if __name__ == "__main__":
    main()
