document.addEventListener('DOMContentLoaded', async () => {
  const steamInput = document.getElementById('steam-url');
  const categoryGrid = document.getElementById('category-grid');
  const dynamicArea = document.getElementById('dynamic-area');
  const diffGrid = document.getElementById('difficulty-grid');
  const subtagGrid = document.getElementById('subtag-grid');
  const statusEl = document.getElementById('save-status');
  const versionEl = document.querySelector('.version-info');

  // 커스텀 입력 필드 및 저장 버튼 참조
  const customTitleInput = document.getElementById('custom-title');
  const customContentInput = document.getElementById('custom-content');
  const saveBtn = document.getElementById('save-settings-btn');

  let currentSettings = {
    steamUrl: '',
    category: '',
    difficulty: '',
    subTag: '',
    customTitle: '',
    customContent: '',
    isAutoTitle: true // 자동 제목 생성 여부 추적
  };

  // 1. Manifest에서 버전 정보 가져오기
  try {
    const manifest = chrome.runtime.getManifest();
    if (versionEl && manifest.version) {
      versionEl.innerText = `SYSTEM v${manifest.version}`;
    }
  } catch (e) {
    console.log("Version info not available");
  }

  // 2. 저장된 설정 불러오기
  const saved = await chrome.storage.local.get(['seaf_settings']);
  if (saved.seaf_settings) {
    currentSettings = { ...currentSettings, ...saved.seaf_settings };
    steamInput.value = currentSettings.steamUrl || '';
    customTitleInput.value = currentSettings.customTitle || '';
    customContentInput.value = currentSettings.customContent || '';
    customTitleInput.dataset.auto = currentSettings.isAutoTitle ? "true" : "false";
  }

  // 3. 카테고리 초기화
  Object.entries(CONFIG.CATEGORIES).forEach(([id, data]) => {
    const btn = document.createElement('div');
    btn.className = `btn ${currentSettings.category === id ? 'active' : ''}`;
    btn.innerHTML = `<span>${data.emoji}</span><span>${data.name}</span>`;
    btn.onclick = () => selectCategory(id);
    categoryGrid.appendChild(btn);
  });

  // 4. 선택 로직
  function selectCategory(id) {
    currentSettings.category = id;
    currentSettings.subTag = ''; 
    
    Array.from(categoryGrid.children).forEach((child, idx) => {
      const categoryId = Object.keys(CONFIG.CATEGORIES)[idx];
      child.classList.toggle('active', categoryId === id);
    });

    const categoryData = CONFIG.CATEGORIES[id];
    
    if (id === 'CREDIT_RUN' || (!categoryData.hasDifficulty && categoryData.tags.length === 0)) {
      dynamicArea.style.display = 'none';
    } else {
      renderDynamicOptions(categoryData);
      dynamicArea.style.display = 'block';
      dynamicArea.classList.remove('fade-in');
      void dynamicArea.offsetWidth; 
      dynamicArea.classList.add('fade-in');
    }
    
    updateLivePreview();
  }

  function renderDynamicOptions(data) {
    // 난이도
    diffGrid.innerHTML = '';
    if (data.hasDifficulty) {
      document.getElementById('difficulty-group').style.display = 'block';
      CONFIG.DIFFICULTIES.forEach(d => {
        const btn = document.createElement('div');
        btn.className = `tag-btn ${currentSettings.difficulty === d ? 'active' : ''}`;
        btn.innerText = d;
        btn.onclick = () => {
          currentSettings.difficulty = d;
          Array.from(diffGrid.children).forEach(c => c.classList.toggle('active', c.innerText === d));
          updateLivePreview();
        };
        diffGrid.appendChild(btn);
      });
    } else {
      document.getElementById('difficulty-group').style.display = 'none';
    }

    // 세부 태그
    subtagGrid.innerHTML = '';
    if (data.tags.length > 0) {
      document.getElementById('subtag-group').style.display = 'block';
      data.tags.forEach(t => {
        const btn = document.createElement('div');
        btn.className = `tag-btn ${currentSettings.subTag === t ? 'active' : ''}`;
        btn.innerText = t;
        btn.onclick = () => {
          currentSettings.subTag = t;
          Array.from(subtagGrid.children).forEach(c => c.classList.toggle('active', c.innerText === t));
          updateLivePreview();
        };
        subtagGrid.appendChild(btn);
      });
    } else {
      document.getElementById('subtag-group').style.display = 'none';
    }
  }

  // 5. 프리뷰/커스텀 입력 업데이트 로직
  function updateLivePreview() {
    if (!currentSettings.category) return;

    const cat = CONFIG.CATEGORIES[currentSettings.category];
    const target = currentSettings.subTag || cat.name;
    const diffText = currentSettings.difficulty ? `${currentSettings.difficulty}단` : "";
    
    // 기본 템플릿 기반 자동 생성
    const autoTitle = CONFIG.DEFAULT_TEMPLATE.title
      .replace('{emoji}', cat.emoji)
      .replace('{target}', target)
      .replace('{diff}', diffText).trim();

    // 사용자가 직접 수정한 적이 없다면(isAutoTitle이 true라면) 자동 생성값으로 채움
    if (customTitleInput.dataset.auto === "true") {
      customTitleInput.value = autoTitle;
      currentSettings.customTitle = autoTitle;
    }
  }

  // 6. 저장 기능
  function saveSettings() {
    currentSettings.steamUrl = steamInput.value;
    currentSettings.customTitle = customTitleInput.value;
    currentSettings.customContent = customContentInput.value;
    currentSettings.isAutoTitle = customTitleInput.dataset.auto === "true";

    chrome.storage.local.set({ seaf_settings: currentSettings }, () => {
      statusEl.innerText = 'DATA SAVED';
      saveBtn.innerText = '저장 완료';
      saveBtn.style.background = '#2e7d32'; // 성공 시 초록색 피드백
      
      setTimeout(() => { 
        statusEl.innerText = ''; 
        saveBtn.innerText = '설정 저장';
        saveBtn.style.background = ''; // 원래 색상으로 복구
      }, 1500);
    });
  }

  // 이벤트 리스너
  saveBtn.addEventListener('click', saveSettings);
  
  customTitleInput.addEventListener('input', () => {
    customTitleInput.dataset.auto = "false"; // 수동 수정 시 자동 업데이트 중단
  });

  if (currentSettings.category) {
    selectCategory(currentSettings.category);
  }
});