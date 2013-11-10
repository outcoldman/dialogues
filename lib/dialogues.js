"use strict";

var url = require('url'),
    async = require('async'),
    _ = require('underscore'),
    utils = require('./utils'),
    httpUtils = require('./httpUtils');

var DEFAULT_VALUES = {
  verboseResponse: true,
  'get-processors': [
    { type: 'gravatar', options: { } },
    { type: 'sensitive', options: { } }
  ],
  'set-processors': [
  ]
};

var Dialogues = function(opts) {
  this._options = utils.merge(DEFAULT_VALUES, opts);
  this._socketListeners = {};

  this._storage = require('./storage/' + opts.storage.type)(opts.storage.options);

  this._getProcessors = _.map(this._options['get-processors'], function(p) {
    return require(p.type ? ('./get-processor/' + p.type) : p.custom)(p.options);
  });

  this._setProcessors = _.map(this._options['set-processors'], function(p) {
    return require(p.type ? ('./set-processor/' + p.type) : p.custom)(p.options);
  });

  /*
  * Filter all spam comments
  */
  var _filterSpam = function(comments) {
    return _.filter(comments, function(comment){
      return !comment.isSpam;
    });
  }

  /*
  * Invoke all specified in options processors for getting commentaries.
  */
  var _invokeGetProcessors = function(req, dialogue, comments, callback) {
    async.waterfall(
      _.union(
        function(next) { next(null, req, dialogue, comments); },
        _.map(this._getProcessors, function(p) { return p.process }) 
      ),
      callback
    );
  }.bind(this);

  /*
  * Invoke all specified in options processors for settings commentaries.
  */
  var _invokeSetProcessors = function(req, dialogue, comment, callback) {
    async.waterfall(
      _.union(
        function(next) { next(null, req, dialogue, comment); },
        _.map(this._setProcessors, function(p) { return p.process }) 
      ),
      callback
    );
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

  var _notifySocketListeners = function(dialogue, updatedCommentaries) {
    var listeners = this._socketListeners[dialogue.id];
    if (listeners) {
      _.each(listeners, function(socket) {
        socket.emit('update', {
          id: dialogue.id,
          comments: updatedCommentaries
        });
      });
    }
  }.bind(this);

  var _onSubscribeSocket = function(data, socket) {
    if (!this._socketListeners[data.id]) {
      this._socketListeners[data.id] = [];
    }
    // In case of if the same socket is trying to connect twice.
    if (this._socketListeners[data.id].indexOf(socket) < 0) {
      this._socketListeners[data.id].push(socket);
    }
  }.bind(this);

  var _onDisconnectSocket = function(socket) {
    for (var id in _.keys(this._socketListeners)) {
      if (_.has(this._socketListeners, id)) {
        this._socketListeners[id] = _.without(this._socketListeners[id], socket);
        if (this._socketListeners[id].length === 0) {
          delete this._socketListeners[id];
        }
      }
    }
  }.bind(this);

  var _getHandler = function(req, res) {
    var reqUrl = url.parse(req.url, true);
    var dialogue = {
      id: reqUrl.query.id,
      host: reqUrl.query.host
    };
    async.waterfall([
      function(next) {
        next(null, dialogue)
      },
      this._storage.getAll,
      function(comments, next) {
        next(null, req, dialogue, _filterSpam(comments));
      },
      _invokeGetProcessors
    ], function(err, r, dialogue, comments) {
      _writeResponse(req, res, err, comments);
    });
  }.bind(this);

  var _postHandler = function(req, res) {
    var dialogue = null;

    async.waterfall([
      function(next) {
        next(null, req);
      },
      httpUtils.readAsJson,
      function(msg, next) {
        var comment = msg.comment;
        comment.date = new Date();
        comment.userIP = httpUtils.getClientIP(req);
        comment.userAgent = req.headers['user-agent'];
        comment.isSpam = false;
        dialogue = {
          id: msg.id,
          host: msg.host
        }
        next(null, req, dialogue, comment);
      },
      _invokeSetProcessors,
      function(req, dialogue, comment, next) {
        next(null, dialogue, comment);
      },
      this._storage.add,
      function(comment, next) {
        next(null, req, dialogue, [comment]);
      },
      _invokeGetProcessors
    ], function(err, r, dialogue, comments) {
      _writeResponse(req, res, err, comments);
      if (!err) {
        comments = _filterSpam(comments);
        if (comments.length > 0) {
          _notifySocketListeners(dialogue, comments);
        }
      }
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

  /*
  * Handler for socket connections.
  */
  this.socketHandler = function(socket) {
    socket.on('subscribe', function(data) {
      _onSubscribeSocket(data, socket);
    });
    socket.on('disconnect', function() {
      _onDisconnectSocket(socket);
    });
  }.bind(this);
}

module.exports = function(opts) {
  return new Dialogues(opts);
}
