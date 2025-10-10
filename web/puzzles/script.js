// 이미지 목록 불러오기 (Firestore에서)
async function loadImages() {
  const category = document.getElementById('category').value;
  const imageList = [];
  const snapshot = await db.collection('images')
    .where('category', '==', category)
    .get();

  snapshot.forEach(doc => {
    const data = doc.data();
    imageList.push(data.url);
  });

  displayThumbnails(imageList);
}

// 썸네일 표시
function displayThumbnails(images) {
  const container = document.getElementById('thumbnailContainer');
  container.innerHTML = '';
  images.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.className = 'thumbnail';
    img.onclick = () => startPuzzleWithImage(url);
    container.appendChild(img);
  });
}

// 사용자 이미지 업로드 처리
document.getElementById('uploadImage').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const storageRef = storage.ref(`uploads/${file.name}`);
  await storageRef.put(file);
  const url = await storageRef.getDownloadURL();
  startPuzzleWithImage(url);
});

// 퍼즐 시작
function startPuzzleWithImage(imageUrl) {
  const pieces = parseInt(document.getElementById('pieces').value);
  const shape = document.getElementById('shape').value;

  const canvas = document.getElementById('puzzleCanvas');
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;

    const pieceWidth = img.width / pieces;
    const pieceHeight = img.height / pieces;

    // 퍼즐 조각 생성 및 드래그 앤 드롭 구현
    for (let y = 0; y < pieces; y++) {
      for (let x = 0; x < pieces; x++) {
        const sx = x * pieceWidth;
        const sy = y * pieceHeight;

        // 각 조각을 캔버스에 그리기
        ctx.drawImage(img, sx, sy, pieceWidth, pieceHeight, sx, sy, pieceWidth, pieceHeight);
      }
    }

    // TODO: 조각을 분리하고 드래그 가능한 HTML 요소로 만들기
    console.log(`퍼즐 시작: ${pieces}x${pieces}, 모양: ${shape}`);
  };
  img.src = imageUrl;
}
