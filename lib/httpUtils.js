/*jshint globalstrict: true*/ 'use strict';

var _readAsPlainText = function(req, callback) {
  var body = '';

  req.on('data', function (data) {
    body += data;
    // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
    if (body.length > 1e6) { 
      // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
      req.connection.destroy();
      callback(new Error('Request is too big.'), null);
    }
  });

  req.on('end', function () {
    callback(null, body);
  });
};

var _readAsJson = function(req, callback) {
  _readAsPlainText(req, function(err, result) {
    if (err) callback(err, null);
    callback(null, JSON.parse(result));
  });
};

var _getClientIP = function(req) {
  var address;
  // The request may be forwarded from local web server.
  var forwardedIpsStr = req.headers['x-forwarded-for']; 
  if (forwardedIpsStr) {
    // 'x-forwarded-for' header may return multiple IP addresses in
    // the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
    // the first one
    var forwardedIps = forwardedIpsStr.split(',');
    address = forwardedIps[0];
  }
  if (!address) {
    // If request was not forwarded
    address = req.connection.remoteAddress;
  }
  return address;
};

module.exports = {
  /*
  * Read whole request body as plain text.
  */
  readAsPlainText: _readAsPlainText,

  /*
  * Read whole request body as plain text and parse as JSON.
  */
  readAsJson: _readAsJson,

  /*
  * Get client IP address.
  */
  getClientIP: _getClientIP
};