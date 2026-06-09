const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const config = require('../config');
const store = require('../utils/store');
const { buildFileInfo } = require('../utils/fileInfo');
const { v4: uuidv4 } = require('uuid');

async function downloadImage(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载失败 (${response.status})`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || '';
  const extMap = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/bmp': '.bmp',
    'image/tiff': '.tiff'
  };

  let ext = extMap[contentType] || '';
  if (!ext) {
    const urlExt = path.extname(new URL(url).pathname).toLowerCase();
    if (config.allowedExtensions.includes(urlExt)) ext = urlExt;
  }
  if (!ext) ext = '.jpg';

  return { buffer, ext };
}

function shortId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let existing;
  try {
    existing = new Set(fs.readdirSync(config.uploadDir).map(f => path.basename(f, path.extname(f))));
  } catch {
    existing = new Set();
  }

  let name;
  do {
    name = '';
    for (let i = 0; i < 5; i++) {
      name += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (existing.has(name));
  return name;
}

function mimeFromExt(ext) {
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.tif' || ext === '.tiff') return 'image/tiff';
  return `image/${ext.slice(1)}`;
}

async function filesFromRemoteImages(images) {
  return Promise.all(images.filter(Boolean).map(async (imageUrl) => {
    const { buffer, ext } = await downloadImage(imageUrl);
    const filename = shortId() + ext;
    const savePath = path.join(config.uploadDir, filename);
    fs.writeFileSync(savePath, buffer);

    return {
      filename,
      originalname: filename,
      mimetype: mimeFromExt(ext),
      size: buffer.length,
      path: savePath
    };
  }));
}

async function saveImageFile(file) {
  if (file.originalname) {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
  }

  try {
    let width, height;
    const ext = path.extname(file.filename).toLowerCase();

    if (ext === '.svg') {
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
    return record;
  } catch (err) {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw err;
  }
}

function cleanupSavedImages(images) {
  images.forEach((image) => {
    store.remove(image.id);
    const filePath = path.join(config.uploadDir, image.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
}

async function saveImageFiles(files) {
  const images = [];
  try {
    for (const file of files) {
      images.push(await saveImageFile(file));
    }
    return images;
  } catch (err) {
    cleanupSavedImages(images);
    files.forEach((file) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
    throw err;
  }
}

async function uploadHandler(req, res, next) {
  let files = req.files || (req.file ? [req.file] : []);

  if (!files.length && req.is('application/json') && req.body && (req.body.image || req.body.images)) {
    try {
      const images = Array.isArray(req.body.images) ? req.body.images : [req.body.image];
      files = await filesFromRemoteImages(images);
    } catch (err) {
      return res.status(400).json({ error: '无法从提供的 URL 下载图片' });
    }
  }

  if (!files.length) {
    return res.status(400).json({ error: '请选择要上传的图片' });
  }

  try {
    const images = await saveImageFiles(files);
    if (images.length === 1) {
      return res.json({ success: true, ...images[0], images });
    }

    return res.json({ success: true, count: images.length, images });
  } catch (err) {
    return res.status(400).json({ error: '文件不是有效的图片格式' });
  }
}

module.exports = uploadHandler;
