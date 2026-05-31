const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const fileFilter = require('./fileFilter');

// 生成5位随机短文件名（62^5 = 9亿种组合，碰撞概率极低）
function shortId(existing) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let name = '';
  for (let i = 0; i < 5; i++) {
    name += chars[Math.floor(Math.random() * chars.length)];
  }
  // 如果文件已存在，重新生成
  if (existing && existing.has(name)) return shortId(existing);
  return name;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // 收集已存在的文件名（不含扩展名），避免碰撞
    let existing;
    try {
      existing = new Set(fs.readdirSync(config.uploadDir).map(f => path.basename(f, path.extname(f))));
    } catch { existing = new Set(); }
    cb(null, shortId(existing) + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeBytes },
  fileFilter
});

module.exports = upload;
