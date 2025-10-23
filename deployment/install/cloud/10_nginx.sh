sudo apt install nginx screen -y

sudo ufw app list

sudo ufw allow 'Nginx Full'

sudo ufw status

systemctl status nginx

# ip addr show ens5 | grep inet | awk '{ print $2; }' | sed 's/\/.*$//'
dig +short myip.opendns.com @resolver1.opendns.com

# Enable nginx at startup
sudo systemctl enable nginx
# Disable nginx at startup
sudo systemctl disable nginx

sudo systemctl stop nginx
sudo systemctl start nginx
sudo systemctl restart nginx

# If you are simply making configuration changes, Nginx can often reload without dropping connections. To do this, type:
sudo systemctl reload nginx

xdrop_install_dir=~/xdrop/install/cloud/11_nginx

# Bagdrop
sudo mkdir /usr/share/nginx/html/sbd
sudo cp -a ~/xdrop/dist/sbd/. /usr/share/nginx/html/sbd/

# Fastdrop
sudo mkdir /usr/share/nginx/html/fastdrop
sudo cp -a ~/xdrop/dist/fastdrop/. /usr/share/nginx/html/fastdrop/
sudo cp $xdrop_install_dir/wild.kbgis* /etc/nginx/ssl/
# New
sudo cp $xdrop_install_dir/fastdrop.no.conf /etc/nginx/conf.d/
sudo cp $xdrop_install_dir/ws.fastdrop.no.conf /etc/nginx/conf.d/
# Change
# sudo nano /etc/nginx/conf.d/fastdrop.no.conf
sudo nano /etc/nginx/conf.d/app.fastdrop.no.conf
sudo nano /etc/nginx/conf.d/ws.fastdrop.no.conf




# Graphmetrix
sudo cp $xdrop_install_dir/wild.pod.express-drop.com.bundle.crt /etc/nginx/ssl/
sudo cp $xdrop_install_dir/wild.pod.expressdrop.key /etc/nginx/ssl/
sudo cp $xdrop_install_dir/pod.express-drop.com.conf /etc/nginx/conf.d/
sudo cp $xdrop_install_dir/pod-star.express-drop.com.conf /etc/nginx/conf.d/


# Error handling
sudo cp $xdrop_install_dir/error.html /usr/share/nginx/html/

# Certificates
sudo cp $xdrop_install_dir/wild.* /etc/nginx/ssl/

# Security
sudo mkdir /etc/nginx/ssl/

sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

sudo cp $xdrop_install_dir/ssl-params.conf /etc/nginx/snippets/
sudo cp $xdrop_install_dir/proxy-params.conf /etc/nginx/snippets/
# sudo nano /etc/nginx/snippets/proxy-params.conf 

# Configuration
sudo cp $xdrop_install_dir/sbd.express-drop.com.conf /etc/nginx/conf.d/
sudo cp $xdrop_install_dir/admin.express-drop.com.conf /etc/nginx/conf.d/
sudo cp $xdrop_install_dir/garage.express-drop.com.conf /etc/nginx/conf.d/

# Streaming
sudo cp $xdrop_install_dir/ws.app.express-drop.com.conf /etc/nginx/conf.d/
sudo cp $xdrop_install_dir/ws.sbd.express-drop.com.conf /etc/nginx/conf.d/
sudo cp $xdrop_install_dir/ws.garage.express-drop.com.conf /etc/nginx/conf.d/

# Whitelists
sudo mkdir /etc/nginx/shared-configs
sudo cp $xdrop_install_dir/pod.whitelist.conf /etc/nginx/shared-configs/

# Default config
sudo cp $xdrop_install_dir/nginx.conf /etc/nginx/
# OR 
sudo nano /etc/nginx/nginx.conf

sudo nginx -t

sudo systemctl restart nginx

