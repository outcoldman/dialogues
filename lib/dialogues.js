"use strict";

var url = require('url'),
    storage = require('./storage/mongoose'),
    gravatar = require('gravatar'),
    _ = require('underscore');

/**
 * Create an dialogues module object.
 *
 * @return {Function}
 */
function createDialoguesModule() {
  return app;
}

var exports = module.exports = createDialoguesModule;

var currentListeners = {};

var preprocessComments = function(comments) {
  _.each(comments, function(comment) {
    comment.icon = gravatar.url(comment.email, {s: '80', d: 'mm'});
    delete comment.email;
    return comment;
  });

  return comments;
}

var writeToResponse = function(req, res, comments) {
  var responseBody = JSON.stringify(comments);
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Content-Length': responseBody.length,
    'Access-Control-Allow-Origin': req.headers.origin,
    'Access-Control-Allow-Methods': 'GET, POST',
    'Access-Control-Max-Age': 1000,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  });
  res.end(responseBody);
}

var handleGet = function(req, res) {
  var reqUrl = url.parse(req.url, true);

  storage.findDialogue(
    reqUrl.query.id, 
    function(comments) {
      console.log(comments);
      writeToResponse(req, res, preprocessComments(comments));
    });
};

var handlePost = function(req, res) {
  var jsonBody = "";
  req.on('data', function(chunk) {
    jsonBody += chunk;
  });
  req.on('end', function() {
    var data = JSON.parse(jsonBody);

    data.comment.date = new Date();
    
    storage.addComment(
      data.id, 
      data.comment,
      function(comment) {
        var comments = preprocessComments([comment]);

        writeToResponse(req, res, comments);

        if (currentListeners[data.id]) {
          _.each(currentListeners[data.id], function(socket) {
            socket.emit('update', {
              id: data.id,
              comments: comments
            });
          });
        }
      });
  });
};

var socketHandle = function(socket) {
  socket.on('subscribe', function(data) {
    if (!currentListeners[data.id]) {
      currentListeners[data.id] = [];
    }
    currentListeners[data.id].push(socket);
  });

  socket.on('disconnect', function() {
    for (var id in _.keys(currentListeners)) {
      if (_.has(currentListeners, id)) {
        currentListeners[id] = _.without(currentListeners[id], socket);
        if (currentListeners[id].length === 0) {
          delete currentListeners[id];
        }
      }
    }
  })
};

/**
* Handle function, which can be used with simple http node module.
*
* @param {http.ClientRequest} req - request object.
* @param {http.ServerResponse} res - response object.
*/
exports.httpHandle = function(req, res) {
  if (req.method == 'GET') {
    handleGet(req, res);
  } else if (req.method == 'POST') {
    handlePost(req, res);
  } else {
    throw new Error('Verb ' + req.method + ' is not supported');
  }
}

exports.socketHandle = socketHandle;
