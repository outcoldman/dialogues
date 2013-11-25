define([
  './jQuery',
  './commentView'
], function($, CommentView) {

var CommentsView = function(options, $container) {
  var that = this;

  that.$container = $container;
  that.commentViews = [];

  that.add = function(comments) {
    $.each(comments, function(index, comment) {
      that.commentViews.push(new CommentView(options, that.$container, comment));
    });
  };

  that.contains = function(comment) {
    var exists = false;
    for (var index = 0; index < that.commentViews.length; index++) {
      if (that.commentViews[index].comment.id === comment.id) {
        return true;
      }
    }
    return false;
  };

  that.scrollToLatest = function() {
    var container = that.$container.get(0);
    if (container.scrollHeight > that.$container.height()) {
      that.$container.animate({ scrollTop: container.scrollHeight }, "slow");
    }
  };
};

return CommentsView;

});