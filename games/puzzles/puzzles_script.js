const db = firebase.firestore();
let timerInterval = null, elapsedTime = 0, puzzlePieces = [], pieceWidth, pieceHeight, puzzleContainer, isGameRunning = false;
let selectedImageUrl = null; // 선택된 이미지 URL을 저장할 변수

window.onload = () => {
  puzzleContainer = document.getElementById('puzzle-container');
  showImageSource('firebase');
  loadImages();
  document.getElementById('uploadImage').addEventListener('change', selectImageFromFile);
};

function showImageSource(source) {
  document.querySelectorAll('.source-content, .tab-button').forEach(el => el.classList.remove('active'));
  document.getElementById('source-' + source).classList.add('active');
  document.querySelector(`.tab-button[onclick="showImageSource('${source}')"]`).classList.add('active');
}

async function loadImages() {
  const category = document.getElementById('category').value;
  const container = document.getElementById('thumbnailContainer');
  container.innerHTML = 'Loading...';
  try {
    const snapshot = await db.collection('images').where('category', '==', category).get();
    if (snapshot.empty) {
      container.innerHTML = '해당 카테고리에 이미지가 없습니다.';
      return;
    }
    const imageList = snapshot.docs.map(doc => doc.data().url);
    displayThumbnails(imageList);
  } catch (error) {
    console.error("Firebase 로딩 에러:", error);
    container.innerHTML = i18next.t('firebase_config_error');
  }
}

function displayThumbnails(images) {
  const container = document.getElementById('thumbnailContainer');
  container.innerHTML = '';
  images.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.className = 'thumbnail';
    img.onclick = () => {
      document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('selected'));
      img.classList.add('selected');
      setSelectedImage(url);
    };
    container.appendChild(img);
  });
}

function selectImageFromUrl() {
  const url = document.getElementById('imageUrl').value.trim();
  if (url) {
    setSelectedImage(url);
  } else {
    alert(i18next.t('alert_noUrl'));
  }
}

function selectImageFromFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => setSelectedImage(event.target.result);
  reader.readAsDataURL(file);
}

function setSelectedImage(url) {
  selectedImageUrl = url;
  const statusEl = document.getElementById('selection-status');
  statusEl.innerHTML = i18next.t('imageSelected');
  statusEl.style.color = '#28a745';
}

function startGame() {
  if (!selectedImageUrl) {
    alert(i18next.t('noImageSelected'));
    return;
  }

  const pieces = parseInt(document.getElementById('pieces').value);
  const img = new Image();
  img.crossOrigin = "Anonymous";

  img.onload = () => {
    document.getElementById('setup').classList.add('hidden');
    document.getElementById('game-info').classList.remove('hidden');

    isGameRunning = true;
    resetTimer();
    startTimer();
    const aspectRatio = img.width / img.height;
    const containerWidth = Math.min(window.innerWidth * 0.95, 800);
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
  img.src = selectedImageUrl;
}

function createPuzzlePieces(img, pieces) {
  puzzlePieces = [];
  puzzleContainer.innerHTML = '';
  const shape = document.getElementById('shape').value;

  if (shape === 'square') {
    // 기존 사각형 로직
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
        addDragListeners(piece);
        puzzlePieces.push(piece);
      }
    }
  } else if (shape === 'jigsaw') {
    // 새로운 직소 퍼즐 로직
    const pieceShapes = [];
    for (let y = 0; y < pieces; y++) {
      pieceShapes[y] = [];
      for (let x = 0; x < pieces; x++) {
        const top = y === 0 ? 0 : -pieceShapes[y - 1][x].bottom;
        const left = x === 0 ? 0 : -pieceShapes[y][x - 1].right;
        const bottom = y === pieces - 1 ? 0 : (Math.random() > 0.5 ? 1 : -1);
        const right = x === pieces - 1 ? 0 : (Math.random() > 0.5 ? 1 : -1);
        pieceShapes[y][x] = { top, bottom, left, right };
      }
    }

    for (let y = 0; y < pieces; y++) {
      for (let x = 0; x < pieces; x++) {
        const shapeInfo = pieceShapes[y][x];
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece';
        const knobSize = pieceWidth * 0.2;
        piece.style.width = `${pieceWidth + knobSize}px`;
        piece.style.height = `${pieceHeight + knobSize}px`;
        piece.style.backgroundImage = `url(${img.src})`;
        
        const bgWidth = puzzleContainer.offsetWidth;
        const bgHeight = puzzleContainer.offsetHeight;
        piece.style.backgroundSize = `${bgWidth}px ${bgHeight}px`;
        piece.style.backgroundPosition = `calc(${-x * pieceWidth}px + ${knobSize/2}px) calc(${-y * pieceHeight}px + ${knobSize/2}px)`;

        const clipPath = generateJigsawPath(shapeInfo, pieceWidth, pieceHeight);
        piece.style.clipPath = clipPath;
        piece.style.webkitClipPath = clipPath;

        piece.dataset.correctX = x;
        piece.dataset.correctY = y;
        addDragListeners(piece);
        puzzlePieces.push(piece);
      }
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
  const containerRect = puzzleContainer.getBoundingClientRect();
  puzzlePieces.forEach((piece) => {
    const randomX = Math.random() * (window.innerWidth - piece.offsetWidth);
    const randomY = containerRect.bottom + 10 + Math.random() * 80;
    piece.style.top = `${randomY}px`;
    piece.style.left = `${randomX}px`;
    document.body.appendChild(piece);
  });
}

function addDragListeners(piece) {
    let offsetX, offsetY;
    function onDown(e) {
      if (!isGameRunning) return; e.preventDefault();
      piece.classList.add('dragging'); document.body.appendChild(piece);
      const rect = piece.getBoundingClientRect(); const touch = e.touches ? e.touches[0] : e;
      offsetX = touch.clientX - rect.left; offsetY = touch.clientY - rect.top;
      document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove, { passive: false }); document.addEventListener('touchend', onUp);
    }
    function onMove(e) {
      if (!piece.classList.contains('dragging')) return; e.preventDefault();
      const touch = e.touches ? e.touches[0] : e;
      piece.style.left = `${touch.clientX - offsetX}px`;
      piece.style.top = `${touch.clientY - offsetY}px`;
    }
    function onUp(e) {
      if (!piece.classList.contains('dragging')) return;
      piece.classList.remove('dragging'); snapToGrid(piece);
      document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onUp);
    }
    piece.addEventListener('mousedown', onDown); piece.addEventListener('touchstart', onDown, { passive: false });
}
  
function snapToGrid(piece) {
  const containerRect = puzzleContainer.getBoundingClientRect(); const pieceRect = piece.getBoundingClientRect();
  const pieceCenterX = pieceRect.left + pieceRect.width / 2; const pieceCenterY = pieceRect.top + pieceRect.height / 2;
  if (pieceCenterX > containerRect.left && pieceCenterX < containerRect.right && pieceCenterY > containerRect.top && pieceCenterY < containerRect.bottom) {
    const gridX = Math.floor((pieceCenterX - containerRect.left) / pieceWidth); const gridY = Math.floor((pieceCenterY - containerRect.top) / pieceHeight);
    piece.style.left = `${containerRect.left + gridX * pieceWidth}px`;
    piece.style.top = `${containerRect.top + gridY * pieceHeight}px`;
    piece.dataset.currentX = gridX;
    piece.dataset.currentY = gridY;
    checkCompletion();
  }
}
  
function checkCompletion() {
  if (!isGameRunning) return;
  for (const piece of puzzlePieces) {
      if (piece.dataset.currentX !== piece.dataset.correctX || piece.dataset.currentY !== piece.dataset.correctY) { return; }
  }
  isGameRunning = false; stopTimer(); showWinModal();
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
  stopTimer(); elapsedTime = 0;
  document.getElementById('timer').innerHTML = `<span data-i18n="timerPrefix">${i18next.t('timerPrefix')}</span> 0.00초`;
}

function showWinModal() {
  const modal = document.getElementById('win-modal');
  modal.querySelector('#final-time').textContent = `${i18next.t('winRecordPrefix')} ${(elapsedTime / 1000).toFixed(2)}초`;
  modal.classList.remove('hidden');
}

function closeWinModal() {
  document.getElementById('win-modal').classList.add('hidden');
  document.getElementById('setup').classList.remove('hidden');
  document.getElementById('game-info').classList.add('hidden');

  puzzlePieces.forEach(p => p.remove()); puzzlePieces = [];
  puzzleContainer.innerHTML = ''; puzzleContainer.style.width = '0'; puzzleContainer.style.height = '0';
  selectedImageUrl = null;
  document.getElementById('selection-status').innerHTML = '';

  isGameRunning = false;
  resetTimer();
}

function generateJigsawPath(shape, w, h) {
  const knobSize = w * 0.2;
  const halfW = w / 2;
  const halfH = h / 2;

  const m = knobSize / 2;

  const points = {
    topLeft: [m, m],
    topRight: [w - m, m],
    bottomLeft: [m, h - m],
    bottomRight: [w - m, h - m]
  };

  let path = `M ${points.topLeft.join(' ')} `;

  if (shape.top !== 0) {
    path += `C ${m + w*0.3},${m} ${m + w*0.2},${m - shape.top * knobSize} ${m + halfW},${m - shape.top * knobSize} `;
    path += `S ${m + w*0.8},${m - shape.top * knobSize} ${points.topRight.join(' ')} `;
  } else { path += `L ${points.topRight.join(' ')} `; }

  if (shape.right !== 0) {
    path += `C ${w-m},${m + h*0.3} ${w - m + shape.right * knobSize},${m + h*0.2} ${w - m + shape.right * knobSize},${m + halfH} `;
    path += `S ${w - m + shape.right * knobSize},${m + h*0.8} ${points.bottomRight.join(' ')} `;
  } else { path += `L ${points.bottomRight.join(' ')} `; }

  if (shape.bottom !== 0) {
    path += `C ${w-m - w*0.3},${h-m} ${w-m - w*0.2},${h-m + shape.bottom * knobSize} ${w-m - halfW},${h-m + shape.bottom * knobSize} `;
    path += `S ${w-m - w*0.8},${h-m + shape.bottom * knobSize} ${points.bottomLeft.join(' ')} `;
  } else { path += `L ${points.bottomLeft.join(' ')} `; }

  if (shape.left !== 0) {
    path += `C ${m},${h-m - h*0.3} ${m + shape.left * knobSize},${h-m - h*0.2} ${m + shape.left * knobSize},${h-m - halfH} `;
    path += `S ${m + shape.left * knobSize},${h-m - h*0.8} ${points.topLeft.join(' ')} `;
  } else { path += `L ${points.topLeft.join(' ')} `; }

  path += 'Z';
  return `path('${path}')`;
}
