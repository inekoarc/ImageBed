function errorHandler(err, req, res, next) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    const config = require('../config');
    return res.status(413).json({ error: `文件过大，最大允许 ${config.maxFileSizeMB}MB` });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }

  const statusCode = err.status || 500;
  console.error(`[Error] ${err.message}`, err.stack);
  res.status(statusCode).json({ error: err.message || '服务器内部错误' });
}

module.exports = errorHandler;
