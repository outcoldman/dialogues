/*jshint globalstrict: true*/ 'use strict';

var Transform = require('stream').Transform,
    util = require('util');

/*
 * Sensitive data remover.
 *
 * Removes email address and other sensitive information from commentary before sending it on client.
 */
var SensitiveMiddlewareStream = module.exports = function(req, res, options) {
  this._options = options;
  Transform.call(this, { objectMode: true });
};

util.inherits(SensitiveMiddlewareStream, Transform);

SensitiveMiddlewareStream.prototype._transform = function(comment, encoding, cb) {

  delete comment.subscription;
  delete comment.email;
  delete comment.userIP;
  delete comment.userAgent;
  delete comment.isSpam;

  this.push(comment);

  cb();
};