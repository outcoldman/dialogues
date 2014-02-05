/*jshint globalstrict: true*/ 'use strict';

var _ = require('underscore');

/*
 * Clear all empty fields.
 */
var ClearMiddleware = module.exports = function(options) {
};

ClearMiddleware.prototype.process = function(req, res, data) {
  var comment = data.comment;

  _(_(comment).keys()).each(function(key) {
    if (comment[key] === null || comment[key] === '') {
      delete comment[key];
    }
  });
};