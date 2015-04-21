/// <reference path="./typings/async/async.d.ts"/>
/// <reference path="./typings/winston/winston.d.ts"/>
/// <reference path="./typings/node/node.d.ts"/>
var winston = require('winston');
var elastic = require('./transports/elastic');
var async = require('async');
var util = require('util');
var mlcl_log = (function () {
    function mlcl_log() {
        var _this = this;
        this.levels = ['debug', 'info', 'warn', 'error'];
        if (mlcl_log._instance) {
            throw new Error('Error: Instantiation failed. Singleton module! Use .getInstance() instead of new.');
        }
        mlcl_log._instance = this;
        this.logger = new winston.Logger({
            transports: [new winston.transports.Console({ color: true, timestamp: true })]
        });
        async.each(this.levels, function (el, callback) {
            _this[el] = function (source, msg, meta) {
                _this.log(el, source, msg, meta);
            };
            callback();
        }, function () {
            mlcl_log.molecuel.log = _this;
        });
        mlcl_log.molecuel.once('mlcl::search::connection:success', function (mlcl_elastic) {
            _this.registerTransport('elasticsearch', elastic(mlcl_elastic));
            if (mlcl_log.molecuel.config.log.ttl) {
                var index = 'logs';
                if (mlcl_log.molecuel.config.log && mlcl_log.molecuel.config.log.index) {
                    index = mlcl_log.molecuel.config.log.index;
                }
                var mapping = {};
                mapping[index] = {
                    '_ttl': { 'enabled': true, 'default': mlcl_log.molecuel.config.log.ttl }
                };
                mlcl_elastic.checkCreateIndex(index, {}, mapping, function () {
                    _this.logger.add(winston.transports['elasticsearch'])
                        .remove(winston.transports.Console);
                    mlcl_log.molecuel.emit('mlcl::log::connection:success', _this);
                });
            }
            else {
                _this.logger.add(winston.transports['elasticsearch'])
                    .remove(winston.transports.Console);
                mlcl_log.molecuel.emit('mlcl::log::connection:success', _this);
            }
        });
        mlcl_log.molecuel.on('mlcl::search::connection:disconnected', function () {
            _this.recoverConsole();
            mlcl_log.molecuel.log = console;
        });
    }
    mlcl_log.prototype.formatArgs = function (args) {
        return [util.format.apply(util.format, Array.prototype.slice.call(args))];
    };
    mlcl_log.prototype.log = function (level, source, msg, meta) {
        if (!meta) {
            meta = {};
        }
        meta.source = source;
        msg = msg.trim();
        if (msg.length > 0) {
            this.logger.log(level, msg, meta);
        }
    };
    mlcl_log.prototype.endLog = function () {
        this.recoverConsole();
    };
    mlcl_log.prototype.registerTransport = function (name, handler) {
        winston.transports[name] = handler;
    };
    mlcl_log.prototype.overwriteConsole = function () {
        var _this = this;
        var _arguments = arguments;
        console.log = function () {
            _this.logger.log.apply(_this.logger, _this.formatArgs(_arguments));
        };
        console.info = function () {
            _this.logger.info.apply(_this.logger, _this.formatArgs(_arguments));
        };
        console.warn = function () {
            _this.logger.warn.apply(_this.logger, _this.formatArgs(_arguments));
        };
        console.error = function () {
            _this.logger.error.apply(_this.logger, _this.formatArgs(_arguments));
        };
        console.debug = function () {
            _this.logger.debug.apply(_this.logger, _this.formatArgs(_arguments));
        };
    };
    mlcl_log.prototype.recoverConsole = function () {
        delete (console.log);
        delete (console.info);
        delete (console.warn);
        delete (console.error);
        delete (console.debug);
    };
    mlcl_log.getInstance = function () {
        if (mlcl_log._instance === null) {
            mlcl_log._instance = new mlcl_log();
        }
        return mlcl_log._instance;
    };
    mlcl_log.init = function (m) {
        mlcl_log.molecuel = m;
        return mlcl_log.getInstance();
    };
    mlcl_log._instance = null;
    return mlcl_log;
})();
module.exports = mlcl_log.init;
