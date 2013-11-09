(function() {

  "use strict"

  var repository = [ 
      { 
        userName: 'Thomas A. Anderson',
        link: 'http://en.wikipedia.org/wiki/Neo_(The_Matrix)',
        email: 'unknown@unknown.com',
        date: '1383972268',
        body: 'body message 0',
        icon: 'http://www.gravatar.com/avatar/2b15c840567bd7ec9372352a9905f3bb?s=80&d=identicon',
        id: 'article1_comment1'
      }, 
      { 
        userName: 'Agent Smith',
        link: 'http://en.wikipedia.org/wiki/Agent_Smith',
        email: 'unknown@unknown.com',
        date: '1383972208',
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
    res.write(responseBody);
    res.end();
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
      var comment = JSON.parse(jsonBody);
      repository.push(comment);

      res.writeHead(200);
      res.end();
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