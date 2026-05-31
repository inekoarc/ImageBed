const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const upload = require('./middleware/upload');
const uploadHandler = require('./routes/upload');
const serveImage = require('./routes/serve');
const { listImages, getImage, deleteImage } = require('./routes/images');

const app = express();

// 安全头（手动设置，避免 Helmet 默认策略导致 HTTP 模式下图片加载问题）
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// 日志
app.use(morgan('combined'));

// JSON 解析
app.use(express.json());

// 静态文件（前端页面）
app.use(express.static('public'));

// 上传频率限制
const uploadLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: { error: '请求过于频繁，请稍后再试' }
});

// 路由: 上传
app.post('/api/upload', uploadLimiter, upload.single('image'), uploadHandler);

// 路由: 图片列表
app.get('/api/images', listImages);

// 路由: 图片详情
app.get('/api/images/:id', getImage);

// 路由: 删除图片
app.delete('/api/images/:id', deleteImage);

// 路由: 图片访问
app.get('/i/:filename', serveImage);

// 错误处理
app.use(errorHandler);

module.exports = app;
