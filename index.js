/* jshint node: true */

var Browser = require('zombie');

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
 * end
 *
 * @param {Function} fn
 * @api public
 */

WalkingDead.prototype.end = function(fn) {
  var self = this;
  var args = [this.browser];

  if (/^function\s?\(err\)\s?{/.test(fn.toString())) { // mocha done()
    args = [];
  }

  step.call(this, function() {
    fn.apply(self, args);
    self.browser.destroy();
  });
};

/*
 * push steps to queue and start walking if not
 *
 * @param {Function} fn
 * @return {WalkingDead}
 * @api public
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
    var fn = this._steps.shift();
    fn = curry.call(this, fn, (2 === (fn.length - this._passargs.length)));
    try {
      fn();
      this._passargs = []; // clear
    } catch(err) {
      this.walking = false;
      throw err; // rethrow
    }
  } else {
    this.walking = false;
  }
}

/*
 * curry arguments
 *
 * @param {Function} fn
 * @param {Boolean} async
 * @return {Function}
 * @api private
 */

function curry(fn, async) {
  var self = this;
  return function() {
    var args = [self.browser]
      .concat(self._passargs)
      .concat(Array.prototype.slice.call(arguments));

    if (true === async) { // add next to call for async
      args.push(next.bind(self));
    }

    fn.apply(fn, args);
    if (!async) next.call(self);
  };
}

/*
 * next for async
 *
 * @param {Function} callback
 * @api private
 */

function next(callback) {
  // if callback is a function execute and return, this is primarily
  // reserved to handle `done` invocations for async tests
  if ('function' === typeof callback) {
    this.walking = false;
    return callback();
  }

  // save args to next pass to next step
  this._passargs = Array.prototype.slice.call(arguments, 1); // adjust for null
  walk.call(this);
}

