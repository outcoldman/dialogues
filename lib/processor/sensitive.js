"use strict";

var _ = require('underscore');

/*
* Sensitive data remover.
*
* Removes email address and other sensitive information from commentary before sending it on client.
*/

var SensitiveProcessor = function(opts) {
  this._options = opts;

  this.process = function(comments, callback) {
    _.each(comments, function(comment){
      delete comment.subscription;
      delete comment.email;
      delete comment.userIP;
      delete comment.userAgent;
    });

    callback(null, comments);
  }.bind(this);
}

module.exports = function(opts) {
  return new SensitiveProcessor(opts);
}