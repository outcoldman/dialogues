(function() { 'use strict';

  if (!$) throw new Error('jQuery is not loaded!');

  var supportStorage = typeof(Storage)!=="undefined";

  var defaultDateFormatter = function(date) {
    var d = new Date();
    d.setTime(date + d.getTimezoneOffset() * 60);
    return d.toLocaleString();
  }

  var defaultBodyFormatter = function(text) {
    return $('<div />').text(text).html().replace(/\n/g, '<br/>');
  }

  var getCookie = function (sKey) {
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  }

  var setCookie = function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
        case Number:
          sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
          break;
        case String:
          sExpires = "; expires=" + vEnd;
          break;
        case Date:
          sExpires = "; expires=" + vEnd.toUTCString();
          break;
      }
    }
    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    return true;
  }

  var getDocumentUrl = function() {
    var url = document.location;
    return url.href.substr(0, url.href.length - url.hash.length);
  }

  var module = {};
  var defaultOptions = {
    id: getDocumentUrl(),
    server: '/api/comments/', // url to commentaries
    debug: false, // enable additional logging
    load: { // loading settings
      manual: false, // true if you want to load commentaries in special moment with load() method
      delay: true // true if you want to load comments only when they will be visible on page.
    },
    render: {
      dateFormatter: defaultDateFormatter,
      template: 
'<section class="comment">\
  <a class="website" >\
    <img class="avatar" height=80 width=80 />\
  </a>\
  <div class="header">\
    <div>\
      <a class="name website" />\
      <a class="comment-link">\
        <span class="date" />\
      </a>\
    </div>\
  </div>\
  <div class="comment-body" />\
</section>',
      selectors: {
        name: 'a.name', // 
        website: 'a.website', // 
        icon: 'img.avatar',
        date: 'span.date',
        body: 'div.comment-body',
        commentLink: 'a.comment-link' 
      }
    },
    formRender: {
      templatePlaceholder:
'<div style="text-align: center;">\
  <a href class="btn btn-primary btn-lg" style="width:80%;">Reply</button>\
</div>',
      placeholderSelectors: {
        button: 'a'
      },
      template: 
'<form role="form">\
  <div class="row">\
    <div class="col-md-4">\
      <div class="form-group">\
        <label for="comment-name-{id}">Display name:</label>\
        <input type="text" class="form-control" name="comment-name" id="comment-name{-id}" placeholder="Enter display name">\
      </div>\
      <div class="form-group">\
        <label for="comment-email-{id}">Email:</label>\
        <input type="email" class="form-control" name="comment-email" id="comment-email-{id}" placeholder="Enter email">\
      </div>\
      <div class="form-group">\
        <label for="comment-website-{id}">Website:</label>\
        <input type="url" class="form-control" name="comment-website" id="comment-website-{id}" placeholder="Enter website">\
      </div>\
      <div class="checkbox">\
        <label>\
          <input type="checkbox" name="comment-subscription" id="comment-subscription-{id}"> Notify about new comments\
        </label>\
      </div>\
    </div>\
    <div class="col-md-8">\
      <div class="form-group">\
        <label for="comment-body-{id}">Body:</label>\
        <textarea class="form-control" rows="10" name="comment-body" id="comment-body-{id}" autofocus="true"></textarea>\
      </div>\
    </div>\
  </div>\
  <div class="comment-preview" />\
  <div class="form-actions">\
    <button type="submit" class="btn btn-primary">Submit</button>\
    <button type="button" class="btn btn-default">Cancel</button>\
  </div>\
</form>',
      selectors: {
        username: 'input[name=comment-name]',
        email: 'input[name=comment-email]',
        website: 'input[name=comment-website]',
        subscription: 'input[name=comment-subscription]',
        body: 'textarea[name=comment-body]',
        submit: 'button[type=submit]',
        cancel: 'button[type=button]',
        preview: 'div.comment-preview'
      }
    },
    bodyFormatter: defaultBodyFormatter,
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
    this._commentsContainer = $('<div />').appendTo($el);
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
        var date = comment.date;
        if (this._render.dateFormatter) {
          date = this._render.dateFormatter(date);
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
    }.bind(this);

    var renderForm = function() {
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
        setCookie('comments-author', JSON.stringify({
          name: $(formRender.selectors.username, form).val(),
          email: $(formRender.selectors.email, form).val(),
          website: $(formRender.selectors.website, form).val()
        }));
      });

      // Check if this is returned user
      var author = getCookie('comments-author');
      if (author) {
        author = JSON.parse(author)
        $(formRender.selectors.username, form).val(author.name),
        $(formRender.selectors.email, form).val(author.email),
        $(formRender.selectors.website, form).val(author.website)
      }

      $(formRender.placeholderSelectors.button, placeholder)
        .click(function() {
          placeholder.hide();
          form.fadeIn();
          var bottom = form[0].getBoundingClientRect().bottom; 
          var windowHeight = $(window).height();
          if (bottom > windowHeight) {
            $("html, body").animate({
              scrollTop: bottom - windowHeight
            }, 500);
          }
          $(formRender.selectors.body, form).focus();
          return false;
        }.bind(this));

      $(formRender.selectors.cancel, form)
        .click(function() {
          form.hide();
          placeholder.fadeIn();
          $(formRender.selectors.body, form).val('').trigger('input');
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

          this.add(comment)
            .done(function(result) {
              form.hide();
              placeholder.fadeIn();
              comment = merge(comment, result);
              renderComment(comment);
              $(formRender.selectors.body, form).val('').trigger('input');
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
        var commentRenderer = typeof this._render === 'function' ? this._render : renderComment;
        for (var i = 0; i < data.length; i++) {
          commentRenderer(data[i], i, this._commentsContainer);
        }
        if (this._options.formRender) {
          renderForm();
        }
        this.$el.fadeIn();
      }.bind(this))
      .fail(function(req, error, status) {
        if (this._options.debug) {
          console.error('Cannot load comments from server, error: ' + error + ', response: ' + status);
        }
        /* TODO: show error to user. */
      }.bind(this));
    }.bind(this);

    this.add = function(comment) {
      var data = JSON.stringify({ id: this._options.id, comment: comment });
      return $.post(this._options.server, data, null, 'json');
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