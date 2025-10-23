# # Step 0 password
# touch ~/.pgpass
# chmod 0600 ~/.pgpass
# # sudo nano ~/.pgpass

# # Add
# password=<password>
# echo "127.0.0.1:5432:*:postgres:$password" | sudo tee -a ~/.pgpass
# echo "localhost:5432:*:postgres:$password" | sudo tee -a ~/.pgpass
# cat ~/.pgpass

db=fastdrop

# psql -U postgres -h localhost -c "CREATE database fastdrop;"

# psql -U postgres -d $db -h localhost -c "CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"
# psql -U postgres -d $db -h localhost -c "CREATE EXTENSION IF NOT EXISTS tablefunc;"

psql -U postgres -d $db -h localhost -c "DROP TABLE flights CASCADE;"
psql -U postgres -d $db -h localhost -c \
"CREATE TABLE flights
(
    id                            INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ) PRIMARY KEY,
    "number"                      CHARACTER VARYING(8)  NOT NULL,
    schedule                      TIMESTAMPTZ           NOT NULL,
    status                        INTEGER               NULL,
    stand_number                  CHARACTER VARYING     NULL,
    sortation                     CHARACTER VARYING     NULL,

    CONSTRAINT flights_key UNIQUE (id, "number", schedule)
);"
psql -U postgres -d $db -h localhost -c "\d flights"

psql -U postgres -d $db -h localhost -c "DROP TABLE flight_sortations CASCADE;"
psql -U postgres -d $db -h localhost -c \
"CREATE TABLE flight_sortations
(
    id                            INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ) PRIMARY KEY,
    flight_id                     INTEGER               NOT NULL,
    destination                   CHARACTER VARYING(3)  NOT NULL,
    class                         CHARACTER VARYING(1)  NOT NULL,
    security_status               CHARACTER VARYING     NULL,
    open                          INTEGER               NOT NULL,
    close                         INTEGER               NOT NULL,
    "number"                      CHARACTER VARYING     NOT NULL,
    actual_state                  INTEGER               NOT NULL,

    CONSTRAINT flight_sortation_key UNIQUE (id, flight_id, destination, class, "number")

);"
psql -U postgres -d $db -h localhost -c "\d flight_sortations"

psql -U postgres -d $db -h localhost -c \
"SELECT create_hypertable('bags_log', 'time_stamp', chunk_time_interval => INTERVAL '1 day', if_not_exists => true, migrate_data => true );"

psql -U postgres -d $db -h localhost -c \
"ALTER TABLE bags_log SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'time_stamp'
);"

psql -U postgres -d $db -h localhost -c "SELECT add_compression_policy('bags_log', INTERVAL '7d');"
psql -U postgres -d $db -h localhost -c "SELECT add_retention_policy('bags_log', INTERVAL '365d');"

# FUNCTIONS

psql -U postgres -d $db -h localhost -c \
"CREATE OR REPLACE FUNCTION i_log_bags()
    RETURNS trigger
  AS
\$\$
BEGIN
         INSERT INTO bags_log(time_stamp, bag_id, actual_state)
         VALUES(now(), NEW.id, NEW.actual_state);
 
    RETURN NEW;
END;
\$\$
LANGUAGE plpgsql;"
# psql -U postgres -d $db -h localhost -c "\df+ i_log_bags"

psql -U postgres -d $db -h localhost -c \
"CREATE OR REPLACE FUNCTION u_log_bags()
  RETURNS trigger AS
\$\$
BEGIN
         INSERT INTO bags_log(time_stamp, bag_id, actual_state)
         VALUES(now(), NEW.id, NEW.actual_state);
 
    RETURN NEW;
END;
\$\$
LANGUAGE plpgsql;"

# TRIGGERS

psql -U postgres -d $db -h localhost -c \
"CREATE OR REPLACE TRIGGER i_log_bags_trigger
  AFTER INSERT
  ON bags
  FOR EACH ROW
  EXECUTE PROCEDURE i_log_bags();"

psql -U postgres -d $db -h localhost -c \
"CREATE OR REPLACE TRIGGER u_log_bags_trigger
  AFTER UPDATE
  ON bags
  FOR EACH ROW
  EXECUTE PROCEDURE u_log_bags();"

# CREATE TABLE ci_data
# (
#     time_stamp 	    TIMESTAMPTZ         NOT NULL,
#     session_id      INTEGER  	        NULL,
#     value           DOUBLE PRECISION 	NULL,
#     asset_id        INTEGER             NULL,
#     comp_id         DOUBLE PRECISION    NULL
# );

# SELECT create_hypertable('ci_data', 'time_stamp', chunk_time_interval => INTERVAL '1 day', if_not_exists => true, migrate_data => true );

# ALTER TABLE ci_data SET (
#   timescaledb.compress,
#   timescaledb.compress_segmentby = 'time_stamp'
# );

# SELECT add_compression_policy('ci_data', INTERVAL '7d');
# SELECT add_retention_policy('ci_data', INTERVAL '35d');

# CREATE TABLE public.assets
# (
#     name character varying COLLATE pg_catalog."default" NOT NULL,
#     external_id character varying COLLATE pg_catalog."default",
#     parent_external_id character varying COLLATE pg_catalog."default",
#     id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
#     parent_id integer,
#     site_id integer,
#     ci_id integer,
#     ipc_id integer,
#     description character varying COLLATE pg_catalog."default",
#     type_id integer,
#     type character varying COLLATE pg_catalog."default",
#     subtype character varying COLLATE pg_catalog."default",
#     CONSTRAINT assets_pkey PRIMARY KEY (id),
#     CONSTRAINT assets_id_site_id_ipc_id_ci_id_key UNIQUE (id, site_id, ci_id, ipc_id)
# )
# WITH (
#     OIDS = FALSE
# )
# TABLESPACE pg_default;

# CREATE TABLE public.components
# (
#     id double precision,
#     asset_id integer,
#     type_id integer,
#     db integer,
#     buffer_index integer,
#     buffer_offset integer,
#     enabled integer,
#     amount integer,
#     CONSTRAINT components_id_key UNIQUE (id),
#     CONSTRAINT components_id_fkey FOREIGN KEY (id)
#         REFERENCES public.assets (asset_id) MATCH SIMPLE
#         ON UPDATE NO ACTION
#         ON DELETE NO ACTION
# )
# WITH (
#     OIDS = FALSE
# )
# TABLESPACE pg_default;

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
sudo mv /var/lib/postgresql/14/main /var/lib/postgresql/14/main.bak

# STEP 4: Edit postgres configuration file:
sudo nano /etc/postgresql/14/main/postgresql.conf
data_directory = 'YOUR_HD_DIR_PATH/postgresql/14/main'

# STEP 5: Restart Postgres & Check everything is working
sudo systemctl start postgresql
pg_lsclusters

# sudo rm -Rf /var/lib/postgresql/11/main.bak