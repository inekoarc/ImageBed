const fs = require('fs');
const path = require('path');
const store = require('../utils/store');
const config = require('../config');

function listImages(req, res) {
  const limit = parseInt(req.query.limit, 10) || undefined;
  const offset = parseInt(req.query.offset, 10) || undefined;
  const images = store.getAll({ limit, offset });
  res.json({ success: true, total: images.length, images });
}

function getImage(req, res) {
  const { id } = req.params;
  const record = store.getById(id);
  if (!record) {
    return res.status(404).json({ error: '图片不存在' });
  }
  res.json({ success: true, ...record });
}

function deleteImage(req, res) {
  const { id } = req.params;
  const record = store.getById(id);
  if (!record) {
    return res.status(404).json({ error: '图片不存在' });
  }

  // 删除文件
  const filePath = path.join(config.uploadDir, record.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // 删除元数据
  store.remove(id);

  res.json({ success: true, message: '图片已删除' });
}

module.exports = { listImages, getImage, deleteImage };
