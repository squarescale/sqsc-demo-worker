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

function fixColorByPoint(ppos, pix, i, iter) {
  if (i == iter) {
    pix[ppos] = 0;
    pix[ppos + 1] = 0;
    pix[ppos + 2] = 0;
  } else {
    var c = 3 * Math.log(i) / Math.log(iter - 1.0);
    if (c < 1) {
      pix[ppos] = 255 * c;
      pix[ppos + 1] = 0;
      pix[ppos + 2] = 0;
    } else if (c < 2) {
      pix[ppos] = 255;
      pix[ppos + 1] = 255 * (c - 1);
      pix[ppos + 2] = 0;
    } else {
      pix[ppos] = 255;
      pix[ppos + 1] = 255;
      pix[ppos + 2] = 255 * (c - 2);
    }
  }
  pix[ppos + 3] = 255;
}

let Mandelbrot = {

  get: function get(data) {
    let minX = data.x - data.scaleX,
      maxX = data.x + data.scaleX,
      minY = data.y - data.scaleY,
      maxY = data.y + data.scaleY;
  
    let canvas = new Canvas(data.width, data.height),
      canvasCropped = new Canvas(data.stepX, data.height);;
    let ctx = canvas.getContext("2d"),
      ctxCropped = canvasCropped.getContext("2d");
    let img = ctx.getImageData(0, 0, data.width, data.height);
    let pix = img.data;
  
    for (var ix = data.step; ix < data.step + data.stepX; ++ix) {
      for (var iy = 0; iy < data.height; ++iy) {
        let x = minX + (maxX - minX) * ix / (data.width - 1);
        let y = minY + (maxY - minY) * iy / (data.height - 1);
        let ppos = 4 * (data.width * iy + ix);
        fixColorByPoint(
          ppos,
          pix,
          iterateMandelbrot(x, y, data.iter),
          data.iter);
      }
    }
    ctx.putImageData(img, 0, 0);
    let imgCropped = ctx.getImageData(data.step, 0, data.step + data.stepX, data.height);
    ctxCropped.putImageData(imgCropped, 0, 0);
    return canvasCropped.toDataURL();
  }
}


module.exports = Mandelbrot;