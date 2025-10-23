# Step 0 password
touch ~/.pgpass
chmod 0600 ~/.pgpass
# sudo nano ~/.pgpass

# Add
password=<password>
echo "127.0.0.1:5432:*:postgres:$password" | sudo tee -a ~/.pgpass
echo "localhost:5432:*:postgres:$password" | sudo tee -a ~/.pgpass
cat ~/.pgpass

# Install PGagent
sudo apt install pgagent -y

psql -U postgres -h localhost -c "CREATE EXTENSION IF NOT EXISTS pgagent;"
psql -U postgres -h localhost -c "CREATE LANGUAGE plpgsql;"

mkdir -p /home/$USER/log/

# Step 1 – Copy The Unit File
# sudo nano /lib/systemd/system/pgagent.service
sudo bash -c "cat > /lib/systemd/system/pgagent.service" << EOF
[Unit]
Description=pgAgent
ConditionPathExists=/home/$USER/log/
After=network.target postgresql.service

[Service]
Type=forking
ExecStart=/usr/bin/pgagent -s /home/$USER/log/pgagent.log -l 2 hostaddr=127.0.0.1 port=5432 dbname=postgres user=postgres
StandardOutput=inherit
StandardError=inherit
RestartSec=5
Restart=always
User=$USER

[Install]
WantedBy=multi-user.target
EOF

# Step 2 – Set permissions
sudo chmod 644 /lib/systemd/system/pgagent.service

# Step 3 – Configure systemd
sudo systemctl daemon-reload
sudo systemctl enable pgagent

# Step 4 – Check status of your service
sudo systemctl restart pgagent
sudo systemctl status pgagent
sudo systemctl stop pgagent

# System reboot
sudo reboot
# You can check the status of your service using :
sudo systemctl status pgagent



# Install pgagent.sevice to /etc/systemd/system
sudo systemctl start pgagent
sudo systemctl stop pgagent

# To automatically start on reboot
sudo systemctl enable pgagent

# Check status
sudo systemctl status pgagent

# Start service
sudo systemctl start pgagent

# Stop service
sudo systemctl stop pgagent

# Check service's log
sudo journalctl -f -u pgagent
