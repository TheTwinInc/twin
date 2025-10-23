sudo nano /etc/sysctl.conf

net.ipv4.ip_forward=1
net.ipv6.conf.all.forwarding=1

sudo sysctl -p

sudo ufw allow 58364/udp

# Step 1 – Update your system
sudo apt update
sudo apt upgrade -y

# Step 2 – Installing a WireGuard VPN server on Ubuntu 20.04 LTS

sudo apt install -y wireguard

# Step 3 – Configuring WireGuard server

sudo -i
cd /etc/wireguard/

# Execute the following command:
umask 077; wg genkey | tee privatekey | wg pubkey > publickey

# To view keys created use the cat command and ls command:
ls -l privatekey publickey
cat privatekey
## Please note down the private key ##
cat publickey
## Please note down the public key ##

exit

# Set Up WireGuard VPN on Ubuntu Linux
# Set Up WireGuard VPN on Ubuntu by Editing wg0.conf

# Edit or update the /etc/wireguard/wg0.conf file as follows:
sudo nano /etc/wireguard/wg0.conf

# Append the following config directives:
## Set Up WireGuard VPN on Ubuntu By Editing/Creating wg0.conf File ##
[Interface]
## My VPN server private IP address ##
Address = 172.16.0.1/24
## My VPN server port ##
ListenPort = 58364
## VPN server's private key i.e. /etc/wireguard/privatekey ##
PrivateKey = CI1M5RNJ0EeYcymGgJOhPqa8IcuasMnbC0Yun8QmckE=
## Remove for full VPN type
# PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o ens5 -j MASQUERADE; ip6tables -A FORWARD -i wg0 -j ACCEPT; ip6tables -t nat -A POSTROUTING -o ens5 -j MASQUERADE
# PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o ens5 -j MASQUERADE; ip6tables -D FORWARD -i wg0 -j ACCEPT; ip6tables -t nat -D POSTROUTING -o ens5 -j MASQUERADE
PostUp = /etc/wireguard/helper/add-nat-routing.sh
PostDown = /etc/wireguard/helper/remove-nat-routing.sh

[Peer]
## Desktop/client VPN public key ##
PublicKey = Uthpi3514vYylS+d0rvIGM0Nqv4FfwDVsZGBAmwsKio=
## client VPN IP address (note  the /32 subnet) ##
AllowedIPs = 172.16.0.2/32
# Save and close the file when using vim text editor.

# Create a new directory using the mkdir command:
sudo mkdir -v /etc/wireguard/helper/

sudo nano /etc/wireguard/helper/add-nat-routing.sh

#!/bin/bash
IPT="/sbin/iptables"
# IPT6="/sbin/ip6tables"          
 
LAN_FACE="eth0"                   # NIC connected to the LAN
LAN_NET="135.181.36.52/32"            # LAN IPv4 sub/net aka CIDR
WG_FACE="wg0"                    # WG NIC 
WG_NET="172.16.0.0/24"            # WG IPv4 sub/net aka CIDR
WG_PORT="58364"                  # WG udp port
# WG_NET_6="fd42:42:42:42::/112"  # WG IPv6 sub/net
 
## IPv4 ##
$IPT -t nat -I POSTROUTING 1 -s $WG_NET -o $LAN_FACE -j MASQUERADE
$IPT -t nat -I POSTROUTING 1 -s $LAN_NET -o $WG_FACE -j MASQUERADE
$IPT -I INPUT 1 -i $WG_FACE -j ACCEPT
$IPT -I INPUT 1 -i $LAN_FACE -j ACCEPT
$IPT -I FORWARD 1 -i $LAN_FACE -o $WG_FACE -j ACCEPT
$IPT -I FORWARD 1 -i $WG_FACE -o $LAN_FACE -j ACCEPT
$IPT -I FORWARD 1 -i $WG_FACE -o $WG_FACE -j ACCEPT
 
## IPv6 (Uncomment) ##
## $IPT6 -t nat -I POSTROUTING 1 -s $SUB_NET_6 -o $LAN_FACE -j MASQUERADE
## $IPT6 -I INPUT 1 -i $WG_FACE -j ACCEPT
## $IPT6 -I FORWARD 1 -i $LAN_FACE -o $WG_FACE -j ACCEPT
## $IPT6 -I FORWARD 1 -i $WG_FACE -o $LAN_FACE -j ACCEPT

sudo chown kis-admin: /etc/wireguard/helper/add-nat-routing.sh
sudo chmod 744 /etc/wireguard/helper/add-nat-routing.sh

# AND:
sudo nano /etc/wireguard/helper/remove-nat-routing.sh

#!/bin/bash
IPT="/sbin/iptables"
# IPT6="/sbin/ip6tables"          
 
IN_FACE="ens5"                   # NIC connected to the internet
LAN_NET="135.181.36.52/32"            # LAN IPv4 sub/net aka CIDR
WG_FACE="wg0"                    # WG NIC
WG_NET="172.16.0.0/24"            # WG IPv4 sub/net aka CIDR
WG_PORT="58364"                  # WG udp port
# SUB_NET_6="fd42:42:42:42::/112"  # WG IPv6 sub/net
 
# IPv4 rules #
$IPT -t nat -D POSTROUTING -s $WG_NET -o $LAN_FACE -j MASQUERADE
$IPT -t nat -D POSTROUTING -s $LAN_NET -o $WG_FACE -j MASQUERADE
$IPT -D INPUT -i $WG_FACE -j ACCEPT
$IPT -D INPUT -i $LAN_FACE -j ACCEPT
$IPT -D FORWARD -i $LAN_FACE -o $WG_FACE -j ACCEPT
$IPT -D FORWARD -i $WG_FACE -o $LAN_FACE -j ACCEPT
$IPT -D FORWARD -i $WG_FACE -o $WG_FACE -j ACCEPT
 
# IPv6 rules (uncomment) #
## $IPT6 -t nat -D POSTROUTING -s $SUB_NET_6 -o $IN_FACE -j MASQUERADE
## $IPT6 -D INPUT -i $WG_FACE -j ACCEPT
## $IPT6 -D FORWARD -i $IN_FACE -o $WG_FACE -j ACCEPT
## $IPT6 -D FORWARD -i $WG_FACE -o $IN_FACE -j ACCEPT

sudo chown kis-admin: /etc/wireguard/helper/remove-nat-routing.sh
sudo chmod 744 /etc/wireguard/helper/remove-nat-routing.sh

# Step 4 – Set up UFW firewall rules
sudo ufw allow 58364/udp

# See “How To Configure Firewall with UFW on Ubuntu 20.04 LTS” for more info.
# Step 5 – Enable and start WireGuard service

# Turn the WireGuard service at boot time using the systemctl command, run:
sudo systemctl enable wg-quick@wg0

# Start the service, execute:
sudo systemctl start wg-quick@wg0

# Get the service status, run:
sudo systemctl status wg-quick@wg0

# Verify that interface named wg0 is up and running on Ubuntu server using the ip command:
sudo wg
sudo ip a show wg0


# Install clients

sudo mkdir -p /etc/wireguard/clients; wg genkey | sudo tee /etc/wireguard/clients/mobile.key | wg pubkey | sudo tee /etc/wireguard/clients/mobile.key.pub

sudo nano /etc/wireguard/clients/mobile.conf

[Interface]
PrivateKey = 
Address = 172.16.0.51/24
DNS = 1.1.1.1, 1.0.0.1

[Peer]
PublicKey = FbBuXgbQAGdh3RJNKGoJ7LHGXlGJTw1DSua57W8nKGY=
AllowedIPs = 0.0.0.0/0
Endpoint = 16.170.167.137:58364

[Peer]
## MOB-SU Desktop/client VPN public key ##
PublicKey = /C1OY6HTOYSiD14tL9mTldRRrIyvQetBTqStYG5UL3E=
## client VPN IP address (note  the /32 subnet) ##
AllowedIPs = 0.0.0.0/24

qrencode -t ansiutf8 /etc/wireguard/clients/mobile.conf