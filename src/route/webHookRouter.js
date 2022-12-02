var express = require('express');
const router = express.Router();
const { postWebHook } = require('../webhook/post');
const { putWebHook } = require('../webhook/put');
const { deleteWebHook } = require('../webhook/delete');
const { getWebHook } = require('../webhook/get');

router.get('/webhook', getWebHook);

router.post('/webhook', postWebHook);

router.put('/webhook', putWebHook);

router.delete('/webhook', deleteWebHook);

module.exports = router;