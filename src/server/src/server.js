(function () {
    const log = require('./utils/log');
    const webServer = require('./services/webServer');
    const webSocketServer = require('./services/webSocketServer');
    const dbClient = require('./services/dbClient');
    const bagMessageServer = require('./services/bagMessageServer');
    const monitorClient = require('./services/monitorClient');
    const tailClient = require('./services/tailClient');
    const env = process.env.NODE_ENV || 'development';
    const dbConfig = require('./config/configPostgres')[env];

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
        if (err.code == 'ECONNRESET') {
            log.error('SRV: Reset client...');
        } else {
            log.info('SRV: Uncaught exception');
            log.error(err);
            shutdown(err);
        }
    });

    let httpServer;
    let bsmServer;
    let wsServers;

    async function startup() {
        log.info('SRV: Start application...');

        try {
            log.info('SRV: Initialize dbClient module');
            let db = await dbClient.initialize(dbConfig);
            
            db.on('connect', dbOnConnect);
            db.on('close', dbOnClose);
            db.on('error', dbOnError);
        } catch (err) {
            log.error(`SRV: Database ${err}`);
            process.exit(1); // Non-zero failure code
        }

        try {
            log.info('SRV: Initialize web server module');
            httpServer = await webServer.initialize();
        } catch (err) {
            log.error(`SRV: WebServer ${err}`);
            process.exit(1); // Non-zero failure code
        }
        
        try {
            log.info('SRV: Initialize web socket server module');
            wsServers = await webSocketServer.initialize();
        } catch (err) {
            log.error(`SRV: WebSocket ${err}`);
            process.exit(1); // Non-zero failure code
        }

        try {
            log.info('SRV: Initialize bag message server module');
            bsmServer = await bagMessageServer.initialize();
        } catch (err) {
            log.error(`SRV: BagMessage ${err}`);
            process.exit(1); // Non-zero failure code
        }

        try {
            log.info('SRV: Initialize monitor client module');
            await monitorClient.initialize();
        } catch (err) {
            log.error(`SRV: MonitorClient ${err}`);
            process.exit(1); // Non-zero failure code
        }

        try {
            log.info('SRV: Initialize tail client module');
            await tailClient.initialize();
        } catch (err) {
            log.error(`SRV: Tail client ${err}`);
            // process.exit(1); // Non-zero failure code
        }
    }

    async function shutdown(e) {
        let err = e;

        setTimeout((function() {
            return process.exit(22);
        }), 10000);
      
        log.info('SRV: Shut down application');

        try {
            log.info('SRV: Close TailClient module');
            await tailClient.close();
            
        } catch (err) {
            log.error(`SRV: Close TailClient: ${err}`);
        }

        try {
            log.info('SRV: Close monitorClient module');
            await monitorClient.close();
            
        } catch (err) {
            log.error(`SRV: Close MonitorClient: ${err}`);
        }

        try {
            log.info('SRV: Close bag message server module');
            if (undefined != bsmServer) {
                await bagMessageServer.close();
            }
        } catch (err) {
            log.error(`SRV: Close BagMessage: ${err}`);
        }

        try {
            log.info('SRV: Close web socket server module');
            if (undefined != wsServers) {
                await webSocketServer.close(wsServers);
            }
        } catch (err) {
            log.error(`SRV: Close WebSocket: ${err}`);
        }

        try {
            log.info('SRV: Close web server module');
            if (undefined != httpServer) {
                await webServer.close();
            }
        } catch (err) {
            log.error(`SRV: Close WebServer: ${err}`);
        }

        try {
            log.info('SRV: Close dbClient module');
            await dbClient.close();
            
        } catch (err) {
            log.error(`SRV: Close Database: ${err}`);
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
    }
    async function dbOnClose() {
        log.info('SRV: Database closed');
    }
    async function dbOnError(error) {
        log.error(`SRV: Database ${error}`);
    }
}());
