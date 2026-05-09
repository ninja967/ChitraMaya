#!/bin/bash
dos2unix /root/chitramaya/schema/*.sql 2>/dev/null
for f in /root/chitramaya/schema/*.sql; do
    PGPASSWORD=chitramaya_pass psql -U chitramaya -h localhost -d chitramaya -f "$f"
    echo "Applied: $f"
done
systemctl restart chitramaya-api
sleep 3
systemctl is-active chitramaya-api
curl -sS http://127.0.0.1:8190/api/health
