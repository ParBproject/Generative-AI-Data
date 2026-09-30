const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('README matches the live pages and the local test command', function () {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /https:\/\/parbproject\.github\.io\/Generative-AI-Data\//);
  assert.match(readme, /retail_sentiment_demo\.html/);
  assert.match(readme, /fraud_demo\.html/);
  assert.match(readme, /churn_demo\.html/);
  assert.match(readme, /automated_data_storytelling_demo\.html/);
  assert.match(readme, /node --test/);
  assert.match(readme, /Do not claim LangChain, Power BI, Tableau/);
  assert.match(readme, /synthetic cloud/);
  assert.match(readme, /hand-set two-coefficient logistic/);
  assert.doesNotMatch(readme, /How does fraud prevalence change transaction patterns/);
});

test('GitHub Actions pins Node and the actions, then runs npm test', function () {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8');
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /actions\/checkout@11d5960a326750d5838078e36cf38b85af677262/);
  assert.match(workflow, /actions\/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020/);
  assert.match(workflow, /node-version: '22\.14\.0'/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm test/);
  assert.doesNotMatch(workflow, /uses: actions\/checkout@v4\s/);
  assert.match(readme, /22\.14\.0/);
  assert.match(readme, /npm ci/);
  assert.equal(fs.readFileSync(path.join(root, '.nvmrc'), 'utf8').trim(), '22.14.0');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.test, 'node --test');
  assert.equal(fs.existsSync(path.join(root, 'package-lock.json')), true);
});
