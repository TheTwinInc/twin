# Choose app
# servicename=expressdrop
# servicename=demo
# servicename=jsmpeg
servicename=server

# Copy The Unit File
sudo bash -c "cat > /lib/systemd/system/thetwin@.service" << EOF
[Unit]
Description=thetwin Web %I
ConditionPathExists=/home/$USER/thetwin/
After=network.target

[Service]
Environment=NODE_ENV=development
ExecStart=/usr/bin/node src/%i.js
WorkingDirectory=/home/$USER/thetwin
StandardOutput=journal
StandardError=journal
SyslogIdentifier=thetwin_%i
RestartSec=5
Restart=always
User=$USER

[Install]
WantedBy=multi-user.target
EOF

# Set permissions
sudo chmod 644 /lib/systemd/system/thetwin@.service

# Configure systemd
sudo systemctl daemon-reload
# Enable service
sudo systemctl enable --now thetwin@$servicename

# Check status of your service and repeat
sudo systemctl start thetwin@$servicename
sudo systemctl status thetwin@$servicename
sudo systemctl stop thetwin@$servicename


# System reboot
sudo reboot
# You can check the status of your service using :
sudo systemctl status thetwin@$servicename

# Check service's log
sudo journalctl -f -u thetwin@$servicename

# Remove service
sudo systemctl stop thetwin@$servicename
sudo systemctl disable thetwin@$servicename
sudo rm /lib/systemd/system/thetwin@.service
sudo systemctl daemon-reload
sudo systemctl reset-failed


