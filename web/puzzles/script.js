function startPuzzle() {
  const category = document.getElementById('category').value;
  const pieces = parseInt(document.getElementById('pieces').value);
  const shape = document.getElementById('shape').value;

  // 예시 이미지 URL (Firebase 연동 시 변경)
  const imageUrl = `https://your-firebase-storage.com/${category}/sample.jpg`;

  const canvas = document.getElementById('puzzleCanvas');
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;

    // 사각형 퍼즐 조각 생성 (기본)
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

    // TODO: shape에 따라 다른 조각 모양 처리
    console.log(`퍼즐 시작: ${pieces}x${pieces}, 모양: ${shape}`);
  };
  img.src = imageUrl;
}
