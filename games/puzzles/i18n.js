// i18n.js

// 모든 번역 내용을 코드 안에 직접 포함하여 경로 문제를 원천 차단합니다.
const resources = {
  ko: {
    translation: {
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
      "loadImageButton": "이미지 선택",
      "uploadLabel": "내 이미지 업로드:",
      "piecesLabel": "조각 수 (가로):",
      "shapeLabel": "조각 모양:",
      "shape_square": "사각형",
      "timerPrefix": "경과 시간:",
      "winTitle": "🎉 축하합니다! 🎉",
      "winMessage": "퍼즐을 완성하셨습니다!",
      "winRecordPrefix": "완성 기록:",
      "newGameButton": "새 게임",
      "alert_noUrl": "이미지 URL을 입력해주세요.",
      "alert_cantLoadImage": "이미지를 불러올 수 없습니다. URL을 확인해주세요.",
      "error_loading_images": "이미지를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.",
      "firebase_config_error": "<strong>Firebase 설정이 올바르지 않습니다.</strong><br>puzzles.html 파일의 firebaseConfig 부분을 확인해주세요.",
      "imageSelected": "✅ 이미지가 선택되었습니다!",
      "noImageSelected": "퍼즐을 시작할 이미지를 먼저 선택해주세요.",
      "startGameButton": "🧩 퍼즐 시작하기"
    }
  },
  en: {
    translation: {
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
      "loadImageButton": "Select Image",
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
      "error_loading_images": "Failed to load images. Please try again later.",
      "firebase_config_error": "<strong>Firebase config is incorrect.</strong><br>Please check the firebaseConfig in puzzles.html file.",
      "imageSelected": "✅ Image Selected!",
      "noImageSelected": "Please select an image to start the puzzle.",
      "startGameButton": "🧩 Start Puzzle"
    }
  }
};

function updatePuzzleContent() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key.startsWith('[placeholder]')) {
      el.placeholder = i18next.t(key.substring(13));
    } else {
      el.innerHTML = i18next.t(key);
    }
  });
}

const urlParams = new URLSearchParams(window.location.search);
const initialLang = urlParams.get('lang') || 'ko';

i18next.init({
  resources, // 외부 파일 대신 내부 리소스를 사용
  lng: initialLang,
  fallbackLng: 'en',
  debug: true // 문제 발생 시 콘솔에서 확인 가능
}, (err, t) => {
  if (err) return console.error('i18next init failed in puzzle', err);
  updatePuzzleContent();
});

// 부모 창(메인 페이지)에서 언어 변경 신호를 받습니다.
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'languageChange') {
    i18next.changeLanguage(event.data.lang, () => updatePuzzleContent());
  }
});
