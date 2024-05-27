const router = require('express').Router();
const { restrict } = require('../middlewares/auth.middlewares');
const {
  getAllNotif,
  createNotifbyId,
  getNotifbyLogin,
  getNotifbyId,
  createNotifBroadcast,updateNotifbyId,updateNotifbyLogin
} = require('../controllers/notification.controller');

router.get('/', getAllNotif);
router.post('/', createNotifbyId);

router.post('/broadcast', createNotifBroadcast);

// BY LOGIN
router.get('/myNotifications', restrict, getNotifbyLogin);
router.put('/myNotifications/:notifikasi_id', restrict, updateNotifbyLogin);

// BY ID
router.get('/:notifikasi_id', getNotifbyId);
router.put('/:notifikasi_id', updateNotifbyId);

module.exports = router;
