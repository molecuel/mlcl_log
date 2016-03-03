"use strict";
const util = require('util');
const winston = require('winston');
let xtend;
xtend = require('xtend');
let mlclElastic;
let elasticsearch = function elasticsearch(options) {
    options = options || {};
    this.level = options.level || 'info';
    this.indexName = options.indexName || 'logs';
    this.typeName = options.typeName || null;
    this.source = options.source || 'molecuel';
    this.disable_fields = options.disable_fields || false;
    return this;
};
util.inherits(elasticsearch, winston.Transport);
elasticsearch.prototype.name = 'elasticsearch';
elasticsearch.prototype.log = function log(level, msg, meta, callback) {
    let self = this;
    let args = Array.prototype.slice.call(arguments, 0);
    callback = 'function' === typeof args[args.length - 1] ? args[args.length - 1] : function fallback() { };
    let entry = {
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
            main: require.main.filename,
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
    mlclElastic.index(self.indexName, entry, function (error, res) {
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
let init = function init(elastic) {
    mlclElastic = elastic;
    return elasticsearch;
};
module.exports = init;
