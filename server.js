// https://github.com/nko4/website/blob/master/module/README.md#nodejs-knockout-deploy-check-ins
require('nko')('BcVz0EJtyJp_foHO');

var isProduction = (process.env.NODE_ENV === 'production');

var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    comments = require('./lib/comments');

var port = (isProduction ? 80 : 8000);

function staticResourceHandler(responce, resource, contentType) {
  var pagePath = path.join(__dirname, resource);

  responce.writeHead(200, {
    'Content-Type': contentType
  });

  fs.createReadStream(pagePath).pipe(responce);
}

http.createServer(function (req, res) {
  if (!isProduction) {
    console.log('Handling request: ' + req.url);
  }
  if (req.url === '/api/comments/') {
    comments.httpHandle(req, res);
  } else if (req.url === '/scripts/comments.js') {
    staticResourceHandler(res, './client/js/comments-client.js', 'text/javascript');
  } else if (req.url === '/') {
    staticResourceHandler(res, './test/onepage/page.html');
  } else {
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end('<html><body>Not found</body></html>\n');
  }
}).listen(port, function(err) {
  if (err) { console.error(err); process.exit(-1); }

  // if run as root, downgrade to the owner of this file
  if (process.getuid() === 0) {
    require('fs').stat(__filename, function(err, stats) {
      if (err) { return console.error(err); }
      process.setuid(stats.uid);
    });
  }

  console.log('Server running at http://0.0.0.0:' + port + '/');
});
