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
  body: { type: String, required: true }
})

var DialogueSchema = new Schema({
  _id: { type: String, required: true },
  comments: [CommentSchema]
});

var Storage = function(opts) {

  if (!this._options.connectionString) {
    throw new Error('mongodb storage requires `connectionString` option')
  }

  this._options = opts;

  mongoose.connect(this._options.connectionString);

  var Dialogue = mongoose.model('Dialogue', DialogueSchema);

  function _getOrInsertDialogue(dialogueId, callback) {
    Dialogue.findOne({_id: dialogueId}, function(err, dialogue) {
      if (err) callback(err, null);
      if (!dialogue) {
        dialogue = new Dialogue({ _id: dialogueId, comments: [] });
        dialogue.save(function (err) {
          callback(err, dialogue);
        });
      } else {
        callback(null, dialogue);
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

  this.getAll = function(dialogueId, callback) {
    _getOrInsertDialogue(dialogueId, function(err, dialogue) {
      if (err) callback(err, null);
      callback(err, _commentsToObjects(dialogue.comments))
    });
  }

  this.add = function(dialogueId, comment, callback) {
    _getOrInsertDialogue(dialogueId, function(err, dialogue) {
      if (err) callback(err, null);
      comment._id = mongoose.Types.ObjectId();
      dialogue.comments.push(comment);
      dialogue.save(function(err) {
        if (err) callback(err, null);
        callback(err, _commentToObject(comment));
      });
    });
  }
}

module.exports = function(opts) {
  return new Storage(opts);
};