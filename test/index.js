/**
 * Created by dob on 20.11.13.
 */
var should = require('should'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter,
  mlcl_elastic = require('mlcl_elastic'),
  mlcl_log = require('../dist');

describe('mlcl_log', function() {
  var mlcl;
  var molecuel;
  var log;
  var searchcon;

  before(function(done) {
    // init fake molecuel
    mlcl = function() {
      return this;
    };
    util.inherits(mlcl, EventEmitter);
    molecuel = new mlcl();

    molecuel.config = { };
    molecuel.config.search = {
      hosts: ['http://localhost:9200'],
      prefix: 'mlcl-log-unit'
    };

    molecuel.config.log = {
      ttl: '4w',
      elasticsearch: true,
      overwriteConsole: false,
      transports: {
        elasticsearch: {
          level: 'info'
        },
        console: {
          level: 'debug'
        }
      }
    };

    mlcl_elastic(molecuel);
    log = new mlcl_log(molecuel);

    molecuel.once('mlcl::search::connection:success', function(search) {
      searchcon = search;
    });
    done();
  });

  describe('elastic', function() {

    it('should wait for log init', function(done) {
      this.timeout(4000);
      molecuel.once('mlcl::log::connection:success', function(connection) {
        connection.should.be.a.object;
        done();
      });
      molecuel.emit('mlcl::core::init:post', molecuel);
      // fake event
      molecuel.emit('mlcl::queue::init:post', {});      
    });

    it('should write first log', function(done) {
      molecuel.log.info('unittest', 'testinfo');
      setTimeout(function() {
          done();
        }, 1000);
    });

    it('should write second log', function(done) {
      molecuel.log.info('unittest', 'testinfo');
      setTimeout(function() {
          done();
        }, 1000);
    });

    it('should write third log', function(done) {
      molecuel.log.info('unittest', 'testinfo');
      setTimeout(function() {
          done();
        }, 1000);
    });

    it('should find logs in the elasticsearch', function(done) {
      searchcon.search({index: 'logs'}, function(error, result) {
        should.not.exists(error);
        result.should.be.a.object;
        result.hits.total.should.be.above(0);
        done();
      });
    });

    after(function(done) {
      log.endLog();
      searchcon.deleteIndex('*', function(error) {
        should.not.exists(error);
        done();
      });
    });
  });
});
