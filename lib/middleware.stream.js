/*jshint globalstrict: true*/ 'use strict';

var _ = require('underscore'),
    async = require('async'),
    Transform = require('stream').Transform,
    util = require('util');

var PassCommentError = {};

var MiddlewareStream = module.exports = function(req, res, dialogue, middleware) {
  this.req = req;
  this.res = res;
  this.dialogue = dialogue;
  this.middlewareFunctions = _(middleware).map(function(instance) {
    return function(comment, cb) {
      instance.process(req, res, dialogue, comment, function(err, result) {
        if (err) cb(err);
        else if (!result) cb(PassCommentError);
        else cb(null, result);
      });
    }.bind(this);
  }.bind(this));
  
  Transform.call(this, { objectMode: true });
};

util.inherits(MiddlewareStream, Transform);

MiddlewareStream.prototype._transform = function(comment, encoding, cb) {
  async.applyEachSeries(
    this.middlewareFunctions,
    comment,
    function(err) {
      console.dir(err);
      if (err === PassCommentError) cb();
      else if (err) cb(err);
      else {
        this.push(comment);
        cb();
      }
    }.bind(this)
  );
};