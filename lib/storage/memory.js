/*
* In-memory storage for commentaries.
*
* This storage is useful only for development. There are not reasons
* to use this storage in production.
*/

/*jshint globalstrict: true*/ 'use strict';

var _ = require('underscore');

var Storage = module.exports = function(options) {
  this.repository = {};
};

Storage.prototype.getAll = function(dialogueId, cb) {
  var id = JSON.stringify(dialogueId);
  cb(null, _.map(this.repository[id] || [], function(c) { return _.clone(c); }));
};

Storage.prototype.add = function(comment, cb) {
  var id = JSON.stringify(comment.dialogueId);
  comment.id = (new Date()).getTime();
  (this.repository[id] || (this.repository[id] = [])).push(_.clone(comment));
  cb(null, comment);
};