// i18next 초기화 설정
i18next.init({
  lng: 'ko', // 기본 언어
  fallbackLng: 'en', // 언어 파일이 없을 경우 기본으로 영어 사용
  backend: {
    loadPath: 'locales/{{lng}}/translation.json' // 언어 파일 경로
  }
}, function(err, t) {
  // 초기화가 완료되면 updateContent 함수를 실행합니다.
  updateContent();
});

// 페이지의 모든 텍스트를 현재 언어에 맞게 업데이트하는 함수
function updateContent() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.innerHTML = i18next.t(key);
  });
}

// 언어 선택 드롭다운이 변경될 때 호출되는 함수
function changeLanguage(lang) {
  i18next.changeLanguage(lang, () => {
    updateContent();

    // 수정된 부분: iframe을 찾아 메시지를 보냅니다.
    const iframe = document.getElementById('gameFrame');
    if (iframe && iframe.contentWindow) {
      // { type: 'languageChange', lang: 'en' } 와 같은 메시지를 전송
      iframe.contentWindow.postMessage({ type: 'languageChange', lang: lang }, '*');
    }
  });
}

// i18next가 언어 파일을 비동기적으로 불러올 수 있도록
// XMLHttpRequest를 사용하도록 설정합니다. (로컬 파일 테스트용)
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