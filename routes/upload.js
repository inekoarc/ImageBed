const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const config = require('../config');
const store = require('../utils/store');
const { buildFileInfo } = require('../utils/fileInfo');
const { v4: uuidv4 } = require('uuid');

// 从 URL 下载图片到本地
async function downloadImage(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载失败 (${response.status})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  // 从 Content-Type 或 URL 推断扩展名
  const contentType = response.headers.get('content-type') || '';
  const extMap = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
    'image/webp': '.webp', 'image/svg+xml': '.svg', 'image/bmp': '.bmp',
    'image/tiff': '.tiff'
  };
  let ext = extMap[contentType] || '';
  if (!ext) {
    const urlExt = path.extname(new URL(url).pathname).toLowerCase();
    if (config.allowedExtensions.includes(urlExt)) ext = urlExt;
  }
  if (!ext) ext = '.jpg'; // 兜底

  return { buffer, ext };
}

// 生成5位随机短文件名（不碰撞）
function shortId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let existing;
  try {
    existing = new Set(fs.readdirSync(config.uploadDir).map(f => path.basename(f, path.extname(f))));
  } catch { existing = new Set(); }

  let name;
  do {
    name = '';
    for (let i = 0; i < 5; i++) {
      name += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (existing.has(name));
  return name;
}

async function uploadHandler(req, res, next) {
  let file = req.file;

  // 支持 JSON 格式传入图片 URL
  if (!file && req.is('application/json') && req.body && req.body.image) {
    try {
      const { buffer, ext } = await downloadImage(req.body.image);
      const filename = shortId() + ext;
      const savePath = path.join(config.uploadDir, filename);
      fs.writeFileSync(savePath, buffer);

      file = {
        filename,
        originalname: filename,
        mimetype: ext === '.jpg' ? 'image/jpeg'
          : ext === '.svg' ? 'image/svg+xml'
          : ext === '.tiff' ? 'image/tiff'
          : `image/${ext.slice(1)}`,
        size: buffer.length,
        path: savePath
      };
    } catch (err) {
      return res.status(400).json({ error: '无法从提供的URL下载图片' });
    }
  }

  if (!file) {
    return res.status(400).json({ error: '请选择要上传的图片' });
  }

  // 修复中文文件名编码（HTTP 头默认用 Latin-1，中文会被乱码）
  if (file.originalname) {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
  }

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
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return res.status(400).json({ error: '文件不是有效的图片格式' });
  }
}

module.exports = uploadHandler;
