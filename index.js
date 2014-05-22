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
    var msg = 'WalkingDead was not zombified, please invoke `zombify` before continuing with steps';
    throw new Error(msg);
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
    var passArgsLength = !!!this._passArgs ? 0 : this._passArgs.length;

    if (fn.length-passArgsLength === 2) {
      fn = turn(fn).bind(this, this.browser, this._passArgs); // async wrap in promise
      fn._promised = true;
    }

    this.d.run(function() {
      process.nextTick(function() {
        if (fn._promised) {
          fn().then(walk.bind(self));
        } else {
          fn.apply(fn, [self.browser].concat(self._passArgs));
          clearPassArgs.call(self);
          walk.call(self);
        }
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
  return function(browser, extraArgs) {
    var d = Q.defer();
    var args = [browser];
    if ('undefined' !== typeof extraArgs) {
      args = args.concat(extraArgs);
    }
    args.push(next.bind(this, d));
    fn.apply(fn, args);
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

  // if callback is a function execute and return, this is primarily
  // reserved to handle `done` invocations for async tests
  if ('function' === typeof callback) {
    return callback();
  }

  var passArgs = Array.prototype.slice.call(arguments, 2, arguments.length);
  if (passArgs.length > 0) {
    this._passArgs = passArgs;
  } else {
    clearPassArgs.call(this);
  }
}

/*
 * undefine _passArgs
 *
 * @api private
 */

function clearPassArgs() {
  delete this._passArgs;
}
