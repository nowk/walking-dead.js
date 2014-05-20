# Walking Dead

Zombies don't like pasta.

# install

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
        pressButton("Sign Me Up!", next);
      })
      .then(function(browser) {
        assert.ok(browser.success);
        assert.equal(browser.text("title"), "Welcome To Brains Depot");
      });

# License

MIT

