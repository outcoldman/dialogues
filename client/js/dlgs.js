(function() { 'use strict';

  if (!$) throw new Error('jQuery is not loaded!');

  var supportStorage = typeof(Storage)!=="undefined";

  /*
  * Get cookie by key
  */
  var getCookie = function (sKey) {
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  }

  /*
  * Set cookie (without expiration date)
  */
  var setCookie = function (sKey, sValue, sDomain, sPath) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
    document.cookie = 
      encodeURIComponent(sKey) + 
      "=" + 
      encodeURIComponent(sValue) + 
      "; expires=Fri, 31 Dec 9999 23:59:59 GMT" + 
      (sDomain ? "; domain=" + sDomain : "") + 
      (sPath ? "; path=" + sPath : "");
    return true;
  }

  /*
  * Get document url (without hash-tags)
  */
  var getDocumentUrl = function() {
    var url = document.location;
    return url.href.substr(0, url.href.length - url.hash.length);
  }

  var module = {};
  var defaultOptions = {
    $el: null,
    id: getDocumentUrl(),
    server: '/api/dialogues/', // url to load dialogues
    debug: false, // enable additional logging
    load: { // loading settings
      manual: false, // true if you want to load commentaries in special moment with load() method
      delay: true, // true if you want to load dialogues only when they will be visible on page.
      sockets: true // use sockets when available
    },
    render: { // Render options for commentaries
      templateContainer: '<ul class="dlgs-list" />', // Container for commentaries
      template: // Template for each commentary
'<li>\
  <section class="dlgs-comment">\
    <a class="dlgs-participant-website" >\
      <img class="dlgs-participant-avatar" height=80 width=80 />\
    </a>\
    <div class="dlgs-comment-header">\
      <div>\
        <a class="dlgs-participant-name dlgs-participant-website" />\
        <a class="dlgs-comment-link">\
          <span class="dlgs-comment-date" />\
        </a>\
      </div>\
    </div>\
    <div class="dlgs-comment-body" />\
  </section>\
</li>',
      selectors: { // Selectors for main elements which dialogues expects
        name: 'a.dlgs-participant-name',
        website: 'a.dlgs-participant-website',
        icon: 'img.dlgs-participant-avatar',
        date: 'span.dlgs-comment-date',
        body: 'div.dlgs-comment-body',
        commentLink: 'a.dlgs-comment-link' 
      }
    },
    preloadRender: {
      template: 
'<div style="text-align: center;">\
  <a href class="btn btn-primary btn-lg" style="width:80%;">New comments loaded...</button>\
</div>',
      selectors: {
        button: 'a'
      }
    },
    formRender: { // Render options for form
      templatePlaceholder: // Placeholder for form
'<div style="text-align: center;">\
  <a href class="btn btn-primary btn-lg" style="width:80%;">Reply</button>\
</div>',
      placeholderSelectors: { 
        button: 'a' // Add commentary button.
      },
      template: // Template for comment form
'<form role="form" class="dlgs-form">\
  <div class="row">\
    <div class="col-md-4">\
      <div class="form-group">\
        <label for="dlgs-participant-name-{id}">Display name:</label>\
        <input type="text" class="form-control" name="dlgs-participant-name" id="dlgs-participant-name{-id}" placeholder="Enter display name">\
      </div>\
      <div class="form-group">\
        <label for="dlgs-participant-email-{id}">Email:</label>\
        <input type="email" class="form-control" name="dlgs-participant-email" id="dlgs-participant-email-{id}" placeholder="Enter email">\
      </div>\
      <div class="form-group">\
        <label for="dlgs-participant-website-{id}">Website:</label>\
        <input type="url" class="form-control" name="dlgs-participant-website" id="dlgs-participant-website-{id}" placeholder="Enter website">\
      </div>\
      <div class="checkbox">\
        <label>\
          <input type="checkbox" name="dlgs-participant-subscription" id="dlgs-participant-subscription-{id}"> Notify about new comments\
        </label>\
      </div>\
    </div>\
    <div class="col-md-8">\
      <div class="form-group">\
        <label for="dlgs-comment-body-{id}">Body:</label>\
        <textarea class="form-control" rows="10" name="dlgs-comment-body" id="dlgs-comment-body-{id}" autofocus="true"></textarea>\
      </div>\
    </div>\
  </div>\
  <div class="dlgs-comment-preview" />\
  <div class="form-actions">\
    <button type="submit" class="btn btn-primary">Submit</button>\
    <button type="button" class="btn btn-default">Cancel</button>\
  </div>\
</form>',
      selectors: { // Selectors for main elements on form
        username: 'input[name=dlgs-participant-name]',
        email: 'input[name=dlgs-participant-email]',
        website: 'input[name=dlgs-participant-website]',
        subscription: 'input[name=dlgs-participant-subscription]',
        body: 'textarea[name=dlgs-comment-body]',
        submit: 'button[type=submit]',
        cancel: 'button[type=button]',
        preview: 'div.dlgs-comment-preview'
      }
    },
    dateFormatter: function(date) { // Default date formatter converts it to local string
      return date.toLocaleString();
    }, 
    bodyFormatter: function(text) { // Default body formatter is plain text
      return $('<div />').text(text).html().replace(/\n/g, '<br/>');
    }, 
    resources: { // String resources
      anonymous: 'Anonymous'
    }
  };

  var root = window, previousDialogues;
  previousDialogues = root.dialogues;

  /*
   * If global object `dialogues` already defined this method allows to resolve conflicts.
   * Call it to get access to current module.
  */
  module.noConflict = function () {
    root.dialogues = previousDialogues;
    return module;
  };

  /*
   * Render comments on element.
   * @param {string|object} - query selector string for element or element itself.
   * @options {object=} - options for rendering comments
  */ 
  module.render = function(options) {
    options = options ? merge(options, defaultOptions) : defaultOptions;
    return new DialoguesInstance(options);
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
  var DialoguesInstance = function (options) {

    if (options.$el) {
      this.$el = $(options.$el);
    } else {
      this.$el = $('<div />').insertAfter(document.currentScript);
    }

    this._options = options;
    this._load = options.load;
    this._render = options.render;
    this._commentsContainer = $(this._render.templateContainer).appendTo(this.$el);
    this._preloadedCommentsButton = null;

    var useSockets = window.io && options.load.sockets;
    var _preloadedComments = [];
    var _formIsOpened = false;

    /*
    * If comments container supports scrolling - scroll it to last element.
    * This method is useful when we add comments.
    */
    var _scrollToBottom = function() {
      var container = this._commentsContainer ;
      if (container.get(0).scrollHeight > container.height()) {
        container.animate({ scrollTop: container.get(0).scrollHeight }, "slow");
      }
    }.bind(this);

    /*
    * Post comment to server.
    */
    var _postComment = function(comment) {
      var data = JSON.stringify({ 
        id: this._options.id, 
        comment: comment
      });
      return $.post(
        this._options.server, 
        data, 
        null,  // callback is null
        'json');
    }.bind(this);

    /*
     * Render comments 
    */ 
    var _renderComments = function(comments) {
      for (var i = 0; i < comments.length; i++) {
        var comment = comments[i];
        var selectors = this._render.selectors;

        var commentSection = $(this._render.template)
          .data('comment', comment);

        var name = comment.name || this._options.resources.anonymous;

        if (comment.icon && selectors.icon) {
          $(selectors.icon, commentSection)
            .attr({
              alt: name,
              src: comment.icon
            });
        }
        
        if (comment.website) {
          $(selectors.website, commentSection).attr({ href: comment.website });
        } else {
          $(selectors.website, commentSection).attr({ disabled: true });
        }

        $(selectors.name, commentSection).text(name);

        if(selectors.date && comment.date) {
          var date = new Date(comment.date);
          if (this._options.dateFormatter) {
            date = this._options.dateFormatter(date);
          }
          $(selectors.date, commentSection).text(date);
        }

        if (selectors.commentLink && comment.id) {
          var sectionId = 'comment_' + comment.id;
          $(selectors.commentLink, commentSection).attr({
            href: getDocumentUrl() + '#' + sectionId
          });
          commentSection.attr({ id: sectionId });
        }
        
        $(selectors.body, commentSection)
          .html(this._options.bodyFormatter(comment.body));

        this._commentsContainer.append(commentSection);
      }
    }.bind(this);

    /*
    * When user is publishing commentaries we don't want to distract him 
    * by adding new commentaries, this is why we preload them and render
    * only when user click on post comment or when he click on show
    * new comments button.
    */
    var _renderPreloadedComments = function() {
      // Let's sort it first, who knows how we can get these updates.
      _preloadedComments.sort(function(a, b) {
        return a.date - b.date;
      });
      _renderComments(_preloadedComments);
      _scrollToBottom();
      if (this._preloadedCommentsButton) {
        this._preloadedCommentsButton.remove();
        _preloadedComments = [];
        this._preloadedCommentsButton = null;
      }
    }.bind(this);

    var _socketConnect = function() {
      var socket = io.connect(this._options.server);
      socket.on('update', function(update) {
        if (update.id === this._options.id) {
          // Remove first all comments which already were rendered
          this._commentsContainer.children().each(function() {
            var id = $(this).data('comment').id;
            for (var i = (update.comments.length - 1); i >= 0; i--) {
              if (update.comments[i].id === id) {
                update.comments.splice(i, 1);
              }
            }
          });

          if (_formIsOpened || _preloadedComments.length > 0) {
            // Push all un rendered comments 
            for (var i = 0; i < update.comments.length; i++) {
              _preloadedComments.push(update.comments[i]);
            }

            if (_preloadedComments.length > 0 && !this._preloadedCommentsButton) {
              var render = this._options.preloadRender;
              this._preloadedCommentsButton = $(render.template).insertAfter(this._commentsContainer);
              $(render.selectors.button, this._preloadedCommentsButton)
                .click(function() {
                  _renderPreloadedComments();
                  return false;
                }.bind(this));
            }
          } else {
            _renderComments(update.comments);
          }
        }
      }.bind(this));
      socket.emit('subscribe', { id: this._options.id });
    }.bind(this);

    /*
    * Render form under comments
    */
    var _renderForm = function() {
      var formRender = this._options.formRender;
      var bodyFormatter = this._options.bodyFormatter;

      var placeholder = $(formRender.templatePlaceholder);
      var form = $(this._options.formRender.template.replace(/{id}/g, this._options.id)).hide();

      $(formRender.selectors.body, form).on('input', function() {
        if (formRender.selectors.preview) {
          $(formRender.selectors.preview, form).html(bodyFormatter($(this).val()));
        }
        if (supportStorage) {
          if ($(this).val()) {
            window.localStorage.setItem(commentStorageId, $(this).val());
          } else {
            window.localStorage.removeItem(commentStorageId);
          }
        }
      });

      var commentStorageId = this._options.id + '_comment_body';
      if (supportStorage) {
        var commentBody = window.localStorage.getItem(commentStorageId);
        if (commentBody) {
           $(formRender.selectors.body, form).val(commentBody).trigger('input');
        }
      }

      // Story user data in cookie, so user will not need to reenter it every time
      $(formRender.selectors.username + ',' +
        formRender.selectors.email + ',' +
        formRender.selectors.website, form)
      .on('input', function(){
        setCookie('dlgs-participant', JSON.stringify({
          name: $(formRender.selectors.username, form).val(),
          email: $(formRender.selectors.email, form).val(),
          website: $(formRender.selectors.website, form).val()
        }), document.location.hostname);
      });

      $(formRender.placeholderSelectors.button, placeholder)
        .click(function() {
          placeholder.hide();

          // Check if this is returned user - just fill the form
          var author = getCookie('dlgs-participant');
          if (author) {
            author = JSON.parse(author)
            $(formRender.selectors.username, form).val(author.name),
            $(formRender.selectors.email, form).val(author.email),
            $(formRender.selectors.website, form).val(author.website)
          }

          form.fadeIn();
          var bottom = form[0].getBoundingClientRect().bottom; 
          var windowHeight = $(window).height();
          if (bottom > windowHeight) {
            $("body").animate({
              scrollTop: $("body").scrollTop() + (bottom - windowHeight)
            }, 'slow');
          }
          $(formRender.selectors.body, form).focus();
          _formIsOpened = true;
          return false;
        }.bind(this));

      $(formRender.selectors.cancel, form)
        .click(function() {
          form.hide();
          placeholder.fadeIn();
          $(formRender.selectors.body, form).val('').trigger('input');
          _formIsOpened = false;
          return false;
        }.bind(this));

      $(formRender.selectors.submit, form)
        .click(function() {
          
          var comment = {
            name: $(formRender.selectors.username, form).val(),
            website: $(formRender.selectors.website, form).val(),
            email: $(formRender.selectors.email, form).val(),
            subscription: $(formRender.selectors.subscription, form).prop('checked'),
            body: $(formRender.selectors.body, form).val()
          }

          _postComment(comment)
            .done(function(result) {
              form.hide();
              _formIsOpened = false;
              placeholder.fadeIn();
              if (_preloadedComments.length > 0) {
                _renderPreloadedComments();
              }
              _renderComments(result);
              $(formRender.selectors.body, form).val('').trigger('input');
              _scrollToBottom();
            }.bind(this))
            .fail(function(req, error, status) {
              if (this._options.debug) {
                console.error('Cannot load comments from server, error: ' + error + ', response: ' + status);
              }
              /* TODO: show error to user. */
            }.bind(this));
          return false;
        }.bind(this))

      this.$el.append(placeholder);
      this.$el.append(form);
        
    }.bind(this);

    /*
     * Load commentaries from server
    */
    this.load = function() {
      return $.getJSON(this._options.server, { id: this._options.id }, function(data) {
        this.$el.hide();
        _renderComments(data);
        
        if (this._options.formRender) {
          _renderForm();
        }

        this.$el.fadeIn();

        if (useSockets) {
          _socketConnect();
        }

      }.bind(this))
      .fail(function(req, error, status) {
        if (this._options.debug) {
          console.error('Cannot load comments from server, error: ' + error + ', response: ' + status);
        }
        /* TODO: show error to user. */
      }.bind(this));
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
    root.dialogues = module;
  }

})();