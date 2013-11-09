(function() {

  "use strict"

  var repository = [ 
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
    ];

  var defaultOptions = {
    "antispam" : [],
    "repositories" : []
  };

  /**
   * Create an comments module object.
   *
   * @return {Function}
   */
  function createCommentsModule() {
    return app;
  }

  var exports = module.exports = createCommentsModule;

  var handleGet = function(req, res) {
    var responseBody = JSON.stringify(repository);
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
      var comment = JSON.parse(jsonBody);
      comment.date = date;
      comment.icon = 'http://www.gravatar.com/avatar/2b15c840567bd7ec9372352a9905f3bb?s=80&d=identicon';
      comment.id = "" + date;
      repository.push(comment);

      var responseBody = JSON.stringify(comment);
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

})();