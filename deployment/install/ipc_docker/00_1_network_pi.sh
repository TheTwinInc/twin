# Hostname xdXXX-revpi
hostname=xd003-revpi
sudo hostnamectl set-hostname $hostname

sudo nano /etc/hosts
127.0.0.1 localhost
127.0.1.1 <hostname>


sudo nano /etc/dhcpcd.conf

# Add
profile static_eth0
metric 201
static ip_address=192.168.11.53/24
static routers=192.168.11.1
static domain_name_servers=192.168.11.1 8.8.8.8 fd51:42f8:caae:d92e::1

interface eth0
fallback static_eth0

interface eth1
metric 202
static ip_address=192.168.10.53/24
static routers=192.168.10.1
static domain_name_servers=192.168.10.1 8.8.8.8 fd51:42f8:caae:d92e::1

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

sudo ip link set eth0 down && sudo ip link set eth0 up

