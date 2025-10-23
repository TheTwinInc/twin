# # Step 0 password
# touch ~/.pgpass
# chmod 0600 ~/.pgpass
# # sudo nano ~/.pgpass

# # Add
# password=<password>
# echo "127.0.0.1:5432:*:postgres:$password" | sudo tee -a ~/.pgpass
# echo "localhost:5432:*:postgres:$password" | sudo tee -a ~/.pgpass
# cat ~/.pgpass



# psql -U postgres -h localhost -c "CREATE database fastdrop;"

# psql -U postgres -d $db -h localhost -c "CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"
# psql -U postgres -d $db -h localhost -c "CREATE EXTENSION IF NOT EXISTS tablefunc;"
db=fastdrop

psql -U postgres -d $db -h localhost -c "DROP TABLE bags CASCADE;"
psql -U postgres -d $db -h localhost -c \
"CREATE TABLE bags
(
    id                            INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ) PRIMARY KEY,
    identification_code           CHARACTER VARYING     NOT NULL,
    actual_state                  INTEGER               NULL DEFAULT 0,
    security_status               CHARACTER VARYING     NULL DEFAULT NULL,
    location                      CHARACTER VARYING     NULL DEFAULT NULL,
    flight_number                 CHARACTER VARYING     NULL,
    flight_sortation              CHARACTER VARYING     NULL,
    
    CONSTRAINT bags_customer_key UNIQUE (identification_code)
);"
psql -U postgres -d $db -h localhost -c "\d bags"

psql -U postgres -d $db -h localhost -c "DROP TABLE bags_log CASCADE;"
psql -U postgres -d $db -h localhost -c \
"CREATE TABLE bags_log
(
    time_stamp                    TIMESTAMPTZ           NOT NULL,
    bag_id                        INTEGER               NOT NULL,
    identification_code           CHARACTER VARYING     NOT NULL,
    actual_state                  INTEGER               NOT NULL,
    security_status               CHARACTER VARYING     NULL,
    location                      CHARACTER VARYING     NULL,
    flight_number                 CHARACTER VARYING     NULL,
    flight_sortation              CHARACTER VARYING     NULL
);"
psql -U postgres -d $db -h localhost -c "\d bags_log"

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

# psql -U postgres -d $db -h localhost -c \
# "CREATE OR REPLACE FUNCTION i_bags()
#   RETURNS trigger AS
# \$\$
# BEGIN   IF EXISTS (
#           SELECT * FROM bags b
#           WHERE b.identification_code = NEW.identification_code
#         ) THEN
#         ELSE
#           INSERT INTO bags(bag_id, identification_code) VALUES(NEW.id, NEW.identification_code);
#         END IF
        
 
#     RETURN NEW;
# END;
# \$\$
# LANGUAGE plpgsql;"

psql -U postgres -d $db -h localhost -c \
"CREATE OR REPLACE FUNCTION log_bags()
  RETURNS trigger AS
\$\$
BEGIN
        INSERT INTO bags_log(time_stamp, bag_id, identification_code, actual_state, security_status, location, flight_number, flight_sortation)
        VALUES(now(), NEW.id, NEW.identification_code, NEW.actual_state, NEW.security_status, NEW.location, NEW.flight_number, NEW.flight_sortation);
    RETURN NEW;
END;
\$\$
LANGUAGE plpgsql;"
# psql -U postgres -d $db -h localhost -c "\df+ log_bags"
psql -U postgres -d $db -h localhost -c "\df log_bags"

# psql -U postgres -d $db -h localhost -c \
# "CREATE OR REPLACE FUNCTION u_log_bags()
#   RETURNS trigger AS
# \$\$
# BEGIN
#         INSERT INTO bags_log(time_stamp, bag_id, identification_code, actual_state, security_status, location, flight_number, flight_sortation)
#         VALUES(now(), NEW.id, NEW.identification_code, NEW.actual_state, NEW.security_status, NEW.location, NEW.flight_number, NEW.flight_sortation);
 
#     RETURN NEW;
# END;
# \$\$
# LANGUAGE plpgsql;"

# TRIGGERS

psql -U postgres -d $db -h localhost -c \
"CREATE OR REPLACE TRIGGER i_log_bags_trigger
  AFTER INSERT
  ON bags
  FOR EACH ROW
  EXECUTE PROCEDURE log_bags();"

psql -U postgres -d $db -h localhost -c \
"CREATE OR REPLACE TRIGGER u_log_bags_trigger
  AFTER UPDATE
  ON bags
  FOR EACH ROW
  EXECUTE PROCEDURE log_bags();"

