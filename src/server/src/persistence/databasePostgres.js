(function () {
    const pg = require('pg');
    var copyFrom = require('pg-copy-streams').from
    const env = process.env.NODE_ENV || 'development';
    const log = require('../utils/log');
    const config = require('../config/config')[env];
    const { EventEmitter } = require('events');

    module.exports.initialize = initialize;
    module.exports.close = close;
    module.exports.simpleExecute = simpleExecute;
    module.exports.execute = execute;
    module.exports.executeStream = executeStream;
    module.exports.isConnected = isConnected;

    let pool;
    let emitter;
    let reconnectTimeout;
    let heartbeatInterval;
    let connected = false;
    let dbConfig;

    async function initialize(dbconfig) {
        dbConfig = dbconfig;
        emitter = new EventEmitter();
        try {
            if (config.dbEnabled) {
                log.info('DB: Initialze postgres database');
                await connect();
            } else {
                log.info('DB: Postgres database not enabled');
            }
        } catch (err) {
            log.error(`DB: Initialize: ${err}`);
        }
        return emitter;
    }

    async function connect() {
        try {
            pool = new pg.Pool(dbConfig.dbPool);
            
            pool.on('error', async error => {
                emitter.emit('error', error);
                connected = false;
            });

            await updateConnectionStatus();
        } catch (err) {
            log.error(`DB: Connect ${err}`);
            connected = false;
            await reconnect();
        }
    }

    async function updateConnectionStatus() {
        let connectionStatus = await isConnected();
        if (connectionStatus) {
            emitter.emit('connect');
            connected = true;
        } else {
            connected = false;
        }
    }

    async function close() {
        try {
            log.info('DB: Close postgres database.');
            emitter.emit('close');
            connected = false;
            if (!pool.ending || !pool.ended) {
                await pool.end();
            }
        } catch (err) {
            log.error(`DB: Close ${err}`);
        }
    }

    async function reconnect() {
        try {
            if (!pool.ending || !pool.ended) {
                await pool.end();
            }
            if (connected) {
                emitter.emit('close');
            }
            log.info('DB: Reconnecting db.');
            reconnectTimeout = setTimeout(async function() {
                if(pool.ended) {
                    await connect();
                }
            }, 5000);
        } catch (err) {
            log.error(`DB: Reconnect ${err}`);
        }
    }

    async function simpleExecute(statement) {
        // log.debug('DB: Simple Execute statement postgres database');
        let client;
        let result;
        try {
            if(connected && (!pool.ending && !pool.ended)) {
                client = await pool.connect();
                if (client) {
                    result = await client.query(statement)
                } else {
                    log.error('DB: Execute statement reject no client');
                }
            }
        } catch (err) {
            log.error(err);
        } finally {
            if (client) {
                await client.release();
            }
            return result;
        }
    }

    async function execute(statement, values) {
        // log.debug('DB: Execute statement postgres database');
        let client;
        let result;
        try {
            if(connected && (!pool.ending && !pool.ended)) {
                client = await pool.connect();
                if (client) {
                    result = await client.query(statement, values)
                } else {
                    log.error('DB: Execute statement reject no client');
                }   
            }
        } catch (err) {
            log.error(err);
        } finally {
            if (client) {
                await client.release();
            }
            return result;
        }
    }

    async function executeStream(statement, bufferStream) {
        // log.debug('DB: Execute Stream statement postgres database');
        return new Promise(async (resolve, reject) => {
            pool.connect(function(error, client, done) {
                if (error) {
                    log.error(error);
                    reject(error);
                } else {
                    try {
                        let databaseStream = client.query(copyFrom(statement));
                        databaseStream.on('error', done);
                        databaseStream.on('finish', done);
                        bufferStream.on('error', done);
                        bufferStream.on('finish', done);
                        bufferStream.pipe(databaseStream);
    
                        resolve(databaseStream);
                    } catch (error) {
                        log.error(error);
                        reject(error);
                    }
                }
                
            });
        });
    }

    async function isConnected() {
        let client;
        let result = false;
        try {
            if(!pool.ending && !pool.ended) {
                client = await pool.connect();
                result = true;
            }
        } catch (err) {
            log.error(err);
        } finally {
            if (client) {
                try {
                    await client.release();
                } catch (err) {
                    log.error(err);
                }
            }
        }
        return result;
    }
})();
