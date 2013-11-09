"use strict";

var url = require('url');

var repository = {
  'my_blog_1': 
  [ 
    { 
      name: 'Thomas A. Anderson',
      website: null,
      email: 'unknown@unknown.com',
      date: 1383939073,
      body: 'body message 0',
      icon: 'http://www.gravatar.com/avatar/2b15c840567bd7ec9372352a9905f3bb?s=80&d=identicon',
      id: 'article1_comment1'
    }, 
    { 
      name: 'Agent Smith',
      website: 'http://en.wikipedia.org/wiki/Agent_Smith',
      email: 'unknown@unknown.com',
      date: 1383929073,
      body: 'body message',
      icon: 'http://www.gravatar.com/avatar/2b15c840567bd7ec9372352a9905f3bb?s=80&d=identicon',
      id: 'article1_comment2'
    } 
  ],
  'my_blog_2': 
  [ 
    { 
      name: 'Thomas A. Anderson',
      website: null,
      email: 'unknown@unknown.com',
      date: 1383939073,
      body: 'body message 0',
      icon: 'http://www.gravatar.com/avatar/2b15c840567bd7ec9372352a9905f3bb?s=80&d=identicon',
      id: 'article1_comment1'
    }, 
    { 
      name: 'Agent Smith',
      website: 'http://en.wikipedia.org/wiki/Agent_Smith',
      email: 'unknown@unknown.com',
      date: 1383929073,
      body: 'body message',
      icon: 'http://www.gravatar.com/avatar/2b15c840567bd7ec9372352a9905f3bb?s=80&d=identicon',
      id: 'article1_comment2'
    } 
  ]
};

var defaultOptions = {
  "antispam" : [],
  "repositories" : []
};

/**
 * Create an dialogues module object.
 *
 * @return {Function}
 */
function createDialoguesModule() {
  return app;
}

var exports = module.exports = createDialoguesModule;

var handleGet = function(req, res) {
  var reqUrl = url.parse(req.url, true);
  var responseBody = JSON.stringify(repository[reqUrl.query.id]);
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Content-Length': responseBody.length
  });
  res.end(responseBody);
};

var handleDelete = function(req, res) {
  throw new Error('Not implemented');
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
    data.comment.icon = 'http://www.gravatar.com/avatar/2b15c840567bd7ec9372352a9905f3bb?s=80&d=identicon';
    data.comment.id = "" + date;
    repository[data.id].push(data.comment);

    var responseBody = JSON.stringify(data.comment);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Length': responseBody.length
    });
    res.end(responseBody);
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
  } else if (req.method == 'DELETE') {
    handleDelete(req, res);
  } else {
    throw new Error('Verb ' + req.method + ' is not supported');
  }
}