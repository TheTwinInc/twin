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
-- SELECT create_hypertable('ci_data', 'time_stamp', chunk_time_interval => INTERVAL '1 day');

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