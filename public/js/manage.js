// ============================
// DOM Elements
// ============================
const imageGrid = document.getElementById('imageGrid');
const imageCount = document.getElementById('imageCount');
const emptyState = document.getElementById('emptyState');
const confirmModal = document.getElementById('confirmModal');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');

let deleteTargetId = null;

// ============================
// Utility
// ============================
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
// Load & Render Images
// ============================
async function loadImages() {
  try {
    const res = await fetch('/api/images');
    const data = await res.json();

    if (!data.success) {
      imageGrid.innerHTML = '<p class="empty-state">加载失败</p>';
      return;
    }

    const images = data.images;
    imageCount.textContent = `共 ${images.length} 张`;

    if (images.length === 0) {
      emptyState.hidden = false;
      imageGrid.innerHTML = '';
      imageGrid.appendChild(emptyState);
      return;
    }

    emptyState.hidden = true;
    imageGrid.innerHTML = '';

    images.forEach(img => {
      const card = document.createElement('div');
      card.className = 'image-card';

      const uploadDate = formatDate(img.createdAt);
      const displayName = img.originalName.length > 20
        ? img.originalName.substring(0, 17) + '...'
        : img.originalName;

      card.innerHTML = `
        <img class="thumb" src="/i/${img.filename}" alt="${img.originalName}" loading="lazy">
        <div class="card-body">
          <div class="filename" title="${img.originalName}">${displayName}</div>
          <div class="meta">${formatSize(img.size)} · ${uploadDate}</div>
          <div class="card-actions">
            <button class="btn-sm" data-url="${img.url}">复制链接</button>
            <button class="btn-sm btn-sm-danger" data-id="${img.id}">删除</button>
          </div>
        </div>
      `;
      // 用 JS 监听 error 事件（避免 CSP script-src-attr 拦截内联 onerror）
      const thumb = card.querySelector('.thumb');
      thumb.addEventListener('error', function() {
        this.src = 'data:image/svg+xml,' + encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="160">' +
          '<rect fill="#f1f5f9" width="200" height="160"/>' +
          '<text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#94a3b8" font-size="14">加载失败</text>' +
          '</svg>'
        );
      });

      imageGrid.appendChild(card);
    });

    // 绑定事件
    document.querySelectorAll('.btn-sm[data-url]').forEach(btn => {
      btn.addEventListener('click', () => copyText(btn.dataset.url));
    });

    document.querySelectorAll('.btn-sm-danger').forEach(btn => {
      btn.addEventListener('click', () => {
        deleteTargetId = btn.dataset.id;
        confirmModal.hidden = false;
      });
    });
  } catch (err) {
    imageGrid.innerHTML = '<p class="empty-state">加载失败，请检查网络</p>';
  }
}

// ============================
// Delete
// ============================
async function deleteImage(id) {
  try {
    const res = await fetch(`/api/images/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('图片已删除');
      loadImages();
    } else {
      showToast(data.error || '删除失败');
    }
  } catch (err) {
    showToast('删除失败，请检查网络');
  }
}

confirmBtn.addEventListener('click', () => {
  if (deleteTargetId) {
    deleteImage(deleteTargetId);
  }
  confirmModal.hidden = true;
  deleteTargetId = null;
});

cancelBtn.addEventListener('click', () => {
  confirmModal.hidden = true;
  deleteTargetId = null;
});

// 点击遮罩层关闭
confirmModal.addEventListener('click', (e) => {
  if (e.target === confirmModal) {
    confirmModal.hidden = true;
    deleteTargetId = null;
  }
});

// ============================
// Init
// ============================
loadImages();
