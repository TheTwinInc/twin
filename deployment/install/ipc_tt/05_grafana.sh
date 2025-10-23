sudo apt install -y apt-transport-https software-properties-common wget

sudo wget -q -O /usr/share/keyrings/grafana.key https://apt.grafana.com/gpg.key

echo "deb [signed-by=/usr/share/keyrings/grafana.key] https://apt.grafana.com stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list

sudo apt update && sudo apt upgrade -y

sudo apt -y install grafana

psql -h localhost -U postgres
psql -U postgres -d $db -h localhost -c \

psql -U postgres -h localhost -c \
"CREATE ROLE grafana WITH
	LOGIN
	NOSUPERUSER
	NOCREATEDB
	NOCREATEROLE
	INHERIT
	NOREPLICATION
	CONNECTION LIMIT -1
	PASSWORD 'grafana';"

# fastdrop database

psql -U postgres -h localhost -c "GRANT USAGE ON SCHEMA public TO grafana;"

db=fastdrop
psql -U postgres -h localhost -c "GRANT CONNECT ON DATABASE $db TO grafana;"
psql -U postgres -d $db -h localhost -c "GRANT SELECT ON TABLE public.items TO grafana;"
psql -U postgres -d $db -h localhost -c "GRANT SELECT ON TABLE public.items_log TO grafana;"

# xdrop database
db=xdrop
psql -U postgres -h localhost -c "GRANT CONNECT ON DATABASE $db TO grafana;"
psql -U postgres -d $db -h localhost -c "GRANT SELECT ON TABLE public.cms TO grafana;"
psql -U postgres -d $db -h localhost -c "GRANT SELECT ON TABLE public.ci_data TO grafana;"
psql -U postgres -d $db -h localhost -c "GRANT SELECT ON TABLE public.assets TO grafana;"
psql -U postgres -d $db -h localhost -c "GRANT SELECT ON TABLE public.components TO grafana;"
