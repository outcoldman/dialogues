describe('middleware/unspam.js', function() { 'use strict';

  var expect = require('chai').expect;
  var sinon = require('sinon');
  var AkismetMiddleware = require('./../../lib/middleware/akismet');

  describe('requested instance', function() {
    it('is a function', function() {
      expect(AkismetMiddleware).to.be.a('function');
    });
  });

  describe('AkismetMiddleware', function() {
    var middleware, req, res, comment, data;

    beforeEach(function() {
      middleware = new AkismetMiddleware({ key: 'A', blog: 'B' });
      middleware.client = {
        checkSpam: sinon.mock()
      };

      req = {
        userIP: '192.168.1.1',
        headers: {
          referer: 'referer-value'
        }
      };
      comment = {
        userAgent: 'userAgent-value',
        name: 'email-value',
        email: 'email-value',
        website: 'website-value',
        body: 'body-value'
      };
      res = {};
      data = {
        comment: comment,
        hide: false
      };
    });

    it('has process function with 4 arguments', function() {
      expect(middleware.process.length).to.equal(4);
    });

    it('calls checkSpam with right parameters', function() {
      var cb = sinon.spy();
      middleware.client.checkSpam.callsArgWith(1, null, false);

      middleware.process(req, res, data, cb);

      expect(middleware.client.checkSpam.calledOnce).to.be.true;
      expect(middleware.client.checkSpam.firstCall.args[0]).to.deep.equal({
        user_ip: req.userIP,
        user_agent: comment.userAgent,
        referrer: req.headers.referer,
        comment_type: middleware.options.commentType,
        comment_author: comment.name,
        comment_author_email: comment.email,
        comment_author_url: comment.website,
        comment_content: comment.body
      });
    });

    it('reports spam in comments', function() {
      var cb = sinon.spy();
      middleware.client.checkSpam.callsArgWith(1, null, true);

      middleware.process(req, res, data, cb);

      expect(cb.calledOnce).to.be.true;
      expect(cb.alwaysCalledWithExactly(null, comment)).to.be.true;

      expect(comment.isSpam).to.equal(true);
    });

    it('reports that comment does not have spam in it', function() {
      var cb = sinon.spy();
      middleware.client.checkSpam.callsArgWith(1, null, false);

      middleware.process(req, res, data, cb);

      expect(cb.calledOnce).to.be.true;
      expect(cb.alwaysCalledWithExactly(null, comment)).to.be.true;
      expect(comment.isSpam).to.equal(false);
    });

    it('propagates errors', function() {
      var cb = sinon.spy();
      var err = {};
      middleware.client.checkSpam.callsArgWith(1, err);

      middleware.process(req, res, data, cb);

      expect(cb.calledOnce).to.be.true;
      expect(cb.alwaysCalledWithExactly(err)).to.be.true;
      expect(comment.isSpam).to.be.undefined;
    });
  });
});