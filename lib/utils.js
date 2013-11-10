"use strict";

var _ = require('underscore');

module.exports = {
  /*
  * Merge two objects, copy all properties (with nested objects) from b to a.
  */ 
  merge: function(a, b) {
    if (b) {
      for (var propertyName in b) {
        if (_.has(b, propertyName)) {
          if (_.isUndefined(a[propertyName])) {
            a[propertyName] = b[propertyName];
          } else if (_.isObject(a[propertyName])) {
            a[propertyName] = merge(a[propertyName], b[propertyName]);
          }
        }
      }
    }
    return a;
  }
};