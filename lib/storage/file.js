/*
* File storage for commentaries.
*/

"use strict";

var fs = require('fs'),
    path = require('path');

var Storage = function(opts) {
  if (!opts.path) {
    throw new Error('file storage requires `path` option, which defines where to store files');
  }

  this._options = opts;
  this._storageDir = opts.path;

  var _getPath = function(dialogue) {
    return path.join(this._storageDir, (dialogue.host + '__' + dialogue.id).replace(/[<>\\\/?*|]/g, '_'));
  }.bind(this);

  this.getAll = function(dialogue, callback) {
    var path = _getPath(dialogue);
    fs.exists(path, function(exists) {
      if (exists) {
        fs.readFile(path, function(err, data) {
          if (err) callback(err, null);
          else {
            callback(null, JSON.parse('[' + data.toString().substring(0, data.length - 1) + ']'));
          }
        })
      } else {
        callback(null, []);
      }
    });
  };

  this.add = function(dialogue, comment, callback) {
    comment.id = (new Date()).getTime();

    var path = _getPath(dialogue);
    fs.writeFile(path, JSON.stringify(comment) + ',', { flag: 'a' }, function(err) {
      callback(err, comment);
    });
  };
}

module.exports = function(opts) {
  return new Storage(opts);
}