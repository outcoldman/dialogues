(function() { 'use strict';

  if (!$) throw new Error('jQuery is not loaded!');

  var defaultDateFormatter = function(date) {
    var d = new Date();
    d.setTime(date + d.getTimezoneOffset());
    return d.toLocaleString();
  }

  var module = {};
  var defaultOptions = {
    server: '/api/comments/', // url to commentaries
    debug: false, // enable additional logging
    load: { // loading settings
      manual: false, // true if you want to load commentaries in special moment with load() method
      delay: true // true if you want to load comments only when they will be visible on page.
    },
    render: {
      commentRenderer: null,
      dateFormatter: defaultDateFormatter,
      template: 
'<section class="comment">\
  <a class="user-link" >\
    <img class="avatar" height=80 width=80 />\
  </a>\
  <div class="header">\
    <div>\
      <a class="user-name user-link" />\
      <a class="comment-link">\
        <span class="date" />\
      </a>\
    </div>\
  </div>\
  <div class="comment-body" />\
</section>',
      selectors: {
        userName: 'a.user-name', // 
        userLink: 'a.user-link', // 
        icon: 'img.avatar',
        date: 'span.date',
        body: 'div.comment-body',
        commentLink: 'a.comment-link' 
      }
    },
    resources: {
      anonymous: 'Anonymous'
    }
  };

  var root = window, previousComments;
  previousComments = root.comments;

  /*
   * If global object `comments` already defined this method allows to resolve conflicts.
   * Call it to get access to current module.
  */
  module.noConflict = function () {
    root.comments = previousComments;
    return module;
  };

  /*
   * Render comments on element.
   * @param {string|object} - query selector string for element or element itself.
   * @options {object=} - options for rendering comments
  */ 
  module.render = function(el, options) {
    options = options ? merge(options, defaultOptions) : defaultOptions;

    var element = $(el);
    if (element) {
      return new CommentsInstance(element, options);
    } else if (options.debug) {
      console.error('Cannot get element ' + el);
    }
  };

  /*
   * Merge two objects, copy all properties (with nested objects) from b to a.
  */ 
  var merge = function(a, b) {
    for (var propertyName in b) {
      if (b.hasOwnProperty(propertyName)) {
        var aProperty = typeof a[propertyName];
        if (aProperty === 'undefined') {
          a[propertyName] = b[propertyName];
        } else if (aProperty === 'object') {
          a[propertyName] = merge(a[propertyName], b[propertyName]);
        }
      }
    }
    return a;
  }

  /*
   * Render method returns instance of this type, which can be used to 
   * manipulate with commentaries on the page.
  */ 
  var CommentsInstance = function ($el, options) {

    this.$el = $el;
    this._options = options;
    this._load = options.load;
    this._render = options.render;

    /*
     * Render comment and append element to main element this.el
    */ 
    var renderComment = function(comment) {
      var selectors = this._render.selectors;

      var commentSection = $(this._render.template)
        .data('comment', comment);

      var name = comment.userName || this._options.resources.anonymous;

      if (comment.icon && selectors.icon) {
        $(selectors.icon, commentSection)
          .attr({
            alt: name,
            src: comment.icon
          });
      }
      
      if (comment.link) {
        $(selectors.userLink, commentSection).attr({ href: comment.link });
      } else {
        console.log('disabled');
        $(selectors.userLink, commentSection).attr({ disabled: true });
      }

      $(selectors.userName, commentSection).text(name);

      if(selectors.date && comment.date) {
        var date = comment.date;
        if (this._render.dateFormatter) {
          date = this._render.dateFormatter(date);
        }
        $(selectors.date, commentSection).text(date);
      }

      if (selectors.commentLink && comment.id) {
        var sectionId = 'comment_' + comment.id;
        var url = document.location;
        $(selectors.commentLink, commentSection).attr({
          href: url.href.substr(0, url.href.length - url.hash.length) + '#' + sectionId
        });
        commentSection.attr({ id: sectionId });
      }
      
      $(selectors.body, commentSection)
        .html(comment.body);

      this.$el.append(commentSection);
    }.bind(this);

    /*
     * Load commentaries from server
    */
    this.load = function() {
      $.get(this._options.server, function(data) {
        var commentRenderer = typeof this._render === 'function' ? this._render : renderComment;
        for (var i = 0; i < data.length; i++) {
          commentRenderer(data[i], i, this.$el);
        }
      }.bind(this)).fail(function(req, error, status) {
        if (this._options.debug) {
          console.error('Cannot load comments from server, error: ' + error + ', response: ' + status);
        }
        /* TODO: show error to user. */
      }.bind(this));
    }.bind(this);

    this.add = function() {

    }.bind(this);

    if (this._load && !this._load.manual) {
      if (this._load.delay) {
        var loaded = false;
        var loadOnVisible = function () {
          if (!loaded && this.$el[0].getBoundingClientRect().top <= window.innerHeight) {
            this.load();
            loaded = true;
          }
        }.bind(this);
        loadOnVisible();
        // if comments got loaded on page show - no reason to subscribe on scroll event.
        if (!loaded) {
          window.onscroll = loadOnVisible;
        }
      } else {
        this.load();
      }
    }
  };

  /*
   * Module registration.
  */ 
  if (typeof define !== 'undefined' && define.amd) {
    define([], function () {
        return module;
    });
  } else {
    root.comments = module;
  }

})();