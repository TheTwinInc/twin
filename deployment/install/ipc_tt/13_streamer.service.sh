sudo apt install ffmpeg

# Step 1 – Copy The Unit File
sudo nano /lib/systemd/system/streamer.service
sudo bash -c "cat > /lib/systemd/system/streamer.service" << EOF
[Unit]
Description=Video Stream
ConditionPathExists=/home/$USER/streamer/
After=network.target

[Service]
Environment=NODE_ENV=production
ExecStart=/usr/bin/node stream.js
WorkingDirectory=/home/$USER/streamer/
StandardOutput=inherit
StandardError=inherit
RestartSec=5
Restart=always
User=$USER

[Install]
WantedBy=multi-user.target
EOF

# Step 2 – Set permissions
sudo chmod 644 /lib/systemd/system/streamer.service

# Step 3 – Configure systemd
sudo systemctl daemon-reload
sudo systemctl enable streamer

# Step 4 – Check status of your service
sudo systemctl start streamer
sudo systemctl status streamer
sudo systemctl stop streamer

# System reboot
sudo reboot
# You can check the status of your service using :
sudo systemctl status streamer

# Check service's log
sudo journalctl -f -u streamer

# Remove service
sudo systemctl stop streamer
sudo systemctl disable streamer
sudo rm /lib/systemd/system/streamer.service
sudo rm /etc/systemd/system/multi-user.target.wants/streamer.service
sudo systemctl daemon-reload
sudo systemctl reset-failed
