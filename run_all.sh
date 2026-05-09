#!/bin/bash
tar -xzf /root/chitramaya.tar.gz -C /root/
bash /root/setup_db.sh > /var/log/setup_db.log 2>&1
bash /root/deploy_hf.sh > /var/log/deploy_hf.log 2>&1
bash /root/chitramaya/infra/bootstrap.sh > /var/log/setup_bootstrap.log 2>&1
: "${HF_TOKEN:?Set HF_TOKEN in the environment before running model downloads}"
bash /root/chitramaya/infra/setup-image-models.sh > /var/log/setup_image.log 2>&1
bash /root/chitramaya/infra/setup-video-models.sh > /var/log/setup_video.log 2>&1
echo "ALL DONE" > /var/log/full_setup_done.txt
