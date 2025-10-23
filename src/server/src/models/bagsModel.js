(function () {
    const _ = require('lodash');
    const database = require('../persistence/databasePostgres.js');
    const log = require('../utils/log');
    const utils = require('../utils/utils');

    const env = process.env.NODE_ENV || 'development';
    const config = require('../config/config')[env];

    module.exports.getBag = getBag;
    module.exports.getBagLog = getBagLog;
    module.exports.getBags = getBags;
    module.exports.getBagsBsm = getBagsBsm;
    module.exports.getTransferBags = getTransferBags;
    module.exports.upsertBag = upsertBag;
    module.exports.updateBagSecurity = updateBagSecurity;
    module.exports.insertBagLog = insertBagLog;

    async function getBag(bag) {
        let result = {};
        if (bag.identificationCode != '') {
            try {
                const query = {
                    text: `SELECT * FROM v_bags_info WHERE identification_code = $1`,
                    values: [bag.identificationCode]
                };
                const resultQuery = await database.execute(query);
                if (undefined != resultQuery && undefined != resultQuery.rows) {
                    const data = resultQuery.rows;
                    // log.debug(`BM: Get bag data: ${JSON.stringify(resultQuery.rows)}`);
                    result = utils.camelizeKeys(data[0]);
                }
            } catch(error) {
                log.error(`BM: Error: ${error}`);
                result = {
                    error: 'BM: Unable to read bag.',
                };
            }
        }
        return result;
    }

    async function getBagLog(bag) {
        let result = [];
        let noReadTags = ['??????????', '!!!!!!!!!!', '          '];
        log.info(`BM: Get bag log: ${JSON.stringify(bag)}`);
        if (bag.id != '') {
            try {
                let query = {};
                if (undefined != bag.identificationCode && !noReadTags.includes(bag.identificationCode)) {
                    query = {
                        // text: `SELECT * FROM v_bags_log WHERE bag_id = $1`,
                        text: `SELECT DISTINCT time_stamp, bag_id, identification_code, bhs_code, actual_state, location, security_status, security_override, sortation, sortation_override, sortation_reason, sortation_reached FROM v_bags_log WHERE bag_id = $1`,
                    values: [bag.id]
                    };
                    // log.info(`BM: Read query: ${query}`);
                } else {
                    query = {
                        text: `SELECT DISTINCT time_stamp, bag_id, identification_code, bhs_code, actual_state, location, security_status, security_override, sortation, sortation_override, sortation_reason, sortation_reached FROM v_bags_log WHERE identification_code = $1 AND bhs_code = $2`,
                    values: [bag.identificationCode, bag.bhsCode]
                    };
                    // log.info(`BM: No Read query: ${query}`);
                }
                
                const resultQuery = await database.execute(query);
                if (undefined != resultQuery && undefined != resultQuery.rows) {
                    const data = resultQuery.rows;
                    // log.debug(`BM: Get bag log data: ${JSON.stringify(resultQuery.rows)}`);
                    data.forEach( (row) => {
                        result.push(utils.camelizeKeys(row));
                    });
                }
            } catch(error) {
                log.error(`BM: Error: ${error}`);
                result = {
                    error: 'BM: Unable to read bag log.',
                };
            }
        }
        return result;
    }

    async function getBags(bag) {
        let result = {};
        let bags = [];
        let filterStatement = [];
        try {
            let filterQueryValues = '';
            if ('' != bag.identificationCode) {
                let primaryColumns = ['identificationCode'];
                let characterColumns = ['identificationCode'];

                for (const prop in bag) {
                    if (primaryColumns.includes(prop)) {
                        if (characterColumns.includes(prop)) {
                            filterStatement.push(`${_.snakeCase(prop)} = '${bag[prop]}'`);
                        } else {
                            filterStatement.push(`${_.snakeCase(prop)} = ${bag[prop]}`);
                        }
                    }
                }
                filterQueryValues = `WHERE ${filterStatement.join()}`;
            }
            
            const query = {
                text: `SELECT id, identification_code, bhs_code, flight_number, destination, class, to_char(departure_date, 'YYYY-MM-DD') as departure_date, security_override FROM v_bags_info ${filterQueryValues} ORDER BY id DESC;`
            };
            // log.info(`BM: Bags list query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                // log.debug(`BM: Get bags list: ${JSON.stringify(data[0])}`);
                data.forEach(bag => {
                    bags.push(utils.camelizeKeys(bag));
                });
                result = bags;
            }
        } catch(error) {
            log.error(`BM: Error: ${error}`);
            result = {
                error: 'BM: Unable to read bagS.',
            };
        }
        return result;
    }

    async function getBagsBsm(bag) {
        let result = {};
        let bags = [];
        let filterStatement = [];
        try {
            let primaryColumns = ['identificationCode'];
            let characterColumns = ['identificationCode'];
            let queryColumns = ['bag_id', 'identification_code', 'departure_date', 'flight_number', 'bsm']
            
            let filterQueryValues = '';
            
            if ('' != bag.identificationCode) {
                

                for (const prop in bag) {
                    if (primaryColumns.includes(prop)) {
                        if (characterColumns.includes(prop)) {
                            filterStatement.push(`${_.snakeCase(prop)} = '${bag[prop]}'`);
                        } else {
                            filterStatement.push(`${_.snakeCase(prop)} = ${bag[prop]}`);
                        }
                    }
                }
                filterQueryValues = `WHERE ${filterStatement.join()}`;
            }

            const selectQueryValues = queryColumns.join();
            
            const query = {
                text: `SELECT ${selectQueryValues} FROM v_bags_bsm ${filterQueryValues} ORDER BY bag_id DESC;`
            };
            log.info(`BM: Bags list query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                // log.debug(`BM: Get bags list: ${JSON.stringify(data[0])}`);
                data.forEach(bag => {
                    bags.push(utils.camelizeKeys(bag));
                });
                result = bags;
            }
        } catch(error) {
            log.error(`BM: Error: ${error}`);
            result = {
                error: 'BM: Unable to read bagS.',
            };
        }
        return result;
    }

    async function getTransferBags() {
        let result = {};
        let bags = [];
        try {
            const query = {
                text: `SELECT * FROM v_bags_transfer ORDER BY schedule_time ASC;`
                // text: `SELECT * FROM bags ORDER BY id DESC;`
            };
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                // log.debug(`BM: Get bags list: ${JSON.stringify(data[0])}`);
                data.forEach(bag => {
                    bags.push(utils.camelizeKeys(bag));
                });
                result = bags;
            }
        } catch(error) {
            log.error(`BM: Error: ${error}`);
            result = {
                error: 'BM: Unable to read bagS.',
            };
        }
        return result;
    }
    
    async function upsertBag(bag) {
        let result = {};
        // log.debug(`BM: Get bag: ${JSON.stringify(bag)}`);
        try {
            let insertProps = [];
            let insertValues = [];
            let updateProps = [];
            let acceptedColumns = ['identificationCode', 'actualState', 'securityStatus', 'location', 'flightNumber', 'flightSortation'];
            let characterColumns = ['identificationCode', 'securityStatus', 'location', 'flightNumber', 'flightSortation'];
            let conflictColumns = ['identificationCode'];
            let updateColumns = ['actualState', 'securityStatus', 'location', 'flightNumber', 'flightSortation'];

            for (const prop in bag) {
                if ((acceptedColumns.includes(prop))) {
                    insertProps.push(`${_.snakeCase(prop)}`);
                    
                    if (characterColumns.includes(prop)) {
                        insertValues.push(`'${bag[prop]}'`);
                    } else {
                        insertValues.push(bag[prop]);
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
                text: `INSERT INTO bags (${insertQueryColumns}) VALUES(${insertQueryValues}) ON CONFLICT (${conflictColumnsValues }) DO UPDATE SET ${updateProps} RETURNING *`,
            };
            // log.debug(`BM: Upsert bag query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                result = utils.camelizeKeys(data[0]);
            }
        } catch (err) {
            log.error(err);
            result = {
                error: 'BM: Unable to upsert bag.',
            };
        }
        return result;
    }

    async function updateBagSecurity(bag) {
        let result = {};
        log.info(`FM: Update security bag: ${JSON.stringify(bag)}`);
        try {
            let updateStatement = [];
            let filterStatement = [];
            let acceptedColumns = ['securityOverride'];
            let characterColumns = [, 'securityOverride'];
            let primaryColumns = ['id'];
            let returningColumns = ['id', 'identificationCode', 'securityOverride'];

            for (const prop in bag) {
                if (acceptedColumns.includes(prop)) {
                    if (characterColumns.includes(prop) && 'null' != bag[prop]) {
                        updateStatement.push(`${_.snakeCase(prop)} = '${bag[prop]}'`);
                    } else {
                        updateStatement.push(`${_.snakeCase(prop)} = ${bag[prop]}`);
                    }
                }
                if (primaryColumns.includes(prop)) {
                    if (characterColumns.includes(prop)) {
                        filterStatement.push(`${_.snakeCase(prop)} = '${bag[prop]}'`);
                    } else {
                        filterStatement.push(`${_.snakeCase(prop)} = ${bag[prop]}`);
                    }
                }
            }

            const updateQueryValues = updateStatement.join();
            const filterQueryValues = filterStatement.join();
            const returningQueryValues = returningColumns.map(x => _.snakeCase(x)).join();

            const query = {
                text: `UPDATE bags SET ${updateQueryValues} WHERE ${filterQueryValues} RETURNING ${returningQueryValues}`,
            };

            log.info(`FM: Query: ${JSON.stringify(query)}`);

            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                result = utils.camelizeKeys(data[0]);
            }
        } catch (err) {
            log.error(err);
            result = {
                error: 'FM: Unable to update bag security.',
            };
        }
        return result;
    }

    async function insertBagLog(bag) {
        let result = {};
        try {
            const query = {
                text: `CALL insert_bag_log(ivc_identification_code => $1, ivc_bhs_code => $2, ivc_location => $3, iin_actual_state => $4, ivc_sortation_reached => $5, ivc_security_status => $6 )`,
                values: [bag.identificationCode, bag.bhsCode, bag.location, bag.actualState, bag.sortationReached, bag.securityStatus]
            };
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                const dataParsed = utils.camelizeKeys(data[0]);
                if (undefined != dataParsed.ivcIdentificationCode && undefined != dataParsed.oinBagId) {
                    result['identificationCode'] = dataParsed.ivcIdentificationCode;
                    result['id'] = dataParsed.oinBagId;
                }
            }
        } catch (err) {
            log.error(err);
            result = {
                error: 'BM: Unable to upsert bag.',
            };
        }
        return result;
    }
})();
