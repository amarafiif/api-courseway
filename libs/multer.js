const multer = require('multer');

module.exports = {
  imageFilter: multer({
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
      } else {
        const err = new Error('File type is not supported')
        return cb(err.message, false);
        
      }
    },
    onError: (err, next) => {
      next(err);
    },
  }),
};