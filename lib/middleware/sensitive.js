/*jshint globalstrict: true*/ 'use strict';

/*
 * Sensitive data remover.
 *
 * Removes email address and other sensitive information from commentary before sending it on client.
 */
var SensitiveMiddleware = module.exports = function(options) {
};

SensitiveMiddleware.prototype.process = function(req, res, comment, cb) {
  delete comment.subscription;
  delete comment.email;
  delete comment.userIP;
  delete comment.userAgent;
  delete comment.isSpam;

  cb(null, comment);
};