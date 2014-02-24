/*
* MongoDB storage for commentaries.
*/

/*jshint globalstrict: true*/ 'use strict';

var mongo = require('mongodb'),
    _ = require('underscore');

var MongoClient = mongo.MongoClient,
    ObjectID = mongo.ObjectID;

var Storage = module.exports = function(options) {
  if (!options.connectionString) {
    throw new Error('mongodb storage requires `connectionString` option');
  }

  this.options = options;

  this.connection = null;
  this.afterConnection = [];

  MongoClient.connect(this._options.connectionString, function(err, db){
    this.connection = {
      err: err,
      db: db
    };

    if (this.afterConnection) {
      _.each(this.afterConnection, function(callback) {
        callback();
      });

      this.afterConnection = null;
    }
  }.bind(this));
};

Storage.prototype.getDb = function(cb) {
  if (this.connection) {
    cb(this.connection.err, this.connection.db);
  } else {
    this.afterConnection.push(function() {
      cb(this.connection.err, this.connection.db);
    }.bind(this));
  }
};

Storage.prototype.getAll = function(dialogueId, cb) {
  this.getDb(function(err, db){
    if (err) cb(err, null);
    else {
      var comments = db.collection('comments');
      comments.find({ dialogueId: dialogueId }, function(err, result) {
        if (err) cb(err, null);
        else {
          cb(null, result);
        }
      });
    }
  });
};

Storage.prototype.add = function(comment, cb) {
  this.getDb(function(err, db){
    if (err) cb(err, null);
    else {
      var comments = db.collection('comments');
      comments.save(
        comment,
        function(err) {
          if (err) cb(err, null);
          else cb(null, comment);
        });
    }
  });
};
