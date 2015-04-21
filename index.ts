/// <reference path="./typings/async/async.d.ts"/>
/// <reference path="./typings/winston/winston.d.ts"/>
/// <reference path="./typings/node/node.d.ts"/>

import winston = require('winston');
import elastic = require('./transports/elastic');
import async = require('async');
import util = require('util');

class mlcl_log {

  private static _instance:mlcl_log = null;
  public static molecuel;
  protected logger:winston.LoggerInstance;
  protected levels = ['debug', 'info', 'warn', 'error'];

  constructor() {
    if(mlcl_log._instance){
      throw new Error('Error: Instantiation failed. Singleton module! Use .getInstance() instead of new.');
    }
    mlcl_log._instance = this;
    this.logger = new winston.Logger({
      transports: [new winston.transports.Console({ color: true, timestamp: true})]
    });

    async.each(this.levels, (el: string, callback) => {
      this[el] = (source, msg, meta) => {
        this.log(el, source, msg, meta);
      };
      callback();
    }, () => {
      mlcl_log.molecuel.log = this;
    });

    // provides mlcl_elastic as argument for the function...
    mlcl_log.molecuel.once('mlcl::search::connection:success', (mlcl_elastic) => {
      this.registerTransport('elasticsearch', elastic(mlcl_elastic));
      /*if(mlcl_log.molecuel.config.log.overwriteConsole) {
        console.log('overwrite console');
        this.overwriteConsole();
      }*/

      if(mlcl_log.molecuel.config.log.ttl) {
        var index = 'logs';
        if(mlcl_log.molecuel.config.log && mlcl_log.molecuel.config.log.index) {
          index = mlcl_log.molecuel.config.log.index;
        }

        var mapping = {};
        mapping[index] = {
          '_ttl' : { 'enabled' : true, 'default': mlcl_log.molecuel.config.log.ttl }
        };

        mlcl_elastic.checkCreateIndex(index, {}, mapping, () => {
          this.logger.add(winston.transports['elasticsearch'])
            .remove(winston.transports.Console);
            mlcl_log.molecuel.emit('mlcl::log::connection:success', this);
        });
      } else {
        this.logger.add(winston.transports['elasticsearch'])
          .remove(winston.transports.Console);
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

  public log(level, source, msg, meta):void {
    if(!meta) {
      meta = {};
    }
    meta.source = source;
    msg = msg.trim();
    if(msg.length>0) {
      this.logger.log(level, msg, meta);
    }
  }

  public endLog() {
    this.recoverConsole();
  }

  public registerTransport(name:string, handler:any) {
    winston.transports[name] = handler;
  }

  public overwriteConsole() {
    var _arguments = arguments;
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
    delete(console.log);
    delete(console.info);
    delete(console.warn);
    delete(console.error);
    delete(console.debug);
  }

  public static getInstance():mlcl_log {
    if(mlcl_log._instance === null) {
      mlcl_log._instance = new mlcl_log();
    }
    return mlcl_log._instance;
  }

  public static init(m):mlcl_log {
    mlcl_log.molecuel = m;
    return mlcl_log.getInstance();
  }

}

export = mlcl_log.init;
