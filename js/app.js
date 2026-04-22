const $ = id => document.getElementById(id);
let files = [], originalDims = {};
let uploadUrls = [], resultUrl = null;

(function() {
  const d = localStorage.getItem('darkMode') === 'true';
  if (d) {
    document.documentElement.classList.add('dark');
    $('sunIcon').classList.add('hidden');
    $('moonIcon').classList.remove('hidden');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();

$('darkToggle').onclick = () => {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark);
  $('sunIcon').classList.toggle('hidden');
  $('moonIcon').classList.toggle('hidden');
};

$('dropZone').onclick = () => $('fileInput').click();
$('dropZone').ondragover = e => {
  e.preventDefault();
  e.currentTarget.classList.add('border-blue-500', 'scale-105');
};
$('dropZone').ondragleave = e => {
  e.currentTarget.classList.remove('border-blue-500', 'scale-105');
};
$('dropZone').ondrop = e => {
  e.preventDefault();
  e.currentTarget.classList.remove('border-blue-500', 'scale-105');
  handleFiles(e.dataTransfer.files);
};
$('fileInput').onchange = e => handleFiles(e.target.files);

function handleFiles(fileList) {
  files = Array.from(fileList).filter(f => {
    if (!f.type.startsWith('image/')) {
      showError(`${f.name} is not an image`);
      return false;
    }
    return true;
  });
  if (files.length) {
    $('preview').classList.remove('hidden');
    $('fileCount').textContent = `${files.length} file${files.length > 1 ? 's' : ''}`;
    $('fileList').innerHTML = files.map((f, i) => {
      const url = URL.createObjectURL(f);
      uploadUrls.push(url);
      const img = new Image();
      img.onload = () => {
        originalDims[i] = { w: img.width, h: img.height };
      };
      img.src = url;
      return `<div class="file-item flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"><img src="${url}" class="w-14 h-14 object-cover rounded-lg shadow-sm"><div class="flex-1 min-w-0"><p class="font-medium text-gray-800 dark:text-white truncate">${f.name}</p><p class="text-sm text-gray-500 dark:text-gray-400">${(f.size / 1024).toFixed(1)} KB</p></div></div>`;
    }).join('');
    setTimeout(() => {
      uploadUrls.forEach(url => URL.revokeObjectURL(url));
      uploadUrls = [];
      $('preview').classList.add('hidden');
      files = [];
    }, 30 * 60 * 1000);
  }
}

$('format').onchange = () => {
  const fmt = $('format').value;
  $('qualitySection').classList.toggle('hidden', !['JPEG', 'WEBP'].includes(fmt));
};

$('quality').oninput = () => $('qualityValue').textContent = $('quality').value + '%';

$('resizeToggle').onchange = () => $('resizeSection').classList.toggle('hidden', !$('resizeToggle').checked);

$('width').oninput = () => {
  if ($('aspectLock').checked && originalDims[0]) {
    const r = originalDims[0].h / originalDims[0].w;
    $('height').value = Math.round($('width').value * r);
  }
};
$('height').oninput = () => {
  if ($('aspectLock').checked && originalDims[0]) {
    const r = originalDims[0].w / originalDims[0].h;
    $('width').value = Math.round($('height').value * r);
  }
};

$('convertBtn').onclick = async () => {
  if (!files.length) {
    showError('Please select files');
    return;
  }
  $('error').classList.add('hidden');
  $('convertBtn').disabled = true;
  $('progress').classList.remove('hidden');
  $('progressBar').style.width = '50%';

  const fd = new FormData();
  files.forEach(f => fd.append('files', f));
  fd.append('format', $('format').value);
  fd.append('quality', $('quality').value);
  if ($('resizeToggle').checked) {
    fd.append('width', $('width').value || 0);
    fd.append('height', $('height').value || 0);
  }

  try {
    const res = await fetch('/api/convert', { method: 'POST', body: fd });
    $('progressBar').style.width = '100%';
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = url;
    const isSingle = files.length === 1;
    if (isSingle && blob.type.startsWith('image/')) {
      $('resultContent').innerHTML = `<div class="flex justify-center"><div class="rounded-xl overflow-hidden shadow-lg" style="max-width:600px;width:100%"><img src="${url}" class="w-full"></div></div>`;
    } else {
      $('resultContent').innerHTML = `<div class="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl"><svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><p class="text-green-700 dark:text-green-400 font-medium">${files.length} images converted successfully</p></div>`;
    }
    $('result').classList.remove('hidden');
    $('downloadBtn').onclick = () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = isSingle ? `${files[0].name.split('.')[0]}_converted.${$('format').value.toLowerCase()}` : 'converted_images.zip';
      a.click();
    };
    setTimeout(() => {
      URL.revokeObjectURL(url);
      resultUrl = null;
      $('result').classList.add('hidden');
    }, 30 * 60 * 1000);
  } catch (err) {
    showError(err.message);
  } finally {
    $('convertBtn').disabled = false;
    $('progress').classList.add('hidden');
    $('progressBar').style.width = '0%';
  }
};

function showError(msg) {
  $('error').textContent = msg;
  $('error').classList.remove('hidden');
  setTimeout(() => $('error').classList.add('hidden'), 5000);
}
