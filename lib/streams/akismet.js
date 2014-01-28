/*jshint globalstrict: true*/ 'use strict';

var _ = require('underscore'),
    akismet = require('akismet-api'),
    httpUtils = require('../httpUtils'),
    Transform = require('stream').Transform;

var DEFAULT_OPTIONS = {
  commentType: 'comment',
  key: null,
  blog: null
};

/*
 * Remove all spam commentaries
 */
var AkismetMiddlewareStream = module.exports = function(options) {
  this._options = _.extend(DEFAULT_OPTIONS, options);
  if (!this._options.key && !this._options.blog) {
    throw new Error('AkismetMiddleware expects options: key and blog');
  }
  this._client = akismet.client({
    key  : this._options.key,
    blog : this._options.blog
  });
  Transform.call(this, { objectMode: true });
};

AkismetMiddlewareStream.prototype._transform = function(chunk, encoding, cb) {
  var comment = chunk.comment;
  var req = chunk.request;
  var res = chunk.response;
  var dialogue = chunk.dialogue;

  this._client.checkSpam({
    user_ip: req.userIP,
    user_agent: comment.userAgent,
    referrer: req.headers.referer,
    permalink: httpUtils.getRequestUrl(req),
    comment_type: this._options.commentType,
    comment_author: comment.name,
    comment_author_email: comment.email,
    comment_author_url: comment.website,
    comment_content: comment.body
  }, function(err, spam) {
    if (err) {
      this.emit('error', err);
    } else {
      // TODO: we need to use logger
      console.log('Spam: '+ spam);
      comment.isSpam = spam;
      this.push(chunk);
      cb();
    }
  }.bind(this));
};
