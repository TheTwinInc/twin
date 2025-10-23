curl -s https://packagecloud.io/install/repositories/timescale/timescaledb/script.deb.sh | sudo bash

sudo apt update

# If you want to install a specific version of TimescaleDB, instead of the most recent, you can specify the version like this: apt-get install timescaledb-2-postgresql-12='2.6.0*' timescaledb-2-loader-postgresql-12='2.6.0*'
# sudo apt install -y timescaledb-postgresql-12
sudo apt install -y timescaledb-2-postgresql-14

# sudo apt install timescaledb-tools

# Tune timescale
sudo timescaledb-tune --quiet --yes

# Restart postgresql
sudo systemctl restart postgresql
pg_lsclusters
