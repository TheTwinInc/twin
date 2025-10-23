const { DIRECTION_NONE } = require('hammerjs');

(function () {
    
    const log = require('../config/log');
    const session = require('../models/sessionModel');
    
    const env = process.env.NODE_ENV || 'development';
    const config = require('../config/config')[env];
    const commands = require('../config/commands_plc');
    const controllers = require('../config/controllers');

    

    // module.exports.get = get;
    module.exports.getQrcode = getQrcode;
    // module.exports.getId = getId;
    // module.exports.getBarcode = getBarcode;

    async function getQrcode(req, res) {
        let result;
        try {
            const context = {
                // 'attribute' : req.params.attribute,
                'id' : req.params.id
            };
            // res.status(200).end(url);
            let qrCode = await session.getQrcode(context);
            log.info(qrCode);
            result = qrCode;
            res.status(200).end(result);
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    // async function getId(req, res) {
    //     let result = {
    //         sessionId: null
    //     };
    //     await res.status(200).end();
    //     // try {
    //     //     const context = {
    //     //         // 'attribute' : req.params.attribute,
    //     //         'id' : req.params.id
    //     //     };
    //     //     // res.status(200).end(url);
    //     //     // let sessionId = await session.getId(context);
    //     //     let sessionId = session.getId(context);
    //     //     log.info(sessionId);
    //     //     result.sessionId = sessionId;
    //     //     res.status(200).end(result);
    //     // } catch (err) {
    //     //     log.error(err);
    //     //     res.status(404).end();
    //     // }
    // }
}());
