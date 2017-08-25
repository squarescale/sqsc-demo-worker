'use strict';

var expect = require('chai').expect;

var response = require('../../../app/models/response');

describe('Response model', function() {
  it('should be load as function', function() {
    expect(response).to.be.a('function');
  });
});
