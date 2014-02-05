/*jshint globalstrict: true*/ 'use strict';

var BreakError = require('./error').BreakError;

module.exports = function(middleware) {
  var middlewareCaller = function(req, res, data, cb) {
    function invokeCallback(err) {
      if (err) {
        cb(err);
      } else if (data.remove) {
        cb(BreakError);
      } else {
        cb();
      }
    }
    if (middleware.process.length === 3) {
      middleware.process(req, res, data);
      invokeCallback();
    } else {
      middleware.process(req, res, data, invokeCallback);
    }
  };
  
  // For test/diagnostics purposes
  middlewareCaller.__middleware = middleware;

  return middlewareCaller;
};