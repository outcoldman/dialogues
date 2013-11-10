var mongoose = require('mongoose'),
    _ = require('underscore');

var Schema = mongoose.Schema;

var CommentSchema = new Schema({
  _id: Schema.ObjectId,
  name: { type: String, required: false },
  website: { type: String, required: true },
  email: { type: String, required: true },
  date: { type: Number, required: true },
  body: { type: String, required: true }
})

var DialogueSchema = new Schema({
  _id: { type: String, required: true },
  comments: [CommentSchema]
});

mongoose.connect('mongodb://dialogues-user:dialogues-password@ds053778.mongolab.com:53778/dialogues-nko2013');

var Dialogue = mongoose.model('Dialogue', DialogueSchema);

function _underConnection(callback){
  callback();
}

function _getOrInsertDialogue(id, callback) {
  Dialogue.findOne({_id: id}, function(err, dialogue) {
    if (err) throw err;
    if (!dialogue) {
      dialogue = new Dialogue({ _id: id, comments: [] });
      dialogue.save(function (err) {
        if (err) throw err;
        callback(dialogue);
      });
    } else {
      callback(dialogue);
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
  })
}

function findDialogue(id, callback) {
  _underConnection(function() {
    _getOrInsertDialogue(id, function(dialogue) {
      callback(_commentsToObjects(dialogue.comments))
    });
  })
}

function addComment(id, comment, callback) {
  _underConnection(function() {
    _getOrInsertDialogue(id, function(dialogue) {
      comment._id = mongoose.Types.ObjectId();
      dialogue.comments.push(comment);
      dialogue.save(function() {
        callback(_commentToObject(comment));
      });
    });
  });
}

exports.findDialogue = findDialogue;
exports.addComment = addComment;