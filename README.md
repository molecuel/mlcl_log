[![Build Status](https://travis-ci.org/molecuel/mlcl_log.svg?branch=master)](https://travis-ci.org/molecuel/mlcl_log)

[![NPM](https://nodei.co/npm-dl/mlcl_log.png?months=1)](https://nodei.co/npm/mlcl_log/)

[![NPM](https://nodei.co/npm/mlcl_log.png?downloads=true&stars=true)](https://nodei.co/npm/mlcl_log/)

[![NPM version](https://badge.fury.io/js/mlcl_log@2x.png)](http://badge.fury.io/js/mlcl_log)

mlcl_log
========

Logging module for the molecuel CMS

When initializing it logs to the console until the elasticsearch connection has been established.

console.log can be overwritten by the module and automatically write into elasticsearch.
The ttl can be configured via settings. If nothing is configured the logs will never be deleted.

Example in molecuel's config:
```js
{
  ttl: '4w',
  overwriteConsole: false
}
```
