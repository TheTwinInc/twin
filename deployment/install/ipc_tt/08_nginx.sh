sudo apt install -y nginx screen dnsutils

sudo ufw app list

sudo ufw allow 'Nginx Full'

sudo ufw status

systemctl status nginx

# Get public ip
dig +short myip.opendns.com @resolver1.opendns.com

# Enable nginx at startup
sudo systemctl enable nginx
# Disable nginx at startup
# sudo systemctl disable nginx

sudo systemctl stop nginx
sudo systemctl start nginx
sudo systemctl restart nginx
sudo systemctl status nginx

# If you are simply making configuration changes, Nginx can often reload without dropping connections. To do this, type:
sudo systemctl reload nginx

mkdir -p ~/install/dist/thetwin
# Copy dist files from source to ~/install/dist/thetwin

mkdir -p ~/install/nginx/thetwin 
# Copy nginx files from source to ~/install/ipc_thetwin/nginx

install_dir=~/install/nginx/thetwin
dist_dir=~/install/dist/thetwin

# Security
sudo mkdir -p /etc/nginx/ssl/

sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

sudo cp $install_dir/ssl-params.conf /etc/nginx/snippets/
sudo cp $install_dir/proxy-params.conf /etc/nginx/snippets/

# Certificates
sudo cp $install_dir/wild.* /etc/nginx/ssl/
# sudo cp ~/install/ipc_thetwin/nginx/wild.* /etc/nginx/ssl/

# thetwin
sudo mkdir /usr/share/nginx/html/thetwin


# App
sudo cp -a $dist_dir/. /usr/share/nginx/html/thetwin/
# OR
sudo cp -a ~/install/dist/thetwin/. /usr/share/nginx/html/thetwin/

# When running kiosk
# Clear chromium cache
sudo rm -rf ~/.cache/chromium/
sudo rm -rf /home/kiosk/.cache/chromium/

sudo systemctl restart kiosk

# Site Configuration
# New
sudo cp $install_dir/thetwin.no.conf /etc/nginx/sites-enabled/
# Change
sudo nano /etc/nginx/conf.d/thetwin.no.conf

# Error handling
sudo cp $install_dir/error.html /usr/share/nginx/html/

# Default Configuration
# New
sudo cp $install_dir/nginx.conf /etc/nginx/
# Change
sudo nano /etc/nginx/nginx.conf


# Whitelists
sudo mkdir /etc/nginx/shared-configs
sudo cp $install_dir/thetwin.whitelist.conf /etc/nginx/shared-configs/
# sudo nano /etc/nginx/shared-configs/thetwin.whitelist.conf 

# Streaming WS TODO

sudo nginx -t

sudo systemctl restart nginx

sudo systemctl status nginx

sudo journalctl -f -u nginx

# Test with
curl https://app.thetwin.no/api/endpoints
