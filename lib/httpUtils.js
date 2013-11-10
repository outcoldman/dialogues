"use strict";

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

module.exports = {
  /*
  * Read whole request body as plain text.
  */
  readAsPlainText: _readAsPlainText,

  /*
  * Read whole request body as plain text and parse as JSON.
  */
  readAsJson: _readAsJson
};