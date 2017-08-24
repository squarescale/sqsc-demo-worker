'use strict';

const expect = require('chai').expect;

const mandelbrot = require('../../app/mandelbrot');

const data = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  width: 5,
  height: 5,
  startX: 0,
  startY: 0,
  stepX: 5,
  stepY: 5,
  iter: 1
}
const blackCubeBase64Representation = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAABmJLR0QA/wD/AP+gvaeTAAAAFUlEQVQImWNkYGD4z4AGmNAFqCAIAGcRAQmm4PXDAAAAAElFTkSuQmCC";

describe('Mandelbrot', function() {
  describe('#get()', function() {
    it('should return a base64 representation of a 5 x 5 mandelbrot fractal', function() {
      expect(mandelbrot.get(data)).to.be.equal(blackCubeBase64Representation);
    });

    it('should return a base64 representation of a 5 x 5 black cube if incorrect datas', function() {
      const incorrectData = data;
      incorrectData.x = "a";
      expect(mandelbrot.get(incorrectData)).to.be.equal(blackCubeBase64Representation);
    });
    
    it('should throw a TypeError exception if nulled datas', function() {
      expect(function(){
        mandelbrot.get(null)}
      ).to.throw(TypeError);
    });

  });
});
