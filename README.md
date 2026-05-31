# 🏰 Chaldeas 图床

一个简洁的图床应用，上传图片即可获得**5位短链接**，支持图片管理和密码保护。

> 原名 ImageBed，后更名为 Chaldeas。

## 功能特性

- ⚡ **拖拽上传** — 支持拖拽或点击选择图片，上传前可预览、重新选择
- 🔗 **5位短链接** — 生成 `aB3xK.jpg` 格式的短链接，简洁美观
- 🖼️ **支持多种格式** — JPG / PNG / GIF / WebP / SVG / BMP / TIFF
- 📋 **一键复制** — 支持复制原始链接、Markdown、HTML 三种格式
- 🔒 **管理保护** — 图片管理和删除需要密码登录，上传保持公开
- 🗑️ **图片管理** — 可视化管理所有已上传图片，支持删除
- 🎨 **自定义图标** — 支持自定义 favicon 和页面图标

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置

编辑 `.env` 文件：

```env
# 服务端口
PORT=3000

# 上传目录
UPLOAD_DIR=./uploads

# 最大文件大小 (MB)
MAX_FILE_SIZE_MB=10

# 你的服务器域名或 IP（返回的图片链接会以此开头）
DOMAIN_URL=http://你的服务器IP:3000

# 上传频率限制（15分钟内最多60次）
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=60

# 管理密码（用于登录管理页）
ADMIN_PASSWORD=设置你的密码

# 会话密钥（用于加密登录 session）
SESSION_SECRET=改成一个随机字符串
```

**没有域名？** 将 `DOMAIN_URL` 设置为 `http://你的服务器IP:3000` 即可。后续有了域名再改。

### 3. 启动

```bash
npm start
```

生产环境推荐使用 PM2 后台运行：

```bash
npm install -g pm2
pm2 start server.js --name chaldeas
pm2 save
pm2 startup          # 设置开机自启
```

## 使用说明

### 上传图片

1. 浏览器打开 `http://你的服务器IP:3000`
2. 拖拽图片到上传区域，或点击选择文件
3. 确认预览无误后点击「开始上传」（选错可点「重新选择」）
4. 上传成功后，可以：
   - 📋 **复制链接** — 直接复制图片 URL
   - 📋 **复制 Markdown** — 复制 `![alt](url)` 格式
   - 📋 **复制 HTML** — 复制 `<img src="url">` 格式

### 管理图片

1. 访问 `http://你的服务器IP:3000/manage.html`
2. 输入密码登录（默认密码见 `.env` 中的 `ADMIN_PASSWORD`）
3. 查看所有已上传图片的缩略图
4. 点击「复制链接」快速获取 URL
5. 点击「删除」移除不需要的图片

## Nginx 反向代理（推荐）

创建 `/etc/nginx/sites-available/chaldeas`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用并配置 HTTPS：

```bash
ln -s /etc/nginx/sites-available/chaldeas /etc/nginx/sites-enabled/
certbot --nginx -d your-domain.com
nginx -s reload
```

**配置 HTTPS 后**，记得将 `.env` 中的 `DOMAIN_URL` 改为 `https://your-domain.com`。

## API 文档

### 上传图片（公开）

```bash
curl -F "image=@photo.jpg" http://localhost:3000/api/upload
```

响应：

```json
{
  "success": true,
  "id": "a1b2c3d4-...",
  "filename": "aB3xK.jpg",
  "originalName": "photo.jpg",
  "mimeType": "image/jpeg",
  "size": 256000,
  "width": 1920,
  "height": 1080,
  "url": "http://localhost:3000/i/aB3xK.jpg",
  "createdAt": "2026-05-30T10:00:00.000Z"
}
```

### 登录

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"password":"你的密码"}' \
  http://localhost:3000/api/login
```

### 获取图片列表（需登录）

```bash
curl -b cookies.txt http://localhost:3000/api/images
```

### 删除图片（需登录）

```bash
curl -b cookies.txt -X DELETE http://localhost:3000/api/images/<id>
```

### 退出登录

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/logout
```

### 访问图片（公开）

`http://localhost:3000/i/<filename>`

## 支持的图片格式

| 格式 | 扩展名 |
|------|--------|
| JPEG | `.jpg` `.jpeg` |
| PNG | `.png` |
| GIF | `.gif` |
| WebP | `.webp` |
| SVG | `.svg` |
| BMP | `.bmp` |
| TIFF | `.tiff` `.tif` |

## 技术细节

### 安全特性

- 文件类型双重校验（MIME 类型 + sharp 真实图片检测）
- 5位随机文件名（62⁵ ≈ 9亿种组合），防碰撞、防路径穿越
- 上传频率限制，防止滥用
- 管理页面密码保护（express-session 会话管理）
- 文件大小限制（默认 10MB，可配置）
- 安全 HTTP 头（X-Content-Type-Options、X-Frame-Options 等）

### 编码处理

- 支持中文文件名上传（Latin-1 → UTF-8 编码自动转换）
- 兼容旧版 UUID 格式文件和 5位短格式文件

## 项目结构

```
├── server.js              # 入口文件
├── app.js                 # Express 应用（路由、会话、认证）
├── config.js              # 集中配置
├── .env                   # 环境配置（端口、密码、域名等）
├── middleware/
│   ├── upload.js          # Multer 上传配置 + 5位短文件名生成
│   ├── fileFilter.js      # 文件类型白名单校验
│   └── errorHandler.js    # 全局错误处理
├── routes/
│   ├── upload.js          # POST /api/upload
│   ├── images.js          # GET/DELETE /api/images
│   ├── serve.js           # GET /i/:filename
│   └── auth.js            # POST /api/login, /api/logout
├── utils/
│   ├── store.js           # JSON 文件元数据存储
│   └── fileInfo.js        # 文件信息构建
├── public/                # 前端页面
│   ├── index.html         # 上传页面
│   ├── manage.html        # 管理页面（需登录）
│   ├── login.html         # 登录页面
│   ├── js/                # 前端 JavaScript
│   ├── css/               # 样式文件
│   └── favicon.png        # 网站图标
├── uploads/               # 上传的图片文件
└── data/                  # 元数据存储
    └── images.json        # 图片记录
```
