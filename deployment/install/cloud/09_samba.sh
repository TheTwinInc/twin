sudo apt install -y samba

sudo groupadd -g 2001 kis-admin

sudo smbpasswd -a kis-admin

sudo nano /etc/samba/smb.conf

# Copy the following to the bottom of the view presented by the previous command

# [xdrop]
#     comment = Xdrop on Ubuntu
#     path = /home/kis-admin/xdrop
#     read only = no
#     browsable = yes

[xdrop]
   path = /home/kis-admin/xdrop
   writeable=Yes
   create mask=0777
   directory mask=0777
   public=no


sudo systemctl restart smbd

sudo ufw allow samba