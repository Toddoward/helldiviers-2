document.addEventListener('DOMContentLoaded', async () => {
  // --- 기존 UI 요소 참조 ---
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

  // --- 기존 초기 설정 로직 ---
  const manifestData = chrome.runtime.getManifest();
  versionDisplay.innerText = `SEAF Assistant v${manifestData.version}`;

  const iconUrl = chrome.runtime.getURL('icons/icon128.png');
  document.documentElement.style.setProperty('--seaf-icon-url', `url("${iconUrl}")`);

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
  if (typeof SEAF_CONFIG !== 'undefined') {
    Object.keys(SEAF_CONFIG.CATEGORIES).forEach(key => {
      const c = SEAF_CONFIG.CATEGORIES[key];
      const btn = document.createElement('div');
      btn.className = `category-btn ${currentSettings.category === key ? 'active' : ''}`;
      btn.innerHTML = `<span>${c.name}</span><br><span>${c.emoji}</span>`;
      btn.onclick = () => selectCategory(key);
      categoryGrid.appendChild(btn);
    });
    if (currentSettings.category) selectCategory(currentSettings.category);
  }

  function selectCategory(key) {
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

  // 저장 버튼
  saveBtn.onclick = () => {
    if (!steamInput.value.includes('steamcommunity.com') && steamInput.value.trim() !== "") {
      showStatus("STEAM URL 확인 요망", "error");
      return;
    }

    currentSettings.steamUrl = steamInput.value;
    currentSettings.isDetectionActive = detectionToggle.checked;
    currentSettings.customContent = customContentInput.value;

    chrome.storage.local.set({ seaf_settings: currentSettings }, () => {
      showStatus("DEPLOYED", "success");
      // 통합된 background 알람 시스템에 신호 전달
      chrome.runtime.sendMessage({ type: "SETTINGS_UPDATED" });
    });
  };

  function showStatus(msg, type) {
    statusEl.innerText = msg;
    statusEl.className = type;
    setTimeout(() => { statusEl.innerText = ""; }, 2500);
  }

  // --- TEST SYSTEM START (삭제 예정) ---
  const logDisplay = document.getElementById('test-log-display');
  const linkList = document.getElementById('test-link-list');

  // 로그 및 링크 업데이트 함수
  const updateTestUI = async () => {
    const data = await chrome.storage.local.get(['systemLogs', 'testLobbyLinks']);
    
    // 로그 렌더링
    if (data.systemLogs) {
      logDisplay.innerHTML = data.systemLogs.map(log => 
        `<div><span style="color:#888">[${log.time}]</span> ${log.msg}</div>`
      ).join('');
      logDisplay.scrollTop = 0; // 최신 로그 상단 고정
    }

    // 링크 렌더링
    if (data.testLobbyLinks && data.testLobbyLinks.length > 0) {
      linkList.innerHTML = data.testLobbyLinks.map(link => 
        `<div style="margin-bottom:5px; border-bottom:1px solid #ccc; padding-bottom:3px;">
          ID: ${link.postId} <br>
          <a href="${link.lobby}" target="_blank" style="color:blue;">[JOIN LOBBY]</a>
         </div>`
      ).join('');
    } else {
      linkList.innerText = "발견된 링크 없음";
    }
  };

  // 초기 로드 시 실행
  updateTestUI();

  // 스토리지 변경 감지
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.systemLogs || changes.testLobbyLinks) {
      updateTestUI();
    }
  });
  // --- TEST SYSTEM END ---
});