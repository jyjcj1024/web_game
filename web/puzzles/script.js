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

    for (let y = 0; y < pieces; y++) {
      for (let x = 0; x < pieces; x++) {
        ctx.drawImage(
          img,
          x * pieceWidth, y * pieceHeight, pieceWidth, pieceHeight,
          x * pieceWidth, y * pieceHeight, pieceWidth, pieceHeight
        );
      }
    }

    console.log(`퍼즐 시작: ${pieces}x${pieces}, 모양: ${shape}`);
  };
  img.src = imageUrl;
}
