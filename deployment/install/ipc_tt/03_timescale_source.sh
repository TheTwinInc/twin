sudo apt install -y libkrb5-dev

# Clone timescale repository and compile
cd
# Delete timescaledb folder if it exists
# Postgresql 11
timescaledbtag=1.7.5
# Postgresql 12
timescaledbtag=2.4.2

sudo rm -r timescaledb
git clone https://github.com/timescale/timescaledb.git
cd timescaledb
git checkout tags/$timescaledbtag
./bootstrap -DREGRESS_CHECKS=OFF
cd ./build && make
sudo make install

# Tune timescaledb
cd
sudo apt install golang -y
go get github.com/timescale/timescaledb-tune/cmd/timescaledb-tune
sudo ./go/bin/timescaledb-tune --yes

# sudo apt remove golang -y
# sudo rm -r -f go

# Restart postgresql
sudo systemctl restart postgresql
sudo systemctl status postgresql

