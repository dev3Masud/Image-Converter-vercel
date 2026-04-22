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
  const newFiles = Array.from(fileList).filter(f => {
    if (!f.type.startsWith('image/')) {
      showError(`${f.name} is not an image`);
      return false;
    }
    return true;
  });
  
  files = [...files, ...newFiles];
  
  if (files.length) {
    $('preview').classList.remove('hidden');
    $('fileCount').textContent = `${files.length} file${files.length > 1 ? 's' : ''}`;
    $('fileList').innerHTML = files.map((f, i) => {
      const url = URL.createObjectURL(f);
      if (!uploadUrls.includes(url)) uploadUrls.push(url);
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
    const format = $('format').value.toLowerCase();
    
    if (isSingle && blob.type.startsWith('image/')) {
      $('convertedGrid').innerHTML = `
        <div class="cursor-pointer group" onclick="showPreview('${url}', '${files[0].name}')">
          <div class="relative rounded-lg overflow-hidden border-2 border-transparent group-hover:border-blue-500 transition">
            <img src="${url}" class="w-full h-32 object-cover">
            <div class="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">${format.toUpperCase()}</div>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-2 truncate">${files[0].name}</p>
        </div>
      `;
      showPreview(url, files[0].name);
      $('downloadBtnText').textContent = 'Download';
      $('downloadAllBtn').classList.add('hidden');
      $('downloadBtn').onclick = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${files[0].name.split('.')[0]}_converted.${format}`;
        a.click();
      };
    } else {
      // Multiple files - show grid with placeholders
      $('convertedGrid').innerHTML = files.map((f, i) => `
        <div class="group">
          <div class="relative rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center h-32">
            <div class="text-center">
              <svg class="w-12 h-12 text-blue-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p class="text-xs font-semibold text-gray-600 dark:text-gray-300">Converted</p>
            </div>
            <div class="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">${format.toUpperCase()}</div>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-2 truncate">${f.name}</p>
        </div>
      `).join('');
      
      $('previewSection').classList.remove('hidden');
      $('previewContent').innerHTML = `
        <div class="text-center py-8">
          <svg class="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p class="text-lg font-semibold text-gray-800 dark:text-white mb-2">${files.length} Images Converted Successfully</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">All images are packaged in a ZIP file</p>
        </div>
      `;
      
      $('downloadBtnText').textContent = 'Download ZIP';
      $('downloadAllBtn').classList.add('hidden');
      $('downloadBtn').onclick = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted_images.zip';
        a.click();
      };
    }
    
    $('result').classList.remove('hidden');
    
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

window.showPreview = (url, name, index) => {
  $('previewSection').classList.remove('hidden');
  $('previewContent').innerHTML = `<div style="max-width:600px;width:100%"><img src="${url}" class="w-full rounded-lg shadow-lg"></div>`;
  $('downloadBtn').onclick = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.split('.')[0]}_converted.${$('format').value.toLowerCase()}`;
    a.click();
  };
};

function showError(msg) {
  $('error').textContent = msg;
  $('error').classList.remove('hidden');
  setTimeout(() => $('error').classList.add('hidden'), 5000);
}
