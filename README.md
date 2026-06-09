# 🏰 Chaldeas 图床

简洁美观的图床应用 —— 上传图片，即可获得可访问的短链接。支持多图批量上传、密码保护的管理后台、CLI 命令行上传，以及飞书多维表格插件。

## 功能特性

- ⚡ **批量上传** — 支持多张图片同时上传，拖拽或点击选择
- 🔗 **5 位短链接** — 生成 `aB3xK.jpg` 格式的短链接，简洁美观
- 🖼️ **多格式支持** — JPG / PNG / GIF / WebP / SVG / BMP / TIFF
- 📋 **一键复制** — 单张复制，或批量复制全部链接 / Markdown / HTML
- 🔒 **管理保护** — 图片管理和删除需要密码登录，上传保持公开
- 🗑️ **图片管理** — 可视化管理所有已上传图片，支持删除
- 🖥️ **CLI 工具** — 命令行上传，URL 自动复制到剪贴板
- 🌐 **中文支持** — 中文文件名上传不会乱码
- 🔗 **URL 上传** — 支持传入图片 URL 自动下载到图床（Coze / API 集成）
- 📊 **飞书插件** — 飞书多维表格字段捷径，一列插图片一列自动返回 URL
- 🎨 **自定义图标** — Chaldeas 主题品牌图标

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并编辑：

```env
# 服务端口
PORT=3000

# 上传目录
UPLOAD_DIR=./uploads

# 最大文件大小 (MB)
MAX_FILE_SIZE_MB=50

# 服务器地址（返回的图片链接会以此开头）
DOMAIN_URL=https://your-domain.com

# 上传频率限制（15分钟内最多60次）
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=60

# 管理密码（用于登录管理页）
ADMIN_PASSWORD=设置你的密码

# 会话密钥（用于加密登录 session）
SESSION_SECRET=改成一个随机字符串
```

| 变量 | 说明 |
|------|------|
| `DOMAIN_URL` | 图片链接的域名前缀，有域名用域名，没域名用 `http://IP:3000` |
| `ADMIN_PASSWORD` | 管理后台登录密码 |
| `SESSION_SECRET` | 用于加密 session 的随机字符串，可用 `openssl rand -hex 32` 生成 |

### 3. 启动

```bash
npm start
```

开发模式（文件修改自动重启）：

```bash
npm run dev
```

## 生产部署

推荐使用 **Nginx 反向代理 + PM2 进程管理 + Certbot SSL** 部署。

### PM2 进程管理

```bash
npm install -g pm2
pm2 start server.js --name chaldeas
pm2 save
pm2 startup          # 开机自启
```

常用命令：

```bash
pm2 status           # 查看状态
pm2 logs chaldeas    # 查看日志
pm2 restart chaldeas # 重启
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 20m;
    }
}
```

### HTTPS（Certbot + Let's Encrypt）

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

申请后自动续期，无需手动操作：

```bash
sudo certbot renew --dry-run  # 验证续期正常
```

## 使用说明

### 上传图片

1. 浏览器打开 `https://your-domain.com`
2. 拖拽一张或多张图片到上传区域，或点击选择文件
3. 确认预览无误后点击「开始上传」（选错可点「重新选择」）
4. 上传成功后，每张图片可单独复制 URL，或批量：
   - **复制全部链接** — 每行一个 URL
   - **复制全部 Markdown** — 每行一个 `![alt](url)` 格式
   - **复制全部 HTML** — 每行一个 `<img src="url">` 格式
5. 点击「继续上传」上传下一批

### 管理图片

1. 访问 `https://your-domain.com/manage.html`（自动跳转登录页）
2. 输入密码登录（密码在 `.env` 的 `ADMIN_PASSWORD`）
3. 查看所有已上传图片的缩略图
4. 点击「复制链接」快速获取 URL
5. 点击「删除」移除不需要的图片
6. 使用完毕后可点击「退出登录」

### CLI 命令行上传

```bash
# 上传图片，URL 自动复制到剪贴板
node bin/imagebed 照片.jpg

# 指定服务器地址（默认从 .env 读取）
IMAGEBED_URL=https://your-domain.com node bin/imagebed 照片.jpg
```

CLI 会自动读取 `.env` 中的 `DOMAIN_URL`，跨平台剪贴板支持（Windows/macOS/Linux）。

## API 参考

### 上传图片（公开）

**multipart/form-data（推荐）：**

```bash
curl -F "image=@照片1.jpg" -F "image=@照片2.jpg" https://your-domain.com/api/upload
```

**JSON URL 传入（Coze / 程序调用）：**

```bash
# 单张 URL
curl -X POST https://your-domain.com/api/upload \
  -H "Content-Type: application/json" \
  -d '{"image": "https://example.com/photo.jpg"}'

# 批量 URL
curl -X POST https://your-domain.com/api/upload \
  -H "Content-Type: application/json" \
  -d '{"images": ["https://example.com/1.jpg", "https://example.com/2.jpg"]}'
```

响应：

```json
{
  "success": true,
  "count": 2,
  "images": [
    {
      "url": "https://your-domain.com/i/aB3xK.jpg",
      "filename": "aB3xK.jpg",
      "originalName": "photo.jpg",
      "size": 123456,
      "width": 1920,
      "height": 1080
    }
  ]
}
```

单张上传时额外返回简写字段：

```json
{
  "success": true,
  "url": "https://your-domain.com/i/aB3xK.jpg",
  "filename": "aB3xK.jpg",
  "images": [...]
}
```

### 管理后台 API

**登录：**

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"password":"你的密码"}' \
  https://your-domain.com/api/login -c cookies.txt
```

**获取图片列表（需登录）：**

```bash
curl -b cookies.txt https://your-domain.com/api/images
```

**删除图片（需登录）：**

```bash
curl -b cookies.txt -X DELETE https://your-domain.com/api/images/<id>
```

**退出登录：**

```bash
curl -b cookies.txt -X POST https://your-domain.com/api/logout
```

## 飞书多维表格插件

提供了飞书多维表格插件，支持在表格中直接上传图片并自动填入 URL。

部署到服务器：

```bash
cp -r feishu-plugin public/
pm2 restart chaldeas
```

安装步骤见 [feishu-plugin/README.md](feishu-plugin/README.md)。

## 技术栈

| 技术 | 用途 |
|------|------|
| Node.js 24 | 运行时 |
| Express 5 | Web 框架 |
| Multer 2.x | 文件上传处理（支持批量） |
| Sharp | 图片校验 + 元数据提取 |
| express-session | 会话管理（24h 过期） |
| express-rate-limit | 上传频率限制 |
| Morgan | HTTP 请求日志 |

## 项目结构

```
├── server.js              # 入口文件
├── app.js                 # Express 应用（路由、会话、认证）
├── config.js              # 集中配置
├── .env                   # 环境配置
├── middleware/
│   ├── upload.js          # Multer 上传配置 + 5位短文件名生成
│   ├── fileFilter.js      # 文件类型白名单校验
│   └── errorHandler.js    # 全局错误处理
├── routes/
│   ├── upload.js          # POST /api/upload（支持多图、URL传入）
│   ├── images.js          # GET/DELETE /api/images
│   ├── serve.js           # GET /i/:filename
│   └── auth.js            # POST /api/login, /api/logout
├── utils/
│   ├── store.js           # JSON 文件元数据存储
│   └── fileInfo.js        # 文件信息构建
├── public/                # 前端页面
│   ├── index.html         # 上传页面（支持多图）
│   ├── manage.html        # 管理页面（需登录）
│   ├── login.html         # 登录页面
│   ├── js/                # 前端 JavaScript
│   ├── css/               # 样式文件
│   └── favicon.png        # 网站图标
├── feishu-plugin/         # 飞书多维表格插件
├── bin/
│   └── imagebed           # CLI 命令行上传工具
├── uploads/               # 上传的图片文件
└── data/
    └── images.json        # 图片元数据记录
```

## 安全特性

- 文件类型双重校验（MIME 类型 + Sharp 真实图片检测）
- 5 位随机文件名（62⁵ ≈ 9 亿种组合），防碰撞、防路径穿越
- 上传频率限制，防止滥用
- 管理页面密码保护（express-session 会话管理，24 小时过期）
- 文件大小限制（默认 50MB，可配置）
- 安全 HTTP 头（X-Content-Type-Options、X-Frame-Options 等）
- HTTPS 加密传输（通过 Nginx + Let's Encrypt）
- 路径遍历防护（图片文件名严格校验）

## Coze / 扣子集成

可作为 Coze 自定义插件使用：

| 参数 | 值 |
|------|------|
| 请求方法 | POST |
| URL | `https://your-domain.com/api/upload` |
| 传入方式 | Body |
| 参数名 | `image` |
| 类型 | String（传入图片 URL） |

## 许可证

MIT
