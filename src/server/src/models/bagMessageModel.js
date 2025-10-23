const { result } = require('lodash');

(function () {
    const _ = require('lodash');
    const database = require('../persistence/databasePostgres');
    const log = require('../utils/log');
    const utils = require('../utils/utils');

    const env = process.env.NODE_ENV || 'development';
    const config = require('../config/config')[env];

    const bagMessageServer = require('../services/bagMessageServer');

    module.exports.send = send;

    async function send(bagMessage) {
        let result = {};
        // log.debug(`BM: send: ${JSON.stringify(bagMessage)}`);
        if (bagMessage.standardMessageId != '' && bagMessage.content != '') {
            try {
                bagMessageServer.messageHandler(bagMessage);
                result = bagMessage;
            } catch(error) {
                log.error(`BM: Error: ${error}`);
                result = {
                    error: 'BM: Unable to read bag.',
                };
            }
        }
        return result;
    }
})();
