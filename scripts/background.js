/**
 * Project SEAF - Background Service Worker
 * 최적화: 헬망호 필터링 URL 사용 및 실시간 감지
 */

let pollingInterval = null;
let lastSeenPostId = null;

const MANGHO_LIST_URL = "https://gall.dcinside.com/mgallery/board/lists/?id=helldiversseries&sort_type=N&search_head=60";

async function fetchSteamLobby(profileUrl) {
  try {
    const response = await fetch(profileUrl);
    if (!response.ok) return null;
    const html = await response.text();
    const lobbyRegex = /<div class="profile_in_game_joingame">[\s\S]*?<a href="(steam:\/\/joinlobby\/\d+\/\d+\/\d+)"/;
    const match = html.match(lobbyRegex);
    return match ? match[1] : null;
  } catch (e) {
    console.error("SEAF Steam Fetch Error:", e);
    return null;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_LOBBY_LINK") {
    fetchSteamLobby(request.url).then(link => sendResponse({ link }));
    return true; 
  }
  if (request.type === "SETTINGS_UPDATED") {
    startPolling();
  }
});

async function startPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  
  const { seaf_settings: s } = await chrome.storage.local.get(['seaf_settings']);
  if (!s?.isDetectionActive) return;

  const intervalTime = (s.pollingInterval || 10) * 1000;

  pollingInterval = setInterval(async () => {
    try {
        // 1. 활성 탭 하나만 찾는 게 아니라, 갤러리가 열린 모든 탭을 쿼리
        const tabs = await chrome.tabs.query({ url: "*://gall.dcinside.com/mgallery/board/*id=helldiversseries*" });
        
        // 탭이 하나도 없으면 감지할 이유가 없으므로 리턴 (이건 유지하되, 타겟을 탭 리스트로 변경)
        if (tabs.length === 0) return;

        const res = await fetch(MANGHO_LIST_URL);
        const html = await res.text();
        // ... (파싱 로직 동일) ...

        if (firstPost) {
            const currentId = firstPost.getAttribute('data-no');
            
            // [중요] 처음 실행 시 undefined 상태면 현재 글번호를 바로 저장하고 다음 턴을 기다림
            if (!lastSeenPostId) {
                lastSeenPostId = currentId;
                return;
            }

            // 새 글 감지 시
            if (parseInt(currentId) > parseInt(lastSeenPostId)) {
                const title = firstPost.querySelector('.gall_tit a')?.innerText.trim();
                
                // 발견된 모든 탭에 메시지 전송 (브로드캐스팅)
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { 
                        type: "SHOW_SEAF_NOTIFICATION", 
                        postId: currentId, 
                        title 
                    }).catch(() => { /* 탭이 닫히거나 응답 안 해도 에러 무시 */ });
                });
                
                lastSeenPostId = currentId;
            }
        }
    } catch (e) {
        // 에러 발생 시 폴링 중단되지 않게 처리
    }
  }, intervalTime);
}

startPolling();