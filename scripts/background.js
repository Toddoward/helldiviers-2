/**
 * Project SEAF - Background Service Worker
 * [통합 버전] Alarms API 기반 실시간 감지 및 상세 본문 검사 엔진
 */

let lastCheckedPostId = null;
const MANGHO_LIST_URL = "https://gall.dcinside.com/mgallery/board/lists/?id=helldiversseries&sort_type=N&search_head=60";

// --- TEST SYSTEM START (삭제 예정) ---
/**
 * 테스트용 로그 기록 함수
 */
async function addLog(message) {
    try {
        const data = await chrome.storage.local.get(['systemLogs']);
        const logs = data.systemLogs || [];
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        const newLogs = [`[${timeStr}] ${message}`, ...logs].slice(0, 100); 
        await chrome.storage.local.set({ systemLogs: newLogs });
        console.log(`[SEAF LOG] ${message}`);
    } catch (e) {
        console.error("Log Error:", e);
    }
}

/**
 * 감지된 링크 스토리지 저장 (팝업 출력용)
 */
async function saveLink(link, title) {
    const data = await chrome.storage.local.get(['testLobbyLinks']);
    let list = data.testLobbyLinks || [];
    if (!list.some(item => item.link === link)) {
        list.unshift({
            time: new Date().toLocaleTimeString(),
            title: title,
            link: link
        });
        if (list.length > 15) list.pop();
        await chrome.storage.local.set({ testLobbyLinks: list });
    }
}

/**
 * 팝업에서의 UI 테스트 요청 처리
 */
async function sendTestNotification() {
    const testTitle = "[TEST] 샘플 망호 테스트 알림";
    const testLink = "steam://joinlobby/553850/1234567890/1234567890";
    
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
            type: "SEAF_NEW_LOBBY",
            title: testTitle,
            link: testLink
        }).catch(() => {
            addLog("❌ 테스트 알림 송신 실패 (컨텐츠 스크립트 미실행 탭)");
        });
        addLog("🚀 현재 활성 탭에 테스트 UI 신호 송신 완료");
    }
}
// --- TEST SYSTEM END ---

/**
 * 상세 페이지 탐색 및 로비 링크 확인
 */
async function processPost(postId, title) {
    try {
        const viewUrl = `https://gall.dcinside.com/mgallery/board/view/?id=helldiversseries&no=${postId}`;
        const detailRes = await fetch(viewUrl);
        const detailHtml = await detailRes.text();
        
        // 상세 본문에서 스팀 로비 링크 추출
        const lobbyMatch = detailHtml.match(/steam:\/\/joinlobby\/\d+\/\d+\/\d+/);
        
        if (lobbyMatch) {
            const lobbyLink = lobbyMatch[0];
            await addLog(`✅ [새 망호] ${title.substring(0, 15)}... | 로비 발견`);
            
            // 테스트 시스템 기록
            await saveLink(lobbyLink, title);

            // 모든 탭에 알림 전송 (새로운 통합 타입 SEAF_NEW_LOBBY 사용)
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
                chrome.tabs.sendMessage(tab.id, {
                    type: "SEAF_NEW_LOBBY",
                    title: title,
                    link: lobbyLink
                }).catch(() => {});
            }
            return true;
        } else {
            await addLog(`❌ 로비링크 없음: ${title.substring(0, 15)}...`);
            return false;
        }
    } catch (e) {
        await addLog(`❌ 상세 페이지 오류 (${postId}): ${e.message}`);
        return false;
    }
}

/**
 * 실시간 감지 핵심 로직 (Alarms에 의해 호출)
 */
async function performDetection() {
    try {
        // 1단계: 활성화 체크
        const { seaf_settings: s } = await chrome.storage.local.get(['seaf_settings']);
        if (!s?.isDetectionActive) return;

        // 2단계: 자원 최적화 (갤러리 탭 존재 확인)
        const tabs = await chrome.tabs.query({ url: "*://gall.dcinside.com/mgallery/board/*id=helldiversseries*" });
        if (tabs.length === 0) return;

        // 3단계: 목록 탐색
        const res = await fetch(MANGHO_LIST_URL);
        const html = await res.text();
        
        // 게시글 추출 정규식 (공지사항 제외 로직 포함)
        const postRegex = /<tr[^>]*data-no="(\d+)"[^>]*>[\s\S]*?<td class="gall_tit[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/g;
        const matches = [...html.matchAll(postRegex)];
        
        const currentPosts = matches
            .filter(m => !m[0].includes('icon_notice'))
            .map(m => ({
                id: parseInt(m[1]),
                title: m[2].replace(/<[^>]*>?/gm, '').trim()
            }));

        if (currentPosts.length === 0) return;

        // 기준점 설정
        if (lastCheckedPostId === null) {
            lastCheckedPostId = currentPosts[0].id;
            addLog(`탐색 시작: 기준 ID 설정 (${lastCheckedPostId})`);
            return;
        }

        // 새 글 필터링
        const newPosts = currentPosts.filter(p => p.id > lastCheckedPostId);
        if (newPosts.length === 0) return;

        addLog(`새 게시글 ${newPosts.length}개 감지. 상세 분석 시작...`);

        // 상세 본문 검사 (역순으로 최신글부터)
        for (const post of [...newPosts].reverse()) {
            await processPost(post.id, post.title);
        }

        // 마지막 확인 ID 업데이트
        lastCheckedPostId = currentPosts[0].id;

    } catch (e) {
        addLog(`❌ 탐색 엔진 에러: ${e.message}`);
    }
}

/**
 * 알람 설정 및 리스너
 */
async function setupAlarm() {
    const { seaf_settings: s } = await chrome.storage.local.get(['seaf_settings']);
    await chrome.alarms.clear("MANGHO_DETECTION");

    if (s?.isDetectionActive) {
        const periodInMinutes = Math.max(0.1, (s.pollingInterval || 5) / 60); 
        chrome.alarms.create("MANGHO_DETECTION", { periodInMinutes });
        addLog(`[시스템] 엔진 가동 (주기: ${s.pollingInterval}초)`);
    } else {
        addLog("[시스템] 엔진 중지됨");
    }
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "MANGHO_DETECTION") performDetection();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "SETTINGS_UPDATED") setupAlarm();
    if (request.type === "TEST_NOTIFICATION_UI") sendTestNotification();
    
    // 기존 스팀 로비 링크 수동 추출 (글쓰기 페이지용)
    if (request.type === "GET_LOBBY_LINK") {
        fetch(request.url).then(r => r.text()).then(html => {
            const lobbyRegex = /steam:\/\/joinlobby\/\d+\/\d+\/\d+/;
            const match = html.match(lobbyRegex);
            sendResponse({ link: match ? match[0] : null });
        });
        return true; 
    }
});

// 초기 구동
setupAlarm();