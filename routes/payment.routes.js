const router = require('express').Router();
const { restrict } = require('../middlewares/auth.middlewares');
const {
  getAllPayment,
  createPayment,
  updatePaymentStatusbyId,
  getPaymentbyLogin,
  getPaymentById,
  createPaymentbyLogin,
  updatePaymentStatusbyLogin,
} = require('../controllers/payment.controller');

router.get('/', getAllPayment);
router.post('/', createPayment);

// BY LOGIN
router.get('/checkout', restrict, getPaymentbyLogin);
router.post('/checkout', restrict, createPaymentbyLogin);
router.put('/checkout', restrict, updatePaymentStatusbyLogin);

// BY ID
router.get('/:riwayat_transaksi_id', getPaymentById);
router.put('/:riwayat_transaksi_id', updatePaymentStatusbyId);

module.exports = router;
