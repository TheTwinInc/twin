const { result } = require('lodash');

(function () {
    const _ = require('lodash');
    const database = require('../persistence/databasePostgres.js');
    const log = require('../utils/log');
    const utils = require('../utils/utils');

    const env = process.env.NODE_ENV || 'development';
    const config = require('../config/config')[env];

    module.exports.getHandlers = getHandlers;
    module.exports.upsertHandler = upsertHandler;
    module.exports.getLocations = getLocations;
    module.exports.upsertLocation = upsertLocation;
    module.exports.deleteLocation = deleteLocation;
    module.exports.deleteLocations = deleteLocations;
    module.exports.getAirports = getAirports;
    module.exports.upsertAirport = upsertAirport;
    module.exports.deleteAirport = deleteAirport;
    module.exports.deleteAirports = deleteAirports;
    module.exports.getAirlines = getAirlines;
    module.exports.upsertAirline = upsertAirline;
    module.exports.upsertAirlineLocation = upsertAirlineLocation;
    module.exports.deleteAirline = deleteAirline;
    module.exports.deleteAirlines = deleteAirlines;
    module.exports.getSettings = getSettings;
    module.exports.upsertSetting = upsertSetting;
    

    async function getHandlers() {
        let result = {};
        let handlers = [];
        try {
            const query = {
                text: `SELECT * FROM handlers ORDER BY id DESC;`
            };
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                // log.debug(`SM: Get handlers list: ${JSON.stringify(data)}`);
                data.forEach(handler => {
                    handlers.push(utils.camelizeKeys(handler));
                });
                result = handlers;
            }
        } catch(error) {
            log.error(`SM: Error: ${error}`);
            result = {
                error: 'SM: Unable to read handlers.',
            };
        }
        return result;
    }

    async function upsertHandler(handler) {
        let result = {};
        // log.debug(`SM: Get handler: ${JSON.stringify(handler)}`);
        try {
            let insertProps = [];
            let insertValues = [];
            let updateProps = [];
            let acceptedColumns = ['id', 'name', 'location'];
            let characterColumns = ['name'];
            let conflictColumns = ['id'];
            let updateColumns = ['name', 'location'];

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
                text: `INSERT INTO handlers (${insertQueryColumns}) VALUES(${insertQueryValues}) ON CONFLICT (${conflictColumnsValues }) DO UPDATE SET ${updateProps} RETURNING *`,
            };
            // log.debug(`SM: Upsert handler query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                result = utils.camelizeKeys(data[0]);
            }
            
        } catch (err) {
            log.error(err);
            result = {
                error: 'SM: Unable to upsert handler.',
            };
        }
        return result;
    }

    async function getLocations() {
        let result = {};
        let locations = [];
        try {
            const query = {
                text: `SELECT * FROM locations ORDER BY id;`
            };
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                // log.debug(`SM: Get locations list: ${JSON.stringify(data)}`);
                data.forEach(location => {
                    locations.push(utils.camelizeKeys(location));
                });
                result = locations;
            }
        } catch(error) {
            log.error(`SM: Error: ${error}`);
            result = {
                error: 'SM: Unable to read locations.',
            };
        }
        return result;
    }

    async function upsertLocation(location) {
        let result = {};
        log.debug(`SM: Upsert: ${JSON.stringify(location)}`);
        try {
            let insertProps = [];
            let insertValues = [];
            let updateProps = [];
            let acceptedColumns = ['id', 'name', 'type', 'area', 'enable', 'description'];
            let characterColumns = ['id', 'name', 'type', 'area', 'description'];
            let conflictColumns = ['id'];
            let updateColumns = ['name', 'enable', 'description'];

            for (const prop in location) {
                if ((acceptedColumns.includes(prop))) {
                    insertProps.push(`${_.snakeCase(prop)}`);
                    
                    if (characterColumns.includes(prop)) {
                        insertValues.push(`'${location[prop]}'`);
                    } else {
                        insertValues.push(location[prop]);
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
                text: `INSERT INTO locations (${insertQueryColumns}) VALUES(${insertQueryValues}) ON CONFLICT (${conflictColumnsValues }) DO UPDATE SET ${updateProps} RETURNING *`,
            };
            // log.debug(`SM: Upsert location query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                // log.debug(`SM: Upsert location data: ${JSON.stringify(data)}`);
                result = utils.camelizeKeys(data[0]);
            }
        } catch (err) {
            log.error(err);
            result = {
                error: 'SM: Unable to upsert location.',
            };
        }
        return result;
    }

    async function deleteLocation(location) {
        let result = {};
        // log.debug(`SM: Delete location: ${JSON.stringify(location)}`);
        try {
            let primaryColumn = 'id';
            let primaryColumnValue;
            let characterColumns = ['id'];

            if (characterColumns.includes(primaryColumn)) {
                primaryColumnValue = `'${location[primaryColumn]}'`;
            } else {
                primaryColumnValue = location[primaryColumn];
            }
                    
            const query = {
                text: `DELETE FROM locations WHERE ${primaryColumn} = ${primaryColumnValue} RETURNING *`,
            };
            // log.debug(`SM: Delete location query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                result = utils.camelizeKeys(data[0]);
            }
        } catch (err) {
            log.error(err);
            result = {
                error: 'SM: Unable to delete location.',
            };
        }
        return result;
    }

    async function deleteLocations(locations) {
        let result = {};
        // log.debug(`SM: Delete locations: ${JSON.stringify(locations)}`);
        try {
            let primaryColumn = 'id';
            let primaryColumnValues = locations[primaryColumn];
            const query = {
                text: `DELETE FROM locations WHERE ${primaryColumn} IN (${primaryColumnValues}) RETURNING *`,
            };
            // log.debug(`SM: Delete location query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                result = utils.camelizeKeys(data);
            }
        } catch (err) {
            log.error(err);
            result = {
                error: 'SM: Unable to delete locations.',
            };
        }
        return result;
    }

    async function getAirports() {
        let result = {};
        let airports = [];
        try {
            const query = {
                text: `SELECT * FROM airports ORDER BY code;`
            };
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                // log.debug(`SM: Get airports: ${JSON.stringify(data[0])}`);
                data.forEach(airport => {
                    airports.push(utils.camelizeKeys(airport));
                });
                result = airports;
            }
        } catch(error) {
            log.error(`SM: Error: ${error}`);
            result = {
                error: 'SM: Unable to read airports.',
            };
        }
        return result;
    }

    async function upsertAirport(airport) {
        let result = {};
        // log.debug(`SM: Upsert airport: ${JSON.stringify(airport)}`);
        try {
            let insertProps = [];
            let insertValues = [];
            let updateProps = [];
            let acceptedColumns = ['code', 'name', 'icao', 'domain'];
            let characterColumns = ['code', 'name', 'icao', 'domain'];
            let conflictColumns = ['code'];
            let updateColumns = ['name', 'domain', 'icao'];

            for (const prop in airport) {
                if ((acceptedColumns.includes(prop))) {
                    insertProps.push(`${_.snakeCase(prop)}`);
                    
                    if (characterColumns.includes(prop)) {
                        insertValues.push(`'${airport[prop]}'`);
                    } else {
                        insertValues.push(airport[prop]);
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
                text: `INSERT INTO airports (${insertQueryColumns}) VALUES(${insertQueryValues}) ON CONFLICT (${conflictColumnsValues }) DO UPDATE SET ${updateProps} RETURNING *`,
            };
            // log.debug(`SM: Upsert airport query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                // log.debug(`SM: Get airports: ${JSON.stringify(data[0])}`);
                result = utils.camelizeKeys(data[0]);
            }
        } catch (err) {
            log.error(err);
            result = {
                error: 'SM: Unable to upsert airport.',
            };
        }
        return result;
    }

    async function deleteAirport(airport) {
        let result = {};
        // log.debug(`SM: Delete airport: ${JSON.stringify(airport)}`);
        try {
            let primaryColumn = 'code';
            let primaryColumnValue;
            let characterColumns = ['code'];

            if (characterColumns.includes(primaryColumn)) {
                primaryColumnValue = `'${airport[primaryColumn]}'`;
            } else {
                primaryColumnValue = airport[primaryColumn];
            }
                    
            const query = {
                text: `DELETE FROM airports WHERE ${primaryColumn} = ${primaryColumnValue} RETURNING *`,
            };
            // log.debug(`SM: Delete airport query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                result = utils.camelizeKeys(data[0]);
            }
        } catch (err) {
            log.error(err);
            result = {
                error: 'SM: Unable to delete airport.',
            };
        }
        return result;
    }

    async function deleteAirports(airports) {
        let result = {};
        // log.debug(`SM: Delete airports: ${JSON.stringify(airports)}`);
        try {
            let primaryColumn = 'code';
            let primaryColumnValues = airports[primaryColumn];
            const query = {
                text: `DELETE FROM airports WHERE ${primaryColumn} IN (${primaryColumnValues}) RETURNING *`,
            };
            // log.debug(`SM: Delete airport query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                result = utils.camelizeKeys(data);
            }
        } catch (err) {
            log.error(err);
            result = {
                error: 'SM: Unable to delete airports.',
            };
        }
        return result;
    }

    async function getAirlines() {
        let result = {};
        let airlines = [];
        try {
            const query = {
                text: `SELECT * FROM v_airlines ORDER BY code;`
            };
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                // log.debug(`SM: Get airlines: ${JSON.stringify(data[0])}`);
                data.forEach(airline => {
                    airlines.push(utils.camelizeKeys(airline));
                });
                result = airlines;
            }
        } catch(error) {
            log.error(`SM: Error: ${error}`);
            result = {
                error: 'SM: Unable to read airlines.',
            };
        }
        return result;
    }

    async function upsertAirline(airline) {
        let result = {};
        // log.debug(`SM: Upsert airline: ${JSON.stringify(airline)}`);
        try {
            let insertProps = [];
            let insertValues = [];
            let updateProps = [];
            let acceptedColumns = ['code', 'name'];
            let characterColumns = ['code', 'name'];
            let conflictColumns = ['code'];
            let updateColumns = ['name'];

            for (const prop in airline) {
                if ((acceptedColumns.includes(prop))) {
                    insertProps.push(`${_.snakeCase(prop)}`);
                    
                    if (characterColumns.includes(prop)) {
                        insertValues.push(`'${airline[prop]}'`);
                    } else {
                        insertValues.push(airline[prop]);
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
                text: `INSERT INTO airlines (${insertQueryColumns}) VALUES(${insertQueryValues}) ON CONFLICT (${conflictColumnsValues }) DO UPDATE SET ${updateProps} RETURNING *`,
            };
            // log.debug(`SM: Upsert airline query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                result = utils.camelizeKeys(data[0]);
            }
        } catch (err) {
            log.error(err);
            result = {
                error: 'SM: Unable to upsert airline.',
            };
        }
        return result;
    }

    async function upsertAirlineLocation(airline) {
        let result = {};
        // log.debug(`SM: Upsert airline: ${JSON.stringify(airline)}`);
        try {
            let insertProps = [];
            let insertValues = [];
            let updateProps = [];
            let acceptedColumns = ['handlerId','airline', 'location'];
            let characterColumns = ['airline', 'location'];
            let conflictColumns = ['airline'];
            let updateColumns = ['location'];

            for (const prop in airline) {
                if ((acceptedColumns.includes(prop))) {
                    insertProps.push(`${_.snakeCase(prop)}`);
                    
                    if (characterColumns.includes(prop)) {
                        insertValues.push(`'${airline[prop]}'`);
                    } else {
                        insertValues.push(airline[prop]);
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
                text: `INSERT INTO airlines_location (${insertQueryColumns}) VALUES(${insertQueryValues}) ON CONFLICT (${conflictColumnsValues }) DO UPDATE SET ${updateProps} RETURNING *`,
            };
            log.debug(`SM: Upsert airline query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                result = utils.camelizeKeys(data[0]);
            }
        } catch (err) {
            log.error(err);
            result = {
                error: 'SM: Unable to upsert airline.',
            };
        }
        return result;
    }

    async function deleteAirline(airline) {
        let result = {};
        // log.debug(`SM: Delete airline: ${JSON.stringify(airline)}`);
        try {
            let primaryColumn = 'code';
            let primaryColumnAirlinesLocation = 'airline';
            let primaryColumnValue;
            let characterColumns = ['code'];

            if (characterColumns.includes(primaryColumn)) {
                primaryColumnValue = `'${airline[primaryColumn]}'`;
            } else {
                primaryColumnValue = airline[primaryColumn];
            }
                    
            const queryAirlinesLocation = {
                text: `DELETE FROM airlines_location WHERE ${primaryColumnAirlinesLocation} = ${primaryColumnValue}`,
            };
            await database.execute(queryAirlinesLocation);

            const queryAirline = {
                text: `DELETE FROM airlines WHERE ${primaryColumn} = ${primaryColumnValue} RETURNING *`,
            };
            const resultQuery = await database.execute(queryAirline);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                result = utils.camelizeKeys(data[0]);
            }
        } catch (err) {
            log.error(err);
            result = {
                error: 'SM: Unable to delete airline.',
            };
        }
        return result;
    }

    async function deleteAirlines(airlines) {
        let result = {};
        // log.debug(`SM: Delete airlines: ${JSON.stringify(airlines)}`);
        try {
            let primaryColumn = 'code';
            let primaryColumnAirlinesLocation = 'airline';
            let primaryColumnValues = airlines[primaryColumn];

            const queryAirlinesLocation = {
                text: `DELETE FROM airlines_location WHERE ${primaryColumnAirlinesLocation} IN (${primaryColumnValues})`,
            };
            await database.execute(queryAirlinesLocation);

            const query = {
                text: `DELETE FROM airlines WHERE ${primaryColumn} IN (${primaryColumnValues}) RETURNING *`,
            };
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                result = utils.camelizeKeys(data);
            }
        } catch (err) {
            log.error(err);
            result = {
                error: 'SM: Unable to delete airlines.',
            };
        }
        return result;
    }

    async function getSettings() {
        let result = {};
        let settings = [];
        try {
            const query = {
                text: `SELECT * FROM settings;`
            };
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                data.forEach(setting => {
                    settings.push(utils.camelizeKeys(setting));
                });
                result = settings;
            }
        } catch(error) {
            log.error(`SM: Error: ${error}`);
            result = {
                error: 'SM: Unable to read settings.',
            };
        }
        return result;
    }

    async function upsertSetting(twinSetting) {
        let result = {};
        log.debug(`SM: Upsert: ${JSON.stringify(twinSetting)}`);
        try {
            let insertProps = [];
            let insertValues = [];
            let updateProps = [];
            let acceptedColumns = ['name', 'value', 'description'];
            let characterColumns = ['name', 'value', 'description'];
            let conflictColumns = ['name'];
            let updateColumns = ['value', 'description'];

            for (const prop in twinSetting) {
                if ((acceptedColumns.includes(prop))) {
                    insertProps.push(`${_.snakeCase(prop)}`);
                    
                    if (characterColumns.includes(prop)) {
                        insertValues.push(`'${twinSetting[prop]}'`);
                    } else {
                        insertValues.push(twinSetting[prop]);
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
                text: `INSERT INTO settings (${insertQueryColumns}) VALUES(${insertQueryValues}) ON CONFLICT (${conflictColumnsValues }) DO UPDATE SET ${updateProps} RETURNING *`,
            };
            // log.debug(`SM: Upsert location query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            if (undefined != resultQuery && undefined != resultQuery.rows) {
                const data = resultQuery.rows;
                result = utils.camelizeKeys(data[0]);
            }
        } catch (err) {
            log.error(err);
            result = {
                error: 'SM: Unable to upsert setting.',
            };
        }
        return result;
    }
})();
