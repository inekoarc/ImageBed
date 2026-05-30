const path = require('path');
const sharp = require('sharp');
const config = require('../config');
const store = require('../utils/store');
const { buildFileInfo } = require('../utils/fileInfo');
const { v4: uuidv4 } = require('uuid');

async function uploadHandler(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: '请选择要上传的图片' });
  }

  const file = req.file;

  try {
    // 第二层校验：用 sharp 验证图片完整性并获取元数据
    let width, height;
    const ext = path.extname(file.filename).toLowerCase();

    if (ext === '.svg') {
      // SVG 文件跳过 sharp 校验
      width = 0;
      height = 0;
    } else {
      const metadata = await sharp(file.path).metadata();
      width = metadata.width || 0;
      height = metadata.height || 0;
    }

    const info = buildFileInfo(file, config.domainUrl);
    const record = {
      id: uuidv4(),
      ...info,
      width,
      height,
      createdAt: new Date().toISOString()
    };

    store.add(record);

    res.json({ success: true, ...record });
  } catch (err) {
    // sharp 校验失败：文件不是合法图片，删除文件
    const fs = require('fs');
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return res.status(400).json({ error: '文件不是有效的图片格式' });
  }
}

module.exports = uploadHandler;
