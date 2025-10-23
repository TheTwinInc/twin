# # tightvnc
# sudo apt install tightvncserver

# sudo apt install dbus-x11

# vncserver

# vncserver -kill :1

# mv /home/$USER/.vnc/xstartup /home/$USER/.vnc/xstartup.bak

# nano /home/$USER/.vnc/xstartup
# bash -c "cat > /home/$USER/.vnc/xstartup" << EOF
# #!/bin/bash
# xrdb $HOME/.Xresources
# startxfce4 &
# EOF

# sudo chmod +x ~/.vnc/xstartup

# vncserver

# vncserver -kill :1

# # Add service
# sudo nano /etc/systemd/system/vncserver@.service
# sudo bash -c "cat > /etc/systemd/system/vncserver@.service" << EOF
# [Unit]
# Description=Start TightVNC server at startup
# After=syslog.target network.target

# [Service]
# Type=forking
# User=$USER
# Group=$USER
# WorkingDirectory=/home/$USER

# PIDFile=/home/$USER/.vnc/%H:%i.pid
# ExecStartPre=-/usr/bin/vncserver -kill :%i > /dev/null 2>&1
# ExecStart=/usr/bin/vncserver -depth 24 -geometry 1280x800 :%i
# ExecStop=/usr/bin/vncserver -kill :%i

# [Install]
# WantedBy=multi-user.target
# EOF


# sudo chmod 644 /lib/systemd/system/vncserver@.service

# sudo systemctl daemon-reload

# sudo systemctl enable vncserver@1.service 

# vncserver -kill :1

# sudo systemctl start vncserver@1

# x11vnc
# Update & install packages:
sudo apt update && sudo apt install -y x11vnc

# Store VNC password:

sudo x11vnc -storepasswd /etc/x11vnc.passwd

vnc_password=<vnc_password>
sudo x11vnc -storepasswd $vnc_password /etc/x11vnc.passwd

sudo chmod 0400 /etc/x11vnc.passwd

# Edit /lib/systemd/system/x11vnc.service:

sudo bash -c "cat > /lib/systemd/system/x11vnc.service" << EOF
[Unit]
Description=Start x11vnc
After=multi-user.target

[Service]
Type=simple
ExecStart=/usr/bin/x11vnc -display :0 -auth guess -forever -loop -noxdamage -repeat -localhost -rfbauth /etc/x11vnc.passwd -rfbport 5900 -shared

[Install]
WantedBy=multi-user.target
Alias=vnc.service
EOF

sudo chmod 644 /lib/systemd/system/x11vnc.service

# Enable & start x11vnc service:
sudo systemctl daemon-reload
sudo systemctl enable x11vnc.service
sudo systemctl start x11vnc.service


# # Tiger vnc
# sudo apt-get install tigervnc-scraping-server

# mkdir -p ~/.vnc

# vncpasswd

# vncserver -localhost no

# vncserver -list 

# nano ~/.vnc/xstartup

# sudo chmod +x ~/.vnc/xstartup

# export DISPLAY=:0.0

# sudo nano /lib/systemd/system/x0vncserver.service
# sudo chmod 644 /lib/systemd/system/x0vncserver.service

# sudo systemctl daemon-reload

# sudo systemctl enable x0vncserver.service 
# sudo systemctl disable x0vncserver.service 

# sudo systemctl stop x0vncserver

# x0vncserver -passwordfile ~/.vnc/passwd -display :0
# x0vncserver -passwordfile ~/.vnc/passwd -display :0 >/dev/null 2>&1 &

# ps -fu user | grep [x]0vncserve



# # Rename the existing .Xauthority file by running the following command
# mv .Xauthority old.Xauthority 

# # xauth with complain unless ~/.Xauthority exists
# touch ~/.Xauthority

# # only this one key is needed for X11 over SSH 
# xauth generate :0 . trusted 

# # generate our own key, xauth requires 128 bit hex encoding
# xauth add ${HOST}:0 . $(xxd -l 16 -p /dev/urandom)

# # To view a listing of the .Xauthority file, enter the following 
# xauth list 