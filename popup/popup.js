document.addEventListener('DOMContentLoaded', async () => {
  const versionDisplay = document.getElementById('version-display');
  const steamInput = document.getElementById('steam-url');
  const detectionToggle = document.getElementById('detection-toggle');
  const pollingSlider = document.getElementById('polling-slider');
  const pollingValue = document.getElementById('polling-value');
  const categoryGrid = document.getElementById('category-grid');
  const dynamicArea = document.getElementById('dynamic-area');
  const diffGrid = document.getElementById('difficulty-grid');
  const subtagGrid = document.getElementById('subtag-grid');
  const diffGroup = document.getElementById('difficulty-group');
  const customTitleInput = document.getElementById('custom-title');
  const customContentInput = document.getElementById('custom-content');
  const saveBtn = document.getElementById('save-settings-btn');
  const statusEl = document.getElementById('save-status');

  const manifestData = chrome.runtime.getManifest();
  versionDisplay.innerText = `SYSTEM v${manifestData.version}`;

  const iconUrl = chrome.runtime.getURL('icons/icon128.png');
  document.documentElement.style.setProperty('--seaf-icon-url', `url("${iconUrl}")`);

  // 1. 초기값 설정 (문제 1 해결)
  let currentSettings = {
    steamUrl: '',
    pollingInterval: 5,
    isDetectionActive: true,
    category: '',
    difficulty: '',
    subTag: '',
    customTitle: '',
    customContent: ''
  };

  const saved = await chrome.storage.local.get(['seaf_settings']);
  if (saved.seaf_settings) {
    currentSettings = { ...currentSettings, ...saved.seaf_settings };
  }

  // UI 반영
  steamInput.value = currentSettings.steamUrl || '';
  detectionToggle.checked = currentSettings.isDetectionActive;
  pollingSlider.value = currentSettings.pollingInterval;
  pollingValue.innerText = `${currentSettings.pollingInterval}s`;
  customContentInput.value = currentSettings.customContent || '';

  // 슬라이더 이벤트
  pollingSlider.oninput = (e) => {
    pollingValue.innerText = `${e.target.value}s`;
    currentSettings.pollingInterval = parseInt(e.target.value);
  };

  // 카테고리 렌더링
  Object.keys(SEAF_CONFIG.CATEGORIES).forEach(key => {
    const c = SEAF_CONFIG.CATEGORIES[key];
    const btn = document.createElement('div');
    btn.className = `category-btn ${currentSettings.category === key ? 'active' : ''}`;
    btn.innerHTML = `<span>${c.name}</span><br><span>${c.emoji}</span>`;
    btn.onclick = () => selectCategory(key);
    categoryGrid.appendChild(btn);
  });

  if (currentSettings.category) selectCategory(currentSettings.category);

  function selectCategory(key) {
    // 문제 2 해결: 종족 변경 시 세부 태그 초기화
    if (currentSettings.category !== key) {
        currentSettings.subTag = ''; 
    }
    
    currentSettings.category = key;
    const cData = SEAF_CONFIG.CATEGORIES[key];

    Array.from(categoryGrid.children).forEach((btn, idx) => {
      btn.classList.toggle('active', Object.keys(SEAF_CONFIG.CATEGORIES)[idx] === key);
    });

    dynamicArea.style.display = 'block';
    
    if (cData.hasDifficulty) {
      diffGroup.style.display = 'block';
      renderDifficulty();
    } else {
      diffGroup.style.display = 'none';
      currentSettings.difficulty = '';
    }

    renderSubTags(key);
    updateLivePreview();
  }

  function renderDifficulty() {
    diffGrid.innerHTML = '';
    // tags.css의 #difficulty-grid 스타일을 타도록 설정
    SEAF_CONFIG.DIFFICULTIES.forEach(d => {
      const btn = document.createElement('div');
      btn.className = `tag-btn ${currentSettings.difficulty == d ? 'active' : ''}`;
      btn.innerText = d; 
      btn.onclick = () => {
        currentSettings.difficulty = d;
        renderDifficulty();
        updateLivePreview();
      };
      diffGrid.appendChild(btn);
    });
  }

  function renderSubTags(key) {
    subtagGrid.innerHTML = '';
    const tags = SEAF_CONFIG.CATEGORIES[key].tags || [];
    if (tags.length === 0) {
      subtagGrid.parentElement.style.display = 'none';
      return;
    }
    subtagGrid.parentElement.style.display = 'block';
    tags.forEach(t => {
      const btn = document.createElement('div');
      btn.className = `tag-btn ${currentSettings.subTag === t ? 'active' : ''}`;
      btn.innerText = t;
      btn.onclick = () => {
        currentSettings.subTag = (currentSettings.subTag === t) ? '' : t;
        renderSubTags(key);
        updateLivePreview();
      };
      subtagGrid.appendChild(btn);
    });
  }

  function updateLivePreview() {
    if (!currentSettings.category) return;
    const c = SEAF_CONFIG.CATEGORIES[currentSettings.category];
    const target = currentSettings.subTag || c.name;
    const diffText = currentSettings.difficulty ? `${currentSettings.difficulty}단` : '';
    
    const title = SEAF_CONFIG.TEMPLATES.title
      .replace('{emoji}', c.emoji).replace('{target}', target).replace('{diff}', diffText)
      .replace(/\s+/g, ' ').trim();
    
    customTitleInput.value = title;
    currentSettings.customTitle = title;
  }

  // 문제 5 해결: 데이터 유효성 검사 및 저장 피드백
  saveBtn.onclick = () => {
    if (!steamInput.value.includes('steamcommunity.com')) {
      showStatus("STEAM URL 확인 요망", "error");
      return;
    }

    currentSettings.steamUrl = steamInput.value;
    currentSettings.isDetectionActive = detectionToggle.checked;
    currentSettings.customContent = customContentInput.value;

    chrome.storage.local.set({ seaf_settings: currentSettings }, () => {
      showStatus("DEPLOYED", "success");
      // 백그라운드에 즉시 알림 (선택 사항)
      chrome.runtime.sendMessage({ type: "SETTINGS_UPDATED" });
    });
  };

  function showStatus(msg, type) {
    statusEl.innerText = msg;
    statusEl.className = type;
    setTimeout(() => { statusEl.innerText = ""; }, 2500);
  }
});