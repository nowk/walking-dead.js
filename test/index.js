/* jshint node: true */

var assert = require('chai').assert;
var domain = require('domain');
var app = require('./app');
var WalkingDead = require('..');


describe("WalkingDead", function() {
  this._timeout = 9999;
  var url = 'http://127.0.0.1:7331/';
  var zopts = {debug: false, silent: false};
  var server;

  before(function(done) {
    server = app.listen(7331, function() {
      done();
    });
  });

  after(function(done) {
    server.close(done);
  });

  it("has given/when/then/and chainable methods", function(done) {
    new WalkingDead(url).zombify(zopts)
      .then(function(browser) {
        assert.equal(browser.text('title'), 'Walking Dead');
      })
      .and(function(browser) {
        assert.equal(browser.text('h1'), 'Hello World!');
      })
      .when(function(browser, next) {
        browser.clickLink("Linky", next);
      })
      .then(function(browser) {
        assert.equal(browser.text('title'), 'Walking Dead - Linky');
      })
      .and(function(browser) {
        assert.equal(browser.text('h1'), 'Linky!');
      })
      .when(function(browser, next) {
        browser.clickLink("Home", next);
      })
      .then(function(browser) {
        assert.equal(browser.text('title'), 'Walking Dead');
      })
      .and(function(browser) {
        assert.equal(browser.text('h1'), 'Hello World!');
        done();
      });
  });

  describe("spanning across multiple test cases", function() {
    var wd;

    it("can span", function() {
      wd = new WalkingDead(url).zombify(zopts);
    });

    it("multiple", function(done) {
      wd.when(function(browser, next) {
        browser.clickLink('Linky', function() {
          next(done);
        });
      });
    });

    it("test cases", function() {
      wd.then(function(browser) {
        assert.equal(browser.text('h1'), 'Linky!');
      });
    });

    it.skip("if this fails (AssertionError)", function() {
      wd.then(function(browser) {
        assert.equal(browser.text('h1'), 'Wrong Text');
      });
    });

    it.skip('will still continue to assert this test', function() {
      wd.then(function(browser) {
        assert.equal(browser.text('a'), 'Wrong Text');
      });
    });
  });

  it("throws if not zombified", function() {
    assert.throws(function() {
      new WalkingDead(url)
        .then(function(browser) {
          assert.equal(browser.text('title'), 'Walking Dead');
        });
    }, 'WalkingDead was not zombified, please invoke `zombify` before continuing with steps');
  });

  it("assertion errors are not consumed by async-ness", function(done) {
    // new WalkingDead(url).zombify(zopts)
    //   .when(function(browser, next) {
    //     browser.clickLink('Linky', next);
    //   })
    //   .then(function(browser) {
    //     assert.equal(browser.text('title'), 'Wrong Title');
        done();
    //   });
  });

  it("can pass along additional arguments to the next step", function(done) {
    new WalkingDead(url).zombify(zopts)
      .given(function(browser, next) {
        var title = browser.text('title');
        next(null, title.toLowerCase(), title+'!');
      })
      .then(function(browser, arg1, arg2,  next) {
        assert.equal(arg1, 'walking dead');
        assert.equal(arg2, 'Walking Dead!');
        next(null, arg1+'!', arg2+'!');
      })
      .and(function(browser, arg1, arg2) {
        assert.equal(arg1, 'walking dead!');
        assert.equal(arg2, 'Walking Dead!!');
      })
      .and(function(browser, next) {
        assert.equal(typeof next, 'function');
        next(done);
      });
  });
});

