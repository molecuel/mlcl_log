[![Build Status](https://travis-ci.org/molecuel/mlcl_log.svg?branch=master)](https://travis-ci.org/molecuel/mlcl_log)

[![NPM](https://nodei.co/npm-dl/mlcl_log.png?months=1)](https://nodei.co/npm/mlcl_log/)

[![NPM](https://nodei.co/npm/mlcl_log.png?downloads=true&stars=true)](https://nodei.co/npm/mlcl_log/)

[![NPM version](https://badge.fury.io/js/mlcl_log@2x.png)](http://badge.fury.io/js/mlcl_log)

mlcl_log
========


The integrated logging mechanism is available via the global molecuel instance in every module.

When starting up. The default logging mechanism is to log to the console. After the elasticsearch instance has been connected the mlcl_log module changes the logging to the elastic. The log format is compatible with logstash format and it should be possible to analyse the data with Kibana.

Every module gets the molecule core module instance with it’s init function parameters.

To use the logging of the molecuel system it’s just needed to execute

molecuel.log.info(‘mymodulename’, ‘message’, {field1: ‘myfielddata’})
molecuel.log.warn(‘mymodulename’, ‘message’, {field1: ‘myfielddata’})
molecuel.log.error(‘mymodulename’, ‘message’, {field1: ‘myfielddata’})
molecuel.log.debug(‘mymodulename’, ‘message’, {field1: ‘myfielddata’})

On default every log level except the debug level will be logged to the elastic search instance except the debug level.

Debugging can be configured via the configuration.


```js
ttl: '4w',
transports: {
  elasticsearch: {
   level: 'info'
  },
  console: {
   level: 'debug'
  }
}
```

In the config above the system logs everything to console. If the console entry in transports is removed only info debug level will be logged to elastic search. Console will be disabled.

If the elasticsearch transport entry will be changed to debug or something else there will be more log output to the elasticsearch.
