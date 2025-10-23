# Step 0 Install PGagent
sudo apt install pgagent -y

psql -U postgres -h localhost
CREATE EXTENSION IF NOT EXISTS pgagent;
\q

# User
touch ~/.pgpass
chmod 0600 ~/.pgpass
sudo nano ~/.pgpass
127.0.0.1:5432:*:postgres:dbPassword
localhost:5432:*:postgres:dbPassword


# Step 1 – Copy The Unit File
# sudo cp ~/expressdrop/install/cloud/03_pgagent/pgagent.service /lib/systemd/system/pgagent.service
sudo nano /lib/systemd/system/pgagent.service

# Step 2 – Set permissions
sudo chmod 644 /lib/systemd/system/pgagent.service

# Step 3 – Configure systemd
sudo systemctl daemon-reload
sudo systemctl enable pgagent.service

# Step 4 – Check status of your service
sudo systemctl start pgagent.service
sudo systemctl status pgagent.service
sudo systemctl restart pgagent.service
sudo systemctl stop pgagent.service

# System reboot
sudo reboot
# You can check the status of your service using :
sudo systemctl status pgagent.service



# Copy pgagent.sevice to /etc/systemd/system
sudo systemctl start pgagent.service
sudo systemctl stop pgagent.service

# To automatically start on reboot
sudo systemctl enable pgagent.service

# Check status
sudo systemctl status pgagent.service

# Start service
sudo systemctl start pgagent.service

# Stop service
sudo systemctl stop pgagent.service

# Check service's log
sudo journalctl -f -u pgagent.service
