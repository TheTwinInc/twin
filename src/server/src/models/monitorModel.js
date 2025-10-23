(function () {
    const _ = require('lodash');
    const { formatISO, format } = require('date-fns');
    const database = require('../persistence/databasePostgres');
    const log = require('../utils/log');
    const utils = require('../utils/utils');
    const si = require('systeminformation');
    // const fs = require('node:fs/promises');
    const fs = require('node:fs');
    const readLastLines = require('read-last-lines');
    
    const env = process.env.NODE_ENV || 'development';
    const config = require('../config/config')[env];
    const dateFormat = config.dateFormat;
    const tails = require('../config/tails');
    
    module.exports.getTwinStatistics = getTwinStatistics;
    module.exports.getLocationStatistics = getLocationStatistics;
    module.exports.getSystemInformation = getSystemInformation;
    module.exports.getHeartbeats = getHeartbeats;
    module.exports.upsertHeartbeat = upsertHeartbeat;
    module.exports.getFileTail = getFileTail;
    

    const groupFunction = {
        location : function(statistics) {return statistics.location;},
        sortationReason : function(statistics) {return statistics.sortationReason;},
        bucket10Min : function(statistics) {return formatISO(statistics.bucket10Min);},
        bucket1Hour : function(statistics) {return formatISO(statistics.bucket1Hour);}
    }

    async function getTwinStatistics() {
        let result = {};
        let rows = [];
        try {
            const query = {
                text: `SELECT * FROM v_twin_location_statistics;`
            };
            const resultQuery = await database.execute(query);
            let data;
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                data = resultQuery.rows;
                data.forEach(row => {
                    rows.push(utils.camelizeKeys(row));
                });
                let groupData = _.groupBy(rows, groupFunction['bucket1Hour']);
                // log.debug(`MM: Group twin satistics: ${JSON.stringify(groupData)}`);
                result['twinStatistics'] = groupData;
            } 
            // log.debug(`MM: Get twin satistics: ${JSON.stringify(data)}`);
        } catch(error) {
            log.error(`MM: Statistics Error: ${error}`);
            result = {
                error: 'MM: Unable to read twin satistics.',
            };
        }
        return result;
    }

    async function getSystemInformation() {
        let result = {};
        result['time'] = await time();
        // result['cpu'] = await cpu();
        result['mem'] = await mem();
        result['fs'] = await fileSystem();
        
        return result;
    }

    async function getLocationStatistics(context) {
        let result = {};
        let rows = [];
        let bucket = context.bucket ? context.bucket : '10 minutes';
        try {
            const query = {
                text: `WITH bag_found AS (SELECT bags.id, bags.identification_code FROM bags),
                        bag_log_found AS (SELECT bl.time_stamp, bl.bag_id, bl.bhs_code, bl.actual_state, bl.location, bl.security_status, bl.security_override, bl.sortation, bl.sortation_override, bl.sortation_reason, bl.sortation_reached, bf.id, bf.identification_code
                            FROM bags_log bl
                            JOIN bag_found bf ON bl.bag_id = bf.id WHERE bl.location IN (SELECT location FROM public.locations WHERE locations.type = '2')
                        ),
                        bag_info AS (SELECT DISTINCT blF.bag_id, time_bucket($1, blf.time_stamp) AS bucket, blf.identification_code, blf.location, blf.sortation_reason FROM bag_log_found blf)
                        SELECT
                            DISTINCT location,
                            bucket,
                            sortation_reason,
                            COUNT(1) OVER (PARTITION BY bucket) AS total_count,
                            COUNT(1) OVER (PARTITION BY bucket, location) AS location_count,
                            COUNT(1) OVER (PARTITION BY bucket, location, sortation_reason) AS location_sortation_count
                        FROM bag_info ORDER BY bucket;`,
                values: [bucket]
            };
            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            // log.debug(`MM: Get location statistics: ${JSON.stringify(data[0])}`);
            data.forEach(row => {
                rows.push(utils.camelizeKeys(row));
            });
            let groupData = _.groupBy(rows, groupFunction['location']);
            // log.debug(`MM: Group twin satistics: ${JSON.stringify(groupData)}`);
            result['locationStatistics'] = groupData;
            // result = rows;
        } catch(error) {
            log.error(`MM: Locations Error: ${error}`);
            result = {
                error: 'MM: Unable to location statistics.',
            };
        }
        return result;
    }

    // async function cpu() {
    //     let result = {};
    //     try {
    //         const data = await si.cpu();
    //         result = data;
    //         // log.info(`MM: CPU: ${JSON.stringify(data)}`);
    //     } catch (e) {
    //          log.error(`MM: Error: ${e}`);
    //     }
    //     return result;
    // }

    async function mem() {
        let result = {}
        try {
            const data = await si.mem();
            result = data;
            // log.info(`MM: MEM: ${JSON.stringify(data)}`);
        } catch (e) {
            log.error(`MM: Error: ${e}`);
        }
        return result;
    }

    async function fileSystem() {
        let result = {}
        try {
            const data = await si.fsSize();
            result = data;
            // log.info(`MM: FS: ${JSON.stringify(data)}`);
        } catch (e) {
            log.error(`MM: Error: ${e}`);
        }
        return result;  
    }

    async function time() {
        let result = {}
        try {
            const data = await si.time();
            result = data;
            // log.info(`MM: TIME: ${JSON.stringify(data)}`);
        } catch (e) {
            log.error(`MM: Error: ${e}`);
        }
        return result;  
    }

    async function getHeartbeats() {
        let result = {};
        let heartbeats = [];
        try {
            const query = {
                text: `SELECT * FROM heartbeat ORDER BY id DESC;`
            };
            const resultQuery = await database.execute(query);
            let data;
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                data = resultQuery.rows;
                data.forEach(heartbeat => {
                    heartbeats.push(utils.camelizeKeys(heartbeat));
                });
                result = heartbeats;
            } 
            // log.debug(`MM: Get heartbeat list: ${JSON.stringify(data)}`);
            
        } catch(error) {
            log.error(`MM: Heartbeat Error: ${error}`);
            result = {
                error: 'MM: Unable to read heartbeat.',
            };
        }
        return result;
    }

    async function upsertHeartbeat(handler) {
        let result = {};
        // log.debug(`MM: Get handler: ${JSON.stringify(handler)}`);
        try {
            let insertProps = [];
            let insertValues = [];
            let updateProps = [];
            let acceptedColumns = ['id', 'name', 'status'];
            let characterColumns = ['id', 'name'];
            let conflictColumns = ['id'];
            let updateColumns = ['status'];

            for (const prop in handler) {
                if ((acceptedColumns.includes(prop))) {
                    insertProps.push(`${_.snakeCase(prop)}`);
                    
                    if (characterColumns.includes(prop)) {
                        insertValues.push(`'${handler[prop]}'`);
                    } else {
                        insertValues.push(handler[prop]);
                    }
                    
                    if (updateColumns.includes(prop)) {
                        updateProps.push(`${_.snakeCase(prop)} = EXCLUDED.${_.snakeCase(prop)}`);
                    }
                }
            }

            const insertQueryColumns = insertProps.join();
            const insertQueryValues = insertValues.join();
            const conflictColumnsValues = conflictColumns.map(x => _.snakeCase(x)).join();

            const query = {
                text: `INSERT INTO heartbeat (${insertQueryColumns}) VALUES(${insertQueryValues}) ON CONFLICT (${conflictColumnsValues }) DO UPDATE SET ${updateProps} RETURNING *`,
            };
            // log.debug(`MM: Upsert heartbeat query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            let data;
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                data = resultQuery.rows;
                result = utils.camelizeKeys(data[0]);
            } 
        } catch (error) {
            log.error(`MM: Upsert heartbeat Error: ${error}`);
            result = {
                error: 'MM: Unable to upsert heartbeat.',
            };
        }
        return result;
    }

    async function getFileTail(context) {
        let result = {};
        try {
            let rows = [];
            let tail;
            log.info(`MM: Get File tail: ${JSON.stringify(context)}`);
            if ('' != context.name) {
                tailName = context.name;
                if (undefined != tails) {
                    let tail;
                    for (let index = 0; index < tails.length; index++) {
                        if (tailName == tails[index].name) {
                            tail = tails[index];
                            break;
                        }
                    }
                    log.info(`MM: Tail chosen: ${JSON.stringify(tail)}`);
                    // result = await readTail(tail);
                    result = await readLastLines.read(tail.file, 32);
                }
            }
        } catch (error) {
            log.error(`MM: Filetail Error: ${error}`);
            result = {
                error: 'MM: Unable to get file tail.',
            };
        }
        return result;
    }

    // async function readTail (tail, lines) {
    //     let result;
    //     if (undefined != tail) {
    //         try {
    //             fs.open(tail.file, 'r', (error, fd) => {
    //                 if (error) {
    //                     log.error(error);
    //                     throw error;
    //                 }
                    
    //                 fs.fstat(fd, function(error, stats) {
    //                     if (error) {
    //                         log.error(error);
    //                         throw error;
    //                     }
    //                     // log.debug(`MM: Stats ${JSON.stringify(stats)}`);
    //                     let bufferSize = stats.size;
    //                     let chunkSize = 512;
    //                     let buffer = Buffer.alloc(bufferSize);
    //                     let offset = bufferSize - chunkSize;
    //                     let bytesRead = 0;
    //                     // let offset = 0;
    //                     let lines = 0;
            
    //                     // while (offset < bufferSize) {
    //                     // while (offset > 0) {
    //                         chunkSize = Math.min(chunkSize, bufferSize - bytesRead);
    //                         log.info(`MM: Bytes read ${JSON.stringify(bytesRead)}`);
    //                         log.info(`MM: Chunk size ${JSON.stringify(chunkSize)}`);
    //                         log.info(`MM: Offset ${JSON.stringify(offset)}`);
    //                         fs.read(fd, buffer, offset, chunkSize, offset,
    //                             function (err, bytes, buff) {
    //                                 if (err) throw err;
    //                                 // let buffRead = buff.slice(bytesRead, bytesRead+chunkSize);
    //                                 // do something with buffRead
    //                                 // log.info(buffRead);
                                    
    //                                 // log.info(`MM: Data read bytes: ${bytes}`);
    //                                 // log.info(`MM: Buff read: ${buff.subarray(bytesRead, bytesRead + bytes)}`);
    //                                 // log.info(`MM: Buff read: ${buff.subarray(0,512)}`);
    //                                 bytesRead += bytes;
    //                                 offset -= bytes;
    //                                 // done();
    //                                 // if (err) {
    //                                 //     throw err;
    //                                 // }
    //                                 // const content = data;
    //                                 // bytesRead = bytes;
                                
    //                                 // Invoke the next step here however you like
    //                                 // log.info(content);   // Put all of the code here (not the best solution)
    //                             }
    //                         );
                            
    //                         // offset -= chunkSize;
    //                     // }
    //                     log.info(`Data read ${buffer.toString('utf8', 0, bufferSize)}`);
    //                     fs.close(fd);
    //                 });
                    
    //             });
    //             // const data = await fs.readFile(tail.file, { encoding: 'utf8' },);
    //             // result = data;
    //         } catch (error) {
    //             log.error(`MM: Error: ${error}`);
    //             result = {
    //                 error: 'MM: Unable to read tail.',
    //             };
    //         }
    //     }
    //     return result;
    // }

    
    // function extractFileName(name) {}
    //     for (let index = 0; index < filesTail.length; index++) {
    //         let fileTail = filesTail[index];
    //         fileTail.unwatch();
    //     }
})();