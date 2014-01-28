/*jshint globalstrict: true*/ 'use strict';

var BaseStream = require('./../base.stream.js');

/*
 * Remove all spam commentaries
 */
module.exports = BaseStream.extend({
  process: function(comment, cb) {
    cb(null, /* accept comment: */ !comment.isSpam);
  }
});