/*jshint globalstrict: true*/ 'use strict';

var sinon = require('sinon');

var MiddlewareStub2 = module.exports = function(options) {
  this.name = 'MiddlewareStub2';

  this._stub = sinon.spy();
};

MiddlewareStub2.prototype.process = function(req, res, data) {
  this._stub(req, res, data);
};