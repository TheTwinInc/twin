(function () {
    module.exports.initialize = initialize;
    module.exports.close = close;

    const log = require('../utils/log');
    const wss = require('./webSocketServer.js');
    const monitor = require('../models/monitorModel');
    const env = process.env.NODE_ENV || 'development';
    const config = require('../config/config')[env];

    let monitorInterval;
    const monitorIntervalDelay = config.monitorIntervalDelay;

    function initialize() {
        log.debug('MC: Initialize web socket server service');
        return new Promise((resolve, reject) => {
            try {
                monitorInterval = setInterval(monitorUpdate, monitorIntervalDelay);
                updateHeartbeats();
                resolve();
            } catch (error) {
                log.error(`MC: ${error}`);
                reject(error);
            }
        });
    }

    function close() {
        log.debug(`MC: Close: monitor client service`);
        return new Promise((resolve, reject) => {
            try {
                clearInterval(monitorInterval);
                resolve();
            } catch (error) {
                log.error(`MC: ${error}`);
                reject(error);
            }
        });
    }

    function monitorUpdate() {
        updateHeartbeats();
        updateSystemInformation();
        updateTwinStatistics();
        updateLocations();
    }

    async function updateHeartbeats() {
        // log.debug(`WSS: UpdateHeartbeats: `);
        let isBinary = false;
        let heartbeats = await monitor.getHeartbeats();
        let message = {
            request: 'updateHeartbeats',
            payload: heartbeats
        };
        wss.broadcastMessage(message, isBinary);
    }

    async function updateSystemInformation() {
        // log.debug(`WSS: UpdateSystemInformation: `);
        let isBinary = false;
        let systemInformation = await monitor.getSystemInformation();
        let message = {
            request: 'updateSystemInformation',
            payload: systemInformation
        };
        // log.debug(`WSS: System Information: ${JSON.stringify(systemInformation)}`);
        wss.broadcastMessage(message, isBinary);
    }

    async function updateTwinStatistics() {
        // log.debug(`WSS: UpdateTwinStatistics: `);
        let isBinary = false;
        let twinSatistics = await monitor.getTwinStatistics();
        let message = {
            request: 'updateTwinStatistics',
            payload: twinSatistics
        };
        // log.debug(`WSS: Twin Statistics: ${JSON.stringify(twinSatistics)}`);
        wss.broadcastMessage(message, isBinary);
    }

    async function updateLocations() {
        // log.debug(`WSS: UpdateTwinStatistics: `);
        let isBinary = false;
        // let twinSatistics = await monitor.getTwinStatistics();
        let message = {
            request: 'updateLocations',
            payload: true
        };
        // log.debug(`WSS: Twin Statistics: ${JSON.stringify(twinSatistics)}`);
        wss.broadcastMessage(message, isBinary);
    }

}());