(function () {

    module.exports.initialize = initialize;
    module.exports.close = close;

    const Tail = require('../utils/tail').Tail;
    const log = require('../utils/log');
    const wss = require('./webSocketServer');
    const env = process.env.NODE_ENV || 'development';
    const config = require('../config/config')[env];
    const tails = require('../config/tails')


    let filesTail = [];

    function initialize() {
        log.debug('TC: Initializing tail client service');
        return new Promise((resolve, reject) => {
            try {
                log.info('TC: Tail client initialized');

                // var options= {separator: /[\r]{0,1}\n/, fromBeginning: false, fsWatchOptions: {}, follow: true, logger: log};
                var options= {separator: /[\r]{0,1}\n/, fromBeginning: false, fsWatchOptions: {}, follow: true};

                if (undefined != tails) {
                    for (let index = 0; index < tails.length; index++) {
                        let fileTail;
                        let tail = tails[index];
                        fileTail = startTail(fileTail, tail.file, tail.name, options);
                        filesTail.push(fileTail);
                    }
                    
                }
                resolve();
            } catch (error) {
                log.error(`TC: Initialize: ${error}`);
                reject();
            }
        });
    }

    function startTail(fileHandle, file, name, options) {
        fileHandle = new Tail(file, options)
            .on("line", function (data) {
                let payload = {
                    name: name,
                    data: data
                };
                updateTailFile(payload);
            })
            .on("error", function (error) {
                log.error(`TC: Start Tail: ${error}`);
            });

        fileHandle.watch();
        return fileHandle;
    }

    function close() {
        return new Promise((resolve, reject) => {
            try {
                if (undefined != filesTail) {
                    for (let index = 0; index < filesTail.length; index++) {
                        let fileTail = filesTail[index];
                        fileTail.unwatch();
                    }
                }
                resolve();
            } catch (error) {
                log.error(`TC: Close: ${error}`);
                reject(error);
            }
        });
    }

    async function updateTailFile(data) {
        let isBinary = false;
        let message = {
            request: 'updateTailFile',
            payload: data
        };
        wss.broadcastMessage(message, isBinary);
    }
}());
