sudo apt install -y python3 python3-dev python-dev libatlas-base-dev p7zip\
    libpq-dev build-essential libssl-dev libffi-dev \
    libxml2-dev libxslt1-dev zlib1g-dev \
    python3-pip gcc

# sudo apt install r-base r-base-core r-base-dev -y
# sudo apt install -y python3-pip

# Change python version
sudo update-alternatives --remove-all python
sudo update-alternatives --config python
sudo update-alternatives --install /usr/bin/python python /usr/bin/python2.7 1
sudo update-alternatives --install /usr/bin/python python /usr/bin/python3.8 2
sudo update-alternatives --config python

sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.8 1
sudo update-alternatives --config python3


python3 -m pip install pandas
python3 -m pip install psycopg2
python3 -m pip install jupyterlab
python3 -m pip install notebook
python3 -m pip install paho-mqtt
python3 -m pip install python-snap7
python3 -m pip install matplotlib

cd ~
mkdir install
cd install
curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh
sudo bash nodesource_setup.sh
sudo apt update
sudo apt -y install nodejs
sudo apt -y install build-essential
sudo apt -y install tshark
sudo apt -y install ncdu

