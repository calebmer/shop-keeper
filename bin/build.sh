#!/bin/sh

mkdir -p lib
node_modules/.bin/babel --stage 0 --retain-lines src --out-dir lib
