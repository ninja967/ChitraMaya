#!/bin/bash
set -x
# 1. System packages
apt-get update -y
apt-get install -y python3-venv python3.13-venv curl git
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 2. Start API
cd /root/chitramaya
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cat << 'EOF' > /etc/systemd/system/chitramaya-api.service
[Unit]
Description=ChitraMaya API
After=network.target postgresql.service comfyui.service

[Service]
User=root
WorkingDirectory=/root/chitramaya
Environment="PATH=/root/chitramaya/.venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment="DATABASE_URL=postgresql://chitramaya:chitramaya_pass@localhost:5432/chitramaya"
Environment="COMFY_URL=http://127.0.0.1:8188"
Environment="PYTHONPATH=core"
ExecStart=/root/chitramaya/.venv/bin/uvicorn chitramaya.server:app --host 0.0.0.0 --port 8190
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable chitramaya-api
systemctl restart chitramaya-api

# 3. Build UI
cd /root/chitramaya/dashboard
npm install
npm run build

# 4. HF Space Deployment
cd /root/chitramaya/hosting
mkdir -p public
cp -r ../dashboard/dist/* public/
# Set proxy target to the droplet
sed -i "s|http://165.245.130.122:8190|http://134.199.192.206:8190|g" proxy.js

rm -rf .git
git init
git config user.email "chitramaya@example.com"
git config user.name "ChitraMaya"
git add .
git commit -m "Deploy ChitraMaya HF Space"
: "${HF_SPACE_REPO:?Set HF_SPACE_REPO, for example https://huggingface.co/spaces/<user>/<space>}"
git push -f "$HF_SPACE_REPO" master:main
echo "HF Space Deployment Complete"
