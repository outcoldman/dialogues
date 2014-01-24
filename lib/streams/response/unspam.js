/*jshint globalstrict: true*/ 'use strict';

var Transform = require('stream').Transform,
    util = require('util');

/*
 * Remove all spam commentaries
 */
var UnspamMiddlewareStream = module.exports = function(req, res, options) {
  this._options = options;
  Transform.call(this, { objectMode: true });
};

util.inherits(UnspamMiddlewareStream, Transform);

UnspamMiddlewareStream.prototype._transform = function(comment, encoding, cb) {
  
  if (!comment.isSpam) {
    this.push(comment);
  }
  
  cb();
};