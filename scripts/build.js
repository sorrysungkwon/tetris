#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

async function build() {
  const template = fs.readFileSync(path.join(root, 'src/template.html'), 'utf8');
  const css      = fs.readFileSync(path.join(root, 'src/style.css'),     'utf8');

  let js;
  const gameJs = fs.readFileSync(path.join(root, 'src/game.js'), 'utf8');
  const usesModules = /^import\s/m.test(gameJs);

  if (usesModules) {
    // ES modules mode: esbuild bundles src/game.js (entry) + all imports
    const esbuild = require('esbuild');
    const result = await esbuild.build({
      entryPoints: [path.join(root, 'src/game.js')],
      bundle:      true,
      write:       false,
      format:      'iife',
      platform:    'browser',
      target:      'es2018',
    });
    js = Buffer.from(result.outputFiles[0].contents).toString();
    console.log('Mode: esbuild bundle (ES modules detected)');
  } else {
    // Plain concatenation mode: no imports yet
    js = gameJs;
    console.log('Mode: direct concat (no imports in game.js)');
  }

  const html = template
    .replace('<!--BUILD_CSS-->', `<style>\n${css.trimEnd()}\n</style>`)
    .replace('<!--BUILD_JS-->',  `<script>\n${js.trimEnd()}\n</script>`);

  fs.writeFileSync(path.join(root, 'index.html'), html);
  console.log(`Built index.html  ${(html.length / 1024).toFixed(1)} KB`);
}

build().catch(e => { console.error(e); process.exit(1); });
