(function () {
    const log = require('../utils/log');
    const bagMessage = require('../models/bagMessageModel');
  
    const env = process.env.NODE_ENV || 'development';
    // const config = require('../config/config')(env);
  
    module.exports.send = send;

    async function send(req, res) {
        let result = {};
        try {
            log.info(`Body: ${JSON.stringify(req.body)}`);
            const context = {
                'standardMessageId': req.body.standardMessageId == undefined ? '' : req.body.standardMessageId,
                'messageContent': req.body.messageContent == undefined ? '' : req.body.messageContent,
            }
            log.info(`Context: ${JSON.stringify(context)}`);
            result = await bagMessage.send(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }
  })();
