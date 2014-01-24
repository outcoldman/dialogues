/*jshint globalstrict: true*/ 'use strict';

var gravatar = require('gravatar'),
    Transform = require('stream').Transform,
    util = require('util');

var DEFAULT_OPTIONS = {
  s: 80, // Size of icons in pixels
  d: 'mm' // default view
};

/*
 * Gravatar icon provider.
 */
var GravatarMiddlewareStream = module.exports = function(req, res, options) {
  this._options = options;
  Transform.call(this, { objectMode: true });
};

util.inherits(GravatarMiddlewareStream, Transform);

GravatarMiddlewareStream.prototype._transform = function(comment, encoding, cb) {
  comment.icon = gravatar.url(comment.email || '', this._options);
  this.push(comment);
  cb();
};