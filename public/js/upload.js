// ============================
// DOM Elements
// ============================
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const previewImage = document.getElementById('previewImage');
const previewName = document.getElementById('previewName');
const previewSize = document.getElementById('previewSize');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const uploadBtn = document.getElementById('uploadBtn');
const result = document.getElementById('result');
const resultImage = document.getElementById('resultImage');
const urlInput = document.getElementById('urlInput');
const copyUrlBtn = document.getElementById('copyUrlBtn');
const copyMarkdownBtn = document.getElementById('copyMarkdownBtn');
const copyHtmlBtn = document.getElementById('copyHtmlBtn');
const resetBtn = document.getElementById('resetBtn');

let selectedFile = null;

// ============================
// Utility
// ============================
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast('已复制到剪贴板'));
  } else {
    // HTTP 回退方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('已复制到剪贴板');
  }
}

// ============================
// File Selection
// ============================
function handleFile(file) {
  if (!file) return;

  // 客户端校验
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'image/svg+xml', 'image/bmp', 'image/tiff'];
  if (!allowedTypes.includes(file.type)) {
    showToast('不支持的文件类型');
    return;
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    showToast('文件过大，最大支持 10MB');
    return;
  }

  selectedFile = file;

  // 预览
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    previewName.textContent = file.name;
    previewSize.textContent = formatSize(file.size);
    dropZone.hidden = true;
    preview.hidden = false;
    result.hidden = true;
    progressBar.hidden = true;
    uploadBtn.disabled = false;
    uploadBtn.textContent = '开始上传';
  };
  reader.readAsDataURL(file);
}

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

// 拖拽
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  handleFile(file);
});

// ============================
// Upload
// ============================
uploadBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  uploadBtn.disabled = true;
  uploadBtn.textContent = '上传中...';
  progressBar.hidden = false;
  progressFill.style.width = '0%';

  const formData = new FormData();
  formData.append('image', selectedFile);

  try {
    // 用 XHR 实现上传进度
    const xhr = new XMLHttpRequest();
    const data = await new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          progressFill.style.width = pct + '%';
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          try {
            reject(JSON.parse(xhr.responseText));
          } catch {
            reject({ error: `上传失败 (${xhr.status})` });
          }
        }
      });

      xhr.addEventListener('error', () => reject({ error: '网络错误' }));
      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });

    // 上传成功
    preview.hidden = true;
    result.hidden = false;
    resultImage.src = data.url;
    urlInput.value = data.url;
    progressBar.hidden = true;
    uploadBtn.disabled = false;
    uploadBtn.textContent = '上传完成 ✓';
    showToast('上传成功！');
  } catch (err) {
    showToast(err.error || '上传失败');
    progressFill.style.width = '0%';
    uploadBtn.disabled = false;
    uploadBtn.textContent = '开始上传';
  }
});

// ============================
// Copy Buttons
// ============================
copyUrlBtn.addEventListener('click', () => copyText(urlInput.value));
copyMarkdownBtn.addEventListener('click', () => copyText(`![${selectedFile?.name || 'image'}](${urlInput.value})`));
copyHtmlBtn.addEventListener('click', () => copyText(`<img src="${urlInput.value}" alt="${selectedFile?.name || 'image'}">`));

// ============================
// Reset
// ============================
resetBtn.addEventListener('click', () => {
  selectedFile = null;
  fileInput.value = '';
  dropZone.hidden = false;
  preview.hidden = true;
  result.hidden = true;
  progressBar.hidden = true;
  progressFill.style.width = '0%';
});
