"use strict";

var url = require('url'),
    storageMangoose = require('./storage/mongoose'),
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

var writeToResponse = function(req, res, comments) {
  _.each(comments, function(comment) {
    comment.icon = gravatar.url(comment.email, {s: '80', d: 'mm'});
    delete comment.email;
    return comment;
  });

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

  storageMangoose.findDialogue(
    reqUrl.query.id, 
    function(comments) {
      writeToResponse(req, res, comments);
    });
};

var handlePost = function(req, res) {
  var jsonBody = "";
  req.on('data', function(chunk) {
    jsonBody += chunk;
  });
  req.on('end', function() {
    var date = new Date();
    date = (date.getTime() - date.getTimezoneOffset()*60*1000)/1000;
    var data = JSON.parse(jsonBody);
    data.comment.date = date;
    
    storageMangoose.addComment(
      data.id, 
      data.comment,
      function(comment) {
        writeToResponse(req, res, [comment]);
      });
  });
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