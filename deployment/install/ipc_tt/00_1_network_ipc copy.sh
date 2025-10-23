sudo apt install -y dnsutils
sudo apt install -y net-tools netplan.io

# Setup keyboard
# Permanent
sudo localectl set-keymap no

# Hostname xdXXX-ipc127
hostname=xd006-ipc127
sudo hostnamectl set-hostname $hostname

sudo sed -i "s+127.0.0.1.*+127.0.0.1       localhost app.fastdrop.no ws.fastdrop.no db.fastdrop.no+g" /etc/hosts
sudo sed -i "s+127.0.1.1.*+127.0.1.1       $hostname+g" /etc/hosts

echo "192.168.10.51   plc-fastdrop" | sudo tee -a /etc/hosts

# Step 0 To enable network manually if internet is not available
ip a

sudo ip link set eno1 up

# Find IPC dhcp address
sudo ip addr add 192.168.201.101/24 dev eno1
sudo ip route add default via 192.168.201.1 dev eno1

# Add nameserver
echo "nameserver 8.8.8.8" | sudo tee -a /etc/resolv.conf

# Find IPC fixed address
sudo ip addr add 192.168.201.39/24 dev eno2

# Add extra ip address if necessary
sudo ip addr add 192.168.10.151/24 broadcast 192.168.10.255 dev eno1 label eno1:1

# Step 0.5 To enable network automatically
sudo bash -c "cat > /etc/netplan/00-installer-config.yaml" << EOF
network:
  version: 2
  ethernets:
    eno1:
      dhcp4: no
      addresses:
        [10.87.0.224/24]
      routes:
        - to: 0.0.0.0/0
          via: 10.87.0.1
          metric: 200
      nameservers:
        addresses: [10.87.0.1,8.8.8.8]
    eno2:
      dhcp4: yes
      nameservers:
        addresses: [8.8.8.8]
      optional: true
EOF

# Add extra ip address if necessary when using only 1 network port
sudo bash -c "cat > /etc/netplan/10-installer-config.yaml" << EOF
network:
  version: 2
  ethernets:
    eno1:
      addresses:
        [192.168.10.151/24]
EOF

# Apply changes
sudo netplan apply

# Show routes
sudo ip route show

# Add firewall
sudo apt install -y ufw

sudo ufw status

sudo ufw allow ssh
sudo ufw allow 5432
sudo ufw allow 3000
sudo ufw allow 2000
sudo ufw allow 2001
sudo ufw allow 8020
sudo ufw allow 8080

sudo ufw enable

sudo shutdown -r now

