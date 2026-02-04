/**
 * Project SEAF - Central Configuration
 * 유동적 태그 풀 시스템을 위해 구조화된 설정 파일입니다.
 */
const CONFIG = {
  GALLERY_ID: "helldiversseries",
  MANGHO_HEAD_ID: "60",
  NOTI_DURATION: 6000,
  POLLING_INTERVAL: 30,

  // UI 애니메이션 및 반응 속도 설정 (ms)
  // 매우 빠른 반응성을 위해 150ms 이하의 속도 권장
  ANIMATION_SPEED: {
    FAST: 150, 
    INSTANT: 50
  },

  // 난이도 공통 데이터 (1단 ~ 10단)
  DIFFICULTIES: Array.from({ length: 10 }, (_, i) => (i + 1).toString()),

  // 대분류 및 귀속 태그 정의 (유동적 UI 생성용)
  CATEGORIES: {
    TERMINID: {
      name: "테르미니드",
      emoji: "🪳",
      color: "#EAD033",
      tags: ["프레데터", "럽쳐", "글룸", "하이브월드", "하이브로드"],
      hasDifficulty: true
    },
    AUTOMATON: {
      name: "오토마톤",
      emoji: "🤖",
      color: "#FF4500",
      tags: ["소각대", "제트여단"],
      hasDifficulty: true
    },
    ILLUMINATE: {
      name: "일루미닛",
      emoji: "🦑",
      color: "#931bca",
      tags: [],
      hasDifficulty: true
    },
    ANYWHERE: {
      name: "아무데나",
      emoji: "🗺️",
      color: "#FFFFFF",
      tags: [],
      hasDifficulty: true
    },
    CREDIT_RUN: {
      name: "크레딧런",
      emoji: "💎",
      color: "#006eff",
      tags: [],
      hasDifficulty: false
    }
  },

  UI_CLASS: {
    JOIN_BTN: "seaf-join-button",
    AUTO_FILL_BTN: "seaf-autofill-button",
    NOTI_CONTAINER: "seaf-notification-stack",
    NOTI_BUBBLE: "seaf-notification-bubble"
  },

  /**
   * 제목 생성 로직 가이드 (치환 변수)
   * {emoji}: 선택한 카테고리의 이모지
   * {target}: 세부 태그를 골랐으면 태그명, 아니면 카테고리명
   * {diff}: 난이도 (선택 시 'N단', 미선택 시 공백)
   */
  DEFAULT_TEMPLATE: {
    title: "{emoji} {target} {diff}",
    content: "☄️아래 버튼을 클릭해서 참여하세요!☄️\n"
  }
};

if (typeof window !== 'undefined') {
  window.SEAF_CONFIG = CONFIG;
}