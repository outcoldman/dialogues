/*
* In-memory storage for commentaries.
*
* This storage is useful only for development. There are not reasons
* to use this storage in production.
*/

"use strict";

var _ = require('underscore');

var Storage = function(opts) {
  var repository = {};

  this.getAll = function(dialogueId, callback) {
    callback(null, _.map(repository[dialogueId] || [], function(c) { return _.clone(c); }));
  };

  this.add = function(dialogueId, comment, callback) {
    comment.id = (new Date()).getTime();
    (repository[dialogueId] || (repository[dialogueId] = [])).push(_.clone(comment));
    callback(null, comment);
  };
}

module.exports = function(opts) {
  return new Storage(opts);
}