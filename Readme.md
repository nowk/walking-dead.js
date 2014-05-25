# Walking Dead

[![Build Status](https://travis-ci.org/nowk/walking-dead.js.svg?branch=master)](https://travis-ci.org/nowk/walking-dead.js)
[![Code Climate](https://codeclimate.com/github/nowk/walking-dead.js.png)](https://codeclimate.com/github/nowk/walking-dead.js)

Zombies don't like pasta.

# Install

    npm install walking-dead

# Usage

Zombie basic:

    var Browser = require("zombie");
    var assert = require("assert");

    // Load the page from localhost
    browser = new Browser()
    browser.visit("http://localhost:3000/", function () {

      // Fill email, password and submit form
      browser.
        fill("email", "zombie@underworld.dead").
        fill("password", "eat-the-living").
        pressButton("Sign Me Up!", function() {

          // Form submitted, new page loaded.
          assert.ok(browser.success);
          assert.equal(browser.text("title"), "Welcome To Brains Depot");
        });
    });

Becomes Walking Dead

    var WalkingDead = require('walking-dead');
    var assert = require('assert');

    new WalkingDead('http://localhost:3000/').zombify({})
      .when(function(browser) {
        browser.
          fill("email", "zombie@underworld.dead").
          fill("password", "eat-the-living").
      })
      .and(function(browser, next) {
        browser.pressButton("Sign Me Up!", next);
      })
      .then(function(browser) {
        assert.ok(browser.success);
        assert.equal(browser.text("title"), "Welcome To Brains Depot");
      });

---

Passing additional `agruments` to the next step.

    new WalkingDead('http://localhost:3000/').zombify({})
      .when(function(browser, next) {
        var title = browser.text('title');
        next(title.toLowerCase());
      })
      .then(function(browser, lowerCaseTitle, next) {
        assert.equal(lowerCaseTitle, '<a lowercased title>');
        next(function() {
          done();
        });
      })
      .end(function(browser, fn) {
        fn();
      });

---

You can also call `end` to end the session. `end` returns `browser` as the first agrument by default, as well as any arguments `next`ed from the prior step.

    new WalkingDead('http://localhost:3000/').zombify({})
      .end(function(browser) {
        assert.equal(browser.text("title"), "Welcome To Brains Depot");
        done();
      });

Or

    new WalkingDead('http://localhost:3000/').zombify({})
      .then(function(browser) {
        assert.equal(browser.text("title"), "Welcome To Brains Depot");
      })
      .end(done);


# License

MIT

