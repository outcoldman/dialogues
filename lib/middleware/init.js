/*jshint globalstrict: true*/ 'use strict';

var httpUtils = require('./../httpUtils');

/*
 * Populate new commentary with initial data
 */
var InitMiddleware = module.exports = function(options) {
};

InitMiddleware.prototype.process = function(req, res, data) {
  var comment = data.comment;

  comment.date = new Date();
  var userIP = httpUtils.getClientIP(req);
  if (userIP) {
    comment.userIP = userIP;
  }
  var userAgent = req.headers['user-agent'];
  if (userAgent) {
    comment.userAgent = userAgent;
  }
};