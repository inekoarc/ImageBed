const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const upload = require('./middleware/upload');
const uploadHandler = require('./routes/upload');
const serveImage = require('./routes/serve');
const { listImages, getImage, deleteImage } = require('./routes/images');

const app = express();

// 安全头（不使用 HTTPS 时禁用 upgrade-insecure-requests）
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      formAction: ["'self'"],
      connectSrc: ["'self'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"]
    }
  }
}));

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
