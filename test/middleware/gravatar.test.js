describe('middleware/gravatar.js', function() { 'use strict';

  var expect = require('chai').expect;
  var GravatarMiddleware = require('./../../lib/middleware/gravatar');

  describe('requested instance', function() {
    it('is a function', function() {
      expect(GravatarMiddleware).to.be.a('function');
    });
  });

  describe('GravatarMiddleware', function() {

    var middleware;

    beforeEach(function() {
      middleware = new GravatarMiddleware();
    });

    it('has process function with 3 arguments', function() {
      expect(middleware.process.length).to.equal(3);
    });

    it('creates url to icon for email', function() {
      var data = {
        comment:{
          email: 'mail@example.com'
        }
      };

      middleware.process({}, {}, data);

      expect(data.comment.icon).to.equal('http://www.gravatar.com/avatar/7daf6c79d4802916d83f6266e24850af?s=80&d=mm');
    });

    it('creates url to icon for empty email', function() {
      var data = {
        comment: {
          email: null
        }
      };

      middleware.process({}, {}, data);

      expect(data.comment.icon).to.equal('http://www.gravatar.com/avatar/d41d8cd98f00b204e9800998ecf8427e?s=80&d=mm');
    });
  });

  describe('GravatarMiddleware with https', function() {
    var middleware;

    beforeEach(function() {
      middleware = new GravatarMiddleware({ https: true });
    });

    it('creates url to icon for email with https', function() {
      var data = {
        comment:{
          email: 'mail@example.com'
        }
      };

      middleware.process({}, {}, data);

      expect(data.comment.icon).to.equal('https://secure.gravatar.com/avatar/7daf6c79d4802916d83f6266e24850af?s=80&d=mm');
    });
  });

  describe('GravatarMiddleware with no default gravatar options', function() {
    var middleware;

    beforeEach(function() {
      middleware = new GravatarMiddleware({ gravatar_options: { s: 200, d: 'identicon' }, https: true });
    });

    it('creates url based on options', function() {
      var data = {
        comment:{
          email: 'mail@example.com'
        }
      };

      middleware.process({}, {}, data);

      expect(data.comment.icon).to.equal('https://secure.gravatar.com/avatar/7daf6c79d4802916d83f6266e24850af?s=200&d=identicon');
    });
  });

  describe('GravatarMiddleware with ratings', function() {
    var middleware;

    beforeEach(function() {
      middleware = new GravatarMiddleware({ gravatar_options: { s: 200, d: 'identicon', r: 'pg' }, https: true });
    });

    it('creates url based on options', function() {
      var data = {
        comment:{
          email: 'mail@example.com'
        }
      };

      middleware.process({}, {}, data);

      expect(data.comment.icon).to.equal('https://secure.gravatar.com/avatar/7daf6c79d4802916d83f6266e24850af?s=200&d=identicon&r=pg');
    });
  });

  describe('GravatarMiddleware with https auto-discovery', function() {
    var middleware;

    beforeEach(function() {
      middleware = new GravatarMiddleware();
    });

    it('should use https when request is https', function() {
      var data = {
        comment:{
          email: 'mail@example.com'
        }
      };

      middleware.process({ protocol: 'https' }, {}, data);

      expect(data.comment.icon).to.equal('https://secure.gravatar.com/avatar/7daf6c79d4802916d83f6266e24850af?s=80&d=mm');
    });

    it('should use http when request is http', function() {
      var data = {
        comment:{
          email: 'mail@example.com'
        }
      };

      middleware.process({ protocol: 'http' }, {}, data);

      expect(data.comment.icon).to.equal('http://www.gravatar.com/avatar/7daf6c79d4802916d83f6266e24850af?s=80&d=mm');
    });
  });
});