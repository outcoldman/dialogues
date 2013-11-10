"use strict";

var url = require('url'),
    async = require('async'),
    _ = require('underscore'),
    utils = require('./utils'),
    httpUtils = require('./httpUtils');

var DEFAULT_VALUES = {
  verboseResponse: true,
  processors: [
    { type: 'gravatar', options: { } },
    { type: 'sensitive', options: { } }
  ]
};

var Dialogues = function(opts) {
  this._options = utils.merge(DEFAULT_VALUES, opts);
  this._socketListeners = {};

  this._storage = require('./storage/' + opts.storage.type)(opts.storage.options);

  this._processors = _.map(this._options.processors, function(p) {
    return require(p.type ? ('./processor/' + p.type) : p.custom)(p.options);
  });

  /*
  * Invoke all specified in options processors.
  */
  var _invokeProcessors = function(comments, callback) {
    async.waterfall(
      _.union(
        function(callback) { callback(null, comments); },
        _.map(this._processors, function(p) { return p.process }) 
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

  var _notifySocketListeners = function(dialogueId, updatedCommentaries) {
    var listeners = this._socketListeners[dialogueId];
    if (listeners) {
      _.each(listeners, function(socket) {
        socket.emit('update', {
          id: dialogueId,
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

    async.waterfall([
      function(callback) {
        callback(null, reqUrl.query.id)
      },
      this._storage.getAll,
      _invokeProcessors
    ], function(err, comments) {
      _writeResponse(req, res, err, comments);
    });
  }.bind(this);

  var _postHandler = function(req, res) {
    var dialogueId = '';

    async.waterfall([
      function(callback) {
        callback(null, req);
      },
      httpUtils.readAsJson,
      function(msg, callback) {
        var comment = msg.comment;
        comment.date = new Date();
        comment.userIP = httpUtils.getClientIP(req);
        comment.userAgent = req.headers['user-agent'];
        dialogueId = msg.id;
        callback(null, dialogueId, comment);
      },
      this._storage.add,
      function(comment, callback) {
        callback(null, [comment]);
      },
      _invokeProcessors
    ], function(err, comments) {
      _writeResponse(req, res, err, comments);
      if (!err) {
        _notifySocketListeners(dialogueId, comments);
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
