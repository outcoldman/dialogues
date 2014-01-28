describe('unspam.js', function() { 'use strict';

  var expect = require('chai').expect;
  var sinon = require('sinon');
  var UnspamMiddleware = require('./../../lib/middleware/unspam');

  describe('requested instance', function() {
    
    it('is a function', function() {
      expect(UnspamMiddleware).to.be.a('function');
    });

  });

  describe('UnspamMiddleware', function() {
    var middleware;

    beforeEach(function() {
      middleware = new UnspamMiddleware();
    });

    it('does not push spam comments', function() {
      var cb = sinon.spy();
      var comment = { isSpam: true };

      middleware.process({}, {}, comment, cb);

      expect(cb.calledOnce).to.be.true;
      expect(cb.alwaysCalledWithExactly()).to.be.true;
    });

    it('push not spam comments', function() {
      var cb = sinon.spy();
      var comment = { isSpam: false };

      middleware.process({}, {}, comment, cb);

      expect(cb.calledOnce).to.be.true;
      expect(cb.alwaysCalledWithExactly(null, comment)).to.be.true;
    });

    it('filter spam comments', function() {
      var cb = sinon.spy();
      var comment1 = { isSpam: false };  
      var comment2 = { isSpam: true };
      var comment3 = { isSpam: false };

      [comment1, comment2, comment3].forEach(function(comment) {
        middleware.process({}, {}, comment, cb);
      });

      expect(cb.calledThrice).to.be.true;
      expect(cb.firstCall.calledWithExactly(null, comment1)).to.be.true;
      expect(cb.secondCall.calledWithExactly()).to.be.true;
      expect(cb.thirdCall.calledWithExactly(null, comment3)).to.be.true;
    });
  });
});