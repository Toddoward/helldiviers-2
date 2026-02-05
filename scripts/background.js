/**
 * Project SEAF - Background Service Worker
 * 핵심 로직: 실시간 글 감시, 스팀 로비 파싱, 알림 전송
 */

let pollingTimer = null;
let lastSeenPostId = null;

// 1. 초기화 및 리스너 등록
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['seaf_settings'], (result) => {
    if (!result.seaf_settings) {
      chrome.storage.local.set({ 
        seaf_settings: { 
          isDetectionActive: true, 
          pollingInterval: 5,
          steamUrl: ''
        } 
      });
    }
  });
  startPolling();
});

// 팝업에서 설정 변경 시 즉시 반영
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SETTINGS_UPDATED") {
    startPolling();
  }
});

/**
 * 폴링 시작 함수
 */
async function startPolling() {
  if (pollingTimer) clearInterval(pollingTimer);
  
  const saved = await chrome.storage.local.get(['seaf_settings']);
  const settings = saved.seaf_settings || { isDetectionActive: true, pollingInterval: 5 };

  if (!settings.isDetectionActive) {
    console.log("SEAF: Detection is inactive.");
    return;
  }

  const interval = (settings.pollingInterval || 5) * 1000;
  
  pollingTimer = setInterval(async () => {
    await checkNewMangho();
  }, interval);
  
  console.log(`SEAF: Polling started with ${settings.pollingInterval}s interval.`);
}

/**
 * 갤러리 목록 확인 및 새 글 감지
 */
async function checkNewMangho() {
  try {
    const response = await fetch("https://gall.dcinside.com/mgallery/board/lists/?id=helldiversseries");
    const html = await response.text();
    
    // 헬다이버즈 갤러리 특성상 '망호' 키워드가 포함된 최신 글 ID 추출
    const postMatch = html.match(/class="us-post"[^>]*data-no="(\d+)"/);
    if (!postMatch) return;

    const currentTopId = postMatch[1];

    // 새로운 글이 올라왔을 때만 처리
    if (lastSeenPostId && currentTopId !== lastSeenPostId) {
      // 제목에 '망호' 혹은 '모집'이 포함되어 있는지 간이 확인 (정규식은 사이트 구조에 맞게 최적화)
      if (html.includes("망호") || html.includes("모집")) {
        await processNewPost(currentTopId);
      }
    }
    lastSeenPostId = currentTopId;
  } catch (error) {
    console.error("SEAF Polling Error:", error);
  }
}

/**
 * 새 글에서 스팀 로비 링크 추출 및 알림
 */
async function processNewPost(postId) {
  try {
    const postUrl = `https://gall.dcinside.com/mgallery/board/view/?id=helldiversseries&no=${postId}`;
    const response = await fetch(postUrl);
    const html = await response.text();

    // 스팀 로비 링크 정규식 (steam://joinlobby/...)
    const lobbyRegex = /steam:\/\/joinlobby\/\d+\/\d+\/\d+/;
    const lobbyMatch = html.match(lobbyRegex);

    if (lobbyMatch) {
      const lobbyLink = lobbyMatch[0];
      
      // 시스템 알림 전송
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '../icons/icon128.png',
        title: '신규 망호 감지!',
        message: '새로운 헬다이버즈 망호가 포착되었습니다. 클릭하여 합류하세요.',
        priority: 2
      });

      // 알림 클릭 시 스팀 링크 실행 또는 갤러리 이동은 별도 리스너에서 처리
      // 콘텐츠 스크립트에 알림 (오류 가드 적용)
      const tabs = await chrome.tabs.query({ url: "*://gall.dcinside.com/mgallery/board/lists/?id=helldiversseries*" });
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { 
          type: "NEW_MANGHO_DETECTED", 
          url: postUrl, 
          lobby: lobbyLink 
        }, () => {
          if (chrome.runtime.lastError) { /* 수신자 없음 무시 */ }
        });
      });
    }
  } catch (error) {
    console.error("SEAF Process Error:", error);
  }
}

// 초기 실행
startPolling();