/**
 * Project SEAF - Steam Lobby Parser
 * 스팀 프로필 페이지에서 로비 참여 링크를 추출하는 유틸리티입니다.
 */

const SteamParser = {
  /**
   * HTML 소스에서 steam://joinlobby/ 프로토콜 링크를 정규식으로 추출합니다.
   * @param {string} html - 페이지 소스 문자열
   * @returns {string|null} - 추출된 로비 링크
   */
  extractLobbyLink: (html) => {
    // 스팀 로비 참여 링크 정규식
    const lobbyRegex = /steam:\/\/joinlobby\/\d+\/\d+\/\d+/;
    const match = html.match(lobbyRegex);
    return match ? match[0] : null;
  },

  /**
   * 지정된 URL의 탭에서 링크를 추출하고 결과를 반환합니다.
   * (Background Script에서 호출될 예정)
   */
  async fetchFromTab(tabId) {
    return new Promise((resolve) => {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => document.documentElement.outerHTML
      }, (results) => {
        if (results && results[0]) {
          const link = this.extractLobbyLink(results[0].result);
          resolve(link);
        } else {
          resolve(null);
        }
      });
    });
  }
};

// 외부 모듈 사용 가능성 대응
if (typeof module !== 'undefined') {
  module.exports = SteamParser;
}