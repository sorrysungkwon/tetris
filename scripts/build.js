#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const template = fs.readFileSync(path.join(root, 'src/template.html'), 'utf8');
const css      = fs.readFileSync(path.join(root, 'src/style.css'),     'utf8');
const js       = fs.readFileSync(path.join(root, 'src/game.js'),       'utf8');

const html = template
  .replace('<!--BUILD_CSS-->', `<style>\n${css.trimEnd()}\n</style>`)
  .replace('<!--BUILD_JS-->',  `<script>\n${js.trimEnd()}\n</script>`);

fs.writeFileSync(path.join(root, 'index.html'), html);

const kb = (html.length / 1024).toFixed(1);
console.log(`Built index.html  ${kb} KB`);
