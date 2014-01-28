describe('base.stream.js', function() { 'use strict';

  var _ = require('underscore');
  var expect = require('chai').expect;
  var sinon = require('sinon');
  var BaseCommentStream = require('./../lib/base.stream');

  describe('requested instance', function() {
    
    it('is a function', function() {
      expect(BaseCommentStream).to.be.a('function');
    });

    it('is a transform stream', function() {
      var stream = new BaseCommentStream();
      expect(stream).to.be.an.instanceof(require('stream').Transform);
    });

  });

  describe('BaseCommentStream', function() {
    it('calls initialize in constructor and sets all properties', function() {
      var SpyStream = BaseCommentStream.extend({
        initialize: sinon.spy()
      });

      var res = {};
      var req = {};
      var options = {};
      var stream = new SpyStream(req, res, options);

      expect(stream.initialize.calledOnce).to.be.true;
      expect(stream.initialize.alwaysCalledOn(stream)).to.be.true;
      expect(stream.initialize.alwaysCalledWithExactly(req, res, options)).to.be.true;

      expect(stream.res).to.equal(res);
      expect(stream.req).to.equal(req);
      expect(stream.options).to.equal(options);
    });

    describe('method process', function() {
      it('propagates error', function(done) {
        var StubStream = BaseCommentStream.extend({
          process: sinon.stub()
        });

        var stream = new StubStream(/* req: */ {}, /* res: */ {}, /* options: */ {});

        var comment = {};
        var error = {};
        stream.process.withArgs(comment).callsArgWith(1, error);

        stream.on('error', function(err) {
          expect(err).to.equal(error);
          error = null;
          done();
        });

        stream.end(comment);

        while (stream.read() !== null) {
          throw 'Error should break stream';
        }

        // Set error to null in error to verify workflow
        expect(error).to.be.null;
      });

      it('can accept comment by not passing parameters', function() {
        var StubStream = BaseCommentStream.extend({
          process: sinon.stub()
        });

        var stream = new StubStream(/* req: */ {}, /* res: */ {}, /* options: */ {});

        var comment = {};
        stream.process.withArgs(comment).callsArg(1);
        stream.end(comment);

        expect(stream.read()).to.equal(comment);
        expect(stream.read()).to.be.null;
      });

      it('can accept comment by passing true', function() {
        var StubStream = BaseCommentStream.extend({
          process: sinon.stub()
        });

        var stream = new StubStream(/* req: */ {}, /* res: */ {}, /* options: */ {});

        var comment = {};
        stream.process.withArgs(comment).callsArgWith(1, null, true);
        stream.end(comment);

        expect(stream.read()).to.equal(comment);
        expect(stream.read()).to.be.null;
      });

      it('can refuse comment by passing false', function() {
        var StubStream = BaseCommentStream.extend({
          process: sinon.stub()
        });

        var stream = new StubStream(/* req: */ {}, /* res: */ {}, /* options: */ {});

        var comment = {};
        stream.process.withArgs(comment).callsArgWith(1, null, false);
        stream.end(comment);

        expect(stream.read()).to.be.null;
      });
    });
    
  });
});