(function () {
  module.exports = {
    development: {
      dbPool: {
        user: 'postgres', // env var: PGUSER
        database: 'twin', // env var: PGDATABASE
        password: '!7win4dmin', // env var: PGPASSWORD
        // host: 'db.twin', // Server hosting the postgres database
        host: '127.0.0.1', // Server hosting the postgres database
        // host: '10.5.97.89', // Server hosting the postgres database
        // host: '192.168.2.31', // Server hosting the postgres database
        port: 5432, // env var: PGPORT
        max: 10, // max number of clients in the pool
        idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
      }
    },
    production: {
      dbPool: {
        user: 'postgres', // env var: PGUSER
        database: 'twin', // env var: PGDATABASE
        password: '!7win4dmin', // env var: PGPASSWORD
        // host: 'localhost', // Server hosting the postgres database
        host: 'db.twin', // Server hosting the postgres database
        port: 5432, // env var: PGPORT
        max: 10, // max number of clients in the pool
        idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
      }
    },
    cloud: {
      dbPool: {
        user: 'postgres', // env var: PGUSER
        database: 'twin', // env var: PGDATABASE
        password: '!7win4dmin', // env var: PGPASSWORD
        // host: 'localhost', // Server hosting the postgres database
        host: 'localhost', // Server hosting the postgres database
        port: 5432, // env var: PGPORT
        max: 10, // max number of clients in the pool
        idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
      }
    },
  };
})();
