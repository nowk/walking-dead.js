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
  this._passargs = [];
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
  opts = opts || {};
  this.browser = new Browser(opts);
  this._zombie = this.browser.visit.bind(this.browser, this.url);
  return this;
};

/*
 * chained methods
 */

var chainMethods = ['given', 'when', 'then', 'and', 'step'];
chainMethods
  .forEach(function(m) {
    WalkingDead.prototype[m] = step;
  });

/*
 * push steps to queue and start walking if not
 *
 * @param {Function} fn
 * @return {WalkingDead}
 * @api private
 */

function step(fn) {
  if ('function' !== typeof fn) {
    throw new Error('WalkingDead step must be a function');
  }

  if (null === this._zombie) {
    throw new Error('WalkingDead was not zombified, please invoke `zombify`' +
      ' before continuing with steps');
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
    var fn = turn.call(this, this._steps.shift());
    var self = this;

    this.d.run(function() {
      process.nextTick(function() {
        var _returned = fn();
        if ('undefined' !== typeof _returned && 'then' in _returned) { // promise
          _returned.then(walk.bind(self));
        } else {
          walk.call(self);
        }
      });
    });
  } else {
    this.walking = false;
  }
}

/*
 * curry and promise (if applicable)
 *
 * @param {Function} fn
 * @return {Function}
 * @api private
 */

function turn(fn) {
  if (2 === (fn.length - this._passargs.length)) {
    return promise.bind(this, curry.call(this, fn));
  } else {
    return curry.call(this, fn);
  }
}

/*
 * curry arguments
 *
 * @param {Function} fn
 * @return {Function}
 * @api private
 */

function curry(fn) {
  var args = [this.browser].concat(this._passargs);
  this._passargs = []; // reset passargs

  return function() {
    return fn.apply(fn, args.concat(Array.prototype.slice.call(arguments)));
  };
}

/*
 * wrap in promise
 *
 * @param {Function} fn
 * @return {Promise}
 */

function promise(fn) {
  var d = Q.defer();
  fn(next.bind(this, d)); // pass next for async
  return d.promise;
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

  // if callback is a function execute and return, this is primarily
  // reserved to handle `done` invocations for async tests
  if ('function' === typeof callback) {
    return callback();
  }

  // save args to next pass to next step
  this._passargs = Array.prototype.slice.call(arguments, 2, arguments.length);
}

