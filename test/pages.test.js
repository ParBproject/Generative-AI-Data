const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cdn = require('../js/cdn.js');

const root = path.join(__dirname, '..');
const livePages = [
  'index.html',
  'retail_sentiment_demo.html',
  'fraud_demo.html',
  'churn_demo.html',
  'automated_data_storytelling_demo.html'
];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('live page paths stay in place and link to each other', function () {
  livePages.forEach(function (page) {
    assert.equal(fs.existsSync(path.join(root, page)), true, page);
  });
  const home = read('index.html');
  const projects = read('js/portfolio-home.js');
  ['retail_sentiment_demo.html', 'fraud_demo.html', 'churn_demo.html', 'automated_data_storytelling_demo.html']
    .forEach(function (page) {
      assert.match(projects, new RegExp(page));
    });
  assert.match(home, /Skip to content/);
  assert.doesNotMatch(home, /id="visualizations"|chartHeatmap|chartTimeseries|chartHistogram|chartScatter/);
  assert.match(read('js/portfolio-home.js'), /live: 'retail_sentiment_demo.html'/);
});

test('homepage does not draw the fake charts or a Predicted/Actual heatmap', function () {
  const home = read('index.html');
  const script = read('js/portfolio-home.js');
  assert.match(home, /coefficients are written in the source/);
  assert.match(home, /made-up numbers/);
  assert.doesNotMatch(home, /dummyimage\.com|id="kpis"|95% CI|AI Forecast|cdn\.plot\.ly|js\/load-plotly\.js/);
  assert.doesNotMatch(script, /Plotly\.|newPlot|hovertemplate|Predicted %\{x\}|Actual %\{y\}|chartHeatmap|scattergl|95% CI|AI Forecast|Production models/);
  assert.doesNotMatch(home + script, /These four charts are random or hand-entered drawings|AUC 0\.91|F1-Score|2\.4M/);
});

test('Plotly script tags use the pinned integrity hash', function () {
  livePages.forEach(function (page) {
    const html = read(page);
    if (!html.includes('cdn.plot.ly')) return;
    assert.match(html, new RegExp(cdn.PLOTLY_SRC.replace(/[.]/g, '\\.')));
    assert.match(html, new RegExp(cdn.PLOTLY_INTEGRITY));
    assert.match(html, /crossorigin="anonymous"/);
  });
  const loader = read('js/load-plotly.js');
  assert.match(loader, /script\.integrity = cdn\.PLOTLY_INTEGRITY/);
  assert.match(loader, /crossOrigin = 'anonymous'/);
});

test('transformers entry is pinned and models load on demand', function () {
  const loader = read('js/load-transformers.js');
  const demo = read('js/sentiment-demo.js');
  const page = read('retail_sentiment_demo.html');
  assert.match(loader, /integrity: cdn\.TRANSFORMERS_INTEGRITY/);
  assert.match(page, /Models stay unloaded until you analyze a review\./);
  assert.match(page, /does not chat/);
  assert.match(page, /<label for="review">/);
  assert.match(demo, /function loadModels\(\)/);
  assert.match(demo, /analyzeBtn\.addEventListener\('click'/);
  assert.match(demo, /topk:\s*2/);
  assert.match(demo, /allowLocalModels = false/);
  assert.match(demo, /zeroShotArguments/);
  assert.match(demo, /runStages/);
  assert.match(page, /scored on its own/);
  assert.match(page, /2,000 characters/);
  assert.doesNotMatch(demo, /candidate_labels/);
  assert.doesNotMatch(demo, /\binit\(\)/);
  const handler = demo.split("addEventListener('click'")[1];
  assert.match(handler, /loadModels\(\)/);
});

test('fraud and churn pages do not present sketches as fitted models', function () {
  const fraud = read('fraud_demo.html');
  const churn = read('churn_demo.html');
  assert.match(fraud, /not a fraud detector/);
  assert.match(fraud, /no transaction data/);
  assert.doesNotMatch(fraud, /fraud_detection\.svg/);
  assert.match(fraud, /viewport/);
  assert.match(read('js/fraud-demo.js'), /Synthetic amount index/);
  assert.match(churn, /not fit on customer data/);
  assert.match(churn, /log-odds/);
  assert.doesNotMatch(churn, /SHAP/);
  assert.match(churn, /percentage points/);
  assert.match(churn, /viewport/);
  assert.doesNotMatch(churn, /id="shap"/);
  assert.match(read('js/churn-demo.js'), /churnInsight/);
  assert.match(read('js/churn-demo.js'), /formatPoints/);
});

test('story demo renders text, not HTML, and does not depend on a third-party CSV', function () {
  const page = read('automated_data_storytelling_demo.html');
  const demo = read('js/story-demo.js');
  assert.match(page, /computed in the page/);
  assert.match(page, /five made-up rows/);
  assert.match(page, /<label for="fileInput">/);
  assert.doesNotMatch(page, /seaborn|raw\.githubusercontent/);
  assert.doesNotMatch(demo, /innerHTML|seaborn|raw\.githubusercontent/);
  assert.match(demo, /SAMPLE_CSV/);
  assert.match(demo, /MAX_CSV_BYTES/);
  assert.match(demo, /summaryText/);
  assert.match(demo, /input\.value = ''/);
  assert.match(demo, /clearView\('Could not parse that CSV\.'\)/);
  assert.match(demo, /clearView\('This demo only reads CSV files up to 1 MB\.'\)/);
  assert.match(page, /id="factcheck"/);
  assert.match(page, /written in the page as examples/);
  assert.match(demo, /exampleClaims/);
  assert.match(demo, /resetFactCheck/);
  assert.doesNotMatch(demo, /innerHTML/);
});

test('the starter template is deleted and nothing links to it', function () {
  const starter = 'generative_ai_data_analyst_portfolio_git_hub_pages_single_file.html';
  assert.equal(fs.existsSync(path.join(root, starter)), false);
  const linked = livePages.concat(['README.md']).concat(
    fs.readdirSync(path.join(root, 'js')).map(function (name) { return 'js/' + name; })
  );
  linked.forEach(function (file) {
    assert.doesNotMatch(read(file), /generative_ai_data_analyst_portfolio_git_hub_pages_single_file/, file);
  });
});

test('no shipped page still hovers a hand-entered matrix as Predicted versus Actual', function () {
  const files = livePages.concat(
    fs.readdirSync(path.join(root, 'js')).map(function (name) { return 'js/' + name; })
  );
  files.forEach(function (file) {
    assert.doesNotMatch(read(file), /Predicted %\{x\}|Actual %\{y\}|hovertemplate/, file);
  });
});

test('link previews do not call the drawings AI-powered storytelling', function () {
  const home = read('index.html');
  assert.doesNotMatch(home, /AI-powered data storytelling/);
  assert.doesNotMatch(home, /dummyimage\.com/);
  assert.match(home, /DistilBERT on a review you type/);
});

test('local script sources point at files in the repo', function () {
  livePages.forEach(function (page) {
    const html = read(page);
    const sources = html.match(/<script src="([^"]+)"/g) || [];
    sources.forEach(function (tag) {
      const src = tag.slice('<script src="'.length, -1);
      if (/^https?:/i.test(src)) return;
      assert.equal(fs.existsSync(path.join(root, src)), true, page + ' -> ' + src);
    });
  });
});

test('generated dashboard images are not in the repo', function () {
  fs.readdirSync(root).forEach(function (name) {
    assert.equal(/simple_compose|^[12]\.png$/.test(name), false, name);
  });
  assert.equal(fs.existsSync(path.join(root, 'docs/screenshots')), false);
  assert.equal(fs.existsSync(path.join(root, 'images/fraud_detection.svg')), false);
  livePages.concat(['README.md']).forEach(function (file) {
    assert.doesNotMatch(read(file), /simple_compose|docs\/screenshots|dummyimage\.com/, file);
  });
});

test('demo sources do not contain credential assignments', function () {
  const files = fs.readdirSync(path.join(root, 'js')).map(function (name) { return 'js/' + name; })
    .concat(livePages);
  const secret = /sk_live_[0-9A-Za-z]+|AKIA[0-9A-Z]{16}|api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i;
  files.forEach(function (file) {
    assert.doesNotMatch(read(file), secret, file);
  });
});
