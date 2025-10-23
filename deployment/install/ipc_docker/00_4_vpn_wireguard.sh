sudo apt install openresolv
# Ubuntu 20.04 LTS set up WireGuard and verification commands
sudo nano /etc/sysctl.conf

net.ipv4.ip_forward=1
# net.ipv6.conf.all.forwarding=1

sudo sysctl -p

# The procedure for installing and configuring a VPN client is the same as setting up the server. Let us install the client on an Ubuntu Linux 20.04 LTS desktop:
sudo apt install wireguard -y

# # Raspberrypi Start
# echo "deb http://deb.debian.org/debian/ unstable main" | sudo tee --append /etc/apt/sources.list
# sudo apt-key adv --keyserver   keyserver.ubuntu.com --recv-keys 04EE7237B7D453EC
# sudo apt-key adv --keyserver   keyserver.ubuntu.com --recv-keys 648ACFD622F3D138
# sudo sh -c 'printf "Package: *\nPin: release a=unstable\nPin-Priority: 90\n" > /etc/apt/preferences.d/limit-unstable'

# sudo apt update
# sudo apt install wireguard -y
# sudo apt install wireguard-dkms -y

# sudo su
# apt install raspberrypi-kernel-headers libelf-dev libmnl-dev build-essential git
# git clone https://git.zx2c4.com/wireguard-tools
# make -C wireguard-tools/src -j$(nproc)
# make -C wireguard-tools/src install
# exit

# sudo systemctl enable --now systemd-resolved
# # Raspberrypi Stop

# Next we need create VPN client config on Ubuntu/Debian/CentOS Linux destkop:
sudo sh -c 'umask 077; touch /etc/wireguard/wg0.conf'
sudo -i
cd /etc/wireguard/
umask 077; wg genkey | tee privatekey | wg pubkey > publickey
ls -l publickey privatekey
## Note down the privatekey ##
cat privatekey
cat publickey
exit

# WireGuard VPN Client Configuration
# Edit the /etc/wireguard/wg0.conf file:
sudo nano /etc/wireguard/wg0.conf

# Append the following directives:
[Interface]
## This Desktop/client's private key ##
PrivateKey = MI+4W6EeuSmwGUKlkJmdB1LqtJml7EpnzLygM7dD4GU=
## Client ip address ##
Address = 172.16.0.103/24
DNS = 1.1.1.1, 8.8.8.8

PostUp = /etc/wireguard/helper/add-nat-routing.sh
PostDown = /etc/wireguard/helper/remove-nat-routing.sh

[Peer]
## Ubuntu 20.04 server public key ##
PublicKey = FbBuXgbQAGdh3RJNKGoJ7LHGXlGJTw1DSua57W8nKGY=
## set ACL ##
AllowedIPs = 172.16.0.0/24
## Your Ubuntu 20.04 LTS server's public IPv4/IPv6 address and port ##
Endpoint = 16.170.167.137:58364
##  Key connection alive ##
PersistentKeepalive = 25

# Create a new directory using the mkdir command:
sudo mkdir -v /etc/wireguard/helper/

# Contains of add-nat-routing.sh displayed using the cat command:
sudo nano /etc/wireguard/helper/add-nat-routing.sh

#!/bin/bash
IPT="/sbin/iptables"
# IPT6="/sbin/ip6tables"          
 
LAN_FACE="eth1"                   # NIC connected to the LAN
LAN_NET="192.168.10.0/24"            # LAN IPv4 sub/net aka CIDR
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
 
LAN_FACE="eth1"                   # NIC connected to the LAN
LAN_NET="192.168.10.0/24"            # LAN IPv4 sub/net aka CIDR
WG_FACE="wg0"                    # WG NIC
WG_NET="172.0.0.0/16"            # WG IPv4 sub/net aka CIDR
WG_PORT="58364"                  # WG udp port
# SUB_NET_6="fd42:42:42:42::/112"  # WG IPv6 sub/net
 
# IPv4 rules #
$IPT -t nat -D POSTROUTING -s $WG_NET -o $LAN_FACE -j MASQUERADE
$IPT -t nat -D POSTROUTING -s $LAN_NET -o $WG_FACE -j MASQUERADE
$IPT -D INPUT -i $WG_FACE -j ACCEPT
$IPT -D INPUT -i $LAN_FACE -j ACCEPT
$IPT -D FORWARD -i $LAN_FACE -o $WG_FACE -j ACCEPT
$IPT -D FORWARD -i $WG_FACE -o $LAN_FACE -j ACCEPT
 
# IPv6 rules (uncomment) #
## $IPT6 -t nat -D POSTROUTING -s $SUB_NET_6 -o $LAN_FACE -j MASQUERADE
## $IPT6 -D INPUT -i $WG_FACE -j ACCEPT
## $IPT6 -D FORWARD -i $LAN_FACE -o $WG_FACE -j ACCEPT
## $IPT6 -D FORWARD -i $WG_FACE -o $LAN_FACE -j ACCEPT

sudo chown kis-admin: /etc/wireguard/helper/remove-nat-routing.sh
sudo chmod 744 /etc/wireguard/helper/remove-nat-routing.sh

sudo shutdown -r now

# Enable and start VPN client/peer connection, run:
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
sudo systemctl status wg-quick@wg0
sudo journalctl -f -u wg-quick@wg0

# Allow desktop client and Ubuntu server connection over VPN
# We need to configure the server-side peer-to-peer VPN option and allow a connection between the client computer and the server. Let us go back to our Ubuntu 20.04 LTS server and edit wg0.conf file to add [Peer] (client) information as follows (type commands on your server box):
sudo systemctl stop wg-quick@wg0
sudo nano /etc/wireguard/wg0.conf

# Append the following config:
[Peer]
## Desktop/client VPN public key ##
PublicKey = <client_public_key>
## client VPN IP address (note  the /32 subnet) ##
AllowedIPs = 172.0.0.0/16
# Save and close the file. Next start the service again, run:
sudo systemctl start wg-quick@wg0

# Step 7 – Verification
# That is all, folks. By now, both Ubuntu servers and clients must be connected securely using a peer-to-peer VPN called WireGuard. Let us test the connection. Type the following ping command on your client machine/desktop system:
ping -c 4 172.16.0.1
sudo wg

# Step 8 – Firewall configurations
# Now we have set up and configured peer-to-peer VPN networking for our Ubuntu server and client. However, you may want to give access to the Internet for all VPN clients. For these purposes, we need to set up IPv4 and IPv6 firewall rules, including NAT and IP forwarding. See the following tutorial:
# How To Set Up WireGuard Firewall Rules in Linux