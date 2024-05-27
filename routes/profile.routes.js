const express = require('express');
const router = express.Router();
const {imageFilter} = require('../libs/multer');
const { restrict } = require('../middlewares/auth.middlewares');
const {
  getAllAccountProfile,
  getAccountbyId,
  getAccountbyLogin,
  updateProfilebyId,
  updateProfilebyLogin,
  changePasswordbyLogin,
  logout,
  getRiwayatPembayaran,
} = require('../controllers/profile.controllers');

router.get('/', getAllAccountProfile);

//BY LOGIN
router.get('/account', restrict, getAccountbyLogin);
router.put('/updateProfile', restrict, imageFilter.single('url_image'), updateProfilebyLogin);
router.put('/changePassword', restrict, changePasswordbyLogin);
router.get('/paymentHistory', restrict, getRiwayatPembayaran);

//BY ID
router.get('/:account_id', getAccountbyId);
router.put('/:account_id', imageFilter.single('url_image'), updateProfilebyId);
router.post('/logout', logout);

module.exports = router;
