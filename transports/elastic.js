/// <reference path="./../typings/async/async.d.ts"/>
/// <reference path="./../typings/winston/winston.d.ts"/>
/// <reference path="./../typings/node/node.d.ts"/>
var util = require('util');
var winston = require('winston');
var xtend;
xtend = require('xtend');
var mlcl_elastic;
var Elasticsearch = function Elasticsearch(options) {
    options = options || {};
    this.level = options.level || 'info';
    this.indexName = options.indexName || 'logs';
    this.typeName = options.typeName || null;
    this.source = options.source || 'molecuel';
    this.disable_fields = options.disable_fields || false;
    return this;
};
util.inherits(Elasticsearch, winston.Transport);
Elasticsearch.prototype.name = 'elasticsearch';
Elasticsearch.prototype.log = function log(level, msg, meta, callback) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 0);
    callback = 'function' === typeof args[args.length - 1] ? args[args.length - 1] : function fallback() { };
    var entry = {
        level: level,
        '@source': meta.source || self.source,
        '@timestamp': new Date().toISOString(),
        '@message': msg
    };
    if (meta && meta._enableProcess) {
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
    if (meta.source) {
        delete (meta.source);
    }
    if (meta && meta.tags) {
        entry['@tags'] = meta && meta.tags;
    }
    if (meta) {
        entry['@fields'] = xtend(entry['@fields'], meta);
    }
    mlcl_elastic.index(self.indexName, entry, function (error, res) {
        if (callback && self.fireAndForget) {
            return callback(null);
        }
        if (callback) {
            return callback(error, res);
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
