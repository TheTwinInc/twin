sudo nano /etc/wpa_supplicant/wpa_supplicant.conf


ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=NO

network={
        ssid=""
        psk=""
}

sudo wpa_cli -i wlan0 reconfigure
ifconfig wlan0

# Check power savings
# sudo iw dev wlan0 get power_save
# sudo iw dev wlan0 set power_save off
iwconfig
sudo iwconfig wlan0 power off

sudo nano /etc/rc.local