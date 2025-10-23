sudo apt install -y curl ca-certificates gnupg
sudo apt -y install git cmake software-properties-common

curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/apt.postgresql.org.gpg >/dev/null

# IPC
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ bullseye-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
# Rpi
sudo sh -c 'echo "deb [arch=arm64] http://apt.postgresql.org/pub/repos/apt/ bullseye-pgdg main" > /etc/apt/sources.list.d/pgdg.list'


sudo apt update && sudo apt upgrade -y

# IPC
# sudo apt -y install postgresql-12 postgresql-server-dev-12 libssl-dev
# sudo apt -y install postgresql-14 postgresql-server-dev-14 libssl-dev
sudo apt -y install postgresql-14

sudo cp /etc/postgresql/14/main/postgresql.conf /etc/postgresql/14/main/postgresql.conf.bak
# Add
# Only if using external drive
# sudo sed -i "s+data_directory = '/var/lib/postgresql/14/main'+data_directory = '/mnt/datapg/postgresql/14/main'+g" /etc/postgresql/14/main/postgresql.conf
# cat /etc/postgresql/14/main/postgresql.conf | grep data_directory
# Change
sudo sed -i "s+#listen_addresses = 'localhost'+listen_addresses = '*'+g" /etc/postgresql/14/main/postgresql.conf
cat /etc/postgresql/14/main/postgresql.conf | grep listen_addresses

sudo cp /etc/postgresql/14/main/pg_hba.conf /etc/postgresql/14/main/pg_hba.conf.bak

sudo tee -a /etc/postgresql/14/main/pg_hba.conf > /dev/null << EOF
# IPv4 xdrop connections:
host        all         all          192.168.10.0/24       md5
host        all         all          192.168.11.0/24       md5
host        all         all         192.168.201.0/24       md5
host        all         all            172.16.0.0/24       md5
EOF

sudo cat /etc/postgresql/14/main/pg_hba.conf

# Restart postgresql
sudo systemctl restart postgresql
sudo systemctl status postgresql

pg_lsclusters

postgres_pass=<postgres_pass>

sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$postgres_pass';"

# Remove postgresql
# sudo apt-get --purge remove postgresql*
# sudo apt-get purge postgresql*
# 