sudo apt install -y python3 python3-pip python3-dev
sudo apt install -y libatlas-base-dev p7zip\
    build-essential libssl-dev libffi-dev \
    libxml2-dev libxslt1-dev zlib1g-dev gcc
sudo apt install -y libpq-dev

# Change python version
sudo update-alternatives --remove-all python
sudo update-alternatives --config python
sudo update-alternatives --install /usr/bin/python python /usr/bin/python3.9 1
# sudo update-alternatives --install /usr/bin/python python /usr/bin/python3.7 1

sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.9 1
sudo update-alternatives --config python3


python3 -m pip install pandas
python3 -m pip install psycopg2
python3 -m pip install notebook
python3 -m pip install jupyterlab
python3 -m pip install paho-mqtt
python3 -m pip install websocket-client
python3 -m pip install opencv-python
python3 -m pip install rel
python3 -m pip install pyserial
# python3 -m pip install ischedule
# python3 -m pip install -r 07_requirements.txt
