sudo apt install -y wget
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
RELEASE=$(lsb_release -cs)
echo "deb http://apt.postgresql.org/pub/repos/apt/ ${RELEASE}"-pgdg main | sudo tee  /etc/apt/sources.list.d/pgdg.list

sudo apt update
sudo apt upgrade -y
sudo apt -y install git cmake
sudo apt -y install postgresql-11 postgresql-server-dev-11 libssl-dev

sudo nano /etc/postgresql/11/main/postgresql.conf
# Add
listen_address = '*'

sudo nano /etc/postgresql/11/main/pg_hba.conf
# Add
host    all         all         192.168.201.0/24        md5
host    all         all         172.16.0.0/16           md5

# Add our PPA
sudo add-apt-repository ppa:timescale/timescaledb-ppa
sudo apt update

# Now install appropriate package for PG version
sudo apt -y install timescaledb-postgresql-11
sudo timescaledb-tune

# Restart postgresql
sudo systemctl restart postgresql
sudo systemctl status postgresql



