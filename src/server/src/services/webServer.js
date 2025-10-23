(function () {

    module.exports.initialize = initialize;
    module.exports.close = close;

    const http = require('http');
    const express = require('express');
    const env = process.env.NODE_ENV || 'development';
    const app = express();
    const config = require('../config/config')[env];
    const log = require('../utils/log');

    require('../services/express')(app, config);
    require('../routes/routes')(app, config);
    require('../services/error-handler')(app, config);

    let httpServer;
    
    function initialize() {
        log.debug('WS: Initializing web server service');
        return new Promise((resolve, reject) => {
            log.info('Web server initialized');

            httpServer = http.createServer(app);

            httpServer.listen(config.port)
                .on('listening', () => {
                    log.info('WS: Listening on port ' + config.port + '...');
                    resolve(httpServer);
                })
                .on('error', err => {
                    log.error(`WS: Listening error ${err}`);
                    reject(err);
                });
        });
    }

    function close() {
        return new Promise((resolve, reject) => {
            httpServer.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }
}());
