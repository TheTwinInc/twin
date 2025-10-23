# sudo apt install -y xorg chromium-browser unclutter xdotool sed
sudo apt install -y --no-install-recommends xserver-xorg x11-xserver-utils xinit

sudo apt install -y --no-install-recommends chromium-browser

sudo apt install -y --no-install-recommends unclutter xdotool sed

sudo apt install -y --no-install-recommends xfce4 xfce4-terminal

sudo apt install -y --no-install-recommends lightdm
sudo dpkg-reconfigure lightdm

sudo apt install -y chromium-browser


# Make kiosk script executable.
nano /home/$USER/kiosk/kiosk.sh

mkdir -p /home/$USER/kiosk/

bash -c "cat > /home/$USER/kiosk/kiosk.sh" << EOF
#!/bin/bash
xset s noblank      # don't blank the video device
xset s off          # disable screen saver
xset -dpms          # disable DPMS (Energy Star) features.

# Disables the entire “display power management system”
unclutter -idle 0.5 -root &

# Allow quitting the X server with CTRL-ATL-Backspace
setxkbmap -option terminate:ctrl_alt_bksp

sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' /home/$USER/.config/chromium/Default/Preferences
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' /home/$USER/.config/chromium/Default/Preferences

sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' /home/$USER/.config/chromium/'Local State'
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/; s/"exit_type":"[^"]\+"/"exit_type":"Normal"/' /home/$USER/.config/chromium/Default/Preferences

KIOSK_URL=https://app.fastdrop.no/loader

chromium --disable-gpu --touch-events=enabled --start-fullscreen --start-maximized --window-position=001,001 --kiosk --incognito --noerrdialogs --disable-translate --no-first-run --fast --fast-start --disable-infobars --disable-features=TranslateUI --disk-cache-dir=/dev/null --password-store=basic --disable-pinch --overscroll-history-navigation=disabled --disable-features=TouchpadOverscrollHistoryNavigation $KIOSK_URL &
# chromium-browser --disable-gpu --touch-events=enabled --start-fullscreen --start-maximized --window-position=001,001 --kiosk --incognito --noerrdialogs --disable-translate --no-first-run --fast --fast-start --disable-infobars --disable-features=TranslateUI --disk-cache-dir=/dev/null --password-store=basic --disable-pinch --overscroll-history-navigation=disabled --disable-features=TouchpadOverscrollHistoryNavigation $KIOSK_URL &

while true; do
   # xdotool keydown ctrl+Tab; xdotool keyup ctrl+Tab;
   xdotool keydown ctrl+Next; xdotool keyup ctrl+Next;
#    xdotool keydown ctrl+r; xdotool keyup ctrl+r;
   sleep 10
done

echo $DISPLAY
EOF

sudo chmod u+x /home/$USER/kiosk/kiosk.sh

# Copy fastdrop app
sudo cp -a /home/$USER/install/dist/fastdrop/. /usr/share/nginx/html/fastdrop/

# Add environmental variables
echo "Environment=DISPLAY=:0.0" | tee -a /home/$USER/kiosk/kiosk.env
echo "Environment=XAUTHORITY=/home/kiosk/.Xauthority" | tee -a /home/$USER/kiosk/kiosk.env
echo "Environment=KIOSK_URL=https://app.fastdrop.no/loader" | tee -a /home/$USER/kiosk/kiosk.env

# Add kiosk service
servicename=kiosk

# Copy The Unit File
# sudo nano /lib/systemd/system/kiosk.service
sudo bash -c "cat > /lib/systemd/system/kiosk.service" << EOF
[Unit]
Description=Fastdrop Kiosk
ConditionPathExists=/home/$USER/kiosk/kiosk.sh
Wants=graphical.target network.target
After=graphical.target network.target xdrop@scanner.service

[Service]
Environment=DISPLAY=:0.0
Environment=XAUTHORITY=/home/$USER/.Xauthority
Type=simple
ExecStart=/bin/bash /home/$USER/kiosk/kiosk.sh
WorkingDirectory=/home/$USER/kiosk
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=kiosk_service
User=$USER

[Install]
WantedBy=graphical.target
EOF

# Set permissions
sudo chmod 644 /lib/systemd/system/kiosk.service

# Configure systemd
sudo systemctl daemon-reload
# Enable service
sudo systemctl enable --now kiosk

# Clear chromium cache
sudo rm -rf ~/.cache/chromium/
sudo rm -rf /home/$USER/.cache/chromium/

# Check status of your service and repeat
sudo systemctl start kiosk
sudo systemctl status kiosk
sudo systemctl stop kiosk

# System reboot
sudo reboot
# You can check the status of your service using :
sudo systemctl status kiosk

# Check service's log
sudo journalctl -f -u kiosk

# Remove service
sudo systemctl stop kiosk
sudo systemctl disable kiosk
sudo rm /lib/systemd/system/kiosk.service
sudo systemctl daemon-reload
sudo systemctl reset-failed

# # Setup autologin
sudo nano /etc/lightdm/lightdm.conf

# [SeatDefaults]
# user-session=xfce
# autologin-user=kis-admin
# autologin-user-timeout=0
#user-session=default
sudo sed -i "s+^#user-session=.*+user-session=xfce+g" /etc/lightdm/lightdm.conf
sudo sed -i "s+^#autologin-user=.*+autologin-user=kis-admin+g" /etc/lightdm/lightdm.conf
sudo sed -i "s+^#autologin-user-timeout=.*+autologin-user-timeout=0+g" /etc/lightdm/lightdm.conf

# greeter-session=unity-greeter

# Clean booting screen and information
# Raspberry pi
# Disable starting rainbow using 
echo "disable_splash=1" | sudo tee -a /boot/config.txt

# Disable booting information using 
sudo sed -i "s+console=tty1+console=tty3+g" /boot/cmdline.txt
sudo sed -i "s+rootwait+rootwait silent quiet splash plymouth.ignore-serial-consoles loglevel=0 logo.nologo vt.global_cursor_default=0+g" /boot/cmdline.txt

# Disable booting autologin terminal information
touch ~/.hushlogin
echo "[Service]" | sudo tee -a /etc/systemd/system/getty@tty1.service.d/autologin.conf
echo "ExecStart=" | sudo tee -a /etc/systemd/system/getty@tty1.service.d/autologin.conf
echo "ExecStart=-/sbin/agetty --autologin $USER --noclear %I $TERM" | sudo tee -a /etc/systemd/system/getty@tty1.service.d/autologin.conf
# Replace line
# ExecStart=-/sbin/agetty --autologin kis-admin --noclear %I xterm-256color 
# with
# ExecStart=-/sbin/agetty --skip-login --noclear --noissue --login-options "-f pi" %I $TERM

# IPC
sudo cp /etc/default/grub /etc/default/grub.bak
# GRUB_CMDLINE_LINUX_DEFAULT="quiet console=tty12 loglevel=0 rd.systemd.show_status=auto rd.udev.log_priority=3 vt.global_cursor_default=0"
GRUB_CMDLINE_LINUX_DEFAULT="quiet console=tty12 loglevel=0 rd.systemd.show_status=auto rd.udev.log_priority=3"

/etc/sysctl.d/20-quiet-printk.conf
kernel.printk = 3 3 3 3

sudo update-grub

#!/bin/bash
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi
echo 'GRUB_DEFAULT=0' > /etc/default/grub
echo 'GRUB_TIMEOUT=5' >> /etc/default/grub
echo 'GRUB_DISTRIBUTOR=`lsb_release -i -s 2> /dev/null || echo Debian`' >> /etc/default/grub
echo 'GRUB_CMDLINE_LINUX_DEFAULT="quiet loglevel=3 vga=current rd.systemd.show_status=auto rd.udev.log-priority=3 vt.global_cursor_default=0"' >> /etc/default/grub
echo 'GRUB_CMDLINE_LINUX="console=ttyS0"' >> /etc/default/grub

update-grub

sed -e '/echo/ s/^#*/#/g' -i file /boot/grub/grub.cfg

sed -e 's/cyan/white/g' -i /boot/grub/grub.cfg
sed -e 's/blue/black/g' -i /boot/grub/grub.cfg


systemctl disable getty@tty1.service # Hide tty login prompt at tty1