describe('base.stream.js', function() { 'use strict';

  var _ = require('underscore');
  var expect = require('chai').expect;
  var sinon = require('sinon');
  var MiddlewareStream = require('./../lib/middleware.stream');

  describe('requested instance', function() {
    
    it('is a function', function() {
      expect(MiddlewareStream).to.be.a('function');
      expect(MiddlewareStream.length).to.equal(4);
    });

    it('is a transform stream', function() {
      var stream = new MiddlewareStream({}, {}, {}, []);
      expect(stream).to.be.an.instanceof(require('stream').Transform);
    });
  });

  describe('MiddlewareStream', function() {
    it('executes middlewares in sequence', function() {
      var middleware1 = {
        process: sinon.mock()
      };
      var middleware2 = {
        process: sinon.mock()
      };
      var res = {};
      var req = {};
      var dialogue = {};
      var comment = {};
      
      middleware1.process.withArgs(req, res, dialogue, comment, sinon.match.func).callsArgWith(4, null, comment);
      middleware2.process.withArgs(req, res, dialogue, comment, sinon.match.func).callsArgWith(4, null, comment);
      
      var stream = new MiddlewareStream(req, res, dialogue, [middleware1, middleware2]);

      stream.end(comment);

      expect(stream.read()).to.equal(comment);

      expect(stream.res).to.equal(res);
      expect(stream.req).to.equal(req);
      expect(stream.dialogue).to.equal(dialogue);

      expect(middleware1.process.calledOnce).to.be.true;
      expect(middleware1.process.calledWithExactly(req, res, dialogue, comment, sinon.match.func)).to.be.true;
      expect(middleware2.process.calledOnce).to.be.true;
      expect(middleware2.process.calledWithExactly(req, res, dialogue, comment, sinon.match.func)).to.be.true;
      expect(middleware2.process.calledAfter(middleware1.process)).to.be.true;
    });

    it('first can break sequence with error', function(done) {
      var middleware1 = {
        process: sinon.mock()
      };
      var middleware2 = {
        process: sinon.mock()
      };
      var res = {};
      var req = {};
      var dialogue = {};
      var comment = {};
      var error = {};
      
      middleware1.process.withArgs(req, res, dialogue, comment, sinon.match.func).callsArgWith(4, error);
      middleware2.process.withArgs(req, res, dialogue, comment, sinon.match.func).callsArgWith(4, null, comment);
      
      var stream = new MiddlewareStream(req, res, dialogue, [middleware1, middleware2]);

      stream.on('error', function(err) {
        expect(err).to.equal(error);

        expect(middleware1.process.calledOnce).to.be.true;
        expect(middleware2.process.called).to.be.false;
        done();
      });

      stream.end(comment);
      expect(stream.read()).to.equal(null);
    });

    it('first can break sequence by removing comment', function() {
      var middleware1 = {
        process: sinon.mock()
      };
      var middleware2 = {
        process: sinon.mock()
      };
      var res = {};
      var req = {};
      var dialogue = {};
      var comment = {};
      var error = {};
      
      middleware1.process.withArgs(req, res, dialogue, comment, sinon.match.func).callsArgWith(4, null, null);
      middleware2.process.withArgs(req, res, dialogue, comment, sinon.match.func).callsArgWith(4, null, comment);
      
      var stream = new MiddlewareStream(req, res, dialogue, [middleware1, middleware2]);

      stream.end(comment);

      expect(stream.read()).to.equal(null);

      expect(middleware1.process.calledOnce).to.be.true;
      expect(middleware2.process.called).to.be.false;
    });
  });
});