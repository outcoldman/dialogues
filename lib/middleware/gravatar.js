/*jshint globalstrict: true*/ 'use strict';

var gravatar = require('gravatar'),
    _ = require('underscore');

var DEFAULT_OPTIONS = {
  gravatar_options: {
    s: 80, // Size of icons in pixels
    d: 'mm' // default view
  },
  https: null // identify based on request
};

/*
 * Gravatar icon provider.
 */
var GravatarMiddleware = module.exports = function(options) {
  this.options = _.defaults(options || {}, DEFAULT_OPTIONS);
};

GravatarMiddleware.prototype.process = function(req, res, dialogue, comment, cb) {
  var https = this.options.https;
  if (https === null) {
    https = req.protocol === 'https';
  }
  comment.icon = gravatar.url(comment.email || '', this.options.gravatar_options, https);
  cb(null, comment);
};