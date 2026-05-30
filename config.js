const path = require('path');

const config = Object.freeze({
  port: parseInt(process.env.PORT, 10) || 3000,
  uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
  maxFileSizeMB: parseFloat(process.env.MAX_FILE_SIZE_MB || '10'),
  maxFileSizeBytes: parseFloat(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024,
  domainUrl: (process.env.DOMAIN_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '60', 10),
  allowedMimeTypes: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'image/svg+xml', 'image/bmp', 'image/tiff'
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif'],
  dataDir: path.resolve('./data'),
});

module.exports = config;
