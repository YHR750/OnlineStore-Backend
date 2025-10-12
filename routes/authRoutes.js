const express = require('express');
const {registerUser, loginUser, getUserProfile} = require('../controllers/authController');
const {authenticateToken} = require('../middleware/authMiddleWare');
const router = express.Router();


router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', authenticateToken, getUserProfile);
module.exports = router;

