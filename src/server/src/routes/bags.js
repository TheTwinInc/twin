(function () {
    const bags = require('../controllers/bagsController');
    const express = require('express');
    let router = express.Router();
    const authorize = require('../middleware/authorize.js');

    router.get('/', authorize(), bags.getBags);
    router.get('/bsm/:identificationCode', authorize(), bags.getBagsBsm);
    router.get('/prs/log/:id', bags.getBagLog);
    // router.get('/prs/log/:id', authorize(), bags.getBagLog);
    router.get('/transfer', authorize(), bags.getTransferBags);
    router.get('/:identificationCode', authorize(), bags.getBag);
    // router.get('/log/', authorize(), bags.getBagLog);
    router.get('/log/:id.:identificationCode.:bhsCode', authorize(), bags.getBagLog);
    router.put('/security/', authorize(), bags.updateBagSecurity);
    router.post('/log/', bags.insertBagLog);
    // router.post('/log/:identificationCode', authorize(), bags.insertBagLog);

    module.exports = router;
}());

