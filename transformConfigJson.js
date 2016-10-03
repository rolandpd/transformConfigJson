/*eslint-env node */
"use strict";

var assign = require("object-assign");
var stream = require("stream");
var process = require("process");
var util = require("util");

function getNpmPackageConfigParams() {
  var config = {
    name: process.env.npm_package_name || "",
    version: process.env.npm_package_version || "",
    description: process.env.npm_package_version || ""
  };
  Object.keys(process.env)
    .filter(function (envkey) {
      return envkey.lastIndexOf('npm_package_config_', 0) === 0;
    })
    .forEach(function (key) {
      config[key.replace('npm_package_config_', '')] = process.env[key];
    });
  return config;
}


util.inherits(Configify, stream.Transform);
function Configify(filename, opts) {
  if (!(this instanceof Configify)) {
    return Configify.configure(opts)(filename);
  }
  this._data = {};
  this._filename = filename;
  stream.Transform.call(this);
}

Configify.prototype._flush = function (cb) {
  try {
    this.emit("configify", this._data, this._filename);
    this.push("module.exports = " + JSON.stringify(this._data, null, 2));
  } catch (err) {
    this.emit("error", err);
    return;
  }
  cb();
};

Configify.prototype._transform = function (configJson, encoding, cb) {
  var localConfig = getNpmPackageConfigParams();
  this._data = assign({}, JSON.parse(configJson), localConfig);
  cb();
};

Configify.configure = function (opts) {
  opts = assign({}, opts);

  return function (filename) {
    if (filename.match(/\.config\.json$/gi)) {
      return new Configify(filename, opts);
    }
    return stream.PassThrough();
  };
};

module.exports = Configify;
