const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');

function walk(dir, files) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
    if (entry.name === 'node_modules' || entry.name === '.git') return;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.js')) files.push(full);
  });
}

test('every JavaScript file parses', function () {
  const files = [];
  walk(root, files);
  assert.ok(files.length >= 8, 'expected the demo scripts to be included');
  files.forEach(function (file) {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  });
});
