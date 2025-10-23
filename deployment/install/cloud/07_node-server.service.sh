# Copy The Unit File
sudo nano /lib/systemd/system/node-server@.service

# Set permissions
sudo chmod 644 /lib/systemd/system/node-server@.service

# Choose app
app_name=expressdrop
app_name=demo
app_name=jsmpeg
app_name=sbd
# Configure systemd
sudo systemctl daemon-reload
sudo systemctl enable --now node-server@$app_name

# Check status of your service and repeat
sudo systemctl start node-server@$app_name
sudo systemctl restart node-server@$app_name
sudo systemctl status node-server@$app_name
sudo systemctl stop node-server@$app_name

# System reboot
sudo reboot
# You can check the status of your service using :
sudo systemctl status node-server@$app_name

# Check service's log
sudo journalctl -f -u node-server@$app_name

# Remove service
# sudo systemctl stop node-server@$app_name
# sudo systemctl disable node-server@$app_name
# sudo rm /etc/systemd/system/node-server@.service
# sudo systemctl daemon-reload
# sudo systemctl reset-failed
