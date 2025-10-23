(function () {
    const _ = require('lodash');
    const database = require('../persistence/databasePostgres.js');
    const log = require('../utils/log');
    const utils = require('../utils/utils');
    

    // module.exports.getFlight = getFlight;
    module.exports.getFlights = getFlights;
    module.exports.getDepartureFlights = getDepartureFlights;
    module.exports.getDepartureDisplay = getDepartureDisplay;
    module.exports.insertDepartureFlight = insertDepartureFlight;
    module.exports.updateDepartureFlightLocation = updateDepartureFlightLocation;
    module.exports.updateDepartureFlightSecurity = updateDepartureFlightSecurity;
    module.exports.upsertDepartureFlights = upsertDepartureFlights;
    module.exports.deleteFlight = deleteFlight;
    module.exports.deleteFlights = deleteFlights;

    // async function getFlight(flight) {
    //     let result = {};
    //     if (flight.flightKey != '') {
    //         try {
    //             const query = {
    //                 text: `WITH bag_found AS (INSERT INTO bags(identification_code) VALUES($1) ON CONFLICT DO NOTHING RETURNING * ),
    //                 bag_requested AS (SELECT * FROM bags b WHERE b.identification_code = $1 UNION SELECT * FROM bag_found bf)
    //                 SELECT * FROM bag_requested;`,
    //             values: [flight.identificationCode]
    //             };
    //             const resultQuery = await database.execute(query);
    //             const data = resultQuery.rows;
    //             log.debug(`FM: Get flight data: ${JSON.stringify(resultQuery.rows)}`);
    //             result = utils.camelizeKeys(data[0]);
    //         } catch(error) {
    //             log.error(`FM: Error: ${error}`);
    //             result = {
    //                 error: 'FM: Unable to read flight.',
    //             };
    //         }
    //     }
    //     return result;
    // }

    async function getFlights() {
        let result = {};
        let flights = [];
        try {
            const query = {
                text: `SELECT * FROM v_flights WHERE schedule_time > now() - INTERVAL '24 hours' ORDER BY schedule_time ASC;`
            };
            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            // log.debug(`FM: Get flights list: ${JSON.stringify(data)}`);
            data.forEach(flight => {
                flights.push(utils.camelizeKeys(flight));
            });
            result = flights;
        } catch(error) {
            log.error(`FM: Error: ${error}`);
            result = {
                error: 'FM: Unable to read flights.',
            };
        }
        return result;
    }

    async function getDepartureFlights() {
        let result = {};
        let flights = [];
        try {
            const query = {
                text: `SELECT * FROM v_flights_departure WHERE schedule_time > now() - INTERVAL '24 hours' ORDER BY schedule_time ASC;`
            };
            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            data.forEach(flight => {
                flights.push(utils.camelizeKeys(flight));
            });
            result = flights;
        } catch(error) {
            log.error(`FM: Error: ${error}`);
            result = {
                error: 'FM: Unable to read flights.',
            };
        }
        return result;
    }

    async function getDepartureDisplay(departureFlight) {
        let result = {};
        let flights = [];
        try {
            const query = {
                text: `SELECT * FROM v_display_departure WHERE location = $1;`,
                values: [departureFlight.display]
            };
            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            data.forEach(flight => {
                flights.push(utils.camelizeKeys(flight));
            });
            result = flights;
        } catch(error) {
            log.error(`FM: Error: ${error}`);
            result = {
                error: 'FM: Unable to read flights.',
            };
        }
        return result;
    }

    async function upsertDepartureFlights(flights) {
        let result = {};
        try {
            let insertProps = [];
            let insertValues = [];
            let updateProps = [];
            let acceptedColumns = ['flightKey', 'location', 'open', 'close'];
            let characterColumns = ['identificationCode', 'securityStatus', 'location', 'flightNumber', 'flightSortation'];
            let conflictColumns = ['identificationCode'];
            let updateColumns = ['actualState', 'securityStatus', 'location', 'flightNumber', 'flightSortation'];

            for (const prop in flights) {
                if ((acceptedColumns.includes(prop))) {
                    insertProps.push(`${_.snakeCase(prop)}`);
                    
                    if (characterColumns.includes(prop)) {
                        insertValues.push(`'${flight[prop]}'`);
                    } else {
                        insertValues.push(flight[prop]);
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
                text: `INSERT INTO flights (${insertQueryColumns}) VALUES(${insertQueryValues}) ON CONFLICT (${conflictColumnsValues }) DO UPDATE SET ${updateProps} RETURNING *`,
            };
            log.debug(`FM: Upsert flight query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            result = utils.camelizeKeys(data[0]);
        } catch (err) {
            log.error(err);
            result = {
                error: 'FM: Unable to upsert flight.',
            };
        }
        return result;
    }
    
    async function insertDepartureFlight(flight) {
        let result = {};
        log.info(`FM: Insert flight: ${JSON.stringify(flight)}`);
        try {
            let insertProps = [];
            let insertValues = [];
            let updateProps = [];
            let acceptedColumns = ['flightKey', 'flightNumber', 'scheduleTime', 'arrDep', 'domInt', 'airport', 'airline'];
            let characterColumns = ['flightKey', 'flightNumber', 'scheduleTime', 'arrDep', 'domInt', 'airport', 'airline'];
            let arrayColumns = [];
            let conflictColumns = ['flightKey'];

            for (const prop in flight) {
                if ((acceptedColumns.includes(prop))) {
                    insertProps.push(`${_.snakeCase(prop)}`);
                    
                    if (characterColumns.includes(prop)) {
                        insertValues.push(`'${flight[prop]}'`);
                    } else if (arrayColumns.includes(prop)){
                        insertValues.push(`ARRAY [${flight[prop]}]`);
                    } else {
                        insertValues.push(flight[prop]);
                    }
                }
            }

            const insertQueryColumns = insertProps.join();
            const insertQueryValues = insertValues.join();
            const conflictColumnsValues = conflictColumns.map(x => _.snakeCase(x)).join();

            const query = {
                text: `INSERT INTO flights (${insertQueryColumns}) VALUES(${insertQueryValues}) ON CONFLICT (${conflictColumnsValues }) DO NOTHING RETURNING *`,
            };
            log.debug(`FM: Insert flight query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            result = utils.camelizeKeys(data[0]);
        } catch (err) {
            log.error(err);
            result = {
                error: 'FM: Unable to upsert flight.',
            };
        }
        return result;
    }

    async function updateDepartureFlightLocation(flight) {
        let result = {};
        log.info(`FM: Upsert flight: ${JSON.stringify(flight)}`);
        try {
            let insertProps = [];
            let insertValues = [];
            let updateProps = [];
            let acceptedColumns = ['flightKey', 'location', 'open', 'close'];
            let characterColumns = ['flightKey', 'location'];
            let arrayColumns = [];
            let conflictColumns = ['flightKey'];
            let updateColumns = ['location', 'open', 'close'];

            for (const prop in flight) {
                if ((acceptedColumns.includes(prop))) {
                    insertProps.push(`${_.snakeCase(prop)}`);
                    
                    if (characterColumns.includes(prop)) {
                        insertValues.push(`'${flight[prop]}'`);
                    } else if (arrayColumns.includes(prop)){
                        insertValues.push(`ARRAY [${flight[prop]}]`);
                    } else {
                        insertValues.push(flight[prop]);
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
                text: `INSERT INTO flights_location (${insertQueryColumns}) VALUES(${insertQueryValues}) ON CONFLICT (${conflictColumnsValues }) DO UPDATE SET ${updateProps} RETURNING *`,
            };
            log.debug(`FM: Upsert flight query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            result = utils.camelizeKeys(data[0]);
        } catch (err) {
            log.error(err);
            result = {
                error: 'FM: Unable to upsert flight.',
            };
        }
        return result;
    }

    async function updateDepartureFlightSecurity(flight) {
        let result = {};
        log.info(`FM: Update security flight: ${JSON.stringify(flight)}`);
        try {
            let updateStatement = [];
            let filterStatement = [];
            let acceptedColumns = ['securityOverride'];
            let characterColumns = ['flightKey', 'securityOverride'];
            let primaryColumns = ['flightKey'];
            let returningColumns = ['flightKey', 'securityOverride'];

            for (const prop in flight) {
                if (acceptedColumns.includes(prop)) {
                    if (characterColumns.includes(prop) && 'null' != flight[prop]) {
                        updateStatement.push(`${_.snakeCase(prop)} = '${flight[prop]}'`);
                    } else {
                        updateStatement.push(`${_.snakeCase(prop)} = ${flight[prop]}`);
                    }
                }
                if (primaryColumns.includes(prop)) {
                    if (characterColumns.includes(prop)) {
                        filterStatement.push(`${_.snakeCase(prop)} = '${flight[prop]}'`);
                    } else {
                        filterStatement.push(`${_.snakeCase(prop)} = ${flight[prop]}`);
                    }
                }
            }

            const updateQueryValues = updateStatement.join();
            const filterQueryValues = filterStatement.join();
            const returningQueryValues = returningColumns.map(x => _.snakeCase(x)).join();

            const query = {
                text: `UPDATE flights SET ${updateQueryValues} WHERE ${filterQueryValues} RETURNING ${returningQueryValues}`,
            };

            log.info(`FM: Query: ${JSON.stringify(query)}`);

            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            if (undefined != data) {
                result = utils.camelizeKeys(data[0]);
            }
        } catch (err) {
            log.error(err);
            result = {
                error: 'FM: Unable to update flight security.',
            };
        }
        return result;
    }

    async function deleteFlight(flight) {
        let result = {};
        log.debug(`SM: Delete flight: ${JSON.stringify(flight)}`);
        try {
            let primaryProp = 'flightKey';
            let primaryColumnValue;
            let characterColumns = ['flightKey'];

            if (characterColumns.includes(primaryProp)) {
                primaryColumnValue = `'${flight[primaryProp]}'`;
            } else {
                primaryColumnValue = flight[primaryProp];
            }

            const primaryColumn = _.snakeCase(primaryProp);

            const queryFlightsLocation = {
                text: `DELETE FROM flights_location WHERE ${primaryColumn} = ${primaryColumnValue}`,
            };
            await database.execute(queryFlightsLocation);
                    
            const query = {
                text: `DELETE FROM flights WHERE ${primaryColumn} = ${primaryColumnValue} RETURNING *`,
            };
            // log.debug(`SM: Delete airline query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            result = utils.camelizeKeys(data[0]);
        } catch (err) {
            log.error(err);
            result = {
                error: 'SM: Unable to delete airline.',
            };
        }
        return result;
    }

    async function deleteFlights(flights) {
        let result = {};
        log.debug(`SM: Delete flights: ${JSON.stringify(flights)}`);
        try {
            let primaryProp = 'flightKey';
            let primaryColumnValues = flights[primaryProp];

            const primaryColumn = _.snakeCase(primaryProp);
            
            const queryFlightsLocation = {
                text: `DELETE FROM flights_location WHERE ${primaryColumn} IN (${primaryColumnValues})`,
            };
            await database.execute(queryFlightsLocation);
            
            const queryFlights = {
                text: `DELETE FROM flights WHERE ${primaryColumn} IN (${primaryColumnValues}) RETURNING *`,
            };
            // log.debug(`SM: Delete flights query: ${JSON.stringify(queryFlights)}`);
            const resultQuery = await database.execute(queryFlights);
            const data = resultQuery.rows;
            result = utils.camelizeKeys(data);
            log.debug(`SM: Delete flights returning: ${JSON.stringify(data)}`);
            // result = data;
        } catch (err) {
            log.error(err);
            result = {
                error: 'SM: Unable to delete flights.',
            };
        }
        return result;
    }
})();
