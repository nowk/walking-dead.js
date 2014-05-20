/* jshint node: true */

var Browser = require('zombie');
var Q = require('q');
var domain = require('domain');

/*
 * expose
 */

module.exports = WalkingDead;

/*
 * walking dead
 *
 * @param {String} url
 * @constructor
 */

function WalkingDead(url) {
  this.url = url;
  this.walking = false;
  this._steps = [];
  this._zombie = null;

  var self = this;
  this.d = domain.create();
  this.d.on('error', function(err) {
    self.walking = false;
    throw err; // throw it back out
  });
}

/*
 * start zombie and make initial visit call
 *
 * @param {Object} opts
 * @return {WalkingDead}
 * @api public
 */

WalkingDead.prototype.zombify = function(opts) {
  if ('undefined' === typeof opts) {
    opts = {};
  }

  this.browser = new Browser(opts);
  this._zombie = this.browser.visit.bind(this.browser, this.url);

  return this;
};

/*
 * chained methods
 */

WalkingDead.prototype.given = step;
WalkingDead.prototype.when = step;
WalkingDead.prototype.then = step;
WalkingDead.prototype.and = step;
WalkingDead.prototype.step = step;

/*
 * push steps to queue and start walking if not
 *
 * @param {Function} fn
 * @return {WalkingDead}
 * @api private
 */

function step(fn) {
  if (null === this._zombie) {
    var msg = 'WalkingDead was not zombified, please invoke `zombify` before continuing with steps';
    throw new Error(msg);
  }

  if (fn.length === 2) {
    fn = turn(fn).bind(null, this.browser); // async wrap in promise
  } else {
    fn = fn.bind(null, this.browser);
  }

  this._steps.push(fn);

  if (!this.walking) {
    this.walking = true;

    if ('undefined' === typeof this._zombie) {
      walk.call(this);
    } else {
      var self = this;
      this._zombie(function(err) { // [, browser, status] these always come undefined....
        if (err) {
          throw err;
        }
        walk.call(self);
        delete self._zombie;
      });
    }
  }

  return this;
}

/*
 * execute steps
 *
 * @api private
 */

function walk() {
  if (this._steps.length > 0) {
    var self = this;
    var fn = this._steps.shift();

    this.d.run(function() {
      process.nextTick(function() {
        var _return = fn();

        if ('undefined' === typeof _return || 'Promise' !== _return.constructor.name) {
          return walk.call(self);
        }

        _return.then(walk.bind(self));
      });
    });
  } else {
    this.walking = false;
  }
}

/*
 * wrap in a promise
 *
 * @param {Function} fn
 * @return {Function}
 * @api private
 */

function turn(fn) {
  return function(browser) {
    var d = Q.defer();
    fn.call(fn, browser, next.bind(null, d));
    return d.promise;
  };
}

/*
 * next for async
 *
 * @param {defer} defer
 * @param {Function} callback
 * @api private
 */

function next(defer, callback) {
  defer.resolve();

  if ('function' === typeof callback) {
    callback();
  }
}

