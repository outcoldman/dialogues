/*
* File storage for commentaries.
*/

/*jshint globalstrict: true*/ 'use strict';

var fs = require('fs'),
    path = require('path');

var Storage = module.exports = function(options) {
  if (!options.path) {
    throw new Error('file storage requires `path` option, which defines where to store files');
  }

  this.options = options;
  this.storageDir = this.options.path;
};

Storage.prototype.getPath = function(dialogueId) {
  return path.join(this.storageDir, dialogueId.replace(/[<>\\\/?*|]/g, '_'));
};

Storage.prototype.getAll = function(dialogueId, cb) {
  var path = this.getPath(dialogueId);
  fs.exists(path, function(exists) {
    if (exists) {
      fs.readFile(path, function(err, data) {
        if (err) cb(err, null);
        else {
          cb(null, JSON.parse('[' + data.toString().substring(0, data.length - 1) + ']'));
        }
      });
    } else {
      cb(null, []);
    }
  });
};

Storage.prototype.add = function(comment, cb) {
  comment.id = (new Date()).getTime();

  var path = this.getPath(comment.dialogueId);
  fs.writeFile(path, JSON.stringify(comment) + ',', { flag: 'a' }, function(err) {
    cb(err, comment);
  });
};