/*jshint globalstrict: true*/ 'use strict';

var Transform = require('stream').Transform,
    util = require('util'),
    _ = require('underscore');

var BaseCommentStream = function(req, res, options) {
  this._options = options;
  if (_.isFunction(this.initialize)) {
    this.initialize(options);
  }
};

module.exports = {
  BaseCommentStream: BaseCommentStream
};