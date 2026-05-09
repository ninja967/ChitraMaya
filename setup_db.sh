#!/bin/bash
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
sudo -u postgres psql -c "CREATE USER chitramaya WITH PASSWORD 'chitramaya_pass';"
sudo -u postgres psql -c "CREATE DATABASE chitramaya OWNER chitramaya;"
echo "Database setup complete"
