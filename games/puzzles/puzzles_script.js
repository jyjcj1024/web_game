// puzzles_script.js

const db = firebase.firestore();
let timerInterval = null, elapsedTime = 0, puzzlePieces = [], pieceWidth, pieceHeight, puzzleContainer, isGameRunning = false;

// i18n 관련 설정 및 함수
const resources = { /* 이 파일에서는 i18n 리소스가 필요 없습니다. 부모 창의 것을 사용합니다. */ };
let currentLang = 'ko'; // 기본값

// 부모 창(index.html)으로부터 언어 변경 메시지를 수신
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'languageChange') {
        changeLanguage(event.data.lang);
    }
});

function updateUIText() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = i18next.t(key);
        if (key.startsWith('[placeholder]')) {
            el.placeholder = translated;
        } else {
            el.innerHTML = translated;
        }
    });
}

function changeLanguage(lang) {
    if (!i18next.isInitialized) return;
    i18next.changeLanguage(lang, (err, t) => {
        if (err) return console.error('Language change failed in iframe', err);
        currentLang = lang;
        updateUIText();
        // 타이머나 모달창 같이 동적으로 생성되는 텍스트도 업데이트
        updateDynamicTexts();
    });
}

function updateDynamicTexts() {
    if (!isGameRunning) {
        document.getElementById('timer').innerHTML = `<span data-i18n="timerPrefix">${i18next.t('timerPrefix')}</span> 0.00초`;
    }
}


// 게임 초기화
window.onload = () => {
    puzzleContainer = document.getElementById('puzzle-container');
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang') || 'ko';
    
    // 부모 창의 리소스를 임시로 빌려와서 초기화
    i18next.init({
        resources: window.parent.i18next.options.resources,
        lng: lang,
        fallbackLng: 'en'
    }, (err, t) => {
        if (err) console.error("iframe i18next init failed", err);
        showImageSource('firebase');
        loadImages();
        updateUIText();
    });
};

function showImageSource(source) {
  document.querySelectorAll('.source-content, .tab-button').forEach(el => el.classList.remove('active'));
  document.getElementById('source-' + source).classList.add('active');
  document.querySelector(`.tab-button[onclick="showImageSource('${source}')"]`).classList.add('active');
}

async function loadImages() {
  const category = document.getElementById('category').value; let imageList = [];
  const container = document.getElementById('thumbnailContainer');
  container.innerHTML = 'Loading images...';
  try {
    const snapshot = await db.collection('images').where('category', '==', category).get();
    if (snapshot.empty) {
        container.innerHTML = '해당 카테고리에 이미지가 없습니다. Firebase를 확인해주세요.';
        return;
    }
    snapshot.forEach(doc => imageList.push(doc.data().url));
    displayThumbnails(imageList);
  } catch (error) {
      console.error("Firebase 로딩 에러:", error);
      container.innerHTML = `이미지를 불러올 수 없습니다. <br> <strong>puzzles.html 파일의 Firebase 설정이 올바른지 확인하세요.</strong>`;
  }
}

function displayThumbnails(images) {
  const container = document.getElementById('thumbnailContainer'); container.innerHTML = '';
  images.forEach(url => {
    const img = document.createElement('img'); img.src = url; img.className = 'thumbnail';
    img.onclick = (e) => {
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('selected'));
        e.target.classList.add('selected');
        startPuzzleWithImage(url);
    };
    container.appendChild(img);
  });
}

document.getElementById('uploadImage').addEventListener('change', (e) => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => startPuzzleWithImage(event.target.result);
  reader.readAsDataURL(file);
});

function startWithExternalImage() {
  const url = document.getElementById('imageUrl').value.trim();
  if (url) {
      startPuzzleWithImage(url);
  } else {
      alert(i18next.t('alert_noUrl'));
  }
}

function startPuzzleWithImage(imageUrl) {
  const pieces = parseInt(document.getElementById('pieces').value);
  if (isNaN(pieces) || pieces < 2 || pieces > 50) {
      alert('조각 수는 2에서 50 사이의 숫자여야 합니다.');
      return;
  }
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.onload = () => {
    isGameRunning = true;
    resetTimer();
    startTimer();
    const aspectRatio = img.width / img.height;
    const containerWidth = Math.min(window.innerWidth * 0.9, 800);
    puzzleContainer.style.width = `${containerWidth}px`;
    puzzleContainer.style.height = `${containerWidth / aspectRatio}px`;
    pieceWidth = containerWidth / pieces;
    pieceHeight = (containerWidth / aspectRatio) / pieces;
    puzzleContainer.style.gridTemplateColumns = `repeat(${pieces}, 1fr)`;
    puzzleContainer.style.gridTemplateRows = `repeat(${pieces}, 1fr)`;
    createPuzzlePieces(img, pieces);
    shuffleAndDisplayPieces();
  };
  img.onerror = () => { alert(i18next.t('alert_cantLoadImage')); };
  img.src = imageUrl;
}

function createPuzzlePieces(img, pieces) {
  puzzlePieces = [];
  puzzleContainer.innerHTML = ''; // 기존 드랍 타겟 제거
  for (let y = 0; y < pieces; y++) {
    for (let x = 0; x < pieces; x++) {
      const piece = document.createElement('div');
      piece.className = 'puzzle-piece';
      piece.style.width = `${pieceWidth}px`;
      piece.style.height = `${pieceHeight}px`;
      piece.style.backgroundImage = `url(${img.src})`;
      piece.style.backgroundSize = `${puzzleContainer.offsetWidth}px ${puzzleContainer.offsetHeight}px`;
      piece.style.backgroundPosition = `-${x * pieceWidth}px -${y * pieceHeight}px`;
      piece.dataset.correctX = x;
      piece.dataset.correctY = y;
      // 각 조각을 드래그 가능하게 만듭니다.
      addDragListeners(piece);
      puzzlePieces.push(piece);
    }
  }

  // 조각을 놓을 수 있는 그리드 배경 생성
  for (let i = 0; i < pieces * pieces; i++) {
    const dropTarget = document.createElement('div');
    dropTarget.className = 'drop-target';
    puzzleContainer.appendChild(dropTarget);
  }
}

function shuffleAndDisplayPieces() {
    const setupRect = document.getElementById('setup').getBoundingClientRect();
    const spawnArea = {
        top: setupRect.bottom + 20,
        left: setupRect.left,
        width: setupRect.width,
        height: 200 // 조각을 흩어놓을 영역 높이
    };

    puzzlePieces.forEach((piece) => {
        // 조각들을 퍼즐판 아래 영역에 무작위로 배치
        const randomX = spawnArea.left + Math.random() * (spawnArea.width - pieceWidth);
        const randomY = spawnArea.top + Math.random() * (spawnArea.height - pieceHeight);
        
        piece.style.position = 'absolute'; // 절대 위치로 설정
        piece.style.top = `${randomY}px`;
        piece.style.left = `${randomX}px`;
        document.body.appendChild(piece); // body에 직접 추가하여 다른 요소 위에 오도록 함
    });
}

function addDragListeners(piece) {
  let offsetX, offsetY;

  function onDown(e) {
    e.preventDefault();
    if (!isGameRunning) return;
    
    piece.classList.add('dragging');
    document.body.appendChild(piece); // 드래그 시작 시 body의 최상단으로 이동
    
    const rect = piece.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    
    offsetX = touch.clientX - rect.left;
    offsetY = touch.clientY - rect.top;
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  }

  function onMove(e) {
    if (!piece.classList.contains('dragging')) return;
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    piece.style.left = `${touch.clientX - offsetX}px`;
    piece.style.top = `${touch.clientY - offsetY}px`;
  }

  function onUp(e) {
    if (!piece.classList.contains('dragging')) return;
    piece.classList.remove('dragging');
    
    snapToGrid(piece);
    
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
  }

  piece.addEventListener('mousedown', onDown);
  piece.addEventListener('touchstart', onDown, { passive: false });
}

function snapToGrid(piece) {
  const containerRect = puzzleContainer.getBoundingClientRect();
  const pieceRect = piece.getBoundingClientRect();
  const pieceCenterX = pieceRect.left + pieceRect.width / 2;
  const pieceCenterY = pieceRect.top + pieceRect.height / 2;

  // 조각의 중심이 퍼즐판 안에 들어왔는지 확인
  if (pieceCenterX > containerRect.left && pieceCenterX < containerRect.right &&
      pieceCenterY > containerRect.top && pieceCenterY < containerRect.bottom) {
      
    // 가장 가까운 그리드 계산
    const gridX = Math.floor((pieceCenterX - containerRect.left) / pieceWidth);
    const gridY = Math.floor((pieceCenterY - containerRect.top) / pieceHeight);
    
    // 해당 위치에 다른 조각이 있는지 확인
    const targetIndex = gridY * Math.sqrt(puzzlePieces.length) + gridX;
    let isOccupied = false;
    for(const p of puzzlePieces) {
      if(p !== piece && p.dataset.placedIndex == targetIndex) {
        isOccupied = true;
        break;
      }
    }
    
    if(!isOccupied) {
      // 그리드에 정확히 스냅
      piece.style.left = `${containerRect.left + gridX * pieceWidth}px`;
      piece.style.top = `${containerRect.top + gridY * pieceHeight}px`;
      piece.dataset.currentX = gridX;
      piece.dataset.currentY = gridY;
      piece.dataset.placedIndex = targetIndex;
      checkCompletion();
    }
  }
}

function checkCompletion() {
    if (!isGameRunning) return;

    for (const piece of puzzlePieces) {
        if (piece.dataset.currentX !== piece.dataset.correctX || piece.dataset.currentY !== piece.dataset.correctY) {
            return; // 하나라도 제자리에 없으면 함수 종료
        }
    }
    
    // 모든 조각이 제자리에 있을 경우
    isGameRunning = false;
    stopTimer();
    showWinModal();

    // 완성 후 조각들이 더 이상 움직이지 않도록 이벤트 리스너 제거 (선택 사항)
    puzzlePieces.forEach(p => {
        const newPiece = p.cloneNode(true);
        p.parentNode.replaceChild(newPiece, p);
    });
}

function startTimer() {
  const startTime = Date.now() - elapsedTime;
  timerInterval = setInterval(() => {
    elapsedTime = Date.now() - startTime;
    document.getElementById('timer').innerHTML = `<span data-i18n="timerPrefix">${i18next.t('timerPrefix')}</span> ${(elapsedTime / 1000).toFixed(2)}초`;
  }, 100);
}

function stopTimer() { clearInterval(timerInterval); }

function resetTimer() {
  stopTimer();
  elapsedTime = 0;
  document.getElementById('timer').innerHTML = `<span data-i18n="timerPrefix">${i18next.t('timerPrefix')}</span> 0.00초`;
}

function showWinModal() {
  const modal = document.getElementById('win-modal');
  modal.querySelector('#final-time').textContent = `${i18next.t('winRecordPrefix')} ${(elapsedTime / 1000).toFixed(2)}초`;
  modal.classList.remove('hidden');
}

function closeWinModal() {
  document.getElementById('win-modal').classList.add('hidden');
  
  // 게임 상태 초기화
  puzzlePieces.forEach(p => p.remove()); // body에 추가된 조각들 제거
  puzzlePieces = [];
  if(puzzleContainer) {
    puzzleContainer.innerHTML = '';
    puzzleContainer.style.width = '0';
    puzzleContainer.style.height = '0';
  }
  isGameRunning = false;
  resetTimer();
}
