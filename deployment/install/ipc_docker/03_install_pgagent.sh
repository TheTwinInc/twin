# Step 1: create a volume for permanent postgres data
docker volume create --name xdrop_db

# Step 2: Start the postgres instance
# Production
docker run -d --name timescaledb -p 127.0.0.1:5432:5432 -e POSTGRES_PASSWORD=xDr0p -v xdrop_db:/var/lib/postgresql/data timescale/timescaledb:latest-pg12
# Development
docker run -d --name timescaledb -p 5432:5432 -e POSTGRES_PASSWORD=xDr0p -v xdrop_db:/var/lib/postgresql/data timescale/timescaledb:latest-pg12
# For debugging
docker run --name timescaledb -p 127.0.0.1:5432:5432 -e POSTGRES_PASSWORD=xDr0p timescale/timescaledb:latest-pg12

docker ps
docker exec -it timescaledb psql -U postgres -c "CREATE DATABASE xdrop"
docker exec -it timescaledb psql -U postgres -d xdrop -c "$(cat init_db.sql)"

docker exec -i -t timescaledb /bin/bash
timescaledb-tune --quiet --yes --dry-run >> /path/to/postgresql.conf
# Or
docker exec -it timescaledb timescaledb-tune --quiet --yes --dry-run >> /path/to/postgresql.conf
docker restart timescaledb

