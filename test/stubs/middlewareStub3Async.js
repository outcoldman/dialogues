/*jshint globalstrict: true*/ 'use strict';

var sinon = require('sinon');

var MiddlewareStub3 = module.exports = function(options) {
  this.name = 'MiddlewareStub3';

  this._stub = sinon.stub();
  this._stub.callsArg(3);
};

MiddlewareStub3.prototype.process = function(req, res, data, cb) {
  this._stub(req, res, data, cb);
};