#!/bin/bash

sudo cp -a ~/install/dist/fastdrop/. /usr/share/nginx/html/fastdrop/
# Clear chromium cache
sudo rm -rf ~/.cache/chromium/
sudo rm -rf /home/kis-admin/.cache/chromium/

sudo systemctl restart kiosk
