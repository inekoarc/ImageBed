const path = require('path');
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const upload = require('./middleware/upload');
const uploadHandler = require('./routes/upload');
const serveImage = require('./routes/serve');
const { listImages, getImage, deleteImage } = require('./routes/images');
const { login, logout } = require('./routes/auth');

const app = express();

// 安全头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// 日志
app.use(morgan('combined'));

// 会话中间件
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// JSON 解析
app.use(express.json());

// 认证中间件
function requireAuth(req, res, next) {
  if (req.session.authenticated) return next();
  if (req.xhr || req.path.startsWith('/api/')) {
    return res.status(401).json({ error: '请先登录' });
  }
  // 页面访问：返回 login.html
  return res.sendFile(path.join(__dirname, 'public', 'login.html'));
}

// 需登录的页面路由（必须在 static 之前）
app.get('/manage.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manage.html'));
});

// 公开静态文件
app.use(express.static('public'));

// 上传频率限制
const uploadLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: { error: '请求过于频繁，请稍后再试' }
});

// ===== 公开路由 =====
app.post('/api/upload', uploadLimiter, upload.single('image'), uploadHandler);
app.post('/api/login', login);
app.get('/i/:filename', serveImage);

// ===== 需登录路由 =====
app.get('/api/images', requireAuth, listImages);
app.get('/api/images/:id', requireAuth, getImage);
app.delete('/api/images/:id', requireAuth, deleteImage);
app.post('/api/logout', requireAuth, logout);

// 错误处理
app.use(errorHandler);

module.exports = app;
