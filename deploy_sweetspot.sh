#!/bin/bash
# Wait for ComfyUI to finish the current job
echo "Waiting for ComfyUI queue to drain..."
while true; do
  running=$(curl -sS http://127.0.0.1:8188/queue | grep -o '"queue_running": \[[^]]*\]' | grep -o '\[.*\]')
  if [[ "$running" == "[]" || -z "$running" ]]; then
    break
  fi
  sleep 30
done

echo "Queue drained! Applying sweet spot settings."
cp /root/server_sweetspot.py /root/chitramaya/core/chitramaya/server.py
systemctl restart chitramaya-api
cd /root/chitramaya
git add core/chitramaya/server.py
git commit -m "opt: adjust video defaults to speed/quality sweet spot (81 frames, 30 total steps)"
git push origin main
