/*jshint globalstrict: true*/ 'use strict';

var async = require('async'),
    url = require('url'),
    _ = require('underscore'),
    httpUtils = require('./../httpUtils'),
    MiddlewareProcessor = require('./middlewareProcessor'),
    CommentsAPI = require('./comments/api'),
    ResponseWriter = require('./responseWriter');

var DEFAULT_OPTIONS = {
  responseWriter: {
    verboseResponse: false
  },
  storage: {
    type: 'memory'
  },
  middleware: {
    'out+*': [
      { type: 'unspam' },
      { type: 'gravatar' },
      { type: 'sensitive' },
      { type: 'clear' }
    ],
    'in+POST': [
      { type: 'clear' },
      { type: 'init' }
    ]
  }
};

var Dialogues = module.exports = function(options) {
  this.options = _.defaults(options, DEFAULT_OPTIONS);

  this.writer = new ResponseWriter(this.options.responseWriter);

  var CommentsStorage = require('./storage/' + this.options.storage.type);
  this.storage = new CommentsStorage(this.options.storage.options);

  this.middlewareProcessor = new MiddlewareProcessor(this.options.middleware);
};

/*
 * Request handler.
 * All urls should have /area/topic/ query parameters.
 */
Dialogues.prototype.handleRequest = function(request, response) {
  var method = request.method.toLowerCase();
  if (!this[method]) {
    // Method is not supported
    this.writeResponse(
      request, 
      response, 
      new Error('Method Not Allowed'),
      { 
        status: 405,
        headers: {
          'Allowed': 'GET, PUT, DELETE, POST'
        }
      });
  } else {
    this[method](request, response);
  }
};

/*
 * GET handler
 */
Dialogues.prototype.get = function(request, response) {
  var query = url.parse(request.url).query;
  if (!query.dialogueId) {
    this.writeResponse(
      request,
      response,
      new Error('DialogueId is expected'),
      { 
        status: 400 
      });
  } else {
    var dialogueId = JSON.parse(query.dialogueId);
    async.waterfall(
      [
        function(cb) {
          this.storage.getAll(dialogueId, cb);
        }.bind(this),
        function(comments, cb) {
          this.middlewareProcessor.out(
            request,
            response,
            comments,
            cb
          );
        }.bind(this)
      ],
      function(error, comments) {
        if (error) {
          this.handleUnknownError(
            request,
            response,
            error);
        } else {
          this.writeResponse(
            request,
            response,
            comments,
            { 
              status: 200 
            });
        }
      }.bind(this)
    );
  }
};

/*
 * PUT handler
 */
Dialogues.prototype.put = function(request, response) {
  async.waterfall(
    [
      function(cb) {
        httpUtils.readAsJson(request, cb);
      }.bind(this),
      function(comment, cb) {
        this.middlewareProcessor.in(
          request,
          response,
          comment,
          cb
        );
      }.bind(this),
      function(comment, cb) {
        this.storage.add(comment, cb);
      }.bind(this),
      function(comment, cb) {
        this.middlewareProcessor.out(
          request,
          response,
          comment,
          cb
        );
      }.bind(this)
    ],
    function(error, comment) {
      if (error) {
        this.handleUnknownError(
          request,
          response,
          error);
      } else {
        this.writeResponse(
          request,
          response,
          comment,
          { 
            status: 201 
          });
      }
    }.bind(this)
  );
};

/*
 * Handler for unknown server errors
 */
Dialogues.prototype.handleUnknownError = function(request, response, error) {
  this.writeResponse(
    request, 
    response, 
    this.options.verboseResponse ? error : new Error('Internal Server Error'), 
    { 
      status: 501 
    });
};

/*
 * Write data to response
 */
Dialogues.prototype.writeResponse = function(request, response, data, settings) {
  var body = data ? JSON.stringify(data) : null;
  
  var headers = settings.headers || {};
  if (body) {
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = body.length;
  }

  response.writeHead(
    settings.status, 
    headers
  );

  if (body) {
    response.write(body);
  }

  response.end();
};
