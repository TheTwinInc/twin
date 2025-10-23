# Hostname xdXXX-ipc127
hostname=xd002-ipc127
hostname=xd001-revpi
sudo hostnamectl set-hostname $hostname


sudo nano /etc/hosts
127.0.0.1 localhost
127.0.1.1 <hostname>

sudo apt -y install net-tools netplan.io
# Step 0 To enable network manually
ip a

sudo ip link set eno1 up

# Find IPC dhcp address
sudo ip addr add 192.168.201.101/24 dev eno1
sudo ip route add default via 192.168.201.1 dev eno1

sudo nano /etc/resolv.conf
# Add nameserver
nameserver 8.8.8.8

# Find IPC fixed address
sudo ip addr add 192.168.202.39/24 dev eno2

# Add extra ip address if necessary
sudo ip addr add 192.168.10.151/24 broadcast 192.168.10.255 dev eno1 label eno1:1

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
        [192.168.11.53/24]
      # gateway4: 192.168.10.1
      routes:
        - to: 0.0.0.0/0
          via: 192.168.11.1
          metric: 500
      nameservers:
        addresses: [192.168.10.11,8.8.8.8]
    eno3:
      dhcp4: no
      addresses:
        [192.168.201.53/24]
      routes:
        - to: 0.0.0.0/0
          via: 192.168.201.1
          metric: 500
      nameservers:
        addresses: [192.168.201.1,8.8.8.8]

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
sudo ufw allow 5432
sudo ufw allow 3000
sudo ufw allow 8080
sudo ufw allow Samba

sudo ufw enable

sudo shutdown -r now