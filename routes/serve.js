const path = require('path');
const fs = require('fs');
const config = require('../config');

function serveImage(req, res, next) {
  const filename = req.params.filename;

  // 路径穿越防护：只允许 UUID 格式的文件名
  if (!/^[0-9a-f-]+\.[a-z]+$/i.test(filename)) {
    return res.status(400).json({ error: '无效的文件名' });
  }

  const filePath = path.resolve(path.join(config.uploadDir, filename));

  // 确保文件路径在 uploadDir 内
  if (!filePath.startsWith(config.uploadDir)) {
    return res.status(403).json({ error: '访问被拒绝' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '图片不存在' });
  }

  // 强缓存：图片不可变
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(filePath);
}

module.exports = serveImage;
