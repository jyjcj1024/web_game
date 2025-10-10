function loadGame(url) {
  // 현재 설정된 언어 정보를 가져옵니다.
  const currentLang = i18next.language;
  // URL에 쿼리 파라미터로 언어 정보를 추가합니다. (예: .../puzzles.html?lang=ko)
  document.getElementById('gameFrame').src = `${url}?lang=${currentLang}`;
}