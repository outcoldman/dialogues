describe('middlewareCaller.js', function() { 'use strict';

  var _ = require('underscore');
  var expect = require('chai').expect;
  var sinon = require('sinon');
  var middlewareCaller = require('./../lib/middlewareCaller');

  var MiddlewareStub1 = require('./stubs/middlewareStub1'),
      MiddlewareStub3Async = require('./stubs/MiddlewareStub3Async');

  describe('requested instance', function() {
    it('is a function', function() {
      expect(middlewareCaller).to.be.a('function');
      expect(middlewareCaller.length).to.equal(1);
    });
  });

  describe('middlewareCaller', function() {

    it('with synchronous wrapper', function() {
      var middleware, caller;
      beforeEach(function() {
        middleware = new MiddlewareStub1();
        caller = middlewareCaller(middleware);
      });

      it('has process function', function() {
        expect(caller).to.be.a('function');
        expect(caller.length).to.equal(4);
      });

      it('process function knows about middleware', function() {
        expect(caller.__middleware).to.equal(middleware);
      });

      it('process function calls callback', function() {
        var req = {}, 
            res = {}, 
            data = {};
        var cb = sinon.spy();
        
        caller(req, res, data, cb);

        expect(caller.__middleware._stub.alwaysCalledWithExactly(req, res, data)).to.be.true;
        expect(caller.__middleware._stub.calledOnce).to.be.true;
        expect(cb.calledOnce).to.be.true;
      });
    });

    it('with asynchronous wrapper', function() {
      var middleware, caller;
      beforeEach(function() {
        middleware = new MiddlewareStub3Async();
        caller = middlewareCaller(middleware);
      });

      it('has process function', function() {
        expect(caller).to.be.a('function');
        expect(caller.length).to.equal(4);
      });

      it('process function knows about middleware', function() {
        expect(caller.__middleware).to.equal(middleware);
      });

      it('process function calls callback', function() {
        var req = {}, 
            res = {}, 
            data = {};
        var cb = sinon.spy();
        
        caller(req, res, data, cb);

        expect(caller.__middleware._stub.alwaysCalledWithExactly(req, res, data, sinon.match.typeOf('function'))).to.be.true;
        expect(caller.__middleware._stub.calledOnce).to.be.true;
        expect(cb.calledOnce).to.be.true;
      });
    });
  });
});