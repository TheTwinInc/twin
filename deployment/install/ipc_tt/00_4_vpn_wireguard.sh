sudo apt install -y openresolv

sudo sed -i "/#net.ipv4.ip_forward=1/s/^#//g" /etc/sysctl.conf
# sudo sed -i "/#net.ipv6.conf.all.forwarding=1/s/^#//g" /etc/sysctl.conf

sudo sysctl -p

# The procedure for installing and configuring a VPN client is the same as setting up the server. Let us install the client:
sudo apt install wireguard -y

# Next we need create VPN client config on Ubuntu/Debian/CentOS Linux destkop:
sudo sh -c 'umask 077; touch /etc/wireguard/wg0.conf'
sudo -i

cd /etc/wireguard/

umask 077; wg genkey | tee privatekey | wg pubkey > publickey

exit

privatekey=$(sudo cat /etc/wireguard/privatekey)
publickey=$(sudo cat /etc/wireguard/publickey)

# WireGuard VPN Client Configuration

ipc_address="172.16.0.203/24"
subnet="172.16.0.0/24"
server_address="16.170.167.137:58364"
server_publickey="FbBuXgbQAGdh3RJNKGoJ7LHGXlGJTw1DSua57W8nKGY="

sudo bash -c "cat > /etc/wireguard/wg0.conf" << EOF
[Interface]
## This Desktop/client's private key ##
PrivateKey = $privatekey
## Client ip address ##
Address = $ipc_address
DNS = 1.1.1.1, 8.8.8.8

PostUp = /etc/wireguard/helper/add-nat-routing.sh
PostDown = /etc/wireguard/helper/remove-nat-routing.sh

[Peer]
## server public key ##
PublicKey = $server_publickey
## set ACL ##
AllowedIPs = $subnet
## Your server's public IPv4/IPv6 address and port ##
Endpoint = $server_address
##  Key connection alive ##
PersistentKeepalive = 25
EOF


lan_face="eno1"
lan_net="10.87.0.0/24"
wg_face="wg0"
wg_net="172.16.0.0/24"
wg_port="58364"

# Create a new directory using the mkdir command:
sudo mkdir -v /etc/wireguard/helper/

# sudo nano /etc/wireguard/helper/add-nat-routing.sh

sudo bash -c "cat > /etc/wireguard/helper/add-nat-routing.sh" << EOF
#!/bin/bash
IPT="/sbin/iptables"
# IPT6="/sbin/ip6tables"          
 
LAN_FACE=$lan_face                  # NIC connected to the LAN
LAN_NET=$lan_net                    # LAN IPv4 sub/net aka CIDR
WG_FACE=$wg_face                    # WG NIC 
WG_NET=$wg_net                      # WG IPv4 sub/net aka CIDR
WG_PORT=$wg_port                    # WG udp port
# WG_NET_6="fd42:42:42:42::/112"    # WG IPv6 sub/net
 
## IPv4 ##
\$IPT -t nat -I POSTROUTING 1 -s \$WG_NET -o \$LAN_FACE -j MASQUERADE
\$IPT -t nat -I POSTROUTING 1 -s \$LAN_NET -o \$WG_FACE -j MASQUERADE
\$IPT -I INPUT 1 -i \$WG_FACE -j ACCEPT
\$IPT -I INPUT 1 -i \$LAN_FACE -j ACCEPT
\$IPT -I FORWARD 1 -i \$LAN_FACE -o \$WG_FACE -j ACCEPT
\$IPT -I FORWARD 1 -i \$WG_FACE -o \$LAN_FACE -j ACCEPT

## IPv6 (Uncomment) ##
## \$IPT6 -t nat -I POSTROUTING 1 -s \$SUB_NET_6 -o \$LAN_FACE -j MASQUERADE
## \$IPT6 -I INPUT 1 -i \$WG_FACE -j ACCEPT
## \$IPT6 -I FORWARD 1 -i \$LAN_FACE -o \$WG_FACE -j ACCEPT
## \$IPT6 -I FORWARD 1 -i \$WG_FACE -o \$LAN_FACE -j ACCEPT
EOF

sudo chown $USER: /etc/wireguard/helper/add-nat-routing.sh
sudo chmod 744 /etc/wireguard/helper/add-nat-routing.sh

# AND:
# sudo nano /etc/wireguard/helper/remove-nat-routing.sh

sudo bash -c "cat > /etc/wireguard/helper/remove-nat-routing.sh" << EOF
#!/bin/bash
IPT="/sbin/iptables"
# IPT6="/sbin/ip6tables"          
 
LAN_FACE=$lan_face                  # NIC connected to the LAN
LAN_NET=$lan_net                    # LAN IPv4 sub/net aka CIDR
WG_FACE=$wg_face                    # WG NIC 
WG_NET=$wg_net                      # WG IPv4 sub/net aka CIDR
WG_PORT=$wg_port                    # WG udp port
# WG_NET_6="fd42:42:42:42::/112"    # WG IPv6 sub/net

# IPv4 rules #
\$IPT -t nat -D POSTROUTING -s \$WG_NET -o \$LAN_FACE -j MASQUERADE
\$IPT -t nat -D POSTROUTING -s \$LAN_NET -o \$WG_FACE -j MASQUERADE
\$IPT -D INPUT -i \$WG_FACE -j ACCEPT
\$IPT -D INPUT -i \$LAN_FACE -j ACCEPT
\$IPT -D FORWARD -i \$LAN_FACE -o \$WG_FACE -j ACCEPT
\$IPT -D FORWARD -i \$WG_FACE -o \$LAN_FACE -j ACCEPT
 
# IPv6 rules (uncomment) #
## \$IPT6 -t nat -D POSTROUTING -s \$SUB_NET_6 -o \$LAN_FACE -j MASQUERADE
## \$IPT6 -D INPUT -i \$WG_FACE -j ACCEPT
## \$IPT6 -D FORWARD -i \$LAN_FACE -o \$WG_FACE -j ACCEPT
## \$IPT6 -D FORWARD -i \$WG_FACE -o \$LAN_FACE -j ACCEPT
EOF

sudo chown $USER: /etc/wireguard/helper/remove-nat-routing.sh
sudo chmod 744 /etc/wireguard/helper/remove-nat-routing.sh

sudo shutdown -r now

# Enable and start VPN client/peer connection, run:
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
sudo systemctl status wg-quick@wg0
sudo journalctl -f -u wg-quick@wg0

# Allow desktop client and server connection over VPN
# We need to configure the server-side peer-to-peer VPN option and allow a connection between the client computer and the server. Let us go back to our server and edit wg0.conf file to add [Peer] (client) information as follows (type commands on your server box):
sudo systemctl stop wg-quick@wg0
sudo nano /etc/wireguard/wg0.conf

publickey=$(sudo cat /etc/wireguard/publickey)
client_address="172.16.0.106/32"

sudo tee -a /etc/wireguard/wg0.conf > /dev/null << EOF

[Peer]
## Desktop/client VPN public key ##
PublicKey = $publickey
## client VPN IP address (note  the /32 subnet) ##
AllowedIPs = $client_address
EOF

sudo systemctl restart wg-quick@wg0

# Step 7 – Verification
# That is all, folks. By now, both  servers and clients must be connected securely using a peer-to-peer VPN called WireGuard. Let us test the connection. Type the following ping command on your client machine/desktop system:
ping -c 4 172.16.0.1
sudo wg

# Step 8 – Firewall configurations
# Now we have set up and configured peer-to-peer VPN networking for our  server and client. However, you may want to give access to the Internet for all VPN clients. For these purposes, we need to set up IPv4 and IPv6 firewall rules, including NAT and IP forwarding. See the following tutorial:
# How To Set Up WireGuard Firewall Rules in Linux