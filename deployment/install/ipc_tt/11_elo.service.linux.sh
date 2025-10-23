sudo apt install -y libudev-dev

# elo light status
sudo -i
python3 -m pip install websocket-client
python3 -m pip install rel
exit


# Install elo library
# Compile the elo library 
cd ~/elo/libelo

make

sudo cp /home/$USER/elo/libelo/libelo.so /usr/lib

sudo chmod 0755 /usr/lib/libelo.so

sudo ldconfig

sudo ldconfig -p | grep elo

make clean
 
# gcc -Wall -o test test.c -lelo
# gcc -Wall -o elo elo.c -lelo

# sudo ./test 111


app_name=status_light

# Step 1 – Copy The Unit File
sudo bash -c "cat > /lib/systemd/system/elo@.service" << EOF
[Unit]
Description=ELO %I
ConditionPathExists=/home/$USER/elo/
After=network.target xdrop@scanner.service

[Service]
Environment=NODE_ENV=production
ExecStart=python %i.py
WorkingDirectory=/home/$USER/elo
StandardOutput=journal
StandardError=journal
SyslogIdentifier=%i_service
RestartSec=5
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

# Step 2 – Set permissions
sudo chmod 644 /lib/systemd/system/elo@.service

# Step 3 – Configure systemd
sudo systemctl daemon-reload
sudo systemctl enable --now elo@$app_name

# Step 4 – Check status of your service
sudo systemctl start elo@$app_name
sudo systemctl status elo@$app_name
sudo systemctl stop elo@$app_name

# System reboot
sudo reboot
# You can check the status of your service using :
sudo systemctl status elo@$app_name

# Check service's log
sudo journalctl -f -u elo@$app_name

# Remove service
sudo systemctl stop elo@$app_name
sudo systemctl disable elo@$app_name
sudo rm /lib/systemd/system/elo@.service
sudo rm /etc/systemd/system/multi-user.target.wants/elo@.service
sudo systemctl daemon-reload
sudo systemctl reset-failed
