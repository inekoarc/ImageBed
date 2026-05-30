const config = require('../config');

function fileFilter(req, file, cb) {
  const ext = '.' + file.originalname.split('.').pop().toLowerCase();
  const mimeOk = config.allowedMimeTypes.includes(file.mimetype);
  const extOk = config.allowedExtensions.includes(ext);

  if (!mimeOk || !extOk) {
    return cb(new Error(`不支持的文件类型: ${file.mimetype || ext}`), false);
  }

  cb(null, true);
}

module.exports = fileFilter;
