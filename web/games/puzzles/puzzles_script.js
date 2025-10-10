let t;
i18next.init({}, (err, initializedT) => { t = initializedT; });

const storage = firebase.storage();
const db = firebase.firestore();

let timerInterval = null;
let elapsedTime = 0;
let puzzlePieces = [];
let pieceWidth, pieceHeight;
let puzzleContainer;
let isGameRunning = false;

window.onload = () => {
  puzzleContainer = document.getElementById('puzzle-container');
  showImageSource('firebase'); // 페이지 로드 시 첫 번째 탭을 활성화
  loadImages();
};

// --- 추가된 탭 제어 함수 ---
function showImageSource(source) {
  // 모든 탭 콘텐츠 숨기기
  document.querySelectorAll('.source-content').forEach(div => div.classList.remove('active'));
  // 모든 탭 버튼 비활성화
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));

  // 선택된 탭과 콘텐츠만 활성화
  document.getElementById('source-' + source).classList.add('active');
  document.querySelector(`.tab-button[onclick="showImageSource('${source}')"]`).classList.add('active');
}

async function loadImages() {
  const category = document.getElementById('category').value;
  const imageList = [];
  const container = document.getElementById('thumbnailContainer');
  container.innerHTML = 'Loading...';
  try {
    const snapshot = await db.collection('images')
      .where('category', '==', category)
      .get();

    snapshot.forEach(doc => {
      const data = doc.data();
      imageList.push(data.url);
    });
    displayThumbnails(imageList);
  } catch (error) {
    console.error("Firestore에서 이미지를 불러오는 중 오류 발생:", error);
    container.innerHTML = '이미지를 불러올 수 없습니다. Firebase 설정을 확인하세요.';
  }
}

function displayThumbnails(images) {
  const container = document.getElementById('thumbnailContainer');
  container.innerHTML = '';
  images.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.className = 'thumbnail';
    img.onclick = (e) => {
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('selected'));
        e.target.classList.add('selected');
        startPuzzleWithImage(url);
    }
    container.appendChild(img);
  });
}

document.getElementById('uploadImage').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    startPuzzleWithImage(event.target.result);
  };
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
  img.onerror = () => {
      alert(i18next.t('alert_cantLoadImage'));
  };
  img.src = imageUrl;
}

function createPuzzlePieces(img, pieces) {
  puzzlePieces = [];
  puzzleContainer.innerHTML = '';
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
      puzzlePieces.push(piece);
      addDragListeners(piece);
    }
  }
  for (let i = 0; i < pieces * pieces; i++) {
    const dropTarget = document.createElement('div');
    dropTarget.className = 'drop-target';
    puzzleContainer.appendChild(dropTarget);
  }
}

function shuffleAndDisplayPieces() {
  const shuffledPositions = [];
  const containerRect = puzzleContainer.getBoundingClientRect();
  for(let i = 0; i < puzzlePieces.length; i++) {
    const randomX = Math.random() * (window.innerWidth - pieceWidth);
    const randomY = Math.random() * (containerRect.bottom + 50) + (window.innerHeight - containerRect.bottom - 50) / 2;
    shuffledPositions.push({top: randomY, left: randomX});
  }
  puzzlePieces.forEach((piece, i) => {
    piece.style.top = `${shuffledPositions[i].top}px`;
    piece.style.left = `${shuffledPositions[i].left}px`;
    document.body.appendChild(piece);
  });
}

function addDragListeners(piece) {
  let offsetX, offsetY;
  function onDown(e) {
    e.preventDefault();
    piece.classList.add('dragging');
    document.body.appendChild(piece);
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
  if (pieceCenterX > containerRect.left && pieceCenterX < containerRect.right &&
      pieceCenterY > containerRect.top && pieceCenterY < containerRect.bottom) {
    const gridX = Math.floor((pieceCenterX - containerRect.left) / pieceWidth);
    const gridY = Math.floor((pieceCenterY - containerRect.top) / pieceHeight);
    const targetLeft = containerRect.left + gridX * pieceWidth;
    const targetTop = containerRect.top + gridY * pieceHeight;
    piece.style.left = `${targetLeft}px`;
    piece.style.top = `${targetTop}px`;
    checkCompletion();
  }
}

function checkCompletion() {
  if (!isGameRunning) return;
  for (const piece of puzzlePieces) {
    const pieceRect = piece.getBoundingClientRect();
    const containerRect = puzzleContainer.getBoundingClientRect();
    const currentX = Math.round((pieceRect.left - containerRect.left) / pieceWidth);
    const currentY = Math.round((pieceRect.top - containerRect.top) / pieceHeight);
    if (currentX.toString() !== piece.dataset.correctX || currentY.toString() !== piece.dataset.correctY) {
      return;
    }
  }
  isGameRunning = false;
  stopTimer();
  showWinModal();
}

function startTimer() {
  const startTime = Date.now() - elapsedTime;
  const timerPrefix = i18next.t('timerPrefix');
  timerInterval = setInterval(() => {
    elapsedTime = Date.now() - startTime;
    document.getElementById('timer').innerHTML = `<span data-i18n="timerPrefix">${timerPrefix}</span> ${(elapsedTime / 1000).toFixed(2)}초`;
  }, 100);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function resetTimer() {
  stopTimer();
  elapsedTime = 0;
  const timerPrefix = i18next.t('timerPrefix');
  document.getElementById('timer').innerHTML = `<span data-i18n="timerPrefix">${timerPrefix}</span> 0.00초`;
}

function showWinModal() {
    const modal = document.getElementById('win-modal');
    const recordPrefix = i18next.t('winRecordPrefix');
    document.getElementById('final-time').textContent = `${recordPrefix} ${(elapsedTime / 1000).toFixed(2)}초`;
    modal.classList.remove('hidden');
}

function closeWinModal() {
    document.getElementById('win-modal').classList.add('hidden');
    puzzlePieces.forEach(p => p.remove());
    puzzlePieces = [];
    puzzleContainer.innerHTML = '';
    puzzleContainer.style.width = '0';
    puzzleContainer.style.height = '0';
    isGameRunning = false;
    resetTimer();
}