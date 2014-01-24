describe('unspam.js', function() { 'use strict';

  var _ = require('underscore');
  var expect = require('chai').expect;
  var UnspamMiddlewareStream = require('./../../lib/streams/response/unspam');

  describe('requested instance', function() {
    
    it('is a function', function() {
      expect(UnspamMiddlewareStream).to.be.a('function');
    });

    it('is a transform stream', function() {
      var stream = new UnspamMiddlewareStream();
      expect(stream).to.be.an.instanceof(require('stream').Transform);
    });

  });

  describe('Stream', function() {
    var stream, result;

    beforeEach(function() {
      result = [];
      stream = new UnspamMiddlewareStream({}, {}, {});
    });

    function readFromStream() {
      var data;
      while ((data = stream.read()) !== null) {
         result.push(data);
      }
    }

    it('does not push spam comments', function() {
      stream.write({ isSpam: true });
      stream.end();

      readFromStream();

      expect(result).to.be.empty;
    });

    it('push not spam comments', function() {
      var comment = { isSpam: false };

      stream.write(comment);
      stream.end();

      readFromStream();

      expect(result).to.include.members([comment]);
    });

    it('filter spam comments', function() {
      var comments = [ 
        { isSpam: false }, 
        { isSpam: true }, 
        { isSpam: false }
      ];

      _(comments).each(function(comment) {
        stream.write(comment);
      });
      stream.end();

      readFromStream();

      var nonSpamComments = _(comments).filter(function(c) { return !c.isSpam; });
      expect(result).to.include.members(nonSpamComments);
    });
  });
});