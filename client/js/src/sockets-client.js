define([], function() { 'use strict';

var SocketsClient = function(server) {

  var _socket = null;
  var _subscriptions = {};

  var _getDialogueId = function(dialogue) {
    return JSON.stringify(dialogue);
  };

  var _onConnect = function() {
    for (var id in _subscriptions) {
      if (_subscriptions.hasOwnProperty(id)) {
        _subscribe(id);
      }
    }
  };

  var _onUpdate = function(update) {
    var id = _getDialogueId(update.dialogue);
    if (_subscriptions[id]) {
      $.each(_subscriptions[id], function(index, callback) {
        callback(update);
      })
    }
  };

  var _subscribe = function(id) {
    _socket.emit('subscribe', JSON.parse(id));
  };

  this.subscribe = function(dialogue, callback) {

    var id = _getDialogueId(dialogue);
    if (!_subscriptions[id]) {
      _subscriptions[id] = [];
    } 
    _subscriptions[id].push(callback);

    if (!_socket) {
      _socket = io.connect(server);

      _socket.on('update', _onUpdate);

      _socket.on('connect', _onConnect);
      _socket.on('reconnect', _onConnect);
    } else {
      _subscribe(id);
    }
  };
}

var instances = {};

return function(server) {
  // Verify if sockets are available
  if (typeof window.io === 'object') {
    if (!instances[server]) {
      instances[server] = new SocketsClient(server);
    }
    return SocketsClient[server];
  }
  return null;
};

});