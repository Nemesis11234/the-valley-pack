"""서버 부팅 테스트: pack/ 기준으로 Forge 서버를 만들고 켜서 KubeJS 오류를 출력한다.

GitHub Actions에서 실행 (forgecdn·maven 접근 필요).
사용: python scripts/boot_test.py <server_dir>
"""
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import time
import tomllib
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, "pack")
SERVER = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "server")
UA = {"User-Agent": "Mozilla/5.0 the-valley-boot-test"}


def download(url, dest):
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as f:
                shutil.copyfileobj(r, f)
            return
        except Exception as e:  # noqa: BLE001
            if attempt == 3:
                raise RuntimeError(f"다운로드 실패 {url}: {e}")
            time.sleep(3)


def mod_url(meta):
    d = meta["download"]
    if d.get("url"):
        return d["url"]
    cf = meta["update"]["curseforge"]
    fid = int(cf["file-id"])
    return f"https://mediafilez.forgecdn.net/files/{fid // 1000}/{fid % 1000}/{urllib.parse.quote(meta['filename'])}"


def install_mods():
    prefixes = json.load(open(os.path.join(ROOT, "scripts", "client_only.json")))["prefixes"]
    mods = os.path.join(SERVER, "mods")
    os.makedirs(mods, exist_ok=True)
    jobs = []
    for name in sorted(os.listdir(os.path.join(PACK, "mods"))):
        path = os.path.join(PACK, "mods", name)
        if name.endswith(".pw.toml"):
            meta = tomllib.load(open(path, "rb"))
            fname = meta["filename"]
            if any(fname.startswith(p) for p in prefixes):
                continue
            jobs.append((mod_url(meta), os.path.join(mods, fname)))
        elif name.endswith(".jar"):
            if not any(name.startswith(p) for p in prefixes):
                shutil.copy(path, os.path.join(mods, name))
    print(f"서버 모드 {len(jobs)}개 다운로드", flush=True)
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
        print("\n".join(errors))
        sys.exit(1)


def copy_pack_files():
    for sub in ["config", "defaultconfigs", "kubejs"]:
        src = os.path.join(PACK, sub)
        if os.path.isdir(src):
            shutil.copytree(src, os.path.join(SERVER, sub), dirs_exist_ok=True,
                            ignore=shutil.ignore_patterns("*.pw.toml"))


def install_forge():
    forge = tomllib.load(open(os.path.join(PACK, "pack.toml"), "rb"))["versions"]
    ver = f"{forge['minecraft']}-{forge['forge']}"
    jar = os.path.join(SERVER, "forge-installer.jar")
    download(f"https://maven.minecraftforge.net/net/minecraftforge/forge/{ver}/forge-{ver}-installer.jar", jar)
    subprocess.run(["java", "-jar", jar, "--installServer"], cwd=SERVER, check=True,
                   stdout=subprocess.DEVNULL)
    with open(os.path.join(SERVER, "user_jvm_args.txt"), "w") as f:
        f.write("-Xms4G\n-Xmx10G\n")
    with open(os.path.join(SERVER, "eula.txt"), "w") as f:
        f.write("eula=true\n")
    with open(os.path.join(SERVER, "server.properties"), "w") as f:
        f.write("online-mode=false\nview-distance=4\nsimulation-distance=4\nspawn-protection=0\n")


def boot():
    import queue
    proc = subprocess.Popen(["bash", "run.sh", "nogui"], cwd=SERVER, stdin=subprocess.PIPE,
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    lines = queue.Queue()

    def reader():
        for line in proc.stdout:
            lines.put(line)
        lines.put(None)

    threading.Thread(target=reader, daemon=True).start()
    start = time.time()
    done = False
    stop_sent_at = None
    tail = []
    last_progress = time.time()

    def send(cmd):
        try:
            proc.stdin.write(cmd + "\n")
            proc.stdin.flush()
        except Exception:  # noqa: BLE001
            pass

    while True:
        try:
            line = lines.get(timeout=5)
        except queue.Empty:
            line = ""
        if line is None:
            break
        if line:
            tail.append(line)
            tail = tail[-300:]
            if re.search(r"Loading|Preparing|Done|ERROR|Exception|Crash", line) and time.time() - last_progress > 30:
                print(f"[{int(time.time() - start)}s] {line.rstrip()[:200]}", flush=True)
                last_progress = time.time()
            if "Failed to start the minecraft server" in line:
                print("서버가 시작에 실패함", flush=True)
                break
            if "Done (" in line and not done:
                done = True
                print(f"서버 켜짐 ({int(time.time() - start)}초)", flush=True)
                for cmd in ["scoreboard objectives list", "team list"]:
                    send(cmd)
                    time.sleep(2)
                send("stop")
                stop_sent_at = time.time()
            if done and re.search(r"objectives|teams? ", line, re.I):
                print("  " + line.rstrip(), flush=True)
        elapsed = time.time() - start
        if not done and elapsed > 1200:
            print("20분 안에 서버가 켜지지 않음", flush=True)
            break
        if stop_sent_at and time.time() - stop_sent_at > 120:
            print("종료가 2분 넘게 걸려서 강제 종료", flush=True)
            break
    if proc.poll() is None:
        proc.kill()
    if not done:
        print("".join(tail[-150:]), flush=True)
    return done


def report():
    ok = True
    for log in ["startup.log", "server.log"]:
        path = os.path.join(SERVER, "logs", "kubejs", log)
        print(f"\n===== kubejs/{log} =====")
        if not os.path.exists(path):
            print("(없음)")
            ok = False
            continue
        lines = open(path, encoding="utf-8", errors="replace").read().splitlines()
        for l in lines:
            if "thevalley" in l.lower() or "[TheValley]" in l:
                print("  " + l)
        errs = [l for l in lines if "ERR" in l[:20] or " Error " in l]
        print(f"오류 줄 {len(errs)}개:")
        for l in errs[:80]:
            print("  " + l)
        if any("thevalley" in l.lower() or "stream" in l.lower() for l in errs):
            ok = False
    return ok


if __name__ == "__main__":
    os.makedirs(SERVER, exist_ok=True)
    print("Forge 설치", flush=True)
    install_forge()
    install_mods()
    copy_pack_files()
    print("서버 시작", flush=True)
    booted = boot()
    good = report()
    print("\n===== 결과:", "통과" if booted and good else "실패", "=====")
    sys.exit(0 if booted and good else 1)
