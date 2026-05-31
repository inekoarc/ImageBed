// ============================
// Feishu Bitable SDK 初始化
// ============================
let bitableReady = false;
let bitableTable = null;

async function initBitable() {
  try {
    // 检查是否在飞书环境中运行
    if (typeof bitable !== 'undefined' && bitable.bridge) {
      await bitable.bridge.connect();
      bitableTable = await bitable.base.getActiveTable();
      bitableReady = true;
      console.log('✅ 飞书 SDK 已连接');
      return true;
    }
  } catch (e) {
    console.warn('飞书 SDK 不可用，将以独立模式运行', e);
  }
  return false;
}

// ============================
// DOM Elements
// ============================
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const imageUrlInput = document.getElementById('imageUrlInput');
const uploadUrlBtn = document.getElementById('uploadUrlBtn');
const previewArea = document.getElementById('previewArea');
const previewImg = document.getElementById('previewImg');
const previewName = document.getElementById('previewName');
const previewSize = document.getElementById('previewSize');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const uploadBtn = document.getElementById('uploadBtn');
const resultArea = document.getElementById('resultArea');
const resultImg = document.getElementById('resultImg');
const resultUrl = document.getElementById('resultUrl');
const copyBtn = document.getElementById('copyBtn');
const fillCellBtn = document.getElementById('fillCellBtn');
const resetBtn = document.getElementById('resetBtn');
const statusEl = document.getElementById('status');

let selectedFile = null;

// ============================
// Utils
// ============================
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function setStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = 'status ' + (type || '');
}

function showPreview(file) {
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewName.textContent = file.name;
    previewSize.textContent = formatSize(file.size);
    previewArea.classList.add('show');
    resultArea.classList.remove('show');
    progressBar.classList.remove('show');
    uploadBtn.disabled = false;
    uploadBtn.textContent = '开始上传';
    setStatus('');
  };
  reader.readAsDataURL(file);
}

function showResult(url) {
  // 在结果区显示缩略图（用完整 URL）
  resultImg.src = url;
  resultUrl.value = url;
  resultArea.classList.add('show');
  previewArea.classList.remove('show');
  setStatus('✅ 上传成功', 'success');

  // 显示"填入单元格"按钮（仅在飞书环境可用）
  if (bitableReady) {
    fillCellBtn.classList.add('show');
  }
}

// ============================
// API Upload
// ============================
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        progressFill.style.width = pct + '%';
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.success) {
          resolve(data);
        } else {
          reject(new Error(data.error || '上传失败'));
        }
      } catch {
        reject(new Error('响应解析失败'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('网络错误')));
    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
}

async function uploadImageFromUrl(url) {
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: url })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || '上传失败');
  return data;
}

// ============================
// 填入飞书单元格
// ============================
async function fillFeishuCell(url) {
  if (!bitableReady || !bitableTable) {
    setStatus('⚠️ 飞书环境未连接', 'error');
    return;
  }

  try {
    setStatus('⏳ 正在填入单元格...');

    // 获取当前选中的行和列
    const selection = await bitableTable.getSelection();

    if (!selection || !selection.recordId || !selection.fieldId) {
      setStatus('⚠️ 请先选中一个单元格', 'error');
      return;
    }

    // 填入 URL
    await bitableTable.setCellValue(
      selection.fieldId,
      selection.recordId,
      url
    );

    setStatus('✅ 已填入单元格！', 'success');
    fillCellBtn.classList.remove('show');
    fillCellBtn.textContent = '✅ 已填入';
  } catch (e) {
    console.error('填入单元格失败:', e);
    setStatus('⚠️ 填入失败，可手动复制粘贴', 'error');
  }
}

// ============================
// Event Listeners
// ============================

// 点击上传区域 → 选择文件
uploadArea.addEventListener('click', (e) => {
  if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
    fileInput.click();
  }
});

// 拖拽上传
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) showPreview(file);
});

// 文件选择
fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) showPreview(e.target.files[0]);
});

// 开始上传
uploadBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  uploadBtn.disabled = true;
  uploadBtn.textContent = '上传中...';
  progressBar.classList.add('show');
  progressFill.style.width = '0%';
  setStatus('');

  try {
    const data = await uploadImage(selectedFile);
    showResult(data.url);
  } catch (err) {
    setStatus('❌ ' + err.message, 'error');
    uploadBtn.disabled = false;
    uploadBtn.textContent = '重试上传';
  }
});

// URL 上传
uploadUrlBtn.addEventListener('click', async () => {
  const url = imageUrlInput.value.trim();
  if (!url) {
    setStatus('⚠️ 请输入图片 URL', 'error');
    return;
  }

  uploadUrlBtn.disabled = true;
  uploadUrlBtn.textContent = '上传中...';
  setStatus('⏳ 正在下载图片...');

  try {
    const data = await uploadImageFromUrl(url);
    showResult(data.url);
    imageUrlInput.value = '';
  } catch (err) {
    setStatus('❌ ' + err.message, 'error');
  } finally {
    uploadUrlBtn.disabled = false;
    uploadUrlBtn.textContent = '上传';
  }
});

// URL 输入框回车触发上传
imageUrlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') uploadUrlBtn.click();
});

// 复制按钮
copyBtn.addEventListener('click', async () => {
  const text = resultUrl.value;
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = '✅';
    setTimeout(() => { copyBtn.textContent = '📋'; }, 1500);
  } catch {
    // 备选方案
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    copyBtn.textContent = '✅';
    setTimeout(() => { copyBtn.textContent = '📋'; }, 1500);
  }
});

// 填入当前单元格
fillCellBtn.addEventListener('click', () => {
  fillFeishuCell(resultUrl.value);
});

// 继续上传
resetBtn.addEventListener('click', () => {
  selectedFile = null;
  fileInput.value = '';
  previewImg.src = '';
  resultImg.src = '';
  resultUrl.value = '';
  previewArea.classList.remove('show');
  resultArea.classList.remove('show');
  progressBar.classList.remove('show');
  fillCellBtn.classList.remove('show');
  fillCellBtn.textContent = '✅ 填入当前单元格';
  setStatus('');
});

// ============================
// 初始化
// ============================
(async () => {
  const connected = await initBitable();
  if (connected) {
    setStatus('✅ 已连接到飞书表格');
  } else {
    // 独立模式仍可使用上传和复制
    console.log('独立模式运行中');
  }
})();
