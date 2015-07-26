#!/bin/sh

export NODE_ENV=test

node_modules/.bin/mocha test/*.test.coffee \
  --require coffee-script/register \
  --require should
