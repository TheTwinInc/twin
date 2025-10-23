sudo apt update && sudo apt upgrade -y

sudo apt install -y samba samba-common-bin

sudo cp /etc/samba/smb.conf /etc/samba/smb.conf.bak
sudo cp /etc/samba/smb.conf.bak /etc/samba/smb.conf

wg_face="wg0"
lan_face="eno1"

sudo sed -i "s+;   interfaces = 127.0.0.0/8 eth0+interfaces = lo $wg_face $lan_face+g" /etc/samba/smb.conf
sudo sed -i "/;   bind interfaces only = yes/s/^;//g" /etc/samba/smb.conf
sudo sed -i "s+log file.*+log file = /var/log/samba/smb.log+g" /etc/samba/smb.conf
sudo sed -i "s+l max log size.*+max log size = 1000+g" /etc/samba/smb.conf
sudo sed -i "s+server role.*+server role = standalone server+g" /etc/samba/smb.conf

NEW_LINE="server string = %h server (Samba, Debian)"
sudo sed -i "/server role/a$NEW_LINE" /etc/samba/smb.conf

NEW_LINE="smb ports = 445"
sudo sed -i "/server string/a$NEW_LINE" /etc/samba/smb.conf

NEW_LINE="disable netbios = yes"
sudo sed -i "/smb ports = 445/a$NEW_LINE" /etc/samba/smb.conf

sudo tee -a /etc/samba/smb.conf > /dev/null << EOF
[xdrop]
    path = /home/$USER
    read only = no
    browsable = yes
    public = no
EOF


# Add $USER as a samba user
smb_password=<smb_password>
echo -ne "$smb_password\n$smb_password\n" | sudo  smbpasswd -a -s $USER

sudo service smbd restart

sudo smbstatus --shares

# Windows client
net use p: \\192.168.10.55\xdrop /user:kis-admin /persistent:yes