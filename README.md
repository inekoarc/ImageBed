# 📸 ImageBed 图床

一个简单的图床应用，上传图片即可获得可访问的超链接。

## 快速开始

### 1. 安装依赖

```bash
npm install --production
```

### 2. 配置

复制 `.env` 文件并根据你的服务器环境修改：

```bash
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
```

**没有域名？** 将 `DOMAIN_URL` 设置为 `http://你的服务器IP:3000` 即可。后续有了域名再改。

### 3. 启动

```bash
npm start
```

生产环境推荐使用 PM2：

```bash
npm install -g pm2
pm2 start server.js --name imagebed
pm2 save
pm2 startup
```

## Nginx 反向代理（推荐）

创建 `/etc/nginx/sites-available/imagebed`：

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

启用并配置 HTTPS（推荐使用 Certbot）：

```bash
ln -s /etc/nginx/sites-available/imagebed /etc/nginx/sites-enabled/
certbot --nginx -d your-domain.com
nginx -s reload
```

**配置 HTTPS 后**，记得将 `.env` 中的 `DOMAIN_URL` 改为 `https://your-domain.com`。

## 使用说明

### 上传图片

1. 浏览器打开 `http://你的服务器IP:3000`
2. 拖拽图片到上传区域，或点击选择文件
3. 点击「开始上传」
4. 上传成功后，可以：
   - 📋 **复制链接** — 直接复制图片 URL
   - 📋 **复制 Markdown** — 复制 `![alt](url)` 格式
   - 📋 **复制 HTML** — 复制 `<img src="url">` 格式

### 管理图片

- 访问 `http://你的服务器IP:3000/manage.html`
- 查看所有已上传的图片
- 点击「复制链接」快速获取图片 URL
- 点击「删除」移除不需要的图片

## API 文档

### 上传图片

```bash
curl -F "image=@photo.jpg" http://localhost:3000/api/upload
```

响应示例：

```json
{
  "success": true,
  "id": "a1b2c3d4-e5f6-7890-...",
  "filename": "a1b2c3d4-e5f6-7890-....jpg",
  "originalName": "photo.jpg",
  "mimeType": "image/jpeg",
  "size": 256000,
  "width": 1920,
  "height": 1080,
  "url": "http://localhost:3000/i/a1b2c3d4...jpg",
  "createdAt": "2026-05-30T10:00:00.000Z"
}
```

### 获取图片列表

```bash
curl http://localhost:3000/api/images
```

### 删除图片

```bash
curl -X DELETE http://localhost:3000/api/images/<id>
```

### 访问图片

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

## 安全特性

- 文件类型双重校验（MIME 类型 + sharp 真实图片检测）
- UUID 文件名，防碰撞、防路径穿越
- 上传频率限制
- 安全 HTTP 头（Helmet）
- 文件大小限制

## 项目结构

```
├── server.js         # 入口文件
├── app.js            # Express 应用
├── config.js         # 配置
├── middleware/
│   ├── upload.js     # Multer 上传配置
│   ├── fileFilter.js # 文件类型过滤
│   └── errorHandler.js
├── routes/
│   ├── upload.js     # 上传 API
│   ├── images.js     # 图片管理 API
│   └── serve.js      # 图片访问
├── utils/
│   ├── store.js      # 元数据存储
│   └── fileInfo.js
├── public/           # 前端页面
├── uploads/          # 上传的文件
└── data/             # 元数据
```
