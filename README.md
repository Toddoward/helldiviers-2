# 🌎 SEAF Assistant

> **헬다이버즈 시리즈 갤러리 망호 실시간 감지 및 자동 참여 Chrome 확장 프로그램**

디시인사이드 헬다이버즈 시리즈 갤러리에서 "헬망호"(멀티플레이 모집 게시글)를 실시간으로 감지하고, Steam 로비 링크를 자동으로 추출하여 원클릭 참여를 지원하는 확장 프로그램입니다.

[메인 UI 스크린샷 - popup.html 화면]

---

## ✨ 주요 기능

### 🔔 실시간 망호 감지
- 사용자 설정 간격(1~30초)으로 갤러리 폴링
- 신규 망호 게시글 자동 감지
- Steam 로비 링크 자동 추출

[토스트 알림 스크린샷]

### ⚡ 즉시 참여
- 토스트 알림으로 신규 망호 알림
- 게시글 조회 및 Steam 로비 즉시 참가 버튼
- 목록 페이지 빠른 참여 버튼

[빠른 참여 버튼 스크린샷]

### ✍️ 게시글 자동 완성
- 진영/난이도/특수작전 태그 선택
- 말머리, 제목, 본문 자동 입력
- Steam 프로필 연동 로비 링크 삽입

[자동완성 기능 스크린샷]

### ⚙️ 세부 설정
- Auto Detection ON/OFF
- 폴링 간격 조정 (1~30초)
- 토스트 알림 지속 시간 (3~30초)

[설정 화면 스크린샷]

---

## 📦 설치 방법

### 방법 1: GitHub Releases (권장)
1. [**Releases 페이지**](../../releases)로 이동
2. 최신 버전의 `SEAF-Assistant-v{version}.crx` 다운로드
3. Chrome 주소창에 `chrome://extensions/` 입력
4. **개발자 모드** 활성화 (우측 상단 토글)
5. `.crx` 파일을 페이지에 **드래그 앤 드롭**
6. 나타나는 팝업에서 **확장 프로그램 추가** 클릭

> ⚠️ **보안 경고**: Chrome 정책상 Web Store 외부 확장 프로그램 설치 시 경고가 표시됩니다. 이는 정상이며, 소스코드를 직접 검토하실 수 있습니다.

### 방법 2: 소스코드 설치
1. [**Releases 페이지**](../../releases)에서 `Source code (zip)` 다운로드
2. 압축 해제
3. Chrome 주소창에 `chrome://extensions/` 입력
4. **개발자 모드** 활성화
5. **압축해제된 확장 프로그램을 로드합니다** 클릭
6. 압축 해제한 폴더 선택

### Chrome Web Store (예정)
```
Chrome Web Store 정식 배포 예정
```

---

## 🛠️ 기술 스택

### Core
- **Chrome Extension Manifest V3**
- **Vanilla JavaScript** (ES6+)
- **HTML5 / CSS3**

### Chrome APIs
- `chrome.storage.local` - 설정 저장
- `chrome.alarms` - 주기적 폴링
- `chrome.tabs` - 탭 간 메시징
- `chrome.runtime` - 백그라운드 통신

### 주요 기술
- **Service Worker** (background.js) - 백그라운드 폴링 엔진
- **Content Script** (content.js) - DOM 조작 및 UI 주입
- **Fetch API** - 게시글 크롤링 및 Steam 프로필 파싱

---

## 📁 프로젝트 구조

```
SEAF-Assistant/
├── manifest.json           # Extension 설정 파일
├── tags.js                 # 카테고리/난이도 데이터
├── styles.css              # 통합 스타일시트
│
├── /scripts
│   ├── background.js       # 실시간 감지 엔진
│   └── content.js          # DOM 조작 & 토스트 알림
│
├── /popup
│   ├── popup.html          # 메인 설정 UI
│   ├── settings.html       # 확장 프로그램 설정
│   └── popup.js            # 설정 페이지 컨트롤러
│
└── /icons
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    ├── icon64.png
    └── icon128.png
```

---

## 🔧 주요 구성 요소

### 1️⃣ Background Service Worker (`background.js`)
```javascript
// 실시간 폴링 엔진
chrome.alarms.create("SEAF_DETECTION", { periodInMinutes: 0.1 });

// 신규 게시글 감지 → Steam 링크 추출 → 탭에 메시지 전송
```

**역할**:
- 헬다이버즈 갤러리 망호 목록 크롤링
- 신규 게시글 감지 (`lastSeenPostId` 기반 중복 방지)
- Steam 로비 링크 추출 (게시글 본문 / Steam 프로필)
- 모든 디시 탭에 알림 브로드캐스팅

### 2️⃣ Content Script (`content.js`)
```javascript
// 토스트 알림 생성
createToast(postId, title, lobbyLink, duration);

// 목록 페이지 빠른 참여 버튼 주입
enhanceListPage();

// 글쓰기 자동완성
handleAutoFill();
```

**역할**:
- 토스트 알림 UI 생성
- 목록 페이지 빠른 참여 버튼 추가
- 조회 페이지 `steam://` 링크를 버튼으로 변환
- 글쓰기 페이지 자동완성 버튼 주입

### 3️⃣ Popup Controller (`popup.js`)
**역할**:
- 진영/난이도/특수작전 태그 UI 렌더링
- 설정값 `chrome.storage.local` 저장/로드
- 자동완성 제목 미리보기

---

## 🎮 사용 방법

### 1. 초기 설정
1. 확장 프로그램 아이콘 클릭
2. **Steam Profile** URL 입력
3. 원하는 **진영/난이도** 선택
4. **저장** 버튼 클릭

[설정 예시 스크린샷]

### 2. 실시간 감지 활성화
1. 우측 하단 **⚙️ 설정** 클릭
2. **Auto Mangho Detection** 토글 ON
3. 폴링 간격 조정 (기본 5초)

[Auto Detection 활성화 스크린샷]

### 3. 자동완성 사용
1. 디시 헬다갤 글쓰기 페이지 접속
2. 에디터 툴바의 **☄️ 망호 자동 완성** 버튼 클릭
3. 말머리/제목/본문 자동 입력 확인

[자동완성 버튼 위치 스크린샷]

---

## 🔍 주요 알고리즘

### 신규 게시글 감지
```javascript
// 1. 헬망호 목록 크롤링
const posts = await fetch(MANGHO_LIST_URL);

// 2. 공지/뉴스 제외
.filter(m => !m[0].includes('icon_notice') && !m[0].includes('icon_fnews'))

// 3. 중복 방지 (ID 비교)
const newPosts = posts.filter(p => p.id > lastSeenPostId);

// 4. Steam 링크 추출
const lobbyLink = await extractLobbyLink(postId);
```

### Steam 로비 링크 추출
```javascript
// 방법 1: 게시글 본문에서 직접 추출
const lobbyMatch = html.match(/steam:\/\/joinlobby\/\d+\/\d+\/\d+/);

// 방법 2: Steam 프로필 크롤링
const profileMatch = html.match(/steamcommunity\.com\/(id|profiles)\/[^\s"<>]+/);
const lobbyLink = await fetchSteamLobby(profileUrl);
```

---

## 🎨 디자인 시스템

### CSS 변수
```css
:root {
  --seaf-color-primary: #41639C;
  --seaf-bg-main: #ffffff;
  --seaf-bg-card: #e9e9f0;
  --seaf-radius: 4px;
}
```

### 네이밍 규칙
- 모든 CSS 클래스: `seaf-` 접두사 (디시인사이드 스타일 충돌 방지)
- 예: `.seaf-toast-container`, `.seaf-btn`, `.seaf-category-grid`

---

## 🚀 개발 환경 설정

### 요구 사항
- Chrome 88+ (Manifest V3 지원)
- 개발자 모드 활성화

### 로컬 개발
```bash
# 1. 저장소 클론
git clone https://github.com/Toddoward/SEAF-Assistant.git

# 2. Chrome 확장 프로그램 페이지 접속
chrome://extensions/

# 3. 개발자 모드 활성화 → 압축해제된 확장 프로그램 로드

# 4. 코드 수정 후 새로고침 (🔄 버튼)
```

### 디버깅
```javascript
// Background Service Worker 로그 확인
chrome://extensions/ → SEAF Assistant → service worker 클릭

// Popup 검사
확장 프로그램 아이콘 우클릭 → "팝업 검사"

// Content Script 로그 확인
디시 페이지에서 F12 → Console 탭
```

---

## 📝 버전 히스토리

### v0.9.0 (Beta) - 2025-02-07
- ✅ 실시간 망호 감지 기능
- ✅ Steam 로비 링크 자동 추출
- ✅ 토스트 알림 시스템
- ✅ 빠른 참여 버튼
- ✅ 게시글 자동완성
- ✅ 설정 UI 완성

---

## 🔮 예정 사항

### v1.0.0 (정식 릴리즈)
- 🔜 **Chrome Web Store 정식 배포**
- 🔜 **사용자 피드백 기반 기능 개선**
  - 커뮤니티 제안 태그 추가
  - 버그 수정 및 안정성 강화

### 향후 업데이트
- 🔜 **진영/난이도 필터링 시스템**
  - 원하는 조건의 망호만 알림 수신
  - 키워드 기반 자동 필터링
  
- 🔜 **스마트 빠른 참여 버튼**
  - 게시글 제목 자동 분석
  - 진영/난이도 감지 후 테마 버튼 생성
  
- 🔜 **다크 모드 지원**
  - 시스템 테마 자동 감지
  - 수동 테마 전환 옵션

- 🔜 **추가 편의 기능**
  - 디시인사이드 알림을 가리지 않는 종속적 알림 메세지 생성
  - 망호 활성화 구분 기능(풀방, 마감 여부 등)
  - 통계 (참여한 망호 수, 자주 가는 진영 등)

---

## 🤝 기여하기

버그 리포트 및 기능 제안은 [Issues](https://github.com/Toddoward/SEAF-Assistant/issues)에 등록해주세요.

### 개발 가이드라인
1. `seaf-` 접두사 네이밍 규칙 준수
2. 코드 주석 작성 (특히 복잡한 로직)
3. Chrome Extension Best Practices 준수

---

## 📜 라이선스

MIT License

---

## 💬 문의

- **개발자**: ToddHoward
- **이슈**: [GitHub Issues](https://github.com/Toddoward/SEAF-Assistant/issues)

---

## ⚠️ 면책 조항

본 확장 프로그램은 디시인사이드 공식 제품이 아니며, 개인 개발 프로젝트입니다.  
사용에 따른 모든 책임은 사용자에게 있습니다.

---

**Made with ☄️ for Helldivers Community**
