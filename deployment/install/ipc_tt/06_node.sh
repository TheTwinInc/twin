sudo apt purge -y nodejs

curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install nodejs -y

sudo apt update && sudo apt upgrade -y

sudo apt install -y nodejs

sudo npm install -g npm@latest
