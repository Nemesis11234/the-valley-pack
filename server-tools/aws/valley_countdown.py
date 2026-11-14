#!/usr/bin/env python3
"""매일 정해진 시각에 서버 끄기 (server-control/schedule.json의 stop, 일본 시간).

systemd 타이머(valley-countdown.timer)가 끄기 10분 전에 실행한다.
10분·5분·3분·1분·30초·10초 전에 게임 안에 알리고, 정각에 월드를 저장하고 서버와 인스턴스를 끈다.
"""
import datetime
import json
import os
import subprocess
import sys
import time

REPO = "/opt/valley/repo"
JST = datetime.timezone(datetime.timedelta(hours=9))
DRY = os.environ.get("VALLEY_COUNTDOWN_DRY") == "1"  # 시험용: 명령 대신 출력만, 시간 빠르게
SPEED = float(os.environ.get("VALLEY_COUNTDOWN_SPEED", "1"))


def log(msg):
    print(f"[valley-countdown] {msg}", flush=True)


def console(cmd):
    if DRY:
        log(f"콘솔: {cmd}")
        return
    subprocess.run(["sudo", "-u", "minecraft", "tmux", "send-keys", "-t", "mc", cmd, "Enter"], check=False)


def label(sec):
    return f"{sec // 60}분" if sec >= 60 else f"{sec}초"


def warn(sec, stop_text):
    text = f"{label(sec)} 뒤 서버가 꺼져요 ({stop_text})"
    console("tellraw @a " + json.dumps([{"text": "[서버] ", "color": "#FF5555"}, {"text": text, "color": "#FFD54F", "bold": True}], ensure_ascii=False))
    if sec <= 60:
        console("title @a times 5 50 10")
        console("title @a subtitle " + json.dumps({"text": "월드는 자동으로 저장돼요", "color": "#AAAAAA"}, ensure_ascii=False))
        console("title @a title " + json.dumps({"text": f"{label(sec)} 뒤 서버 종료", "color": "#FF5555"}, ensure_ascii=False))
    else:
        console("title @a actionbar " + json.dumps({"text": text, "color": "#FFD54F"}, ensure_ascii=False))


def target_time(now, stop):
    h, m = (int(x) for x in stop.split(":"))
    day = now.date()
    if h >= 24:
        h -= 24
        day = day + datetime.timedelta(days=1)
    t = datetime.datetime(day.year, day.month, day.day, h, m, tzinfo=JST)
    if t <= now:
        t += datetime.timedelta(days=1)
    return t


def main():
    cfg = json.load(open(os.environ.get("VALLEY_SCHEDULE", f"{REPO}/server-control/schedule.json"), encoding="utf-8"))
    if not cfg.get("enabled", True):
        log("자동 끄기 꺼져 있음")
        return
    stop = cfg.get("stop", "24:00")
    now = datetime.datetime.fromisoformat(os.environ["VALLEY_COUNTDOWN_NOW"]) if os.environ.get("VALLEY_COUNTDOWN_NOW") else datetime.datetime.now(JST)
    target = target_time(now, stop)
    left = (target - now).total_seconds()
    if left > 15 * 60:
        log(f"끄는 시각까지 {int(left)}초 남아서 아무것도 안 함")
        return
    stop_text = "매일 24시" if stop == "24:00" else f"매일 {stop}"
    start_real = time.time()
    for sec in sorted(cfg.get("warnSeconds", [600, 300, 180, 60, 30, 10]), reverse=True):
        wait = (left - sec) / SPEED - (time.time() - start_real)
        if wait < -5 / SPEED:
            continue  # 이미 지난 알림
        if wait > 0:
            time.sleep(wait)
        warn(sec, stop_text)
        log(f"{label(sec)} 전 알림")
    wait = left / SPEED - (time.time() - start_real)
    if wait > 0:
        time.sleep(wait)
    log("서버 끄기")
    if DRY:
        return
    time.sleep(2)
    subprocess.run(["systemctl", "stop", "valley-ai"], check=False, timeout=60)
    subprocess.run(["systemctl", "stop", "valley"], check=False, timeout=300)  # stop.sh가 월드 저장
    subprocess.run(["shutdown", "-h", "now"], check=False)  # 인스턴스 중지 (요금 멈춤)


if __name__ == "__main__":
    sys.exit(main())
