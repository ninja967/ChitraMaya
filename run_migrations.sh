#!/bin/bash
MIGRATIONS_DIR="/root/chitramaya/migrations"
if [ ! -d "$MIGRATIONS_DIR" ]; then
    MIGRATIONS_DIR="/root/migrations"
fi
if [ ! -d "$MIGRATIONS_DIR" ]; then
    MIGRATIONS_DIR="/root/chitramaya/schema"
fi
dos2unix "$MIGRATIONS_DIR"/*.sql 2>/dev/null
for f in $(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
    [ -f "$f" ] || continue
    PGPASSWORD=chitramaya_pass psql -U chitramaya -h localhost -d chitramaya -f "$f"
    echo "Applied: $f"
done
systemctl restart chitramaya-api
sleep 3
systemctl is-active chitramaya-api
curl -sS http://127.0.0.1:8190/api/health
