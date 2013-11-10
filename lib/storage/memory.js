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

  this.getAll = function(dialogue, callback) {
    var id = JSON.stringify(dialogue);
    callback(null, _.map(repository[id] || [], function(c) { return _.clone(c); }));
  };

  this.add = function(dialogue, comment, callback) {
    var id = JSON.stringify(dialogue);
    comment.id = (new Date()).getTime();
    (repository[id] || (repository[id] = [])).push(_.clone(comment));
    callback(null, comment);
  };
}

module.exports = function(opts) {
  return new Storage(opts);
}