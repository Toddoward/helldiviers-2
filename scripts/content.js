/**
 * Project SEAF - Unified Content Script
 * 1. 빠른 참여 버튼 (목록 페이지)
 * 2. 툴바 버튼 및 자동 완성 (작성 페이지)
 * 3. 본문 내 링크 이미지화 (조회 페이지)
 * 4. 독립적 알림 UI (모든 페이지)
 */

const SEAF_CONTENT = {
  isWritePage: () => window.location.href.includes('board/write'),
  isListPage: () => window.location.href.includes('board/lists'),
  isViewPage: () => window.location.href.includes('board/view'),

  // --- 1. 게시글 목록 페이지 처리 (참가 버튼 주입) ---
  enhanceListPage: function() {
    const posts = document.querySelectorAll('.ub-content');
    posts.forEach(post => {
      if (post.hasAttribute('data-seaf-processed')) return;
      
      const subjectTd = post.querySelector('.gall_subject');
      const titleTd = post.querySelector('.gall_tit.ub-word');
      
      // '헬망호' 말머리인 경우에만 스캔
      if (subjectTd && subjectTd.innerText.trim() === '헬망호' && titleTd) {
        const postLink = titleTd.querySelector('a')?.href;
        if (!postLink) return;

        post.setAttribute('data-seaf-processed', 'true');

        // Background를 통해 해당 게시글 본문의 로비 링크 확인
        chrome.runtime.sendMessage({ type: "GET_LOBBY_LINK", url: postLink }, (response) => {
          if (response && response.link && !titleTd.querySelector('.seaf-fast-join-btn')) {
            const btn = document.createElement('button');
            btn.className = 'seaf-fast-join-btn';
            btn.innerText = '☄️참여';
            Object.assign(btn.style, {
              marginLeft: '8px',
              padding: '1px 6px',
              backgroundColor: '#41639C',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '3px',
              border: 'none',
              cursor: 'pointer',
              verticalAlign: 'middle'
            });
            btn.onclick = (e) => { 
              e.preventDefault(); 
              e.stopPropagation();
              window.location.href = response.link; 
            };
            titleTd.querySelector('a').after(btn);
          }
        });
      }
    });
  },

  // --- 2. 글쓰기 페이지 자동 완성 ---
  injectWriteAssistant: function() {
    const toolbar = document.querySelector('.note-toolbar');
    const breakPoint = document.querySelector('.note-btn-group.note-break');
    if (!toolbar || !breakPoint || document.getElementById('seaf-auto-btn')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'note-btn-group note-mybutton';
    wrapper.innerHTML = `
      <button type="button" id="seaf-auto-btn" class="note-btn" title="SEAF 망호 자동 완성">
        <b style="color:#41639C">☄️망호 자동 완성☄️</b>
      </button>
    `;
    toolbar.insertBefore(wrapper, breakPoint);
    document.getElementById('seaf-auto-btn').onclick = () => this.handleAutoFill();
  },

  handleAutoFill: async function() {
    const { seaf_settings: s } = await chrome.storage.local.get(['seaf_settings']);
    
    // 말머리 자동 선택
    const manghoLi = document.querySelector('li[data-val="헬망호"]');
    if (manghoLi) manghoLi.click();

    // 제목 설정
    const titleInput = document.querySelector('input[name="subject"]');
    if (titleInput) {
      titleInput.value = (s?.customTitle && s.customTitle.trim() !== "") ? s.customTitle : "☄️ 민주주의 망호";
    }

    // 에디터 본문 설정
    const editor = document.querySelector('.note-editable');
    if (editor) {
      editor.innerHTML = "<p>스팀 서버에서 작전 정보를 수신 중...</p>";
      if (s?.steamUrl) {
        chrome.runtime.sendMessage({ type: "GET_LOBBY_LINK", url: s.steamUrl }, (response) => {
          const lobbyLink = response?.link;
          const customContent = (s?.customContent && s.customContent.trim() !== "") ? s.customContent : "민주주의 전파에 즉시 동참하십시오.";
          
          let lobbyImageHtml = lobbyLink 
            ? `<div class="seaf-lobby-btn-wrap" style="text-align: center; margin: 20px 0;">
                 <a href="${lobbyLink}" class="seaf-join-button" style="display: inline-block; padding: 12px 30px; background-color: #41639C; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 5px; font-size: 16px;">
                   ☄️ 즉시 참가하기 ☄️
                 </a>
               </div>`
            : `<p style="text-align:center; color:red; font-weight:bold;">[로비 링크 확보 실패]</p>`;

          // config.js 템플릿 적용 시도
          if (typeof SEAF_CONFIG !== 'undefined' && SEAF_CONFIG.TEMPLATES) {
            editor.innerHTML = SEAF_CONFIG.TEMPLATES.content
              .replace('{custom_content}', customContent.replace(/\n/g, '<br>'))
              .replace('{lobby_image_html}', lobbyImageHtml);
          } else {
            editor.innerHTML = `<div style="text-align:center;">${lobbyImageHtml}<br><p>${customContent.replace(/\n/g, '<br>')}</p></div>`;
          }
        });
      }
    }
  },

  // --- 3. 본문 내 링크 이미지화 (조회 페이지) ---
  convertLobbyLinks: function() {
    const contentView = document.querySelector('.writing_view_box');
    if (!contentView || contentView.hasAttribute('data-seaf-converted')) return;
    
    const lobbyRegex = /steam:\/\/joinlobby\/\d+\/\d+\/\d+/g;
    const originalHtml = contentView.innerHTML;
    
    if (lobbyRegex.test(originalHtml)) {
      contentView.innerHTML = originalHtml.replace(lobbyRegex, (match) => {
        return `
          <div class="seaf-lobby-btn-wrap" style="text-align: center; margin: 20px 0;">
            <a href="${match}" class="seaf-join-button" style="display: inline-block; padding: 12px 30px; background-color: #41639C; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 5px; font-size: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
              ☄️ 즉시 참가하기 ☄️
            </a>
          </div>`;
      });
      contentView.setAttribute('data-seaf-converted', 'true');
    }
  },

  // --- 4. 독립적 알림 UI (Toast) ---
  initNotificationContainer: function() {
    let container = document.getElementById('seaf-notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'seaf-notification-container';
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '2147483647',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none'
      });
      document.body.appendChild(container);
    }
    return container;
  },

  createToast: function(title, link) {
    const container = this.initNotificationContainer();
    const toast = document.createElement('div');
    
    Object.assign(toast.style, {
      width: '300px',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      fontFamily: 'sans-serif',
      fontSize: '14px',
      borderLeft: '5px solid #41639C',
      pointerEvents: 'auto',
      opacity: '0',
      transform: 'translateX(20px)',
      transition: 'all 0.4s ease',
      position: 'relative'
    });

    toast.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">☄️ 새로운 망호 발견!</div>
      <div style="font-size: 12px; color: #ccc; margin-bottom: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${title}</div>
      <div style="display: flex; gap: 8px;">
        <a href="${link}" style="background: #41639C; color: white; text-decoration: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">즉시 참가</a>
        <button class="seaf-close-btn" style="background: #444; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">닫기</button>
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; }, 10);

    const close = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 400);
    };
    toast.querySelector('.seaf-close-btn').onclick = close;
    setTimeout(close, 7000);
  },

  // --- 초기화 ---
  init: function() {
    const url = window.location.href;

    // 1. 목록/조회 페이지: 버튼 주입 및 스캔
    if (this.isListPage() || this.isViewPage()) {
      this.enhanceListPage();
      new MutationObserver(() => this.enhanceListPage()).observe(document.body, { childList: true, subtree: true });
    }

    // 2. 글쓰기 페이지: 자동 완성 버튼
    if (this.isWritePage()) {
      setTimeout(() => this.injectWriteAssistant(), 1000);
    }

    // 3. 조회 페이지: 본문 내 링크 버튼화
    if (this.isViewPage()) {
      this.convertLobbyLinks();
    }

    // 4. 메시지 리스너 (알림 수신)
    chrome.runtime.onMessage.addListener((m) => {
      if (m.type === "SEAF_NEW_LOBBY") {
        this.createToast(m.title, m.link);
      }
    });
  }
};

SEAF_CONTENT.init();