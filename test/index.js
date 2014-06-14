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
      .given(function(browser) {
        assert.equal(browser.text('title'), 'Walking Dead');
      })
      .when(function(browser, next) {
        browser.clickLink("Linky", next);
      })
      .then(function(browser) {
        assert.equal(browser.text('title'), 'Walking Dead - Linky');
      })
      .and(function(browser) {
        assert.equal(browser.text('h1'), 'Linky!');
        done();
      });
  });

  describe("spanning across multiple test cases", function() {
    var wd;

    before(function() {
      wd = new WalkingDead(url).zombify(zopts);
    });

    it("can span", function() {
      wd.given(function(browser) {
        assert.equal(browser.text('title'), 'Walking Dead');
      });
    });

    it("multiple", function(done) {
      wd.when(function(browser) {
        browser.clickLink('Linky', done);
      });
    });

    it("test cases", function() {
      wd.then(function(browser) {
        assert.equal(browser.text('h1'), 'Linky!');
      });
    });

    it("if this fails (AssertionError)", function(done) {
      wd.then(function(browser) {
        // assert.equal(browser.text('h1'), 'Wrong Text');
        done();
      });
    });

    it('will still continue to assert this test', function(done) {
      wd.then(function(browser) {
        // assert.equal(browser.text('a'), 'Wrong Text');
        done();
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

  it("throws if the step is not a function", function() {
    assert.throws(function() {
      new WalkingDead(url).then('A String');
    }, 'WalkingDead step must be a function');
  });

  it("assertion errors are not consumed by async-ness", function(done) {
    new WalkingDead(url).zombify(zopts)
      .when(function(browser, next) {
        browser.clickLink('Linky', next);
      })
      .then(function(browser) {
        // assert.equal(browser.text('title'), 'Wrong Title');
        done();
      });
  });

  it("never seen `waitable` functions every passback the args defined in the docs or code", 
    function(done) {

    /*
     * eg. `clickLink`, `pressButton`
     * supposed to callback(err, browser, status) But, i've never seen them return anything
     * but undefined...
     *
     * https://github.com/assaf/zombie/blob/master/src/zombie/browser.coffee#L899
     * https://github.com/assaf/zombie/blob/master/src/zombie/browser.coffee#L598
     */

    var now = new Date();
    var start;
    new WalkingDead(url).zombify(zopts)
      .when(function(browser, next) {
        browser.clickLink('Linky', next);
      })
      .and(function(browser, next) {
        start = new Date().getTime();
        setTimeout(function() {
          next();
        }, 2000);
      })
      .then(function(browser) {
        var end = new Date().getTime();
        assert(end >= start+2000);
        done();
      });
  });

  it("can pass along additional arguments to the next step", function(done) {
    new WalkingDead(url).zombify(zopts)
      .given(function(browser, next) {
        assert.lengthOf(arguments, 2);
        var title = browser.text('title');
        next(title.toLowerCase(), title+'!');
      })
      .then(function(browser, arg1, arg2,  next) {
        assert.lengthOf(arguments, 4);
        assert.equal(arg1, 'walking dead');
        assert.equal(arg2, 'Walking Dead!');
        next(arg1+'!');
      })
      .and(function(browser, arg1) {
        assert.lengthOf(arguments, 2);
        assert.equal(arg1, 'walking dead!');
      })
      .and(function(browser, next) {
        assert.lengthOf(arguments, 2);
        assert.equal(typeof next, 'function');
        next(function() {
          done();
        });
      })
      .then(function(browser, fn) {
        fn();
      });
  });

  describe("end", function() {
    it("'destroys' the current browser session", function(done) {
      new WalkingDead(url).zombify(zopts)
        .end(function(browser) {
          assert.lengthOf(browser.tabs, 1);
          process.nextTick(function() {
            assert.isNull(browser.tabs);
            done();
          });
        });
    });

    it("is no longer chainable", function(done) {
      var wd = new WalkingDead(url).zombify(zopts);
      assert.isUndefined(wd.end(function(browser) {
        done();
      }));
    });

    it("sends browser back as the only argument", function(done) {
      new WalkingDead(url).zombify(zopts)
        .end(function(browser, next) {
          assert.lengthOf(arguments, 1);
          assert.isUndefined(next, 1);
          assert.equal(browser.text('title'), 'Walking Dead');
          done();
        });
    });

    it("will send any passed arguments from the prior step", function(done) {
      new WalkingDead(url).zombify(zopts)
        .when(function(browser, next) {
          next(function() {
            done();
          });
        })
        .end(function(browser, fn) {
          assert.lengthOf(arguments, 2);
          assert.equal(typeof fn, 'function');
          fn();
        });
    });

    it("can call done with no argument", function(done) {
      new WalkingDead(url).zombify(zopts)
        .end(done);
    });

    it("does not need a function", function(done) {
      var wd = new WalkingDead(url).zombify(zopts);
      wd.then(function() {
        wd.end();
        done();
      });
    });
  });
});

