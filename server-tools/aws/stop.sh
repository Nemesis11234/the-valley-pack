#!/usr/bin/env bash
# 월드를 저장하고 서버를 끈다 (EC2 인스턴스를 중지할 때도 자동으로 불림)
if tmux has-session -t mc 2>/dev/null; then
  tmux send-keys -t mc "say 서버를 곧 종료합니다" Enter
  sleep 2
  tmux send-keys -t mc "stop" Enter
  for i in $(seq 1 180); do
    tmux has-session -t mc 2>/dev/null || exit 0
    sleep 1
  done
fi
exit 0
