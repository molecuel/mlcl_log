/***
 * Molecuel CMS - Elasticsearch integration module
 * @type {exports}
 */
var winston = require('winston');
var elastic = require('./transports/elastic');
var async = require('async');
var util = require('util');
var molecuel;

var log = function log() {
  var self = this;
  this.logger = new winston.Logger();
  this.logger.add(winston.transports.Console, { color: true, timestamp: true});

  async.each(Object.keys(self.logger.levels), function(element, callback) {
    var logFunction = function logFunction(source, msg, meta) {
      this.log(element, source, msg, meta);
    };
    self[element] = logFunction;
    callback();
  });

  this.formatArgs = function formatArgs(args){
    return [util.format.apply(util.format, Array.prototype.slice.call(args))];
  };

  // provides mlcl_elastic as argument for the function...
  molecuel.on('mlcl::search::connection:success', function(mlcl_elastic) {
    self.registerTransport('elasticsearch', elastic(mlcl_elastic));
    molecuel.log = self;
    if(molecuel.config.log.overwriteConsole) {
      self.overwriteConsole();
    }

    if(molecuel.config.log.ttl) {
      var index = 'logs';
      if(molecuel.config.log && molecuel.config.log.index) {
        index = molecuel.config.log.index;
      }

      var mapping = {};
      mapping[index] = {
        '_ttl' : { 'enabled' : true, 'default': molecuel.config.log.ttl }
      };

      mlcl_elastic.checkCreateIndex(index, {}, mapping, function() {
        self.logger.add(winston.transports.elasticsearch)
          .remove(winston.transports.Console);

        molecuel.emit('mlcl::log::connection:success', self);
      });
    } else {
      self.logger.add(winston.transports.elasticsearch)
        .remove(winston.transports.Console);
      molecuel.emit('mlcl::log::connection:success', self);

    }
  });

  molecuel.on('mlcl::search::connection:disconnected', function() {
    self.recoverConsole();
    molecuel.log = console;
  });
};

/////////////////////
// singleton stuff
////////////////////
var instance = null;

var getInstance = function(){
  return instance || (instance = new log());
};

log.prototype.log = function log(level, source, msg, meta) {
  var self = this;
  if(!meta) {
    meta = {};
  }
  meta.source = source;
  msg = msg.trim();
  if(msg.length>0) {
    self.logger.log(level, msg, meta);
  }
};

log.prototype.endLog = function endLog() {
  this.recoverConsole();
};

log.prototype.registerTransport = function registerTransport(name, handler) {
  winston.transports[name] = handler;
};

log.prototype.overwriteConsole = function overwriteConsole() {
  var log = getInstance();
  var self = log;
  console.log = function(){
    self.logger.info.apply(self.logger, self.formatArgs(arguments));
  };

  console.info = function(){
    self.logger.info.apply(self.logger, self.formatArgs(arguments));
  };

  console.warn = function(){
    self.logger.warn.apply(self.logger, self.formatArgs(arguments));
  };

  console.error = function(){
    self.logger.error.apply(self.logger, self.formatArgs(arguments));
  };

  console.debug = function(){
    self.logger.debug.apply(self.logger, self.formatArgs(arguments));
  };
};

log.prototype.recoverConsole = function recoverConsole() {
  delete(console.log);
  delete(console.info);
  delete(console.warn);
  delete(console.error);
  delete(console.debug);
};

function init(m) {
  molecuel = m;
  return getInstance();
}

module.exports = init;
