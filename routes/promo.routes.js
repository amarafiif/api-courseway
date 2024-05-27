const router = require('express').Router();
const { getAllPromo, getPromoById, addPromo, updatePromo, deletePromo } = require('../controllers/promo.controllers');
const { restrict } = require('../middlewares/auth.middlewares');

router.get('/', getAllPromo);
router.get('/:promo_id', getPromoById);
router.post('/addPromo', restrict, addPromo);
router.put('/updatePromo/:promo_id', restrict, updatePromo);
router.delete('/deletePromo/:promo_id', restrict, deletePromo);

module.exports = router;
