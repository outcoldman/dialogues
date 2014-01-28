/*jshint globalstrict: true*/ 'use strict';

var Transform = require('stream').Transform,
    util = require('util'),
    extend = require('extendable');

var BaseCommentStream = module.exports = function(req, res, options) {
  this.options = options;
  this.req = req;
  this.res = res;
  
  Transform.call(this, { objectMode: true });

  this.initialize.apply(this, arguments);
};

util.inherits(BaseCommentStream, Transform);

BaseCommentStream.prototype.initialize = function() {
};

BaseCommentStream.prototype._transform = function(comment, encoding, cb) {
  this.process(comment, function(err, include) {
    if (err) cb(err);
    else {
      if (arguments.length <= 1) {
        include = true;
      }
      if (include) {
        this.push(comment);
      }
      cb(null);
    }
    
  }.bind(this));
};

BaseCommentStream.extend = extend;