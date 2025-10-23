sudo apt remove docker docker-engine docker.io containerd runc
sudo apt update

sudo apt install \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo apt-key fingerprint 0EBFCD88
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"

sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io -y

sudo docker run hello-world

sudo groupadd docker

sudo usermod -aG docker $USER

sudo systemctl enable docker.service
sudo systemctl enable containerd.service

sudo systemctl disable docker.service
sudo systemctl disable containerd.service

# bridge control
brctl show

# network control
networkctl
networkctl status br0

# ip list
ip a | grep " br0:" -A 3
# show host routes
ip route

# show arp table (IP to MAC)
arp -n