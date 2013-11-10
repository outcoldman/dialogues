"use strict";

var gravatar = require('gravatar'),
    _ = require('underscore'),
    utils = require('../utils');

/*
* Gravatar icon provider.
*/

var DEFAULT_VALUES = {
  s: 80, // Size of icons in pixels
  d: 'mm' // default view
};

var GravatarProcessor = function(opts) {
  this._options = utils.merge(DEFAULT_VALUES, opts);

  this.process = function(req, dialogue, comments, next) {
    _.each(comments, function(comment){
      comment.icon = gravatar.url(comment.email || '', this._options);
    }.bind(this));

    next(null, req, dialogue, comments);
  }.bind(this);
}

module.exports = function(opts) {
  return new GravatarProcessor(opts);
}