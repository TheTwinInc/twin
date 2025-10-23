
# 1. Update and Upgrade 
sudo apt-get update && sudo apt-get upgrade

# Timescale db requirement libseccomp2_2.5.1-1_armhf.deb
mkdir install
cd install

# if Raspberrypi

curl http://ftp.debian.org/debian/pool/main/libs/libseccomp/libseccomp2_2.5.1-1_armhf.deb --output libseccomp2_2.5.1-1_armhf.deb

sudo dpkg --install libseccomp2_2.5.1-1_armhf.deb

# fi Raspberrypi

# 2. Install Docker 
mkdir install
cd install
curl -fsSL https://get.docker.com -o get-docker.sh

sh get-docker.sh

sudo usermod -aG docker $USER

# 3. Install Docker-Compose
sudo apt install libffi-dev libssl-dev -y
sudo apt install python3-dev -y
sudo apt install -y python3 python3-pip -y

python3 -m pip install docker-compose

# 4. Enable the Docker system service to start your containers on boot 
sudo systemctl enable docker

# 5. Check the installation
docker run hello-world
docker-compose version

mkdir compose

# 6. Start docker
sudo systemctl start docker
# OR
sudo /etc/init.d/docker start

# docker-compose -f docker-compose.yaml up -d