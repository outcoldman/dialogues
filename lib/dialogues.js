/*jshint globalstrict: true*/ 'use strict';

var url = require('url'),
    async = require('async'),
    _ = require('underscore'),
    httpUtils = require('./httpUtils');

var DEFAULT_OPTIONS = {
  verboseResponse: true,
  middleware: {
    response: [
      { type: 'unspam' },
      { type: 'gravatar' },
      { type: 'sensitive' }
    ],
    request: [
    ]
  }
};

var Dialogues = function(opts) {
  this._options = _.extend(DEFAULT_OPTIONS, opts);

  this._storage = require('./storage/' + opts.storage.type)(opts.storage.options);

  this._getProcessors = _.map(this._options.middleware.response, function(p) {
    var Middleware = require(p.type ? ('./middleware/response/' + p.type) : p.custom);
    var factory = function(req, res) {
      return new Middleware(req, res, p.options || {});
    };
    return factory;
  });

  this._setProcessors = _.map(this._options.middleware.request, function(p) {
    var Middleware = require(p.type ? ('./middleware/request/' + p.type) : p.custom);
    var factory = function(req, res) {
      return new Middleware(req, res, p.options || {});
    };
    return factory;
  });

  /*
  * Invoke all specified in options processors for getting commentaries.
  */
  var _invokeResponseMiddleware = function(req, res, cb) {

    if (this._getProcessors.length === 0) {
      cb();
    } else {
      var streams = _.map(this._getProcessors, function(factory) {
        return factory(req, res);
      });

      for (var index = 1; index < streams.length; index++) {
        streams[index - 1].pipe(streams[index]);
      }

      var comments = [];
      streams[streams.length - 1]
        .on('data', function(comment) {
          comments.push(comment);
        })
        .on('end', function() {
          res.comments = comments;
          cb();
        })
        .on('error', cb);

      _.each(res.comments, function(comment) {
        streams[0].write(comment);
      });

      streams[0].end();
    }
  }.bind(this);

  /*
  * Invoke all specified in options processors for settings commentaries.
  */
  var _invokeRequestMiddleware = function(req, cb) {
    cb();
  }.bind(this);

  var _writeResponse = function(req, res, err, jsonData) {
    if (err) console.error(err);

    var messageBody = '';

    if (err) {
      messageBody = JSON.stringify(this._options.verboseResponse ? err : new Error('Server error'));
    } else {
      messageBody = JSON.stringify(jsonData);
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
    req.dialogue = {
      id: reqUrl.query.id,
      host: reqUrl.query.host
    };
    async.waterfall([
      function(next) {
        next(null, req.dialogue);
      },
      this._storage.getAll,
      function(comments, next) {
        res.comments = comments;
        next(null, req, res);
      },
      _invokeResponseMiddleware
    ], function(err) {
      _writeResponse(req, res, err, res.comments);
    });
  }.bind(this);

  var _postHandler = function(req, res) {
    async.waterfall([
      function(next) {
        next(null, req);
      },
      httpUtils.readAsJson,
      function(msg, next) {
        req.comment = msg.comment;
        req.comment.date = new Date();
        req.comment.userIP = httpUtils.getClientIP(req);
        req.comment.userAgent = req.headers['user-agent'];
        req.comment.isSpam = false;

        req.dialogue = {
          id: msg.dialogues.id,
          host: msg.dialogues.host
        };

        next(null, req);
      },
      _invokeRequestMiddleware,
      function(next) {
        next(null, req.dialogue, req.comment);
      },
      this._storage.add,
      function(comment, next) {
        res.comments = [comment];
        next(null, req, res);
      },
      _invokeResponseMiddleware
    ], function(err) {
      _writeResponse(req, res, err, res.comments);
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