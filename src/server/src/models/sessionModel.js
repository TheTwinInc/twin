(function () {
    const QRCode = require('qrcode');
    const {v4 : uuidv4} = require('uuid')
    // const imageDataURI = require('image-data-uri');
    const log = require('../config/log');

    const env = process.env.NODE_ENV || 'development';
    // const config = require('../config/config')[env];
    
    // module.exports.get = get;  
    module.exports.getQrcode = getQrcode;
    // module.exports.getId = getId;

    async function getQrcode(context) {
        let result;
        let id = context.id;
        let value;
        const url = 'https://app.express-drop.com/'
        try {
            value = await QRCode.toDataURL(url);
            result = value;
            // result = imageDataURI.decode(value);
            return result;
        } catch (err) {
            log.error(err);
        }
    }

    // function getId(context) {
    //     let result;
    //     let value;
    //     let id = context.id;
    //     const newId = uuidv4()
    //     try {
    //         // TODO get uuid from database
    //         // value = await QRCode.toDataURL(url);
    //         value = newId;
    //         result = value;
    //         return result;
    //     } catch (err) {
    //         log.error(err);
    //     }
    // }
    
}());