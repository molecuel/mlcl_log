var util        = require('util');
var winston     = require('winston');
var xtend = require('xtend');
var mlcl_elastic;
/**
 * Constructor
 *
 *
 */
var Elasticsearch = function Elasticsearch( options ) {

  options = options || {};

  // Set defaults
  this.level = options.level || 'info';
  this.indexName = options.indexName || 'logs';

  // Only set typeName if provided, otherwise we will use "level" for types.
  this.typeName = options.typeName || null;

  this.source = options.source || 'molecuel';

  // Automatically added entry fields
  this.disable_fields = options.disable_fields || false;

  return this;

};

util.inherits( Elasticsearch, winston.Transport );


/**
 * Handle Log Entries
 *
 *
 */
Elasticsearch.prototype.log = function log( level, msg, meta, callback ) {

  var self = this;
  var args = Array.prototype.slice.call( arguments, 0 );

  // Not sure if Winston always passed a callback and regulates number of args, but we are on the safe side here
  callback = 'function' === typeof args[ args.length - 1 ] ? args[ args.length - 1 ] : function fallback() {};

  // Using some Logstash naming conventions. (https://gist.github.com/jordansissel/2996677) with some useful variables for debugging.
  var entry = {
    level: level,
    '@source': meta.source || self.source,
    '@timestamp': new Date().toISOString(),
    '@message': msg
  };

  // Add auto-generated fields unless disabled
  if( meta && meta._enableProcess ) {
    entry['@fields'] = {
      pid: process.pid,
      path: module.parent.filename,
      user: process.env.USER,
      main: process.mainModule.filename,
      uptime: process.uptime(),
      rss: process.memoryUsage().rss,
      heapTotal: process.memoryUsage().heapTotal,
      heapUsed: process.memoryUsage().heapUsed
    };
  }

  if(meta.source) {
    delete(meta.source);
  }

  // Add tags only if they exist
  if( meta && meta.tags ) {
    entry['@tags'] = meta && meta.tags;
  }

  if( meta ) {
    entry['@fields'] = xtend(entry['@fields'], meta);
  }

  mlcl_elastic.index(self.indexName, entry, function(error, res) {
    // If we are ignoring callbacks
    if( callback && self.fireAndForget ){
      return callback( null );
    }

    if( callback ) {
      return callback( error, res );
    }

    self.emit('logged');
    if (callback) {
      callback(null, true);
    }
    callback = null;
  });

  return this;
};


var init = function init(elastic) {
  mlcl_elastic = elastic;
  return Elasticsearch;
};

module.exports = init;
