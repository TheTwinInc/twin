sudo apt install network-manager -y

sudo nmtui

iw dev

iw interface_name link
iw wlx7cdd908491e0 link

sudo iwlist wlx7cdd908491e0 scan | grep -i ESSID

nmcli dev wifi connect [essid_name]  password  [insert your password]

sudo apt install wireless-tools -y
sudo apt install wpasupplicant -y

sudo nano /etc/wpa_supplicant/wpa_supplicant.conf

# ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
# update_config=1
# country=NO

# network={
#         ssid=""
#         psk=""
# }

# sudo ip link set wlx7cdd908491e0 up

# wpa_cli -i wlan0 reconfigure
# wpa_cli -i wlx7cdd908491e0 reconfigure
# ifconfig wlan0
# ifconfig wlx7cdd908491e0

# # Check power savings
# # sudo iw dev wlan0 get power_save
# # sudo iw dev wlan0 set power_save off
# iwconfig
# sudo iwconfig wlan0 power off
# sudo iwconfig wlx7cdd908491e0 power off

# sudo nano /etc/rc.local