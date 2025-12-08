const express = require('express');
const router = express.Router();
const cartCtrl = require('../controllers/authController');
const auth = require('../middleware/auth');


router.get('/', auth.required, cartCtrl.getCart);
router.post('/items', auth.optional, cartCtrl.addItem);














module.exports = router;