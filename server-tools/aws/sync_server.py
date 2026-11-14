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


def apply_ai_limits():
    """저장소의 server-control/ai-limits.json 한도를 AI 도우미 설정에 반영 (API 키는 그대로)."""
    src = f"{REPO}/server-control/ai-limits.json"
    dst = f"{SERVER}/thevalley_ai/config.json"
    if not os.path.exists(src) or not os.path.exists(dst):
        return
    try:
        limits = json.load(open(src))
        cfg = json.load(open(dst, encoding="utf-8-sig"))
    except Exception as e:  # noqa: BLE001
        log(f"AI 한도 반영 실패 (config.json 확인): {e}")
        return
    changed = False
    for k in ["dailyLimitUsd", "monthlyLimitUsd"]:
        if k in limits and cfg.get(k) != limits[k]:
            cfg[k] = limits[k]
            changed = True
    if changed:
        with open(dst, "w", encoding="utf-8") as f:
            json.dump(cfg, f, ensure_ascii=False, indent=2)
        log(f"AI 한도: 하루 ${cfg.get('dailyLimitUsd')}, 한 달 ${cfg.get('monthlyLimitUsd')}")


def build_ko_names():
    """방송 채팅용 한국어 이름표 (모드가 바뀌었을 때만 다시 만듦)."""
    out = f"{SERVER}/thevalley_ai/ko_names.json"
    sig_file = f"{SERVER}/thevalley_ai/ko_names.sig"
    mods = sorted(os.listdir(f"{SERVER}/mods"))
    langs = []
    for root, _, files in os.walk(f"{SERVER}/kubejs/assets"):
        for f in files:
            if f == "ko_kr.json":
                p = os.path.join(root, f)
                langs.append(f"{p}:{os.path.getsize(p)}")
    sig = json.dumps([mods, sorted(langs)])
    if os.path.exists(out) and os.path.exists(sig_file) and open(sig_file).read() == sig:
        return
    r = subprocess.run([sys.executable, f"{REPO}/scripts/build_ko_names.py", SERVER, out], capture_output=True, text=True, timeout=600)
    for line in (r.stdout + r.stderr).strip().splitlines()[-3:]:
        log(line)
    if r.returncode == 0:
        open(sig_file, "w").write(sig)


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


KEEP_WORLD_BACKUPS = 1  # 초기화 때 옮겨 둔 예전 월드: 최근 것만 이만큼 남김
KEEP_LOG_DAYS = 14


def cleanup():
    """오래된 월드 백업·로그·크래시 기록 정리 (디스크 아끼기)."""
    backups = f"{SERVER}/backups"
    if os.path.isdir(backups):
        worlds = sorted(d for d in os.listdir(backups) if d.startswith("world-"))
        for d in worlds[:-KEEP_WORLD_BACKUPS] if KEEP_WORLD_BACKUPS > 0 else worlds:
            shutil.rmtree(f"{backups}/{d}", ignore_errors=True)
            log(f"오래된 월드 백업 삭제: {d}")
    cutoff = time.time() - KEEP_LOG_DAYS * 86400
    for sub in ["logs", "crash-reports"]:
        folder = f"{SERVER}/{sub}"
        if not os.path.isdir(folder):
            continue
        for name in os.listdir(folder):
            path = f"{folder}/{name}"
            if name == "latest.log" or not os.path.isfile(path):
                continue
            if os.path.getmtime(path) < cutoff:
                os.remove(path)
    subprocess.run(["journalctl", "--vacuum-time=14d"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    st = shutil.disk_usage(SERVER)
    log(f"디스크: 남은 공간 {st.free // 2**30}GB / 전체 {st.total // 2**30}GB")


def install_countdown():
    """매일 자동 끄기 타이머 설치 (server-control/schedule.json). 끄는 시각 11분 전에 valley_countdown.py 실행."""
    cfg_path = f"{REPO}/server-control/schedule.json"
    timer = "/etc/systemd/system/valley-countdown.timer"
    service = "/etc/systemd/system/valley-countdown.service"
    cfg = json.load(open(cfg_path, encoding="utf-8")) if os.path.exists(cfg_path) else {"enabled": False}
    if not cfg.get("enabled"):
        if os.path.exists(timer):
            subprocess.run(["systemctl", "disable", "--now", "valley-countdown.timer"], check=False, timeout=30)
            log("자동 끄기 꺼짐")
        return
    h, m = (int(x) for x in cfg.get("stop", "24:00").split(":"))
    lead = max(cfg.get("warnSeconds", [600])) + 60
    t = (h * 3600 + m * 60 - lead) % 86400
    when = f"*-*-* {t // 3600:02d}:{t % 3600 // 60:02d}:{t % 60:02d} Asia/Tokyo"
    want_service = (
        "[Unit]\nDescription=The Valley daily shutdown countdown\n\n[Service]\nType=oneshot\n"
        f"ExecStart=/usr/bin/python3 {REPO}/server-tools/aws/valley_countdown.py\nTimeoutStartSec=1200\n"
    )
    want_timer = f"[Unit]\nDescription=The Valley daily shutdown\n\n[Timer]\nOnCalendar={when}\nAccuracySec=1s\n\n[Install]\nWantedBy=timers.target\n"
    changed = False
    for path, text in [(service, want_service), (timer, want_timer)]:
        if not os.path.exists(path) or open(path).read() != text:
            open(path, "w").write(text)
            changed = True
    if changed:
        subprocess.run(["systemctl", "daemon-reload"], check=False, timeout=60)
    subprocess.run(["systemctl", "enable", "--now", "valley-countdown.timer"], check=False, timeout=60)
    log(f"자동 끄기: 매일 {cfg.get('stop')} (알림 시작 {when})")


def write_start_script(ver):
    path = f"{SERVER}/start-valley.sh"
    with open(path, "w") as f:
        f.write("#!/usr/bin/env bash\ncd /opt/valley/server\n")
        f.write(f"exec {JAVA} @user_jvm_args.txt @libraries/net/minecraftforge/forge/{ver}/unix_args.txt nogui\n")
    os.chmod(path, 0o755)


def main():
    before = open(__file__, "rb").read()
    git_pull()
    if open(__file__, "rb").read() != before and os.environ.get("VALLEY_SYNC_REEXEC") != "1":
        log("동기화 스크립트가 바뀌어서 새 버전으로 다시 실행")
        os.environ["VALLEY_SYNC_REEXEC"] = "1"
        os.execv(sys.executable, [sys.executable, __file__])
    ver = install_forge()
    sync_mods()
    sync_pack_files()
    try:
        build_ko_names()
    except Exception as e:  # noqa: BLE001
        log(f"한국어 이름표 실패 (영어 이름으로 계속): {e}")
    maybe_reset_world()
    try:
        cleanup()
    except Exception as e:  # noqa: BLE001
        log(f"정리 실패 (계속 진행): {e}")
    apply_ai_limits()
    try:
        install_countdown()
    except Exception as e:  # noqa: BLE001
        log(f"자동 끄기 설치 실패: {e}")
    write_start_script(ver)
    subprocess.run(["chown", "-R", "minecraft:minecraft", SERVER], check=True)
    log("준비 끝, 서버 시작")


if __name__ == "__main__":
    main()
