"use strict";

var _ = require('underscore');

var _merge = function(a, b) {
  if (b) {
    for (var propertyName in b) {
      if (_.has(b, propertyName)) {
        if (_.isUndefined(a[propertyName])) {
          a[propertyName] = b[propertyName];
        } else if (_.isObject(a[propertyName])) {
          a[propertyName] = _merge(a[propertyName], b[propertyName]);
        }
      }
    }
  }
  return a;
}

module.exports = {
  /*
  * Merge two objects, copy all properties (with nested objects) from b to a.
  */ 
  merge: _merge
};