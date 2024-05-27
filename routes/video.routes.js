const express = require('express');
const router = express.Router();
const { restrict } = require('../middlewares/auth.middlewares');
const {
  getAllVideo,
  createVideo,
  getVideobyId,
  updateVideobyId,
  deleteVideobyId,
} = require('../controllers/video.controller');

router.get('/', getAllVideo);
router.post('/', createVideo);

// BY LOGIN

// BY ID
router.get('/:video_id', getVideobyId);
router.put('/:video_id', updateVideobyId);
router.delete('/:video_id', deleteVideobyId);

module.exports = router;
