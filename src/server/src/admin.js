(function () {
    const log = require('./config/log.js');
    const webServer = require('./services/webServer.js');
    const webSocketServer = require('./services/webSocketServer.js');
    const plcClient = require('./services/plcClient.js');
    const gatewayServer = require('./services/gatewayServer.js');
    const dbClient = require('./services/dbClient.js');
    const commands = require('./config/commands');

    startup();

    process.on('SIGTERM', () => {
        log.info('SRV: Received SIGTERM');
        shutdown();
    });
      
    process.on('SIGINT', () => {
        log.info('SRV: Received SIGINT');
        shutdown();
    });
      
    process.on('uncaughtException', err => {
        log.info('SRV: Uncaught exception');
        log.error(err);
        shutdown(err);
    });

    let plc;
    let httpServer;
    let wsServers;
    let setDeviceStatusEnabled = false;

    async function startup() {
        log.info('SRV: Start application...');

        try {
            log.info('SRV: Initialize dbClient module');
            // TODO handle initialization flag
            let db = await dbClient.initialize();
            
            db.on('connect', dbOnConnect);
            db.on('close', dbOnClose);
            db.on('error', dbOnError);
        } catch (err) {
            log.error(err);
            process.exit(1); // Non-zero failure code
        }

        try {
            log.info('SRV: Initialize plc server module');
            await plcClient.initialize();
        } catch (err) {
            log.error(err);
            process.exit(1); // Non-zero failure code
        }

        try {
            log.info('SRV: Initialize web server module');
            httpServer = await webServer.initialize();
        } catch (err) {
            log.error(err);
            process.exit(1); // Non-zero failure code
        }
        
        try {
            log.info('SRV: Initialize web socket server module');
            wsServers = await webSocketServer.initialize();
            log.info(`SRV: Initialized web socket server module.${JSON.stringify(wsServers)}`);
            // wsServers = await webSocketServer.initialize(httpServer, "/fastdrop");
        } catch (err) {
            log.error(err);
            process.exit(1); // Non-zero failure code
        }

        try {
            log.info('SRV: Initialize gateway server module');
            let gateway = await gatewayServer.initialize(wsServers['fastdrop']);

            gateway.on('connect', gatewayOnConnect);
            gateway.on('close', gatewayOnClose);
            gateway.on('error', gatewayOnError);
        } catch (err) {
            log.error(err);
            process.exit(1); // Non-zero failure code
        }

        
    }

    async function shutdown(e) {
        let err = e;

        await setDeviceStatus(false, 0);

        setTimeout((function() {
            return process.exit(22);
        }), 10000);
      
        log.info('SRV: Shut down application');
        try {
            log.info('SRV: Close plc server module');
            if (undefined != plcClient) {
                await plcClient.close();
            }
        } catch (e) {
            log.error(e);
            err = err || e;
        }

        try {
            log.info('SRV: Close web socket server module');
            if (undefined != wsServers) {
                // log.info(`SRV: Close web socket server module.${JSON.stringify(wsServers['fastdrop'])}`);
                await webSocketServer.close(wsServers);
            }
        } catch (e) {
            log.error(e);
            err = err || e;
        }

        try {
            log.info('SRV: Close web server module');
            if (undefined != httpServer) {
                await webServer.close();
            }
        } catch (e) {
            log.error(e);
            err = err || e;
        }

        try {
            log.info('SRV: Close gateway server module');
            await gatewayServer.close();
        } catch (e) {
            log.error(e);
            err = err || e;
        }

        try {
            log.info('SRV: Close dbClient module');
            await dbClient.close();
            
        } catch (e) {
            log.error(e);
            err = err || e;
        }

        log.info('SRV: Exit process');
        if (err) {
            setTimeout((function() {
                return process.exit(1);
            }), 10000);
        } else {
            setTimeout((function() {
                return process.exit(0);
            }), 10000);
        }
    }

    async function dbOnConnect() {
        log.info('SRV: Database connected');
        await setDeviceStatus(true, 0);
    }
    async function dbOnClose() {
        log.info('SRV: Database closed');
        await setDeviceStatus(false, 0);
    }
    async function dbOnError(error) {
        log.error(`SRV: Database ${error}`);
        await setDeviceStatus(false, 0);
    }

    async function gatewayOnConnect() {
        setDeviceStatusEnabled = true;
        let dbConnection = await dbClient.isConnected();
        log.info('SRV: Gateway connected');
        log.info(`SRV: Update database status: ${dbConnection}`);
        await setDeviceStatus(dbConnection, 0);
    }
    async function gatewayOnClose() {
        setDeviceStatusEnabled = false;
        log.info('SRV: Gateway closed');
    }
    async function gatewayOnError(error) {
        log.error(`SRV: Gateway ${error}`);
    }

    

    async function setDeviceStatus(deviceStatus, deviceIndex) {
        log.info(`SRV: Set device status: ${setDeviceStatusEnabled}`);
        if (setDeviceStatusEnabled) {
            let attribute = 'connection';
            let command = commands[attribute].vars[0];
            command.bit = parseInt(deviceIndex);
            command.value = deviceStatus == true ? 1 : 0;
            await gatewayServer.setAttribute(command);
        }
        
    }

    
}());
