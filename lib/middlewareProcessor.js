/*jshint globalstrict: true*/ 'use strict';

var _ = require('underscore'),
    async = require('async'),
    middlewareCaller = require('./middlewareCaller'),
    BreakError = require('./error').BreakError;

var MiddlewareProcessor = module.exports = function(middlewareOptions) {
  function fillVerbMiddleware(verbMiddleware, options) {
    if (!options) {
      return false;
    }
    
    for (var middlewareIndex = (options.length - 1); middlewareIndex >= 0; middlewareIndex--) {
      var middleware = options[middlewareIndex];
      if (!middleware) {
        continue;
      }
      if (!middleware.caller) {
        var path = middleware.type ? ('./middleware/' + middleware.type) : middleware.custom;
        var Middleware = require(path);
        middleware.caller = middlewareCaller(new Middleware(middleware.options || {}));
      }
      
      verbMiddleware.splice(middlewareIndex, 0, middleware.caller);
    }

    return true;
  }

  this.middleware = { in: {}, out: {} };
  _(this.middleware).each(function(directionMiddleware, direction) {
    _(['GET', 'PUT', 'POST', 'DELETE']).each(function(verb) {
      var verbMiddleware = directionMiddleware[verb] = [];

      if (!fillVerbMiddleware(verbMiddleware, middlewareOptions[direction + '-' + verb])) {
        fillVerbMiddleware(verbMiddleware, middlewareOptions[direction + '+*']);
        fillVerbMiddleware(verbMiddleware, middlewareOptions[direction + '+' + verb]);
      }
    });
  });
};

MiddlewareProcessor.prototype.in = function(req, res, dialogue, comments, cb) {
  this._process(this.middleware.in, req, res, dialogue, comments, cb);
};

MiddlewareProcessor.prototype.out = function(req, res, dialogue, comments, cb) {
  this._process(this.middleware.out, req, res, dialogue, comments, cb);
};

MiddlewareProcessor.prototype._process = function(middleware, req, res, dialogue, comments, cb) {
  var verbMiddleware = middleware[req.method];

  // Create data for each comment
  var commentsData = _(_.isArray(comments) ? comments : [comments]).map(function(comment) {
    return { 
      comment: comment,
      dialogue: dialogue,
      remove: false
    };
  });

  // Execute middleware for each comment
  async.each(
    commentsData, 
    function(data, cb) {
      // Execute middleware in sequence for comment
      async.applyEachSeries(
        verbMiddleware,
        req,
        res,
        data,
        function(err) {
          if (err !== BreakError) {
            cb(err);
          } else {
            cb();
          }
        }
      );
    },
    function(err) {
      if (err) {
        cb(err);
      } else {
        // Return only not removed comments
        var result = [];
        _.each(commentsData, function(data) {
          if (!data.remove) {
            result.push(data.comment);
          }
        });
        if (_.isArray(comments)) {
          cb(null, result);
        } else {
          cb(null, result[0]);
        }
      }
    }
  );
};