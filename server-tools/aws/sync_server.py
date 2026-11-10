"""서버를 켜기 직전에 실행 (systemd ExecStartPre, root).

1. GitHub 저장소를 최신으로 받는다.
2. Forge 서버가 없거나 버전이 바뀌었으면 설치한다.
3. 모드를 저장소 팩 목록(클라이언트 전용 제외)과 똑같이 맞춘다 (없는 것 받기, 빠진 것 지우기).
4. config, defaultconfigs, kubejs를 저장소 팩 내용으로 덮어쓴다.
5. AI 도우미 jar를 최신으로 복사한다.
6. server-control/reset-world.txt의 값이 바뀌었으면 기존 월드를 백업 폴더로 옮긴다 (초기화).
7. 실행 스크립트(start-valley.sh)를 만든다.
"""
import json
import os
import shutil
import subprocess
import sys
import threading
import time
import tomllib
import urllib.parse
import urllib.request

BASE = "/opt/valley"
REPO = f"{BASE}/repo"
PACK = f"{REPO}/pack"
SERVER = f"{BASE}/server"
JAVA = "/opt/java17/bin/java"
UA = {"User-Agent": "Mozilla/5.0 the-valley-server"}


def log(msg):
    print(f"[valley-sync] {msg}", flush=True)


def download(url, dest):
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=120) as r, open(dest + ".part", "wb") as f:
                shutil.copyfileobj(r, f)
            os.replace(dest + ".part", dest)
            return
        except Exception as e:  # noqa: BLE001
            if attempt == 3:
                raise RuntimeError(f"다운로드 실패 {url}: {e}")
            time.sleep(3)


def git_pull():
    try:
        subprocess.run(["git", "-C", REPO, "pull", "-q", "--ff-only"], check=True, timeout=120)
        log("저장소 최신으로 받음")
    except Exception as e:  # noqa: BLE001
        log(f"저장소 받기 실패 (기존 파일로 계속): {e}")


def forge_version():
    v = tomllib.load(open(f"{PACK}/pack.toml", "rb"))["versions"]
    return f"{v['minecraft']}-{v['forge']}"


def install_forge():
    ver = forge_version()
    args = f"{SERVER}/libraries/net/minecraftforge/forge/{ver}/unix_args.txt"
    if os.path.exists(args):
        return ver
    log(f"Forge {ver} 설치")
    jar = f"{SERVER}/forge-installer.jar"
    download(f"https://maven.minecraftforge.net/net/minecraftforge/forge/{ver}/forge-{ver}-installer.jar", jar)
    subprocess.run([JAVA, "-jar", jar, "--installServer"], cwd=SERVER, check=True, stdout=subprocess.DEVNULL)
    os.remove(jar)
    return ver


def mod_url(meta):
    d = meta["download"]
    if d.get("url"):
        return d["url"]
    fid = int(meta["update"]["curseforge"]["file-id"])
    return f"https://mediafilez.forgecdn.net/files/{fid // 1000}/{fid % 1000}/{urllib.parse.quote(meta['filename'])}"


def sync_mods():
    prefixes = json.load(open(f"{REPO}/scripts/client_only.json"))["prefixes"]
    mods = f"{SERVER}/mods"
    os.makedirs(mods, exist_ok=True)
    wanted = {}
    local_jars = {}
    for name in os.listdir(f"{PACK}/mods"):
        path = f"{PACK}/mods/{name}"
        if name.endswith(".pw.toml"):
            meta = tomllib.load(open(path, "rb"))
            fname = meta["filename"]
            if not any(fname.startswith(p) for p in prefixes):
                wanted[fname] = mod_url(meta)
        elif name.endswith(".jar") and not any(name.startswith(p) for p in prefixes):
            wanted[name] = None
            local_jars[name] = path
    have = set(os.listdir(mods))
    for name in have:
        if name.endswith(".jar") and name not in wanted:
            os.remove(f"{mods}/{name}")
            log(f"모드 제거: {name}")
    jobs = [(url, f"{mods}/{n}") for n, url in wanted.items() if n not in have and url]
    for n, p in local_jars.items():
        if n not in have:
            shutil.copy(p, f"{mods}/{n}")
    if jobs:
        log(f"모드 {len(jobs)}개 다운로드")
    errors = []

    def worker(chunk):
        for url, dest in chunk:
            try:
                download(url, dest)
            except Exception as e:  # noqa: BLE001
                errors.append(str(e))

    threads = [threading.Thread(target=worker, args=(jobs[i::8],)) for i in range(8)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    if errors:
        log("\n".join(errors))
        sys.exit(1)
    log(f"서버 모드 {len(wanted)}개 맞춤")


def sync_pack_files():
    for sub in ["config", "defaultconfigs", "kubejs"]:
        src = f"{PACK}/{sub}"
        if os.path.isdir(src):
            shutil.copytree(src, f"{SERVER}/{sub}", dirs_exist_ok=True, ignore=shutil.ignore_patterns("*.pw.toml"))
    os.makedirs(f"{SERVER}/thevalley_ai", exist_ok=True)
    shutil.copy(f"{REPO}/server-tools/thevalley-ai/thevalley-ai.jar", f"{SERVER}/thevalley_ai/thevalley-ai.jar")
    log("설정·스크립트 최신으로 맞춤")


def maybe_reset_world():
    flag = f"{REPO}/server-control/reset-world.txt"
    done = f"{SERVER}/.reset-done"
    if not os.path.exists(flag):
        return
    token = open(flag).read().strip()
    last = open(done).read().strip() if os.path.exists(done) else ""
    if not token or token == last:
        return
    if last == "" and not os.path.isdir(f"{SERVER}/world"):
        open(done, "w").write(token)  # 첫 설치: 월드가 없으니 기록만
        return
    stamp = time.strftime("%Y%m%d-%H%M%S")
    os.makedirs(f"{SERVER}/backups", exist_ok=True)
    if os.path.isdir(f"{SERVER}/world"):
        shutil.move(f"{SERVER}/world", f"{SERVER}/backups/world-{stamp}")
        log(f"월드 초기화: 기존 월드를 backups/world-{stamp}로 옮김")
    open(done, "w").write(token)


def write_start_script(ver):
    path = f"{SERVER}/start-valley.sh"
    with open(path, "w") as f:
        f.write("#!/usr/bin/env bash\ncd /opt/valley/server\n")
        f.write(f"exec {JAVA} @user_jvm_args.txt @libraries/net/minecraftforge/forge/{ver}/unix_args.txt nogui\n")
    os.chmod(path, 0o755)


def main():
    git_pull()
    ver = install_forge()
    sync_mods()
    sync_pack_files()
    maybe_reset_world()
    write_start_script(ver)
    subprocess.run(["chown", "-R", "minecraft:minecraft", SERVER], check=True)
    log("준비 끝, 서버 시작")


if __name__ == "__main__":
    main()
