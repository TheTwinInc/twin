(function () {

    module.exports.initialize = initialize;
    module.exports.close = close;

    const http = require('http');
    const https = require('https');
    const express = require('express');
    const env = process.env.NODE_ENV || 'development';
    const app = express();
    const config = require('../config/config')[env];
    const log = require('../utils/log');
    

    require('../utils/express')(app, config);
    require('../routes/routes')(app, config);

    let httpServer;
    let httpsServer;
    
    function initialize() {
        return new Promise((resolve, reject) => {
            log.info('Initializing web server');

            httpServer = http.createServer(app);
            httpsServer = https.createServer(config.options, app);

            httpServer.listen(config.port)
                .on('listening', () => {
                    log.info('Listening on port ' + config.port + '...');
                    resolve();
                })
                .on('error', err => {
                    log.error(err);
                    reject(err);
                });
            
            httpsServer.listen(config.portSecure)
                .on('listening', () => {
                    log.info('Listening on port ' + config.portSecure + '...');
                    resolve();
                })
                .on('error', err => {
                    log.error(err);
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
            httpsServer.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }

    
}());
