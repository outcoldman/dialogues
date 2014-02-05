/*jshint globalstrict: true*/ 'use strict';

var _ = require('underscore');

var DEFAULT_OPTIONS = {
  props: [
    'id',
    'name',
    'body',
    'web',
    'icon',
    'date'
  ]
};

/*
 * Sensitive data remover.
 *
 * Removes email address and other sensitive information from commentary before sending it on client.
 */
var SensitiveMiddleware = module.exports = function(options) {
  this.options = _.defaults(options || {}, DEFAULT_OPTIONS);

  this.props = _.object(_(this.options.props)
    .map(function(prop) {
      return [prop, true];
    }));
};

SensitiveMiddleware.prototype.process = function(req, res, data) {
  var comment = data.comment;

  _(_(comment).keys()).each(function(key) {
    if (!this.props[key]) {
      delete comment[key];
    }
  }.bind(this));
};