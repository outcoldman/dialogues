describe('middleware/clear.js', function() { 'use strict';

  var expect = require('chai').expect;
  var ClearMiddleware = require('./../../lib/middleware/clear');

  describe('requested instance', function() {
    it('is a function', function() {
      expect(ClearMiddleware).to.be.a('function');
    });
  });

  describe('ClearMiddleware', function() {

    var middleware;

    beforeEach(function() {
      middleware = new ClearMiddleware();
    });

    it('has process function with 3 arguments', function() {
      expect(middleware.process.length).to.equal(3);
    });

    it('removes empty fields', function() {
      var data = {
        comment: { 
          id: '1',
          body: 'body',
          name: '',
          web: null,
          date: 'date',
          icon: 'icon'
        }
      };

      middleware.process({}, {}, data);

      expect(data.comment.id).to.be.a('string');
      expect(data.comment.body).to.be.a('string');
      expect(data.comment.name).to.be.undefined;
      expect(data.comment.web).to.be.undefined;
      expect(data.comment.date).to.be.a('string');
      expect(data.comment.icon).to.be.a('string');
    });
  });
});