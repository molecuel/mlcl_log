'use strict';
/// <reference path="../typings/main.d.ts"/>

import winston = require('winston');
import elastic = require('./transports/elastic');
import async = require('async');
import util = require('util');
import _ = require('lodash');

class mlcl_log {
  public static loaderversion = 2;
  public static singleton = false;
  public static molecuel;
  protected logger: winston.LoggerInstance;
  protected levels = ['debug', 'info', 'warn', 'error'];

  constructor(molecuel: any, config: any) {
    mlcl_log.molecuel = molecuel;
    this.logger = new winston.Logger({
      transports: [new winston.transports.Console()]
    });

    async.each(this.levels, (el: string, callback) => {
      this[el] = (source, msg, meta) => {
        this.log(el, source, msg, meta);
      };
      callback();
    }, () => {
      mlcl_log.molecuel.log = this;
    });

    let logconf = mlcl_log.molecuel.config.log;
    if (logconf.transports && logconf.transports.console && logconf.transports.console.level) {
      this.logger['transports'].console.level = logconf.transports.console.level;
    } else {
      this.logger.remove(winston.transports.Console);
    }

    // provides mlclElastic as argument for the function...
    mlcl_log.molecuel.once('mlcl::search::connection:success', (mlclElastic) => {
      if (logconf.elasticsearch === true
        || (typeof logconf.elasticsearch === 'object' && !Array.isArray(logconf.elasticsearch))) {

          this.registerTransport('elasticsearch', elastic(mlclElastic));
          if (mlcl_log.molecuel.config.log.ttl) {
            let index = 'logs';
            if (mlcl_log.molecuel.config.log && mlcl_log.molecuel.config.log.index) {
              index = mlcl_log.molecuel.config.log.index;
            }

            let mapping = {};
            mapping[index] = {
              '_ttl': { 'enabled': true, 'default': mlcl_log.molecuel.config.log.ttl }
            };

            mlclElastic.checkCreateIndex(index, {}, mapping, () => {
              if (logconf.transports && logconf.transports.elasticsearch && logconf.transports.elasticsearch.level) {
                this.logger.add(winston.transports['elasticsearch'], { level: logconf.transports.elasticsearch.level });
                mlcl_log.molecuel.emit('mlcl::log::connection:success', this);
              } else {
                this.logger.add(winston.transports['elasticsearch']);
                mlcl_log.molecuel.emit('mlcl::log::connection:success', this);
              }
            });
          } else {
            this.logger.add(winston.transports['elasticsearch']);
            mlcl_log.molecuel.emit('mlcl::log::connection:success', this);
          }
      } else {
        mlcl_log.molecuel.emit('mlcl::log::connection:success', this);
      }
    });

    mlcl_log.molecuel.on('mlcl::search::connection:disconnected', () => {
      this.recoverConsole();
      mlcl_log.molecuel.log = console;
    });
  }

  protected formatArgs(args) {
    return [util.format.apply(util.format, Array.prototype.slice.call(args))];
  }

  public log(level, source, msg, meta): void {
    if (!meta) {
      meta = {};
    }
    meta.source = source;
    msg = msg || '';
    if (_.isObject(msg)) {
      msg = msg.toString();
    }
    msg = msg.trim();
    if (msg.length > 0) {
      this.logger.log(level, msg, meta);
    }
  }

  public endLog() {
    this.recoverConsole();
  }

  public registerTransport(name: string, handler: any) {
    winston.transports[name] = handler;
  }

  public overwriteConsole() {
    let _arguments = arguments;
    console.log = () => {
      this.logger.log.apply(this.logger, this.formatArgs(_arguments));
    };

    console.info = () => {
      this.logger.info.apply(this.logger, this.formatArgs(_arguments));
    };

    console.warn = () => {
      this.logger.warn.apply(this.logger, this.formatArgs(_arguments));
    };

    console.error = () => {
      this.logger.error.apply(this.logger, this.formatArgs(_arguments));
    };

    console.debug = () => {
      this.logger.debug.apply(this.logger, this.formatArgs(_arguments));
    };
  }

  public recoverConsole() {
    delete (console.log);
    delete (console.info);
    delete (console.warn);
    delete (console.error);
    delete (console.debug);
  }
}

export = mlcl_log;
