(function () {

    const bunyan = require('bunyan');
    const fs = require('fs');
    const dir = './log';

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    const log = bunyan.createLogger({
        name: 'twin',
        streams: [
            {
                type: 'rotating-file',
                level: 'info',
                path: './log/twin-server.log',
                period: '1d',   // daily rotation
                count: 3        // keep 3 back copies
            },
            {
                level: 'debug',
                path: './log/debug.twin-server.log',
                period: '1d',   // daily rotation
                count: 1        // keep 3 back copies
            },
            {
                level: 'error',
                path: './log/error.twin-server.log',
                period: '1d',   // daily rotation
                count: 3        // keep 3 back copies
            }
        ]
    });

    const Log = function () {};

    Log.prototype.info = function info(e) { log.info(e) };
    Log.prototype.debug = function debug(e) { log.debug(e) };
    Log.prototype.trace = function trace(e) { log.trace(e) };
    Log.prototype.error = function error(e) { log.error(e) };
    Log.prototype.warn = function warn(e) {  log.warn(e) };

    module.exports = new Log();
}());
