// 페이지의 모든 텍스트를 현재 언어에 맞게 업데이트하는 함수
function updatePuzzleContent() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.innerHTML = i18next.t(key);
  });
}

// 1. URL에서 언어 정보 추출 (처음 로드될 때)
const urlParams = new URLSearchParams(window.location.search);
const initialLang = urlParams.get('lang') || 'ko'; // URL에 lang 값이 없으면 'ko'를 기본으로

// 2. i18next 초기화
i18next.init({
  lng: initialLang, // URL에서 가져온 언어로 시작
  fallbackLng: 'en',
  backend: {
    loadPath: 'locales/{{lng}}/translation.json' // 퍼즐 폴더 내의 경로
  }
}, function(err, t) {
  updatePuzzleContent();
});

// 3. 메인 페이지로부터 오는 메시지 수신 대기
window.addEventListener('message', function(event) {
  // 메시지가 languageChange 타입일 경우에만 반응
  if (event.data && event.data.type === 'languageChange') {
    const newLang = event.data.lang;
    i18next.changeLanguage(newLang, () => {
      updatePuzzleContent();
    });
  }
});

// i18next가 언어 파일을 비동기적으로 불러올 수 있도록 설정
i18next.use({
  type: 'backend',
  read: function(language, namespace, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', this.options.backend.loadPath.replace('{{lng}}', language), true);
    xhr.onreadystatechange = function() {
      if (this.readyState === 4 && this.status >= 200 && this.status < 300) {
        callback(null, JSON.parse(this.responseText));
      } else if (this.readyState === 4) {
        callback('failed to load', null);
      }
    };
    xhr.send();
  }
});