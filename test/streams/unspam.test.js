describe('unspam.js', function() { 'use strict';

  var expect = require('chai').expect;
  var UnspamMiddlewareStream = require('./../../lib/streams/unspam');

  describe('requested instance', function() {
    
    it('is a function', function() {
      expect(UnspamMiddlewareStream).to.be.a('function');
    });

  });

  describe('Stream', function() {
    var stream, result;

    beforeEach(function() {
      result = [];
      stream = new UnspamMiddlewareStream({}, {}, {});
    });

    it('does not push spam comments', function() {
      stream.end({ isSpam: true });

      expect(stream.read()).to.be.null;
    });

    it('push not spam comments', function() {
      var comment = { isSpam: false };

      stream.end(comment);

      expect(stream.read()).to.equal(comment);
      expect(stream.read()).to.be.null;
    });

    it('filter spam comments', function() {
      var comments = [ 
        { isSpam: false }, 
        { isSpam: true }, 
        { isSpam: false }
      ];

      comments.forEach(function(comment) {
        stream.write(comment);
      });
      stream.end();

      expect(stream.read()).to.equal(comments[0]);
      expect(stream.read()).to.equal(comments[2]);
      expect(stream.read()).to.be.null;
    });
  });
});