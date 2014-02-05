describe('middleware/init.js', function() { 'use strict';

  var expect = require('chai').expect;
  var InitMiddleware = require('./../../lib/middleware/init');

  describe('requested instance', function() {
    it('is a function', function() {
      expect(InitMiddleware).to.be.a('function');
    });
  });

  describe('SensitiveMiddleware', function() {

    var middleware;

    beforeEach(function() {
      middleware = new InitMiddleware();
    });

    it('has process function with 3 arguments', function() {
      expect(middleware.process.length).to.equal(3);
    });

    it('add initial data to commentary', function() {
      var data = {
        comment: { 
        }
      };

      var req = {
        headers: {
          'user-agent': 'test agent',
          'x-forwarded-for': '192.168.0.1'
        }
      };

      var oldDate = new Date();

      middleware.process(req, {}, data);

      expect(data.comment.date).to.be.within(oldDate, new Date());
      expect(data.comment.userIP).to.equal(req.headers['x-forwarded-for']);
      expect(data.comment.userAgent).to.equal(req.headers['user-agent']);
    });

    it('should always override initial data', function() {
      var data = {
        comment: {
          date: new Date("01/01/2013"),
          userIP: '1.1.1.1',
          userAgent: 'hacker',
          isSpam: true
        }
      };
      var req = {
        headers: {
          'user-agent': 'test agent',
          'x-forwarded-for': '192.168.0.1'
        }
      };

      var oldDate = new Date();

      middleware.process(req, {}, data);

      expect(data.comment.date).to.be.within(oldDate, new Date());
      expect(data.comment.userIP).to.equal(req.headers['x-forwarded-for']);
      expect(data.comment.userAgent).to.equal(req.headers['user-agent']);
    });

    it('keep undefined if data is not defined', function() {
      var data = {
        comment: { 
        }
      };

      var req = {
        headers: {
          'user-agent': '',
          'x-forwarded-for': '192.168.0.1'
        }
      };

      middleware.process(req, {}, data);

      expect(data.comment.date).to.be.a('date');
      expect(data.comment.userIP).to.equal(req.headers['x-forwarded-for']);
      expect(data.comment.userAgent).to.be.undefined;
    });
  });
});