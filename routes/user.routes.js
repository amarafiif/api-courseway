const router = require('express').Router();
const { register, login, verifyOtp, resendOtp , resetPassword,changePassword,whoami } = require('../controllers/users.controllers');
const { restrict } = require('../middlewares/auth.middlewares');

// REGISTER & LOGIN
router.post('/register', register);
router.post('/login', login);

// OTP
router.post('/verify-otp', restrict , verifyOtp)
router.post('/resend-otp', restrict, resendOtp)

//RESET PASSWORD
router.post('/reset-password',resetPassword) //need email get token form email (token in query)
router.put('/reset-password',changePassword) //enter new password (without login)

router.get('/whoami', restrict, whoami);
module.exports = router;
