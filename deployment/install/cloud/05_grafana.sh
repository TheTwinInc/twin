sudo apt install -y apt-transport-https software-properties-common

wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"

sudo apt update
sudo apt upgrade -y
sudo apt -y install grafana

sudo systemctl enable grafana-server

psql -h localhost -U postgres

CREATE ROLE grafana WITH
	LOGIN
	NOSUPERUSER
	NOCREATEDB
	NOCREATEROLE
	INHERIT
	NOREPLICATION
	CONNECTION LIMIT -1
	PASSWORD 'grafana';

GRANT CONNECT ON DATABASE xdrop TO grafana;
GRANT USAGE ON SCHEMA public TO grafana;

# xdrop database
\c xdrop
GRANT SELECT ON TABLE public.ci_data TO grafana;
GRANT SELECT ON TABLE public.assets TO grafana;
GRANT SELECT ON TABLE public.components TO grafana;
GRANT USAGE ON SCHEMA public TO grafana;
\q

sudo grafana-cli plugins install grafana-clock-panel
sudo grafana-cli plugins install natel-discrete-panel
sudo grafana-cli plugins install natel-plotly-panel
sudo grafana-cli plugins install ryantxu-ajax-panel
sudo grafana-cli plugins install digiapulssi-breadcrumb-panel
sudo grafana-cli plugins install pierosavi-imageit-panel

sudo nano /etc/grafana/grafana.ini

[server]
;http_port = 3000, 80
;domain = admin.express-drop.com
;root_url = %(protocol)s://%(domain)s:%(http_port)s/grafana/
;serve_from_sub_path = true

sudo systemctl restart grafana-server