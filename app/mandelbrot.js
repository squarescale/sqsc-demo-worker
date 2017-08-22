/**
 * MANDELBROT algorithm
 */
const Canvas = require('canvas');

function iterateMandelbrot(cx, cy, maxIter) {
  let i,
    x = 0.0,
    y = 0.0;

  for (i = 0; i < maxIter && x * x + y * y <= 4; ++i) {
    var tmp = 2 * x * y;
    x = x * x - y * y + cx;
    y = tmp + cy;
  }
  return i;
}

function getColor(iter, maxIter) {
  let color = {r: 0, g: 0, b: 0, a: 255};
  if (iter !== maxIter) {
    let c = 3 * Math.log(iter) / Math.log(maxIter - 1.0);
    if (c < 1) {
      color.r = 255 * c;
    } else if (c < 2) {
      color.r = 255;
      color.g = 255 * (c - 1);
    } else {
      color.r = 255;
      color.g = 255;
      color.b = 255 * (c - 2);
    }
  }
  return color;
}

let Mandelbrot = {

  get: function get(data) {
    let minX = data.x - data.scaleX,
      maxX = data.x + data.scaleX,
      minY = data.y - data.scaleY,
      maxY = data.y + data.scaleY;
  
    let canvas = new Canvas(data.stepX, data.height);
    let ctx = canvas.getContext("2d");
    let img = ctx.getImageData(0, 0, data.stepX, data.stepY);
    let pixelsData = img.data;

    for (let ix = data.step; ix < data.step + data.stepX; ++ix) {
      for (let iy = 0; iy < data.stepY; ++iy) {
        let globalX = minX + (maxX - minX) * ix / (data.width - 1);
        let globalY = minY + (maxY - minY) * iy / (data.height - 1);
        let rawPixelPosition = 4 * (data.stepX * iy + ix - data.step);
        let iterationCount = iterateMandelbrot(globalX, globalY, data.iter);
        let pixelColor = getColor(iterationCount, data.iter);
        pixelsData[rawPixelPosition] = pixelColor.r;
        pixelsData[rawPixelPosition + 1] = pixelColor.g;
        pixelsData[rawPixelPosition + 2] = pixelColor.b;
        pixelsData[rawPixelPosition + 3] = pixelColor.a;
      }
    }

    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL();
  }
}

module.exports = Mandelbrot;