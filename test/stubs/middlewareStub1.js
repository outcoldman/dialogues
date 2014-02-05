/*jshint globalstrict: true*/ 'use strict';

var sinon = require('sinon');

var MiddlewareStub1 = module.exports = function(options) {
  this.name = 'MiddlewareStub1';

  this._stub = sinon.stub();
};

MiddlewareStub1.prototype.process = function(req, res, data) {
  this._stub(req, res, data);
};