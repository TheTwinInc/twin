# If not installed install pip
sudo apt install -y python3-pip

# Loader
python3 -m pip install pyserial

# Unloader
python3 -m pip install websocket-client

sudo usermod -a -G dialout $USER

# Connect usb scanner and verify device
lsusb

# Connect usb scanner and verify name
sudo dmesg | grep tty

app_name=loader
# app_name=unloader

# Step 1 – Copy The Unit File
sudo bash -c "cat > /lib/systemd/system/scanner@.service" << EOF
[Unit]
Description=Barcode Scanner %I
ConditionPathExists=/home/$USER/scanner/
After=network.target xdrop@scanner.service

[Service]
Environment=NODE_ENV=production
ExecStart=python %i.py
WorkingDirectory=/home/$USER/scanner
StandardOutput=journal
StandardError=journal
SyslogIdentifier=%i_service
RestartSec=5
Restart=always
User=$USER

[Install]
WantedBy=multi-user.target
EOF

# Step 2 – Set permissions
sudo chmod 644 /lib/systemd/system/scanner@.service

# Step 3 – Configure systemd
sudo systemctl daemon-reload
sudo systemctl enable --now scanner@$app_name

# Step 4 – Check status of your service
sudo systemctl start scanner@$app_name
sudo systemctl status scanner@$app_name
sudo systemctl stop scanner@$app_name

# System reboot
sudo reboot
# You can check the status of your service using :
sudo systemctl status scanner@$app_name

# Check service's log
sudo journalctl -f -u scanner@$app_name

# Remove service
sudo systemctl stop scanner@$app_name
sudo systemctl disable scanner@$app_name
sudo rm /lib/systemd/system/scanner@.service
sudo rm /etc/systemd/system/multi-user.target.wants/scanner@.service
sudo systemctl daemon-reload
sudo systemctl reset-failed
