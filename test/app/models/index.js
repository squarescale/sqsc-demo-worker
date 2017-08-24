'use strict';

var expect = require('chai').expect;

var model = require('../../../app/models/index');

describe('Model ', function() {
  it('should contain a Response function', function() {
    expect(model).to.be.a('object');
    expect(model.sequelize).to.be.a('object');
    expect(model.sequelize.models.Response).to.be.a('function');
  });
});
