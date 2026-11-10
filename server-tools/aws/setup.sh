#!/usr/bin/env bash
# The Valley 서버 설치 (Ubuntu, AWS EC2). 한 번만 실행:
#   curl -fsSL https://raw.githubusercontent.com/Nemesis11234/the-valley-pack/main/server-tools/aws/setup.sh | sudo -E bash
# 하는 일: Java 17, 서버 파일, 모드, 자동 시작(systemd), AI 채팅 도우미 설치.
# 이후 서버가 켜질 때마다 GitHub 저장소의 최신 설정·스크립트를 자동으로 받아 온다.
set -euo pipefail

REPO_URL="https://github.com/Nemesis11234/the-valley-pack.git"
BASE=/opt/valley
SERVER=$BASE/server
HEAP_MAX="${VALLEY_HEAP_MAX:-14G}"
HEAP_MIN="${VALLEY_HEAP_MIN:-8G}"

echo "== [1/6] 필요한 프로그램 설치"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y -q
apt-get install -y -q git tmux python3 curl ca-certificates

echo "== [2/6] 서버 전용 사용자"
id minecraft >/dev/null 2>&1 || useradd -r -m -d $BASE -s /bin/bash minecraft
mkdir -p $SERVER

echo "== [3/6] Java 17"
if [ ! -x /opt/java17/bin/java ]; then
  curl -fL --retry 3 -o /tmp/jre17.tgz "https://api.adoptium.net/v3/binary/latest/17/ga/linux/x64/jre/hotspot/normal/eclipse"
  mkdir -p /opt/java17
  tar xzf /tmp/jre17.tgz -C /opt/java17 --strip-components=1
  rm -f /tmp/jre17.tgz
fi
/opt/java17/bin/java -version 2>&1 | head -1

echo "== [4/6] 저장소 받기"
if [ -d $BASE/repo/.git ]; then git -C $BASE/repo pull -q --ff-only; else git clone -q --depth 1 "$REPO_URL" $BASE/repo; fi

echo "== [5/6] 기본 설정 파일"
cd $SERVER
[ -f eula.txt ] || echo "eula=true" > eula.txt
if [ ! -f server.properties ]; then
  cat > server.properties <<PROPS
motd=The Valley - Sunlit Valley Expanded
online-mode=true
white-list=true
enforce-whitelist=true
max-players=12
view-distance=8
simulation-distance=6
difficulty=normal
allow-flight=true
enable-command-block=true
spawn-protection=16
max-tick-time=120000
server-port=25565
PROPS
fi
if [ -n "${VALLEY_WHITELIST_B64:-}" ] && [ ! -f whitelist.json ]; then echo "$VALLEY_WHITELIST_B64" | base64 -d > whitelist.json; fi
if [ -n "${VALLEY_OPS_B64:-}" ] && [ ! -f ops.json ]; then echo "$VALLEY_OPS_B64" | base64 -d > ops.json; fi
cat > user_jvm_args.txt <<JVM
-Xms$HEAP_MIN
-Xmx$HEAP_MAX
-XX:+UseG1GC
-XX:+ParallelRefProcEnabled
-XX:MaxGCPauseMillis=200
-XX:+UnlockExperimentalVMOptions
-XX:+DisableExplicitGC
-XX:G1NewSizePercent=30
-XX:G1MaxNewSizePercent=40
-XX:G1HeapRegionSize=8M
-XX:G1ReservePercent=20
-XX:InitiatingHeapOccupancyPercent=15
JVM
chown -R minecraft:minecraft $SERVER

echo "== [6/6] 자동 시작 등록"
install -m 0644 $BASE/repo/server-tools/aws/valley.service /etc/systemd/system/valley.service
install -m 0644 $BASE/repo/server-tools/aws/valley-ai.service /etc/systemd/system/valley-ai.service
install -m 0755 $BASE/repo/server-tools/aws/valley-console /usr/local/bin/valley-console
systemctl daemon-reload
systemctl enable valley valley-ai >/dev/null 2>&1
systemctl restart valley
systemctl restart valley-ai

echo
echo "설치 끝. 첫 실행은 모드 다운로드 때문에 5~10분 걸려요."
echo "  진행 상황 보기: sudo journalctl -u valley -f   (Ctrl+C로 나가기)"
echo "  서버 콘솔 들어가기: sudo valley-console        (Ctrl+B 누르고 D로 나가기)"
