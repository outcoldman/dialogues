describe('unspam.js', function() { 'use strict';

  var expect = require('chai').expect;
  var sinon = require('sinon');
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

    it('creates url to icon for email', function() {
      var cb = sinon.spy();
      var comment = {
        email: 'mail@example.com'
      };

      middleware.process({}, {}, {}, comment, cb);

      expect(cb.calledOnce).to.be.true;
      expect(cb.alwaysCalledWithExactly(null, comment)).to.be.true;

      expect(comment.icon).to.equal('http://www.gravatar.com/avatar/7daf6c79d4802916d83f6266e24850af?s=80&d=mm');
    });

    it('creates url to icon for empty email', function() {
      var cb = sinon.spy();
      var comment = {
        email: null
      };

      middleware.process({}, {}, {}, comment, cb);

      expect(cb.calledOnce).to.be.true;
      expect(cb.alwaysCalledWithExactly(null, comment)).to.be.true;

      expect(comment.icon).to.equal('http://www.gravatar.com/avatar/d41d8cd98f00b204e9800998ecf8427e?s=80&d=mm');
    });
  });

  describe('GravatarMiddleware with https', function() {
    var middleware;

    beforeEach(function() {
      middleware = new GravatarMiddleware({ https: true });
    });

    it('creates url to icon for email with https', function() {
      var cb = sinon.spy();
      var comment = {
        email: 'mail@example.com'
      };

      middleware.process({}, {}, {}, comment, cb);

      expect(cb.calledOnce).to.be.true;
      expect(cb.alwaysCalledWithExactly(null, comment)).to.be.true;

      expect(comment.icon).to.equal('https://secure.gravatar.com/avatar/7daf6c79d4802916d83f6266e24850af?s=80&d=mm');
    });
  });

  describe('GravatarMiddleware with no default gravatar options', function() {
    var middleware;

    beforeEach(function() {
      middleware = new GravatarMiddleware({ gravatar_options: { s: 200, d: 'identicon' }, https: true });
    });

    it('creates url based on options', function() {
      var cb = sinon.spy();
      var comment = {
        email: 'mail@example.com'
      };

      middleware.process({}, {}, {}, comment, cb);

      expect(cb.calledOnce).to.be.true;
      expect(cb.alwaysCalledWithExactly(null, comment)).to.be.true;

      expect(comment.icon).to.equal('https://secure.gravatar.com/avatar/7daf6c79d4802916d83f6266e24850af?s=200&d=identicon');
    });
  });

  describe('GravatarMiddleware with ratings', function() {
    var middleware;

    beforeEach(function() {
      middleware = new GravatarMiddleware({ gravatar_options: { s: 200, d: 'identicon', r: 'pg' }, https: true });
    });

    it('creates url based on options', function() {
      var cb = sinon.spy();
      var comment = {
        email: 'mail@example.com'
      };

      middleware.process({}, {}, {}, comment, cb);

      expect(cb.calledOnce).to.be.true;
      expect(cb.alwaysCalledWithExactly(null, comment)).to.be.true;

      expect(comment.icon).to.equal('https://secure.gravatar.com/avatar/7daf6c79d4802916d83f6266e24850af?s=200&d=identicon&r=pg');
    });
  });

  describe('GravatarMiddleware with https auto-discovery', function() {
    var middleware;

    beforeEach(function() {
      middleware = new GravatarMiddleware();
    });

    it('should use https when request is https', function() {
      var cb = sinon.spy();
      var comment = {
        email: 'mail@example.com'
      };

      middleware.process({ protocol: 'https' }, {}, {}, comment, cb);

      expect(cb.calledOnce).to.be.true;
      expect(cb.alwaysCalledWithExactly(null, comment)).to.be.true;

      expect(comment.icon).to.equal('https://secure.gravatar.com/avatar/7daf6c79d4802916d83f6266e24850af?s=80&d=mm');
    });

    it('should use http when request is http', function() {
      var cb = sinon.spy();
      var comment = {
        email: 'mail@example.com'
      };

      middleware.process({ protocol: 'http' }, {}, {}, comment, cb);

      expect(cb.calledOnce).to.be.true;
      expect(cb.alwaysCalledWithExactly(null, comment)).to.be.true;

      expect(comment.icon).to.equal('http://www.gravatar.com/avatar/7daf6c79d4802916d83f6266e24850af?s=80&d=mm');
    });
  });
});