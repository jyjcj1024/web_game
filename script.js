function loadGame(url) {
  const currentLang = i18next.language || 'ko';
  document.getElementById('gameFrame').src = `${url}?lang=${currentLang}`;
}
