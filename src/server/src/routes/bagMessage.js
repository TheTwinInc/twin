(function () {
    const bagMessage = require('../controllers/bagMessageController');
    const express = require('express');
    let router = express.Router();
    const authorize = require('../middleware/authorize.js');

    router.put('/', bagMessage.send);
    // router.put('/', authorize(), bagMessage.send);

    module.exports = router;
}());

