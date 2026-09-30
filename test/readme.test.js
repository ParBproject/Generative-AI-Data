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

test('GitHub Actions runs the node test runner', function () {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8');
  assert.match(workflow, /node --test/);
  assert.match(workflow, /actions\/checkout@v4/);
  assert.match(workflow, /node-version: '22'/);
});
