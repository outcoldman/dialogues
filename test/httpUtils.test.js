describe('httpUtils.js', function() { 'use strict';
  var httpUtils = require('./../lib/httpUtils');
  var expect = require('chai').expect;
  var PassThrough = require('stream').PassThrough;
  var sinon = require('sinon');

  describe('requested instance', function() {
    
    it('is an object', function() {
      expect(httpUtils).to.be.a('object');
    });

  });

  describe('httpUtils.readAsPlainText', function() {
    it('is an function with two parameters', function() {
      expect(httpUtils.readAsPlainText).to.be.a('function');
      expect(httpUtils.readAsPlainText.length).to.equal(2);
    });

    it('reads request data as plain text', function(done) {
      var req = new PassThrough();
      httpUtils.readAsPlainText(req, function(err, res) {
        expect(err).to.be.null;
        expect(res).to.equal('AB');
        done();
      });
      req.write('A');
      req.end('B');
    });

    it('propagates errors', function(done) {
      var error = {};
      var req = new PassThrough();
      httpUtils.readAsPlainText(req, function(err, res) {
        expect(err).to.equal(error);
        expect(res).to.be.undefined;
        done();
      });
      req.write('A');
      req.emit('error', error);
    });
  });

  describe('httpUtils.readAsJson', function() {
    it('is an function with two parameters', function() {
      expect(httpUtils.readAsJson).to.be.a('function');
      expect(httpUtils.readAsJson.length).to.equal(2);
    });

    it('reads request data as json object', function(done) {
      var json = { a: 'a', b: 'b' };
      var req = new PassThrough();
      httpUtils.readAsJson(req, function(err, res) {
        expect(err).to.be.null;
        expect(res).to.deep.equal(json);
        done();
      });
      JSON.stringify(json).split('').forEach(req.write, req);
      req.end();
    });

    it('propagates errors', function(done) {
      var error = {};
      var req = new PassThrough();
      httpUtils.readAsJson(req, function(err, res) {
        expect(err).to.equal(error);
        expect(res).to.be.undefined;
        done();
      });
      req.write('{');
      req.emit('error', error);
    });
  });

  describe('httpUtils.getClientIP', function() {
    it('is an function with one parameter', function() {
      expect(httpUtils.getClientIP).to.be.a('function');
      expect(httpUtils.getClientIP.length).to.equal(1);
    });
  });
});