// i18n.js (메인 페이지용)

// 1. 번역 내용을 변수로 직접 선언 (외부 파일 로딩 X)
const resources = {
  ko: {
    translation: {
      "title": "캐주얼 게임 포털",
      "gameCategories": "게임 카테고리",
      "puzzle": "🧩 퍼즐",
      "puzzleGame1": "직소 퍼즐",
      "leftAd": "좌측 광고 영역",
      "futureContent": "추후 콘텐츠",
      "emptyContent": "여기는 비워둡니다.",
      "rightAd": "우측 광고 영역"
    }
  },
  en: {
    translation: {
      "title": "Casual Game Portal",
      "gameCategories": "Game Categories",
      "puzzle": "🧩 Puzzle",
      "puzzleGame1": "Jigsaw Puzzle",
      "leftAd": "Left Ad Area",
      "futureContent": "Future Content",
      "emptyContent": "This area is empty.",
      "rightAd": "Right Ad Area"
    }
  }
};

// 2. i18next 초기화
i18next.init({
  resources, // 위에서 선언한 번역 내용 사용
  lng: 'ko', // 기본 언어
  fallbackLng: 'en',
  debug: true
}, (err, t) => {
  if (err) return console.error('i18next main init failed', err);
  // 초기화 성공 시 UI 텍스트 업데이트
  updateContent();
});

// 3. HTML 내의 텍스트를 업데이트하는 함수
function updateContent() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.innerHTML = i18next.t(key);
  });
}

// 4. 언어 변경 함수
function changeLanguage(lang) {
  i18next.changeLanguage(lang, (err, t) => {
    if (err) return console.error('Language change failed', err);
    
    // 1. 메인 페이지의 텍스트를 변경
    updateContent();
    
    // 2. iframe 안의 게임 페이지에도 언어가 바뀌었다고 신호를 보냄
    const iframe = document.getElementById('gameFrame');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'languageChange', lang: lang }, '*');
    }
  });
}
