define([
  './jQuery'
], 
function($) { 'use strict';

var RestClient = function(options) {
  var _server = options.server;
  var _hostId = options.host;
  var _dialoguesId = options.id;

  this.getAll = function(callback) {
    $.getJSON(
      _server, 
      { host: _hostId, id: _dialoguesId }, 
      function(data) {
        callback(null, data);
      })
    .fail(function(jqxhr, textStatus, error) {
      callback({ message: textStatus, error: error }, null);
    });
  };

  this.post = function(comment, callback) {
    var data = JSON.stringify({ 
      id: _dialoguesId,
      host: _hostId,
      comment: comment
    });
    $.post(
      _server, 
      data, 
      function(result, textStatus, jqXHR) {
        callback(null, result);
      },
      'json')
    .fail(function(jqxhr, textStatus, error) {
      callback({ message: textStatus, error: error }, null);
    });
  };
};

return RestClient;

});