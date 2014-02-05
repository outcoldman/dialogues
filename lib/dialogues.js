/*jshint globalstrict: true*/ 'use strict';

var url = require('url'),
    async = require('async'),
    _ = require('underscore'),
    httpUtils = require('./httpUtils'),
    MiddlewareProcessor = require('./middlewareProcessor'),
    JSONStream = require('JSONStream');

var DEFAULT_OPTIONS = {
  verboseResponse: true,
  middleware: {
    'out+*': [
      { type: 'unspam' },
      { type: 'gravatar' },
      { type: 'sensitive' },
      { type: 'clear' }
    ],
    'in+POST': [
      { type: 'clear' },
      { type: 'init' }
    ]
  }
};

var Dialogues = function(opts) {
  this.options = _.defaults(opts, DEFAULT_OPTIONS);
  this.storage = require('./storage/' + opts.storage.type)(opts.storage.options);

  this.middlewareProcessor = new MiddlewareProcessor(this.options.middleware);

  var _writeResponse = function(req, res, err, comments) {
    if (err) console.error(err);

    var messageBody;
    if (err) {
      messageBody = JSON.stringify(this._options.verboseResponse ? err : new Error('Server error'));
    } else {
      messageBody = JSON.stringify(comments);
    }

    res.writeHead(err ? 500 : 200, {
      'Content-Type': 'application/json',
      'Content-Length': messageBody.length,
      'Access-Control-Allow-Origin': req.headers.origin,
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Max-Age': 1000,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });

    res.end(messageBody);
  }.bind(this);


  var _getHandler = function(req, res) {
    var reqUrl = url.parse(req.url, true);
    var dialogue = {
      id: reqUrl.query.id,
      host: reqUrl.query.host
    };
    async.waterfall([
      function(next) {
        next(null, dialogue);
      },
      this.storage.getAll,
      function(comments, next) {
        this.middlewareProcessor.out(req, res, dialogue, comments, function(err, comments) {
          if (err) next(err);
          else {
            next(null, comments);
          }
        });
      }.bind(this)
    ], function(err, comments) {
      _writeResponse(req, res, err, comments);
    });
  }.bind(this);

  var _postHandler = function(req, res) {
    var dialogue;

    async.waterfall([
      function(next) {
        next(null, req);
      },
      httpUtils.readAsJson,
      function(msg, next) {
        var comment = msg.comment;

        dialogue = {
          id: msg.dialogues.id,
          host: msg.dialogues.host
        };

        next(null, dialogue, comment);
      },
      function(dialogue, comment, next) {
        this.middlewareProcessor.in(req, res, dialogue, [comment], function(err, comments) {
          if (err) next(err);
          else {
            next(null, dialogue, comments[0]);
          }
        });
      }.bind(this),
      this.storage.add,
      function(comment, next) {
        this.middlewareProcessor.out(req, res, dialogue, [comment], function(err, comments) {
          if (err) next(err);
          else {
            next(null, comments);
          }
        });
      }.bind(this)
    ], function(err, comments) {
      _writeResponse(req, res, err, comments);
    });
  }.bind(this);

  /*
  * Handler for http requests.
  */
  this.httpHandler = function(req, res) {
    switch(req.method) {
      case 'GET':
        _getHandler(req, res);
        break;
      case 'POST':
        _postHandler(req, res);
        break;
      default:
        throw new Error('Verb ' + req.method + ' is not supported.');
    }
  }.bind(this);
};

module.exports = function(opts) {
  return new Dialogues(opts);
};