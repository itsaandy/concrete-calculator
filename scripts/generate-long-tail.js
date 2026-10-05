#!/usr/bin/env node
'use strict';

// GitHub Pages uses instant HTML redirects rather than configurable HTTP 301s.
// Google treats these as permanent redirects:
// https://developers.google.com/search/docs/crawling-indexing/301-redirects
const fs = require('node:fs');
const path = require('node:path');
const redirects = require('./long-tail-data.json');
const root = path.join(__dirname, '..');
const domain = 'https://concretecalc.com.au';
const escape = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
let failed = false;

for (const [slug, target] of Object.entries(redirects)) {
  if (!/^[a-z0-9.-]+$/.test(slug) || slug.includes('..') || !target.startsWith('/') || target.startsWith('//')) {
    throw new Error('Invalid local redirect mapping');
  }
  const url = escape(domain + target);
  const canonical = escape(domain + target.split('?')[0]);
  const html = `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url=${url}">
  <link rel="canonical" href="${canonical}">
  <title>Calculator moved | ConcreteCalc</title>
</head>
<body>
  <h1>This calculation has moved</h1>
  <p><a href="${escape(target)}">Continue to the calculator</a> to enter or check your own measurements.</p>
</body>
</html>
`;
  const file = path.join(root, slug, 'index.html');
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== html) {
      console.error('Redirect differs from mapping: ' + slug);
      failed = true;
    }
  } else {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
  }
}
if (failed) process.exitCode = 1;
else console.log('PASS: ' + Object.keys(redirects).length + ' legacy redirects; sitemap unchanged');
