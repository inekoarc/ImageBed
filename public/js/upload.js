// ============================
// DOM Elements
// ============================
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const previewName = document.getElementById('previewName');
const previewSize = document.getElementById('previewSize');
const previewGrid = document.getElementById('previewGrid');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const uploadBtn = document.getElementById('uploadBtn');
const result = document.getElementById('result');
const resultCount = document.getElementById('resultCount');
const resultList = document.getElementById('resultList');
const copyUrlBtn = document.getElementById('copyUrlBtn');
const copyMarkdownBtn = document.getElementById('copyMarkdownBtn');
const copyHtmlBtn = document.getElementById('copyHtmlBtn');
const resetBtn = document.getElementById('resetBtn');
const reselectBtn = document.getElementById('reselectBtn');

let selectedFiles = [];
let uploadedImages = [];

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
  if (!text) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast('已复制到剪贴板'));
  } else {
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

function resetUploadView() {
  selectedFiles = [];
  uploadedImages = [];
  fileInput.value = '';
  previewGrid.innerHTML = '';
  resultList.innerHTML = '';
  dropZone.hidden = false;
  preview.hidden = true;
  result.hidden = true;
  progressBar.hidden = true;
  progressFill.style.width = '0%';
  uploadBtn.disabled = false;
  uploadBtn.textContent = '开始上传';
}

function imageAlt(image, index) {
  return image.originalname || image.filename || `image-${index + 1}`;
}

// ============================
// File Selection
// ============================
function validateFile(file) {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff'
  ];

  if (!allowedTypes.includes(file.type)) {
    showToast(`${file.name} 不是支持的图片类型`);
    return false;
  }

  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    showToast(`${file.name} 超过 50MB`);
    return false;
  }

  return true;
}

function renderPreview(files) {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  previewName.textContent = files.length === 1 ? files[0].name : `${files.length} 张图片`;
  previewSize.textContent = formatSize(totalSize);
  previewGrid.innerHTML = '';

  files.forEach((file) => {
    const item = document.createElement('div');
    item.className = 'preview-item';

    const img = document.createElement('img');
    img.alt = file.name;
    item.appendChild(img);

    const meta = document.createElement('div');
    meta.className = 'preview-item-meta';

    const filename = document.createElement('span');
    filename.title = file.name;
    filename.textContent = file.name;
    meta.appendChild(filename);

    const size = document.createElement('small');
    size.textContent = formatSize(file.size);
    meta.appendChild(size);

    item.appendChild(meta);

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);

    previewGrid.appendChild(item);
  });

  dropZone.hidden = true;
  preview.hidden = false;
  result.hidden = true;
  progressBar.hidden = true;
  uploadBtn.disabled = false;
  uploadBtn.textContent = files.length === 1 ? '开始上传' : `上传 ${files.length} 张图片`;
}

function handleFiles(fileList) {
  const files = Array.from(fileList || []).filter(validateFile);
  if (!files.length) return;

  selectedFiles = files;
  renderPreview(files);
}

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

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
  handleFiles(e.dataTransfer.files);
});

// ============================
// Upload
// ============================
uploadBtn.addEventListener('click', async () => {
  if (!selectedFiles.length) return;

  uploadBtn.disabled = true;
  uploadBtn.textContent = '上传中...';
  progressBar.hidden = false;
  progressFill.style.width = '0%';

  const formData = new FormData();
  selectedFiles.forEach((file) => formData.append('image', file));

  try {
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

    uploadedImages = data.images || [data];
    renderResult(uploadedImages);
    showToast(`上传成功：${uploadedImages.length} 张`);
  } catch (err) {
    showToast(err.error || '上传失败');
    progressFill.style.width = '0%';
    uploadBtn.disabled = false;
    uploadBtn.textContent = selectedFiles.length === 1 ? '开始上传' : `上传 ${selectedFiles.length} 张图片`;
  }
});

function renderResult(images) {
  preview.hidden = true;
  result.hidden = false;
  progressBar.hidden = true;
  resultCount.textContent = `${images.length} 张图片已生成 URL`;
  resultList.innerHTML = '';

  images.forEach((image, index) => {
    const item = document.createElement('div');
    item.className = 'result-item';

    const thumb = document.createElement('img');
    thumb.src = '/i/' + image.filename;
    thumb.alt = imageAlt(image, index);
    item.appendChild(thumb);

    const body = document.createElement('div');
    body.className = 'result-item-body';

    const name = document.createElement('div');
    name.className = 'result-item-name';
    name.textContent = imageAlt(image, index);
    body.appendChild(name);

    const row = document.createElement('div');
    row.className = 'result-item-url';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = image.url;
    input.readOnly = true;
    row.appendChild(input);

    const copyButton = document.createElement('button');
    copyButton.className = 'btn btn-copy';
    copyButton.type = 'button';
    copyButton.textContent = '复制';
    copyButton.addEventListener('click', () => copyText(image.url));
    row.appendChild(copyButton);

    body.appendChild(row);
    item.appendChild(body);
    resultList.appendChild(item);
  });

  uploadBtn.disabled = false;
  uploadBtn.textContent = '上传完成';
}

// ============================
// Copy Buttons
// ============================
copyUrlBtn.addEventListener('click', () => {
  copyText(uploadedImages.map((image) => image.url).join('\n'));
});

copyMarkdownBtn.addEventListener('click', () => {
  copyText(uploadedImages.map((image, index) => `![${imageAlt(image, index)}](${image.url})`).join('\n'));
});

copyHtmlBtn.addEventListener('click', () => {
  copyText(uploadedImages.map((image, index) => `<img src="${image.url}" alt="${imageAlt(image, index)}">`).join('\n'));
});

// ============================
// Reset
// ============================
resetBtn.addEventListener('click', resetUploadView);
reselectBtn.addEventListener('click', resetUploadView);
