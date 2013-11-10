/*
* MongoDB storage for commentaries.
*/

"use strict";

var mongoose = require('mongoose'),
    _ = require('underscore');

var Schema = mongoose.Schema;

var CommentSchema = new Schema({
  _id: Schema.ObjectId,
  name: { type: String, required: false },
  website: { type: String, required: false },
  email: { type: String, required: false },
  date: { type: Date, required: true },
  body: { type: String, required: true },
  userIP: { type: String, required: false },
  userAgent: { type: String, required: false },
  subscription: { type: Boolean, required: false },
  isSpam: { type: Boolean, required: false }
})

var DialogueSchema = new Schema({
  _id: { type: String, required: true },
  comments: [CommentSchema]
});

var Storage = function(opts) {

  if (!opts.connectionString) {
    throw new Error('mongodb storage requires `connectionString` option')
  }

  this._options = opts;

  mongoose.connect(this._options.connectionString);

  var Dialogue = mongoose.model('Dialogue', DialogueSchema);

  function _getOrInsertDialogue(dialogue, callback) {
    Dialogue.findOne({_id: dialogue.id}, function(err, dialogueMongo) {
      if (err) callback(err, null);
      if (!dialogueMongo) {
        dialogueMongo = new Dialogue({ _id: dialogue.id, comments: [] });
        dialogueMongo.save(function (err) {
          callback(err, dialogueMongo);
        });
      } else {
        callback(null, dialogueMongo);
      }
    });
  }

  function _commentToObject(comment) {
    if (comment.toObject) {
      comment = comment.toObject();
    }
    comment.id = comment._id;
    delete comment._id;
    return comment;
  }

  function _commentsToObjects(comments) {
    return _.map(comments, function(comment) {
      return _commentToObject(comment);
    });
  }

  this.getAll = function(dialogue, callback) {
    _getOrInsertDialogue(dialogue, function(err, dialogueMongo) {
      if (err) callback(err, null);
      callback(err, _commentsToObjects(dialogueMongo.comments))
    });
  }

  this.add = function(dialogue, comment, callback) {
    _getOrInsertDialogue(dialogue, function(err, dialogueMongo) {
      if (err) callback(err, null);
      comment._id = mongoose.Types.ObjectId();
      dialogueMongo.comments.push(comment);
      dialogueMongo.save(function(err) {
        if (err) callback(err, null);
        callback(err, _commentToObject(comment));
      });
    });
  }
}

module.exports = function(opts) {
  return new Storage(opts);
};