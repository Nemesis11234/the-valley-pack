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
    switched = 0
    for m, p, data, sha1 in targets:
        ver = found.get(sha1) if sha1 else None
        url = None
        if ver:
            for f in ver.get("files", []):
                if f.get("hashes", {}).get("sha1") == sha1:
                    url = f.get("url")
                    break
        if url:
            write_url_metafile(p, data, url, sha1)
            switched += 1
            print(f"  → Modrinth로 대체: {data['filename']}")
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

    (PACK / "manual-mods.json").write_text(json.dumps(manual_out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    summary = f"Modrinth로 대체 {switched}개, 수동 다운로드 {len(manual_out)}개"
    print(summary)
    gh = Path(sys.argv[2]) if len(sys.argv) > 2 else None
    if gh:
        with gh.open("a", encoding="utf-8") as f:
            f.write(f"### 팩 변환 결과\n\n{summary}\n\n")
            for x in manual_out:
                f.write(f"- {x['name']} (`{x['fileName']}`)\n")


if __name__ == "__main__":
    main()
