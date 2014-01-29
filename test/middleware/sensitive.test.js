describe('unspam.js', function() { 'use strict';

  var expect = require('chai').expect;
  var sinon = require('sinon');
  var SensitiveMiddleware = require('./../../lib/middleware/sensitive');

  describe('requested instance', function() {
    it('is a function', function() {
      expect(SensitiveMiddleware).to.be.a('function');
    });
  });

  describe('SensitiveMiddleware', function() {

    var middleware;

    beforeEach(function() {
      middleware = new SensitiveMiddleware();
    });

    it('removes sensitive information', function() {
      var cb = sinon.spy();
      var comment = { 
        subscription: '',
        email: '',
        userIP: '',
        userAgent: '',
        isSpam: ''
      };

      middleware.process({}, {}, {}, comment, cb);

      expect(cb.calledOnce).to.be.true;
      expect(cb.alwaysCalledWithExactly(null, comment)).to.be.true;

      expect(comment.subscription).to.be.undefined;
      expect(comment.email).to.be.undefined;
      expect(comment.userIP).to.be.undefined;
      expect(comment.userAgent).to.be.undefined;
      expect(comment.isSpam).to.be.undefined;
    });
  });
});