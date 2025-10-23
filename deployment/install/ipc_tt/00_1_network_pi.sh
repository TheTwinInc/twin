sudo apt install -y dnsutils

# Hostname xdXXX-revpi
hostname=xd005-revpi
sudo hostnamectl set-hostname $hostname

sudo sed -i "s+127.0.0.1.*+127.0.0.1       localhost app.fastdrop.no ws.fastdrop.no db.fastdrop.no+g" /etc/hosts
sudo sed -i "s+127.0.1.1.*+127.0.1.1       $hostname+g" /etc/hosts

echo "192.168.10.51   plc-fastdrop" | sudo tee -a /etc/hosts

sudo nano /etc/dhcpcd.conf

# Add either
# Fallback
profile static_eth0
metric 201
static ip_address=192.168.11.53/24
static routers=192.168.11.1
static domain_name_servers=192.168.11.1 8.8.8.8 fd51:42f8:caae:d92e::1

interface eth0
fallback static_eth0

# Static eth0/eth1
interface eth1
metric 202
static_routers=192.168.10.1
static domain_name_servers=192.168.10.1 8.8.8.8 fd51:42f8:caae:d92e::1
static ip_address=192.168.10.54/24


sudo ip link set eth0 down && sudo ip link set eth0 up
sudo ip link set eth1 down && sudo ip link set eth1 up

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
