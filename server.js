require('dotenv').config();

const fs = require('fs');
const app = require('./app');
const config = require('./config');

// 确保上传目录和数据目录存在
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}
if (!fs.existsSync(config.dataDir)) {
  fs.mkdirSync(config.dataDir, { recursive: true });
}

app.listen(config.port, () => {
  console.log(`🚀 ImageBed 图床服务已启动`);
  console.log(`📁 上传目录: ${config.uploadDir}`);
  console.log(`🔗 访问地址: ${config.domainUrl}`);
  console.log(`📏 最大文件: ${config.maxFileSizeMB}MB`);
});
