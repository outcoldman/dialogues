(function() { 'use strict';

  if (!$) throw new Error('jQuery is not loaded!');

  var module = {};
  var defaultOptions = {
    server: '/api/comments/', // url to commentaries
    debug: false, // enable additional logging
    loading: { // loading settings
      manual: false, // true if you want to load commentaries in special moment with load() method
      delay: true // true if you want to load comments only when they will be visible on page.
    },
    rendering: {
      block: '<div class="comment" />', // which element type should be used for each comment block.
      userName: '<div class="userName" />',
      imageClass: 'avatar',
      imageHeight: 80,
      imageWidth: 80,
      date: '<div />',
      dateClass: 'date',
      body: '<div class="body" />',
      userNameLink: '<a rel="nofollow" />'
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
    this.options = options;
    this.loading = options.loading;
    this.rendering = options.rendering;

    /*
     * Render comment and append element to main element this.el
    */ 
    var renderComment = function(comment) {
      var block = $(this.rendering.block);

      var userName = $(this.rendering.userName);
      if (comment.link) {
        userName = $(this.rendering.userNameLink)
          .attr({ href: comment.link })
          .appendTo(userName);
      }

      userName.text(comment.userName || this.options.resources.anonymous);
      
      var commentBody = $(this.rendering.body)
        .addClass(this.rendering.bodyClass)
        .html(comment.body);

      block.append(userName);
      block.append(commentBody);

      this.$el.append(block);
    }.bind(this);

    /*
     * Load commentaries from server
    */
    this.load = function() {
      $.get(this.options.server, function(data) {
        for (var i = 0; i < data.length; i++) {
          renderComment(data[i]);
        }
      }.bind(this)).fail(function(req, error, status) {
        if (this.options.debug) {
          console.error('Cannot load comments from server, error: ' + error + ', response: ' + status);
        }
        /* TODO: show error to user. */
      }.bind(this));
    }.bind(this);

    this.add = function() {

    }.bind(this);

    if (this.loading && !this.loading.manual) {
      if (this.loading.delay) {
        var loaded = false;
        var loadOnVisible = function () {
          if (!loaded && this.el.getBoundingClientRect().top <= window.innerHeight) {
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