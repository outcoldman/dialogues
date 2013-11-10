"use strict";

var _ = require('underscore');

/*
* Sensitive data remover.
*
* Removes email address from commentary before sending it on client.
*/

var SensitiveProcessor = function(opts) {
  this._options = opts;

  this.process = function(comments, callback) {
    _.each(comments, function(comment){
      delete comment.email;
    });

    callback(null, comments);
  }.bind(this);
}

module.exports = function(opts) {
  return new SensitiveProcessor(opts);
}