/*jshint globalstrict: true*/ 'use strict';

var _ = require('underscore'),
    akismet = require('akismet-api'),
    httpUtils = require('../httpUtils');

var DEFAULT_OPTIONS = {
  commentType: 'comment',
  key: null,
  blog: null
};

/*
 * Remove all spam commentaries
 */
var AkismetMiddleware = module.exports = function(options) {
  this.options = _.defaults(options, DEFAULT_OPTIONS);
  if (!this.options.key && !this.options.blog) {
    throw new Error('AkismetMiddleware expects options: key and blog');
  }
  this.client = akismet.client({
    key  : this.options.key,
    blog : this.options.blog
  });
};

AkismetMiddleware.prototype.process = function(req, res, dialogue, comment, cb) {
  this.client.checkSpam({
    user_ip: req.userIP,
    user_agent: comment.userAgent,
    referrer: req.headers.referer,
    permalink: dialogue.permalink,
    comment_type: this.options.commentType,
    comment_author: comment.name,
    comment_author_email: comment.email,
    comment_author_url: comment.website,
    comment_content: comment.body
  }, function(err, spam) {
    if (err) {
      cb(err);
    } else {
      // TODO: we need to use logger
      console.log('Spam: '+ spam);
      comment.isSpam = spam;
      cb(null, comment);
    }
  }.bind(this));
};
