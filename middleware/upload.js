const multer = require('multer');
const path = require('path');
const config = require('../config');
const fileFilter = require('./fileFilter');

// 生成短文件名：时间戳(base36) + 4位随机字符
function shortId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 6);
  return ts + rand;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, shortId() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeBytes },
  fileFilter
});

module.exports = upload;
