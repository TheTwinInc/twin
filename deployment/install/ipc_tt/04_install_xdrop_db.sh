psql -U postgres -h localhost

CREATE database xdrop;
\c xdrop

CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

CREATE EXTENSION IF NOT EXISTS tablefunc;

CREATE TABLE ci_data
(
    time_stamp 	    TIMESTAMPTZ         NOT NULL,
    session_id      DOUBLE PRECISION 	NULL,
    value           DOUBLE PRECISION 	NULL,
    type_id         INTEGER             NULL,
    comp_id         DOUBLE PRECISION    NULL,
    ci_id           DOUBLE PRECISION 	NULL
);

SELECT create_hypertable('ci_data', 'time_stamp', chunk_time_interval => INTERVAL '1 day', if_not_exists => true, migrate_data => true );

ALTER TABLE ci_data SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'time_stamp'
);

SELECT add_compression_policy('ci_data', INTERVAL '7d');
SELECT add_retention_policy('ci_data', INTERVAL '35d');


CREATE TABLE public.assets
(
    name character varying COLLATE pg_catalog."default" NOT NULL,
    external_id character varying COLLATE pg_catalog."default",
    parent_external_id character varying COLLATE pg_catalog."default",
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    parent_id integer,
    site_id integer,
    ci_id integer,
    ipc_id integer,
    comp_id double precision,
    description character varying COLLATE pg_catalog."default",
    type_id integer,
    type character varying COLLATE pg_catalog."default",
    subtype character varying COLLATE pg_catalog."default",
    CONSTRAINT components_pkey PRIMARY KEY (id),
    CONSTRAINT assets_site_id_ipc_id_ci_id_comp_id_key UNIQUE (site_id, ci_id, ipc_id, comp_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

CREATE TABLE public.components
(
    id integer,
    type_id integer,
    buffer_index integer,
    db integer,
    buffer_offset integer,
    enabled integer,
    amount integer,
    CONSTRAINT components_plc_id_key UNIQUE (id),
    CONSTRAINT components_id_fkey FOREIGN KEY (id)
        REFERENCES public.assets (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

CREATE TABLE cms (
    time_stamp  TIMESTAMPTZ       NOT NULL,
    location 	INTEGER  NULL,
    comp_id 	DOUBLE PRECISION  NULL,
    channel_id 	INTEGER  NULL,
    vRMS        DOUBLE PRECISION  NULL,
    aRMS        DOUBLE PRECISION  NULL,
    DKW         DOUBLE PRECISION  NULL,
    peak        DOUBLE PRECISION  NULL
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

# SELECT create_hypertable('cms', 'time_stamp');

SELECT create_hypertable('cms', 'time_stamp', chunk_time_interval => INTERVAL '1 day', if_not_exists => true, migrate_data => true );

ALTER TABLE cms SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'time_stamp'
);

SELECT add_compression_policy('cms', INTERVAL '7d');
SELECT add_retention_policy('cms', INTERVAL '35d');


\q

# Update timescaledb
# psql -U postgres -X -h localhost -d itus

# ALTER EXTENSION timescaledb UPDATE;
# \q

pg_lsclusters
# Move DB
sudo -u postgres psql
# Once you have the PostgreSQL prompt opened up, use the following command to show the current data directory:
SHOW data_directory;

# STEP 1: If postgresql is running, stop it:
sudo systemctl stop postgresql
sudo systemctl status postgresql
netstat -ano | grep 5432

# STEP 2: Get the path to access your hard drive. (if Linux) Find and mount your hard drive by:
# Retrieve your device's name with:
sudo fdisk -l
# Then mount your device
sudo mount /dev/DEVICE_NAME YOUR_HD_DIR_PATH

# STEP 3: Copy the existing database directory to the new location (in your hard drive) with rsync.
sudo rsync -av /var/lib/postgresql YOUR_HD_DIR_PATH
sudo mv /var/lib/postgresql/11/main /var/lib/postgresql/11/main.bak

# STEP 4: Edit postgres configuration file:
sudo nano /etc/postgresql/11/main/postgresql.conf
data_directory = 'YOUR_HD_DIR_PATH/postgresql/11/main'

# STEP 5: Restart Postgres & Check everything is working
sudo systemctl start postgresql
pg_lsclusters

# sudo rm -Rf /var/lib/postgresql/11/main.bak