/*jshint globalstrict: true*/ 'use strict';

var url = require('url'),
    async = require('async'),
    _ = require('underscore'),
    httpUtils = require('./httpUtils'),
    MiddlewareProcessor = require('./middlewareProcessor'),
    JSONStream = require('JSONStream');

var DEFAULT_OPTIONS = {
  verboseResponse: true,
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

var Dialogues = module.exports = function(opts) {
  this.options = _.defaults(opts, DEFAULT_OPTIONS);
  this.storage = require('./storage/' + opts.storage.type)(opts.storage.options);

  this.middlewareProcessor = new MiddlewareProcessor(this.options.middleware);
};

/*
 * Request handler.
 * All urls should have /area/topic/ query parameters.
 */
Dialogues.prototype.handleRequest = function(request, response) {
  var requestUrl = url.parse(request.url, true);

  var requestPath = requestUrl.pathname.split('/');

  var dialogue = {
    area: requestPath[requestPath.length - 3],
    topic: requestPath[requestPath.length - 2]
  };

  if (!dialogue.area || !dialogue.topic) {
    this.writeResponse(
      request,
      response,
      new Error('Bad Request'),
      { 
        status: 400,
      });
  } else {
    var handler = (request.method === 'GET') ? this.handleGET : 
      (request.method === 'PUT') ? this.handlePUT :
      (request.method === 'DELETE') ? this.handleDELETE :
      (request.method === 'POST') ? this.handlePOST :
      null;

    if (handler) {
      handler.call(this, request, response);
    } else {
      this.writeResponse(
        request, 
        response, 
        new Error('Method Not Allowed'),
        { 
          status: 405,
          headers: 'GET, PUT, DELETE, POST' 
        });
    }
  }
};

/*
 * GET request handler.
 */
Dialogues.prototype.handleGET = function(request, response, dialogue) {
  async.waterfall(
    [
      function(cb) {
        this.storage.getAll(dialogue, cb);
      }.bind(this),
      function(comments, cb) {
        this.middlewareProcessor.out(
          request, 
          response, 
          dialogue, 
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
};

/*
 * PUT request handler
 */
Dialogues.prototype.handlePUT = function(request, response, dialogue) {
  async.waterfall(
    [
      function(cb) {
        httpUtils.readAsJson(request, cb);
      }.bind(this),
      function(comment, cb) {
        this.middlewareProcessor.in(
          request, 
          response, 
          dialogue, 
          comment, 
          cb
        );
      }.bind(this),
      function(comment, cb) {
        this.storage.add(dialogue, comment, cb);
      }.bind(this),
      function(comment, cb) {
        this.middlewareProcessor.out(
          request, 
          response, 
          dialogue, 
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
  console.error(error);

  this.writeResponse(
    request, 
    response, 
    this._options.verboseResponse ? error : new Error('Internal Server Error'), 
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
