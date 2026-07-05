const $ = id => document.getElementById(id);

let files = []; // Array of { id, file, status, convertedUrl, convertedBlob, convertedName, originalUrl, exifData, error }
let activeTab = 'converter'; // 'converter' | 'compressor' | 'exif'
let selectedFormat = 'WEBP';
let activeExifId = null;

// Dark Mode Initialization
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

// Event Bindings
$('selectBtn').onclick = () => $('fileInput').click();
$('fileInput').onchange = e => handleFiles(e.target.files);

$('dropZone').ondragover = e => {
  e.preventDefault();
  $('dropZone').classList.add('border-blue-500', 'bg-blue-50/10');
};
$('dropZone').ondragleave = e => {
  e.preventDefault();
  $('dropZone').classList.remove('border-blue-500', 'bg-blue-50/10');
};
$('dropZone').ondrop = e => {
  e.preventDefault();
  $('dropZone').classList.remove('border-blue-500', 'bg-blue-50/10');
  handleFiles(e.dataTransfer.files);
};

$('clearBtn').onclick = () => {
  clearAll();
};

// Scroll Slider Chevrons
$('slideLeft').onclick = () => {
  $('cardsSlider').scrollLeft -= 220;
};
$('slideRight').onclick = () => {
  $('cardsSlider').scrollLeft += 220;
};

$('cardsSlider').onscroll = () => {
  updateScrollButtons();
};

function updateScrollButtons() {
  const slider = $('cardsSlider');
  if (slider.scrollWidth > slider.clientWidth) {
    $('slideLeft').classList.toggle('hidden', slider.scrollLeft <= 5);
    $('slideRight').classList.toggle('hidden', slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 5);
  } else {
    $('slideLeft').classList.add('hidden');
    $('slideRight').classList.add('hidden');
  }
}

// Tab Switching
$('tabConverter').onclick = () => switchTab('converter');
$('tabCompressor').onclick = () => switchTab('compressor');
$('tabExif').onclick = () => switchTab('exif');

function switchTab(tab) {
  activeTab = tab;
  
  // Update Tab Styling
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active', 'bg-white', 'dark:bg-slate-800', 'border-t', 'border-x', 'border-slate-200', 'dark:border-slate-800', 'text-orange-500', 'dark:text-orange-400');
    btn.classList.add('text-slate-500', 'hover:text-slate-700', 'dark:text-slate-400', 'dark:hover:text-slate-200');
  });

  const activeBtn = tab === 'converter' ? $('tabConverter') : (tab === 'compressor' ? $('tabCompressor') : $('tabExif'));
  activeBtn.classList.add('active', 'bg-white', 'dark:bg-slate-800', 'border-t', 'border-x', 'border-slate-200', 'dark:border-slate-800', 'text-orange-500', 'dark:text-orange-400');
  activeBtn.classList.remove('text-slate-500', 'hover:text-slate-700', 'dark:text-slate-400', 'dark:hover:text-slate-200');

  // Update Visible Controls
  if (tab === 'converter') {
    $('formatSelectorGroup').classList.remove('hidden');
    $('compressorPanel').classList.add('hidden');
    $('exifPanel').classList.add('hidden');
    $('exifGuidance').classList.add('hidden');
    $('convertBtn').classList.remove('hidden');
    $('convertBtnText').textContent = 'Convert';
  } else if (tab === 'compressor') {
    $('formatSelectorGroup').classList.add('hidden');
    $('compressorPanel').classList.remove('hidden');
    $('exifPanel').classList.add('hidden');
    $('exifGuidance').classList.add('hidden');
    $('convertBtn').classList.remove('hidden');
    $('convertBtnText').textContent = 'Compress';
  } else if (tab === 'exif') {
    $('formatSelectorGroup').classList.add('hidden');
    $('compressorPanel').classList.add('hidden');
    $('convertBtn').classList.add('hidden');
    $('exifGuidance').classList.remove('hidden');
    
    // Auto load EXIF of active card if available
    if (activeExifId !== null) {
      loadExif(activeExifId);
    } else if (files.length > 0) {
      loadExif(files[0].id);
    } else {
      $('exifPanel').classList.add('hidden');
    }
  }
  
  renderCards();
  updateBadge();
}

// Format Selection Pills
document.querySelectorAll('.format-pill').forEach(pill => {
  pill.onclick = () => {
    document.querySelectorAll('.format-pill').forEach(p => {
      p.classList.remove('bg-white', 'dark:bg-slate-800', 'shadow-sm', 'border', 'border-slate-200/50', 'dark:border-slate-800', 'text-slate-800', 'dark:text-white');
      p.classList.add('text-slate-500', 'hover:text-slate-700', 'dark:text-slate-400', 'dark:hover:text-slate-200');
    });
    pill.classList.add('bg-white', 'dark:bg-slate-800', 'shadow-sm', 'border', 'border-slate-200/50', 'dark:border-slate-800', 'text-slate-800', 'dark:text-white');
    pill.classList.remove('text-slate-500', 'hover:text-slate-700', 'dark:text-slate-400', 'dark:hover:text-slate-200');
    
    selectedFormat = pill.getAttribute('data-format');
    
    // For converter mode, changing format resets converted states so user can re-convert
    if (activeTab === 'converter') {
      files.forEach(f => {
        if (f.status === 'converted' || f.status === 'error') {
          f.status = 'ready';
          if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
          f.convertedUrl = null;
          f.convertedBlob = null;
          f.convertedName = null;
        }
      });
      renderCards();
      updateBadge();
    }
  };
});

// Compressor Inputs logic
$('compressQuality').oninput = () => {
  $('compressValue').textContent = $('compressQuality').value + '%';
  resetCompletedCompressions();
};

$('compressFormat').onchange = () => {
  resetCompletedCompressions();
};

$('resizeToggle').onchange = () => {
  $('resizeDimensions').classList.toggle('hidden', !$('resizeToggle').checked);
  resetCompletedCompressions();
};

$('resizeWidth').oninput = () => resetCompletedCompressions();
$('resizeHeight').oninput = () => resetCompletedCompressions();

function resetCompletedCompressions() {
  if (activeTab === 'compressor') {
    files.forEach(f => {
      if (f.status === 'converted' || f.status === 'error') {
        f.status = 'ready';
        if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
        f.convertedUrl = null;
        f.convertedBlob = null;
        f.convertedName = null;
      }
    });
    renderCards();
    updateBadge();
  }
}

// File Processing
function handleFiles(fileList) {
  if (!fileList.length) return;
  
  $('error').classList.add('hidden');
  
  const incomingFiles = Array.from(fileList).filter(f => {
    // Basic type validation (including HEIC types or extension)
    const ext = f.name.split('.').pop().toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'tif', 'heic', 'heif', 'avif', 'ico'];
    if (f.type.startsWith('image/') || validExtensions.includes(ext)) {
      return true;
    }
    showError(`Unsupported file type: ${f.name}`);
    return false;
  });

  // Limit to 20 files
  if (files.length + incomingFiles.length > 20) {
    showError("Maximum of 20 files can be converted at once.");
    return;
  }

  incomingFiles.forEach(f => {
    const fileId = Math.random().toString(36).substring(2, 9);
    const originalUrl = URL.createObjectURL(f);
    
    files.push({
      id: fileId,
      file: f,
      status: 'ready',
      convertedUrl: null,
      convertedBlob: null,
      convertedName: null,
      originalUrl: originalUrl,
      exifData: null,
      error: null
    });
  });

  renderCards();
  updateBadge();
  
  // If EXIF tab is active, inspect the first newly uploaded file
  if (activeTab === 'exif' && files.length > 0) {
    loadExif(files[files.length - 1].id);
  }
}

function removeFile(id) {
  const index = files.findIndex(f => f.id === id);
  if (index !== -1) {
    const item = files[index];
    if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
    if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
    files.splice(index, 1);
  }
  
  if (activeExifId === id) {
    activeExifId = null;
    $('exifPanel').classList.add('hidden');
  }
  
  renderCards();
  updateBadge();
  
  if (activeTab === 'exif' && files.length > 0 && activeExifId === null) {
    loadExif(files[0].id);
  }
}

function clearAll() {
  files.forEach(f => {
    if (f.originalUrl) URL.revokeObjectURL(f.originalUrl);
    if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
  });
  files = [];
  activeExifId = null;
  $('exifPanel').classList.add('hidden');
  $('downloadZipBtn').classList.add('hidden');
  renderCards();
  updateBadge();
}

// Rendering Cards
function renderCards() {
  const slider = $('cardsSlider');
  
  if (files.length === 0) {
    slider.innerHTML = `
      <div id="emptyState" class="w-full flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500 cursor-pointer" onclick="$('fileInput').click()">
        <svg class="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"/>
        </svg>
        <p class="text-sm font-semibold text-slate-600 dark:text-slate-400">Drag & drop your images here</p>
        <p class="text-xs mt-1">or click Select Files above</p>
      </div>
    `;
    updateScrollButtons();
    return;
  }

  slider.innerHTML = files.map(f => {
    const isInspecting = activeTab === 'exif' && activeExifId === f.id;
    let cardOverlay = '';
    
    if (activeTab === 'converter') {
      if (f.status === 'ready') {
        const origExt = f.file.name.split('.').pop().toUpperCase();
        cardOverlay = `
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white select-none">
            <span class="font-bold text-sm tracking-wider uppercase">${origExt}</span>
          </div>
        `;
      } else if (f.status === 'processing') {
        cardOverlay = `
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white select-none">
            <!-- Spinner / Gear -->
            <svg class="w-8 h-8 text-blue-400 animate-spin-slow mb-1.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.241.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.645-.869L9.594 3.94z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span class="text-[10px] font-bold tracking-wider uppercase text-blue-200">PROCESSING...</span>
            <div class="absolute bottom-0 inset-x-0 h-2 bg-blue-900/30 overflow-hidden">
              <div class="h-full w-full bg-blue-500 progress-bar-striped animate-stripes"></div>
            </div>
          </div>
        `;
      } else if (f.status === 'converted') {
        cardOverlay = `
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white select-none">
            <span class="font-bold text-sm tracking-wider uppercase">${f.convertedName.split('.').pop()}</span>
            <button onclick="downloadSingle('${f.id}', event)" class="mt-2.5 px-3.5 py-1.5 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold rounded-lg shadow active:scale-95 transition uppercase tracking-wider">Save</button>
          </div>
        `;
      } else if (f.status === 'error') {
        cardOverlay = `
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/80 text-rose-200 p-2 text-center select-none">
            <svg class="w-6 h-6 text-rose-400 mb-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <span class="text-[9px] font-semibold break-words w-full truncate" title="${f.error}">Failed</span>
          </div>
        `;
      }
    } else if (activeTab === 'compressor') {
      if (f.status === 'ready') {
        const origExt = f.file.name.split('.').pop().toUpperCase();
        cardOverlay = `
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white select-none">
            <span class="font-bold text-sm tracking-wider uppercase">${origExt}</span>
          </div>
        `;
      } else if (f.status === 'processing') {
        cardOverlay = `
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white select-none">
            <svg class="w-8 h-8 text-orange-400 animate-spin-slow mb-1.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.241.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.645-.869L9.594 3.94z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span class="text-[10px] font-bold tracking-wider uppercase text-orange-200">Compressing...</span>
            <div class="absolute bottom-0 inset-x-0 h-2 bg-orange-900/30 overflow-hidden">
              <div class="h-full w-full bg-orange-500 progress-bar-striped animate-stripes"></div>
            </div>
          </div>
        `;
      } else if (f.status === 'converted') {
        cardOverlay = `
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white select-none">
            <span class="font-bold text-[10px] tracking-wider uppercase">Optimized</span>
            <button onclick="downloadSingle('${f.id}', event)" class="mt-2.5 px-3.5 py-1.5 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold rounded-lg shadow active:scale-95 transition uppercase tracking-wider">Save</button>
          </div>
        `;
      } else if (f.status === 'error') {
        cardOverlay = `
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/80 text-rose-200 p-2 text-center select-none">
            <svg class="w-6 h-6 text-rose-400 mb-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <span class="text-[9px] font-semibold truncate w-full" title="${f.error}">Failed</span>
          </div>
        `;
      }
    } else if (activeTab === 'exif') {
      cardOverlay = `
        <div class="absolute top-2 left-2 px-1.5 py-0.5 bg-slate-900/70 border border-slate-700 text-white text-[8px] font-bold rounded uppercase">
          EXIF
        </div>
      `;
    }

    const cardHighlightClass = isInspecting ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-800';

    return `
      <div id="card-${f.id}" onclick="handleCardClick('${f.id}')" class="card-item relative w-36 h-36 flex-shrink-0 snap-start bg-checker border-2 rounded-xl overflow-hidden shadow-sm hover:shadow transition cursor-pointer ${cardHighlightClass}">
        <!-- Thumbnail -->
        <img src="${f.originalUrl}" class="w-full h-full object-cover select-none pointer-events-none" alt="${f.file.name}">
        
        <!-- Top bar overlay -->
        <div class="absolute top-0 inset-x-0 p-2 flex justify-between items-start bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
          <span class="text-[9px] text-white font-semibold truncate max-w-[80px] bg-black/40 px-1.5 py-0.5 rounded-full select-none" title="${f.file.name}">${f.file.name}</span>
        </div>
        
        <!-- Close Button (Need pointer-events-auto to capture clicks since parent top bar is pointer-events-none) -->
        <button onclick="event.stopPropagation(); removeFile('${f.id}')" class="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center bg-black/50 hover:bg-rose-500 text-white rounded-full transition hover:scale-105 active:scale-95 pointer-events-auto">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <!-- Status Action overlays -->
        ${cardOverlay}
      </div>
    `;
  }).join('');
  
  setTimeout(updateScrollButtons, 50);
}

function handleCardClick(id) {
  if (activeTab === 'exif') {
    loadExif(id);
  }
}

// Badge and zip visibility logic
function updateBadge() {
  const pending = files.filter(f => f.status === 'ready').length;
  $('convertBadge').textContent = pending;
  
  // Disable / Enable convert button
  $('convertBtn').disabled = pending === 0;
  $('convertBtn').classList.toggle('opacity-50', pending === 0);
  $('convertBtn').classList.toggle('cursor-not-allowed', pending === 0);
  
  // Show / Hide Download ZIP button
  const convertedCount = files.filter(f => f.status === 'converted').length;
  if (convertedCount > 1 && (activeTab === 'converter' || activeTab === 'compressor')) {
    $('downloadZipBtn').classList.remove('hidden');
  } else {
    $('downloadZipBtn').classList.add('hidden');
  }
}

// Individual Download
window.downloadSingle = (id, event) => {
  if (event) event.stopPropagation();
  const item = files.find(f => f.id === id);
  if (item && item.convertedUrl) {
    const a = document.createElement('a');
    a.href = item.convertedUrl;
    a.download = item.convertedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

// Batch Action (Convert / Compress)
$('convertBtn').onclick = async () => {
  const pendingFiles = files.filter(f => f.status === 'ready');
  if (!pendingFiles.length) return;
  
  $('error').classList.add('hidden');
  $('convertBtn').disabled = true;
  $('convertBtn').classList.add('opacity-50');
  
  // Rotate the icon
  $('convertBtnIcon').classList.add('animate-spin');

  // Convert files one-by-one sequentially
  for (const item of pendingFiles) {
    item.status = 'processing';
    renderCards();
    
    // Auto-scroll to center the currently processing card in the slider
    const cardEl = $(`card-${item.id}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    
    try {
      const fd = new FormData();
      fd.append('files', item.file);
      
      let endpoint = '/api/convert';
      if (activeTab === 'converter') {
        fd.append('format', selectedFormat);
        fd.append('quality', '85');
      } else if (activeTab === 'compressor') {
        let fmt = $('compressFormat').value;
        if (fmt === 'ORIGINAL') {
          const originalExt = item.file.name.split('.').pop().toUpperCase();
          fmt = ['JPG', 'JPEG', 'PNG', 'WEBP', 'AVIF'].includes(originalExt) ? originalExt : 'WEBP';
        }
        fd.append('format', fmt);
        fd.append('quality', $('compressQuality').value);
        
        if ($('resizeToggle').checked) {
          fd.append('width', $('resizeWidth').value || 0);
          fd.append('height', $('resizeHeight').value || 0);
        }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        body: fd
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || 'Server error during conversion');
      }

      const blob = await res.blob();
      const filename = res.headers.get('content-disposition')
        ? res.headers.get('content-disposition').split('filename=')[1]?.replace(/["']/g, '')
        : `${item.file.name.split('.')[0]}_converted.${selectedFormat.toLowerCase()}`;
      
      item.convertedBlob = blob;
      item.convertedUrl = URL.createObjectURL(blob);
      item.convertedName = filename || `${item.file.name.split('.')[0]}_converted.${selectedFormat.toLowerCase()}`;
      item.status = 'converted';
      
    } catch (e) {
      console.error(e);
      item.status = 'error';
      item.error = e.message;
    }
    
    renderCards();
    updateBadge();
  }

  $('convertBtnIcon').classList.remove('animate-spin');
};

// Download ZIP action
$('downloadZipBtn').onclick = async () => {
  const convertedItems = files.filter(f => f.status === 'converted');
  if (convertedItems.length === 0) return;

  $('downloadZipBtn').disabled = true;
  $('downloadZipBtn').classList.add('opacity-50');

  try {
    const zip = new JSZip();
    convertedItems.forEach(item => {
      if (item.convertedBlob) {
        zip.file(item.convertedName, item.convertedBlob);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted_images.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (err) {
    showError('Failed to generate ZIP package: ' + err.message);
  } finally {
    $('downloadZipBtn').disabled = false;
    $('downloadZipBtn').classList.remove('opacity-50');
  }
};

// Metadata (EXIF) tab loader
async function loadExif(id) {
  activeExifId = id;
  const item = files.find(f => f.id === id);
  if (!item) return;

  // Re-render cards to show selection border
  document.querySelectorAll('.card-item').forEach(card => {
    card.classList.remove('border-blue-500', 'ring-2', 'ring-blue-500/20');
    card.classList.add('border-slate-200', 'dark:border-slate-800');
  });
  const currentCard = $(`card-${id}`);
  if (currentCard) {
    currentCard.classList.remove('border-slate-200', 'dark:border-slate-800');
    currentCard.classList.add('border-blue-500', 'ring-2', 'ring-blue-500/20');
  }

  $('exifGuidance').classList.add('hidden');
  $('exifPanel').classList.remove('hidden');
  
  $('exifTitle').textContent = `Metadata: ${item.file.name}`;
  $('exifTableBody').innerHTML = `
    <tr>
      <td colspan="2" class="py-4 text-center text-slate-400">
        <svg class="w-5 h-5 text-slate-400 animate-spin mx-auto mb-1.5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Reading metadata...
      </td>
    </tr>
  `;

  if (item.exifData) {
    displayExifTable(item.exifData);
    return;
  }

  try {
    const fd = new FormData();
    fd.append('files', item.file);
    
    const res = await fetch('/api/exif', {
      method: 'POST',
      body: fd
    });
    
    if (!res.ok) {
      throw new Error('Failed to retrieve EXIF data');
    }
    
    const data = await res.json();
    item.exifData = data;
    displayExifTable(data);
  } catch (err) {
    console.error(err);
    // Display basic data if server fetch failed
    const fallbackData = {
      'Filename': item.file.name,
      'File Size': (item.file.size / 1024).toFixed(1) + ' KB',
      'Format': item.file.type.split('/')[1]?.toUpperCase() || 'Unknown',
      'Error': 'Failed to read detailed EXIF tags'
    };
    displayExifTable(fallbackData);
  }
}

function displayExifTable(data) {
  let rows = [];
  
  // Basic properties
  const basicKeys = ['Filename', 'Format', 'Mode', 'Size', 'File Size'];
  basicKeys.forEach(k => {
    if (data[k]) {
      rows.push(`
        <tr class="hover:bg-slate-100/30 dark:hover:bg-slate-800/20">
          <td class="py-2.5 font-semibold text-slate-500 dark:text-slate-400 capitalize">${k}</td>
          <td class="py-2.5 truncate max-w-[200px]" title="${data[k]}">${data[k]}</td>
        </tr>
      `);
    }
  });

  // Detailed EXIF sub properties
  if (data.EXIF && Object.keys(data.EXIF).length > 0) {
    rows.push(`
      <tr class="bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800">
        <td colspan="2" class="py-1.5 font-bold text-[10px] text-slate-400 dark:text-slate-500 tracking-wider uppercase">Camera & Capture Info</td>
      </tr>
    `);
    
    for (const [key, val] of Object.entries(data.EXIF)) {
      rows.push(`
        <tr class="hover:bg-slate-100/30 dark:hover:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
          <td class="py-2.5 font-medium text-slate-400 dark:text-slate-500">${key}</td>
          <td class="py-2.5 truncate max-w-[200px]" title="${val}">${val}</td>
        </tr>
      `);
    }
  } else if (data.Error) {
    rows.push(`
      <tr class="border-t border-slate-200 dark:border-slate-800">
        <td class="py-2.5 font-semibold text-rose-500">Notice</td>
        <td class="py-2.5 text-slate-400 italic">${data.Error}</td>
      </tr>
    `);
  } else {
    rows.push(`
      <tr class="border-t border-slate-200 dark:border-slate-800">
        <td colspan="2" class="py-3 text-slate-400 text-center italic">No photographic EXIF metadata found in this image.</td>
      </tr>
    `);
  }

  $('exifTableBody').innerHTML = rows.join('');
}

// Error Helpers
function showError(msg) {
  $('error').textContent = msg;
  $('error').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
