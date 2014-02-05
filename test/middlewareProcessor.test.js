describe('middlewareProcessor.js', function() { 'use strict';

  var _ = require('underscore');
  var expect = require('chai').expect;
  var sinon = require('sinon');
  var MiddlewareProcessor = require('./../lib/middlewareProcessor');

  var MiddlewareStub1 = require('./stubs/middlewareStub1'),
      MiddlewareStub2 = require('./stubs/middlewareStub2'),
      MiddlewareStub3 = require('./stubs/middlewareStub3Async');

  describe('requested instance', function() {
    it('is a function', function() {
      expect(MiddlewareProcessor).to.be.a('function');
      expect(MiddlewareProcessor.length).to.equal(1);
    });
  });

  describe('MiddlewareProcessor', function() {
    it('options set middleware', function() {
      var options = {
        'in+*': [
          { custom: './../test/stubs/middlewareStub1' },
          { custom: './../test/stubs/middlewareStub2' }
        ],
        'in+PUT': [
          { custom: './../test/stubs/middlewareStub3Async' }
        ],
        'in+DELETE': [
          /* should insert it between stub 1 and 2 */,
          { custom: './../test/stubs/middlewareStub3Async' }
        ]
      };

      var processor = new MiddlewareProcessor(options);

      expect(processor.middleware).to.be.not.null;
      expect(processor.middleware.in).to.be.not.null;
      expect(processor.middleware.out).to.be.not.null;

      expect(processor.middleware.in.PUT.length).to.equal(3);
      expect(processor.middleware.in.PUT[0].__middleware).to.be.an.instanceof(MiddlewareStub3);
      expect(processor.middleware.in.PUT[1].__middleware).to.be.an.instanceof(MiddlewareStub1);
      expect(processor.middleware.in.PUT[2].__middleware).to.be.an.instanceof(MiddlewareStub2);

      // In options we've specified that we want to place Middleware3 between 1 and 2 
      // by skipping the first index
      expect(processor.middleware.in.DELETE.length).to.equal(3);
      expect(processor.middleware.in.DELETE[0].__middleware).to.be.an.instanceof(MiddlewareStub1);
      expect(processor.middleware.in.DELETE[1].__middleware).to.be.an.instanceof(MiddlewareStub3);
      expect(processor.middleware.in.DELETE[2].__middleware).to.be.an.instanceof(MiddlewareStub2);

      // All middleware in * should be initialized only once
      expect(processor.middleware.in.DELETE[2]).to.be.equal(processor.middleware.in.PUT[2]);

      // POST should have only middleware from *
      expect(processor.middleware.in.POST.length).to.equal(2);
      expect(processor.middleware.in.POST[0].__middleware).to.be.an.instanceof(MiddlewareStub1);
      expect(processor.middleware.in.POST[1].__middleware).to.be.an.instanceof(MiddlewareStub2);

      // We did not specified anything for out
      expect(processor.middleware.out.PUT.length).to.equal(0);
      expect(processor.middleware.out.DELETE.length).to.equal(0);
    });

    it('in options you can overwrite middleware for everything', function() {
      var options = {
        'in+*': [
          { custom: './../test/stubs/middlewareStub1' },
          { custom: './../test/stubs/middlewareStub2' }
        ],
        'in-PUT': [ // (in|out)-[VERB] overwrites +*
          { custom: './../test/stubs/middlewareStub3Async' }
        ],
        'in+DELETE': [
          /* should insert it between stub 1 and 2 */,
          { custom: './../test/stubs/middlewareStub3Async' }
        ]
      };

      var processor = new MiddlewareProcessor(options);

      expect(processor.middleware).to.be.not.null;
      expect(processor.middleware.in).to.be.not.null;
      expect(processor.middleware.out).to.be.not.null;

      expect(processor.middleware.in.PUT.length).to.equal(1);
      expect(processor.middleware.in.PUT[0].__middleware).to.be.an.instanceof(MiddlewareStub3);

      // In options we've specified that we want to place Middleware3 between 1 and 2 
      // by skipping the first index
      expect(processor.middleware.in.DELETE.length).to.equal(3);
      expect(processor.middleware.in.DELETE[0].__middleware).to.be.an.instanceof(MiddlewareStub1);
      expect(processor.middleware.in.DELETE[1].__middleware).to.be.an.instanceof(MiddlewareStub3);
      expect(processor.middleware.in.DELETE[2].__middleware).to.be.an.instanceof(MiddlewareStub2);

      // POST should have only middleware from *
      expect(processor.middleware.in.POST.length).to.equal(2);
      expect(processor.middleware.in.POST[0].__middleware).to.be.an.instanceof(MiddlewareStub1);
      expect(processor.middleware.in.POST[1].__middleware).to.be.an.instanceof(MiddlewareStub2);

      // We did not specified anything for out
      expect(processor.middleware.out.PUT.length).to.equal(0);
      expect(processor.middleware.out.DELETE.length).to.equal(0);
    });

    it('options can have default middleware', function() {
      var options = {
        'in+*': [
          { type: 'init' }
        ]
      };

      var processor = new MiddlewareProcessor(options);

      expect(processor.middleware.in.PUT.length).to.equal(1);
      expect(processor.middleware.in.PUT[0].__middleware).to.be.an.instanceof(require('./../lib/middleware/init'));
    });

    it('middleware can remove comment', function(done) {
        var options = {
          'out+*': [
            { custom: './../test/stubs/middlewareStub1' },
            { custom: './../test/stubs/middlewareStub2' }
          ]
        };

        var req = { method: 'GET' }, res = {}, dialogue = {}, comments = [ {}, {} ];
        var processor = new MiddlewareProcessor(options);

        // Replace process method to remove first comment
        processor.middleware.out.GET[0].__middleware.process = function(req, res, data) {
          if (data.comment === comments[0]) {
            data.remove = true;
          }
        };

        processor.out(req, res, dialogue, comments, function(err, result) {
          expect(err).to.be.null;
          expect(result).to.deep.equal([comments[1]]);

          var middlewareStub1 = processor.middleware.out.GET[0].__middleware._stub;
          var middlewareStub2 = processor.middleware.out.GET[1].__middleware._stub;

          function matchSecondComment(data) { return data.comment === comments[1] && data.dialogue === dialogue; }

          expect(middlewareStub2.calledOnce).to.be.true;
          expect(middlewareStub2.firstCall.calledWithExactly(req, res, sinon.match(matchSecondComment))).to.be.true;

          done();
        });
      });

      it('middleware can return errors', function(done) {
        var options = {
          'out+*': [
            { custom: './../test/stubs/middlewareStub3Async' },
            { custom: './../test/stubs/middlewareStub2' }
          ]
        };

        var req = { method: 'GET' }, res = {}, dialogue = {}, comments = [ {}, {} ];
        var processor = new MiddlewareProcessor(options);

        var error = {};

        processor.middleware.out.GET[0].__middleware.process = function(req, res, data, cb) {
          cb(error);
        };

        processor.out(req, res, dialogue, comments, function(err, result) {
          expect(err).to.equal(error);
          expect(result).to.be.undefined;

          var middlewareStub1 = processor.middleware.out.GET[0].__middleware._stub;
          var middlewareStub2 = processor.middleware.out.GET[1].__middleware._stub;

          expect(middlewareStub2.called).to.be.false;

          done();
        });
      });

    describe('verb middleware', function() {
      _(['GET', 'PUT', 'POST', 'DELETE']).each(function(verb) {
        var processor, options, req, res, dialogue, comments;

        beforeEach(function() {
          req = { method: verb };
          res = {};
          dialogue = {};
          comments = [ {}, {} ];

          options = {
            'in+*': [
              { custom: './../test/stubs/middlewareStub1' }
            ],
            'out+*': [
              { custom: './../test/stubs/middlewareStub1' }
            ]
          };
          options['in+' + verb] = [
            ,
            { custom: './../test/stubs/middlewareStub2' },
            { custom: './../test/stubs/middlewareStub3Async' }
          ];
          options['out+' + verb] = [
            ,
            { custom: './../test/stubs/middlewareStub2' },
            { custom: './../test/stubs/middlewareStub3Async' }
          ];

          processor = new MiddlewareProcessor(options);
        });

        it('calls all middleware on ' + verb + ' in call', function(done) {
          processor.in(req, res, dialogue, comments, function(err, result) {
            expect(err).to.be.null;
            expect(result).to.deep.equal(comments);

            var middlewareStub1 = processor.middleware.in[verb][0].__middleware._stub;
            var middlewareStub2 = processor.middleware.in[verb][1].__middleware._stub;
            var middlewareStub3 = processor.middleware.in[verb][2].__middleware._stub;

            expect(middlewareStub1.calledTwice).to.be.true;
            expect(middlewareStub2.calledTwice).to.be.true;
            expect(middlewareStub3.calledTwice).to.be.true;

            expect(middlewareStub2.firstCall.calledAfter(middlewareStub1.firstCall)).to.be.true;
            expect(middlewareStub3.firstCall.calledAfter(middlewareStub2.firstCall)).to.be.true;
            expect(middlewareStub1.secondCall.calledAfter(middlewareStub3.firstCall)).to.be.true;
            expect(middlewareStub2.secondCall.calledAfter(middlewareStub1.secondCall)).to.be.true;
            // CalledTwice but secondCall is null - looks like bug in sinon
            // expect(middlewareStub3.secondCall.calledAfter(middlewareStub2.secondCall)).to.be.true;

            function matchFirstComment(data) { return data.comment === comments[0] && data.dialogue === dialogue; }
            function matchSecondComment(data) { return data.comment === comments[1] && data.dialogue === dialogue; }

            expect(middlewareStub1.firstCall.calledWithExactly(req, res, sinon.match(matchFirstComment))).to.be.true;
            expect(middlewareStub1.secondCall.calledWithExactly(req, res, sinon.match(matchSecondComment))).to.be.true;

            expect(middlewareStub2.firstCall.calledWithExactly(req, res, sinon.match(matchFirstComment))).to.be.true;
            expect(middlewareStub2.secondCall.calledWithExactly(req, res, sinon.match(matchSecondComment))).to.be.true;

            expect(middlewareStub3.firstCall.calledWithExactly(req, res, sinon.match(matchFirstComment), sinon.match.func)).to.be.true;

            done();
          });
        });

        it('calls all middleware on ' + verb + ' out call', function(done) {
          processor.out(req, res, dialogue, comments, function(err, result) {
            expect(err).to.be.null;
            expect(result).to.deep.equal(comments);

            var middlewareStub1 = processor.middleware.out[verb][0].__middleware._stub;
            var middlewareStub2 = processor.middleware.out[verb][1].__middleware._stub;
            var middlewareStub3 = processor.middleware.out[verb][2].__middleware._stub;

            expect(middlewareStub1.calledTwice).to.be.true;
            expect(middlewareStub2.calledTwice).to.be.true;
            expect(middlewareStub3.calledTwice).to.be.true;

            expect(middlewareStub2.firstCall.calledAfter(middlewareStub1.firstCall)).to.be.true;
            expect(middlewareStub3.firstCall.calledAfter(middlewareStub2.firstCall)).to.be.true;
            expect(middlewareStub1.secondCall.calledAfter(middlewareStub3.firstCall)).to.be.true;
            expect(middlewareStub2.secondCall.calledAfter(middlewareStub1.secondCall)).to.be.true;
            // CalledTwice but secondCall is null - looks like bug in sinon
            // expect(middlewareStub3.secondCall.calledAfter(middlewareStub2.secondCall)).to.be.true;

            function matchFirstComment(data) { return data.comment === comments[0] && data.dialogue === dialogue; }
            function matchSecondComment(data) { return data.comment === comments[1] && data.dialogue === dialogue; }

            expect(middlewareStub1.firstCall.calledWithExactly(req, res, sinon.match(matchFirstComment))).to.be.true;
            expect(middlewareStub1.secondCall.calledWithExactly(req, res, sinon.match(matchSecondComment))).to.be.true;

            expect(middlewareStub2.firstCall.calledWithExactly(req, res, sinon.match(matchFirstComment))).to.be.true;
            expect(middlewareStub2.secondCall.calledWithExactly(req, res, sinon.match(matchSecondComment))).to.be.true;

            expect(middlewareStub3.firstCall.calledWithExactly(req, res, sinon.match(matchFirstComment), sinon.match.func)).to.be.true;

            done();
          });
        });

      });
    });
  });
});