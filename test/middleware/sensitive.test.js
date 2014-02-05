describe('middleware/sensitive.js', function() { 'use strict';

  var expect = require('chai').expect;
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

    it('has process function with 3 arguments', function() {
      expect(middleware.process.length).to.equal(3);
    });

    it('removes sensitive information', function() {
      var data = {
        comment: { 
          subscription: '',
          email: '',
          userIP: '',
          userAgent: '',
          isSpam: ''
        }
      };

      middleware.process({}, {}, data);

      expect(data.comment.subscription).to.be.undefined;
      expect(data.comment.email).to.be.undefined;
      expect(data.comment.userIP).to.be.undefined;
      expect(data.comment.userAgent).to.be.undefined;
      expect(data.comment.isSpam).to.be.undefined;
    });

    it('keeps only defined properties', function() {
      var data = {
        comment: { 
          id: '1',
          body: 'body',
          name: 'name',
          web: 'web',
          date: 'date',
          icon: 'icon',
          unknownProperty1: '',
          unknownProperty2: ''
        }
      };

      middleware.process({}, {}, data);

      expect(data.comment.id).to.be.a('string');
      expect(data.comment.body).to.be.a('string');
      expect(data.comment.name).to.be.a('string');
      expect(data.comment.web).to.be.a('string');
      expect(data.comment.date).to.be.a('string');
      expect(data.comment.icon).to.be.a('string');

      expect(data.comment.unknownProperty1).to.be.undefined;
      expect(data.comment.unknownProperty2).to.be.undefined;
    });
  });
});