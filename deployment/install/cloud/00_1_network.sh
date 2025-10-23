sudo apt install -y dnsutils

server_name=thetwin

sudo hostnamectl set-hostname $server_name-cloud

sudo nano /etc/hosts
127.0.0.1 localhost
# OR for client connected locally
127.0.0.1 localhost app.thetwin.no

sudo apt -y install net-tools netplan.io
# Step 0 To enable network manually
ip a

sudo ip link set enp1s0f0 up

# Add IPC dhcp address
sudo ip addr add 192.168.201.101/24 dev eno1
sudo ip route add default via 192.168.201.1 dev enp1s0f0

# Add IPC fixed address
sudo ip addr add 192.168.202.39/24 dev eno2

# Add extra ip address if necessary
sudo ip addr add 192.168.10.151/24 broadcast 192.168.10.255 dev enp1s0f0 label eno1:1

# Step 0.5 To enable network automatically
sudo nano /etc/netplan/00-installer-config.yaml

# This is the network config written by 'subiquity'
network:
  version: 2
  ethernets:
    eno1:
      dhcp4: yes
      nameservers:
        addresses: [8.8.8.8]
    eno2:
      dhcp4: no
      addresses:
        [192.168.201.39/24]
      # gateway4: 192.168.10.1
      routes:
        - to: 0.0.0.0/0
          via: 192.168.10.1
          metric: 500
      nameservers:
        addresses: [192.168.10.1,8.8.8.8]

# Add extra ip address if necessary
sudo nano /etc/netplan/10-installer-config.yaml

network:
  version: 2
  ethernets:
    eno1:
      addresses:
        [192.168.11.151/24]


# Apply changes
sudo netplan apply

# Show routes
sudo ip route show

# Add firewall
sudo apt install -y ufw

sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
# sudo ufw allow 8020
sudo ufw allow 3000

sudo ufw reload

sudo ufw enable

sudo shutdown -r now