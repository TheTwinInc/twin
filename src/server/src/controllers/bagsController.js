(function () {
    const log = require('../utils/log');
    const bags = require('../models/bagsModel');
  
    // const env = process.env.NODE_ENV || 'development';
    // const config = require('../config/config')(env);
  
    module.exports.getBag = getBag;
    module.exports.getBagLog = getBagLog;
    module.exports.getTransferBags = getTransferBags;
    module.exports.getBags = getBags;
    module.exports.getBagsBsm = getBagsBsm;
    module.exports.updateBagSecurity = updateBagSecurity;
    module.exports.insertBagLog = insertBagLog;
    // module.exports.upsertBag = upsertBag;

    const bagExceptions = {
        NO_READ: '??????????',
        MULTI_READ: '!!!!!!!!!!',
        NO_TRACKING: '          '
    }

    async function getBag(req, res) {
        let result = {};
        try {
            // log.info(`BC: Req: ${JSON.stringify(req.params)}`);
            const context = {
                'identificationCode': req.params.identificationCode == undefined ? '' : req.params.identificationCode,
            }
            // log.info(`BC: Context: ${JSON.stringify(context)}`);
            result = await bags.getBag(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function getBagLog(req, res) {
        let result = {};
        try {
            // log.info(`BC: Req: ${JSON.stringify(req.params)}`);
            const context = {
                'id': req.params.id == undefined ? '' : req.params.id,
                'identificationCode': req.params.identificationCode == undefined ? '' : req.params.identificationCode,
                'bhsCode': req.params.bhsCode == undefined ? '' : req.params.bhsCode,
            }
            // log.info(`BC: Context: ${JSON.stringify(context)}`);
            if ('NO_READ' == context.identificationCode) {
                // context.identificationCode = '??????????';
                context.identificationCode = bagExceptions.NO_READ;
            } else if ('MULTI_READ' == context.identificationCode) {
                // context.identificationCode = '!!!!!!!!!!';
                context.identificationCode = bagExceptions.MULTI_READ;
            } else if ('NO_TRACKING' == context.identificationCode) {
                // context.identificationCode = '          ';
                context.identificationCode = bagExceptions.NO_TRACKING;
            }

            result = await bags.getBagLog(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function getBags(req, res) {
        let result = {};
        try {
            const context = {
                'identificationCode': req.body.identificationCode == undefined ? '' : req.body.identificationCode.replace(/"|'/g, ''),
            }
            result = await bags.getBags(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function getBagsBsm(req, res) {
        let result = {};
        try {
            const context = {
                'identificationCode': req.params.identificationCode == undefined ? '' : req.params.identificationCode.replace(/"|'/g, ''),
                // 'identificationCode': req.body.identificationCode == undefined ? '' : req.body.identificationCode.replace(/"|'/g, ''),
            }
            result = await bags.getBagsBsm(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function getTransferBags(req, res) {
        let result = {};
        try {
            // log.debug(`BC: Getting transfer bags`);
            result = await bags.getTransferBags();
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function updateBagSecurity(req, res) {
        try {
            const context = {
                'id': req.body.id == undefined ? '' : req.body.id.replace(/"|'/g, ''),
                'securityOverride': req.body.securityOverride == undefined ? null : req.body.securityOverride.replace(/"|'|\[|\]/g, ''),
            }
            let result;
            result = await bags.updateBagSecurity(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function insertBagLog(req, res) {
        try {
            const context = {
                'identificationCode': req.body.identificationCode == undefined ? '' : req.body.identificationCode.replace(/"|'/g, ''),
                'bhsCode': req.body.bhsCode == undefined ? null : req.body.bhsCode,
                'location': req.body.location == undefined ? null : req.body.location,
                'actualState': req.body.actualState == undefined ? null : req.body.actualState,
                'sortationReached': req.body.sortationReached == undefined ? null : req.body.sortationReached,
                'securityStatus': req.body.securityStatus == undefined ? null : req.body.securityStatus,
            }
            let result;
            result = await bags.insertBagLog(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }
  
    // async function upsertBag(req, res) {
    //     try {
    //         // log.debug(`Upsert Body: ${JSON.stringify(req.body)}`);
    //         const context = {
    //             'identificationCode': req.body.identificationCode == undefined ? '' : req.body.identificationCode,
    //             'authorizationCode': req.body.authorizationCode == undefined ? '' : req.body.authorizationCode,
    //         }
    //         let result;
    //         result = await bags.upsertBag(context);
    //         res.status(200).end(JSON.stringify(result));
    //     } catch (err) {
    //         log.error(err);
    //         res.status(404).end();
    //     }
    // }
    
  })();