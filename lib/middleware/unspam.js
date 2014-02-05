/*jshint globalstrict: true*/ 'use strict';

/*
 * Remove all spam commentaries
 */
var UnspamMiddleware = module.exports = function(options) {
};

UnspamMiddleware.prototype.process = function(req, res, data) {
  data.remove = data.comment.isSpam;
};