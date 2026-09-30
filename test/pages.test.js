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
  assert.match(home, /These four charts are random or hand-entered drawings\. They are not model evaluations\./);
  assert.match(read('js/portfolio-home.js'), /live: 'retail_sentiment_demo.html'/);
});

test('homepage charts are lazy, local-month labeled, and not called a confidence interval', function () {
  const home = read('js/portfolio-home.js');
  assert.match(home, /IntersectionObserver/);
  assert.match(home, /shiftMonth/);
  assert.match(home, /ILLUSTRATIVE_BAND_NAME/);
  assert.doesNotMatch(home, /toISOString/);
  assert.doesNotMatch(home, /95% CI/);
  assert.doesNotMatch(home, /AI Forecast/);
  assert.doesNotMatch(home, /scattergl/);
  assert.doesNotMatch(read('index.html'), /cdn\.plot\.ly/);
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
  assert.match(page, /not a chat model/);
  assert.match(page, /<label for="review">/);
  assert.match(demo, /function loadModels\(\)/);
  assert.match(demo, /analyzeBtn\.addEventListener\('click'/);
  assert.match(demo, /topk:\s*2/);
  assert.match(demo, /allowLocalModels = false/);
  assert.match(demo, /zeroShotArguments/);
  assert.match(demo, /runStages/);
  assert.match(page, /separate relevance scores/);
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
  assert.match(fraud, /viewport/);
  assert.match(read('js/fraud-demo.js'), /Synthetic amount index/);
  assert.match(churn, /not SHAP/);
  assert.match(churn, /percentage points/);
  assert.match(churn, /viewport/);
  assert.doesNotMatch(churn, /id="shap"/);
  assert.match(read('js/churn-demo.js'), /churnInsight/);
  assert.match(read('js/churn-demo.js'), /formatPoints/);
});

test('story demo renders text, not HTML, and does not depend on a third-party CSV', function () {
  const page = read('automated_data_storytelling_demo.html');
  const demo = read('js/story-demo.js');
  assert.match(page, /not written by a language model/);
  assert.match(page, /<label for="fileInput">/);
  assert.doesNotMatch(page, /seaborn|raw\.githubusercontent/);
  assert.doesNotMatch(demo, /innerHTML|seaborn|raw\.githubusercontent/);
  assert.match(demo, /SAMPLE_CSV/);
  assert.match(demo, /MAX_CSV_BYTES/);
  assert.match(demo, /summaryText/);
  assert.match(demo, /input\.value = ''/);
  assert.match(demo, /clearView\('Could not parse that CSV\.'\)/);
  assert.match(demo, /clearView\('This demo only reads CSV files up to 1 MB\.'\)/);
});

test('the starter template does not publish fabricated metrics or placeholder endpoints', function () {
  const starter = read('generative_ai_data_analyst_portfolio_git_hub_pages_single_file.html');
  assert.match(starter, /unused starter template/);
  assert.match(starter, /href="index\.html"/);
  assert.match(starter, /retail_sentiment_demo\.html/);
  assert.match(starter, new RegExp(cdn.PLOTLY_INTEGRITY));
  assert.match(starter, /Illustrative band \(±8\)/);
  assert.doesNotMatch(starter, /95% CI|yourusername|your-form-id|Avg Uplift|Stakeholder NPS|resume\.pdf|LangChain|Power BI|XGBoost|Formspree|toISOString/);
});

test('link previews do not call the drawings AI-powered storytelling', function () {
  assert.doesNotMatch(read('index.html'), /AI-powered data storytelling/);
  assert.doesNotMatch(read('generative_ai_data_analyst_portfolio_git_hub_pages_single_file.html'), /AI-powered data storytelling/);
  assert.match(read('index.html'), /Homepage charts are drawings, not model evaluations/);
});

test('local script sources point at files in the repo', function () {
  livePages.concat(['generative_ai_data_analyst_portfolio_git_hub_pages_single_file.html']).forEach(function (page) {
    const html = read(page);
    const sources = html.match(/<script src="([^"]+)"/g) || [];
    sources.forEach(function (tag) {
      const src = tag.slice('<script src="'.length, -1);
      if (/^https?:/i.test(src)) return;
      assert.equal(fs.existsSync(path.join(root, src)), true, page + ' -> ' + src);
    });
  });
});

test('demo sources do not contain credential assignments', function () {
  const files = fs.readdirSync(path.join(root, 'js')).map(function (name) { return 'js/' + name; })
    .concat(livePages)
    .concat(['generative_ai_data_analyst_portfolio_git_hub_pages_single_file.html']);
  const secret = /sk_live_[0-9A-Za-z]+|AKIA[0-9A-Z]{16}|api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i;
  files.forEach(function (file) {
    assert.doesNotMatch(read(file), secret, file);
  });
});
