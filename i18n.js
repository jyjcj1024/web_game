// i18n.js

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
      "rightAd": "우측 광고 영역",
      "pageTitle": "직소 퍼즐 게임",
      "mainTitle": "🧩 직소 퍼즐 설정",
      "tab_firebase": "추천 이미지",
      "tab_url": "URL로 가져오기",
      "tab_upload": "파일 업로드",
      "categoryLabel": "카테고리:",
      "category_female": "인물 - 여자",
      "category_male": "인물 - 남자",
      "category_nature": "자연",
      "category_building": "건물",
      "category_animal": "동물",
      "category_space": "우주",
      "category_music": "악보",
      "externalUrlLabel": "외부 이미지 URL:",
      "externalUrlPlaceholder": "이미지 주소를 붙여넣으세요",
      "loadImageButton": "이미지 불러오기",
      "uploadLabel": "내 이미지 업로드:",
      "piecesLabel": "조각 수 (가로):",
      "shapeLabel": "조각 모양:",
      "shape_square": "사각형",
      "timerPrefix": "경과 시간:",
      "winTitle": "🎉 축하합니다! 🎉",
      "winMessage": "퍼즐을 완성하셨습니다!",
      "winRecordPrefix": "완성 기록:",
      "newGameButton": "새 게임 시작",
      "alert_noUrl": "이미지 URL을 입력해주세요.",
      "alert_cantLoadImage": "이미지를 불러올 수 없습니다. URL을 확인해주세요.",
      "error_loading_images": "이미지를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요."
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
      "rightAd": "Right Ad Area",
      "pageTitle": "Jigsaw Puzzle Game",
      "mainTitle": "🧩 Jigsaw Puzzle Setup",
      "tab_firebase": "Recommended",
      "tab_url": "From URL",
      "tab_upload": "Upload File",
      "categoryLabel": "Category:",
      "category_female": "Person - Female",
      "category_male": "Person - Male",
      "category_nature": "Nature",
      "category_building": "Building",
      "category_animal": "Animal",
      "category_space": "Space",
      "category_music": "Music Sheet",
      "externalUrlLabel": "External Image URL:",
      "externalUrlPlaceholder": "Paste image address here",
      "loadImageButton": "Load Image",
      "uploadLabel": "Upload My Image:",
      "piecesLabel": "Pieces (width):",
      "shapeLabel": "Piece Shape:",
      "shape_square": "Square",
      "timerPrefix": "Time:",
      "winTitle": "🎉 Congratulations! 🎉",
      "winMessage": "You have completed the puzzle!",
      "winRecordPrefix": "Final Time:",
      "newGameButton": "New Game",
      "alert_noUrl": "Please enter an image URL.",
      "alert_cantLoadImage": "Could not load the image. Please check the URL.",
      "error_loading_images": "Failed to load images. Please try again later."
    }
  }
};

i18next.init({
  resources,
  lng: 'ko', // 기본 언어
  fallbackLng: 'en',
  debug: true
}, (err, t) => {
  if (err) return console.error('i18next initialization failed', err);
  updateUI();
});

function updateUI() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key.startsWith('[placeholder]')) {
      el.placeholder = i18next.t(key.substring(13));
    } else {
      el.innerHTML = i18next.t(key);
    }
  });
}

function changeLanguage(lang) {
  i18next.changeLanguage(lang, (err, t) => {
    if (err) return console.error('something went wrong loading', err);
    updateUI();
    const iframe = document.getElementById('gameFrame');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'languageChange', lang: lang }, '*');
    }
  });
}
