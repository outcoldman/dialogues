define([
  './jQuery'
],
function($) { 'use strict';

var EventsAggregator = function() {
  var that = this;
  var listeners = {};

  that.subscribe = function(key, callback) {
    if (typeof listeners[key] === 'undefined') {
      listeners[key] = [];
    }
    listeners[key].push(callback);
  };

  that.unsubscribe = function(key, callback) {
    if (typeof listeners[key] !== 'undefined') {
      for (var index = 0; index < listeners[key].length; index++) {
        if (listeners[key][index] === callback) {
          listeners[key].splice(index, 1);
          break;
        }
      }
      if (listeners[key].length === 0) {
        delete listeners[key];
      }
    }
  };

  that.raise = function(key, data) {
    if (typeof listeners[key] !== 'undefined') {
      $.each(listeners[key], function(index, callback) {
        callback(data);
      });
    }
  };
}

var eventsAggregators = {};

return {
  get: function(host, id) {
    var key = host+ '_' + id;
    return eventsAggregators[key] || (eventsAggregators[key] = new EventsAggregator());
  },

  destroy: function(host, id) {
    var key = host+ '_' + id;
    delete eventsAggregators[key];
  }
};

});