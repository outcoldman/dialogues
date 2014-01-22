/*
* MongoDB storage for commentaries.
*/

/*jshint globalstrict: true*/ 'use strict';

var mongo = require('mongodb'),
    _ = require('underscore');

var MongoClient = mongo.MongoClient,
    ObjectID = mongo.ObjectID;

var Storage = function(opts) {

  if (!opts.connectionString) {
    throw new Error('mongodb storage requires `connectionString` option');
  }

  this._options = opts;

  var connection = null;
  var afterConnection = [];

  MongoClient.connect(this._options.connectionString, function(err, db){
    connection = {
      err: err,
      db: db
    };

    if (afterConnection) {
      _.each(afterConnection, function(callback) {
        callback();
      });

      afterConnection = null;
    }
  });

  var getDb = function(callback) {
    if (connection) {
      callback(connection.err, connection.db);
    } else {
      afterConnection.push(function() {
        callback(connection.err, connection.db);
      });
    }
  };

  this.getAll = function(dialogue, callback) {
    getDb(function(err, db){
      if (err) callback(err, null);
      else {
        var dialogues = db.collection('dialogues');
        dialogues.findOne({ _id: dialogue }, function(err, object) {
          if (err) callback(err, null);
          else {
            callback(null, object ? object.comments : []);
          }
        });
      }
    });
  };

  this.add = function(dialogue, comment, callback) {
    getDb(function(err, db){
      if (err) callback(err, null);
      else {
        var dialogues = db.collection('dialogues');
        comment.id = new ObjectID();
        dialogues.update(
          { _id: dialogue }, 
          { $push: { comments: comment } }, 
          { upsert: true },
          function(err) {
            if (err) callback(err, null);
            else callback(null, comment);
          });
      }
    });
  };
};

module.exports = function(opts) {
  return new Storage(opts);
};