const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const cdn = require('../js/cdn.js');

async function integrityOf(url) {
  const response = await fetch(url);
  assert.equal(response.status, 200, url);
  const bytes = Buffer.from(await response.arrayBuffer());
  return 'sha384-' + crypto.createHash('sha384').update(bytes).digest('base64');
}

test('Plotly 2.27.0 bytes match the pinned integrity', async function () {
  assert.equal(await integrityOf(cdn.PLOTLY_SRC), cdn.PLOTLY_INTEGRITY);
});

test('transformers.js 2.11.0 entry bytes match the pinned integrity', async function () {
  assert.equal(await integrityOf(cdn.TRANSFORMERS_SRC), cdn.TRANSFORMERS_INTEGRITY);
});
