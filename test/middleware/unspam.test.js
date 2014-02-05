describe('middleware/unspam.js', function() { 'use strict';

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

    it('has process function with 3 arguments', function() {
      expect(middleware.process.length).to.equal(3);
    });

    it('hides spam comments', function() {
      var data = {
        comment: { isSpam: true }
      };

      middleware.process({}, {}, data);

      expect(data.remove).to.be.true;
    });

    it('does not remove not spam comments', function() {
      var data = {
        comment: { isSpam: false }
      };

      middleware.process({}, {}, data);

      expect(data.remove).to.be.false;
    });

    it('filter spam comments', function() {
      var data1 = {
        comment: { isSpam: false }
      };
      var data2 = {
        comment: { isSpam: true }
      };
      var data3 = {
        comment: { isSpam: false }
      };

      [data1, data2, data3].forEach(function(data) {
        middleware.process({}, {}, data);
      });

      expect(data1.remove).to.be.false;
      expect(data2.remove).to.be.true;
      expect(data3.remove).to.be.false;
    });
  });
});