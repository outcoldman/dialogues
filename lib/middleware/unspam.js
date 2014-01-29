/*jshint globalstrict: true*/ 'use strict';

/*
 * Remove all spam commentaries
 */
var UnspamMiddleware = module.exports = function(options) {
};

UnspamMiddleware.prototype.process = function(req, res, dialogue, comment, cb) {
  if (comment.isSpam) {
    cb();
  } else {
    cb(null, comment);
  }
};