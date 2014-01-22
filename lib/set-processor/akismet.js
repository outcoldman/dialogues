/*jshint globalstrict: true*/ 'use strict';

var akismet = require('akismet-api'),
    _ = require('underscore'),
    httpUtils = require('../httpUtils');

var DEFAULT_OPTIONS = {
  commentType: 'comment',
  key: 'akismet-key',
  blog: 'http://example.com'
};

var AkismetProcessor = function(opts) {

  this._options = _.extend(DEFAULT_OPTIONS, opts);
  this._client = akismet.client({
    key  : this._options.key,
    blog : this._options.blog
  });

  this.process = function(req, dialogue, comment, next) {
    
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
      if (err) next(err, null);
      else {
        console.log('Spam: '+ spam);
        comment.isSpam = spam;
        next(null, req, dialogue, comment);
      }
    });
    
  }.bind(this);
};

module.exports = function(opts) {
  return new AkismetProcessor(opts);
};