const router = require('express').Router();
const { restrict } = require('../middlewares/auth.middlewares');
const {
    getCount,
} = require('../controllers/admin.controllers');

router.get('/', getCount);

module.exports = router;