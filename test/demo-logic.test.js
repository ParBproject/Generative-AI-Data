const test = require('node:test');
const assert = require('node:assert/strict');
const logic = require('../js/demo-logic.js');

test('baseline churn insight does not call a zero contribution an increase', function () {
  var tenure = logic.contribution(logic.COEFFICIENTS.tenure, 12, 12);
  var charges = logic.contribution(logic.COEFFICIENTS.charges, 70, 70);
  var insight = logic.churnInsight(tenure, charges);
  assert.equal(tenure, 0);
  assert.equal(charges, 0);
  assert.match(insight, /Tenure matches the baseline, so it does not change churn risk/);
  assert.match(insight, /monthly charges matches the baseline, so it does not change churn risk/);
  assert.doesNotMatch(insight, /increases/);
});

test('moving tenure and charges reports the sign of each contribution', function () {
  var tenure = logic.contribution(logic.COEFFICIENTS.tenure, 24, 12);
  var charges = logic.contribution(logic.COEFFICIENTS.charges, 90, 70);
  assert.ok(tenure < 0);
  assert.ok(charges > 0);
  var insight = logic.churnInsight(tenure, charges);
  assert.match(insight, /Tenure decreases churn risk relative to the baseline/);
  assert.match(insight, /monthly charges increases churn risk relative to the baseline/);
});

test('churn probability matches the hand-set logistic', function () {
  var probability = logic.churnProbability(12, 70);
  assert.ok(Math.abs(probability - (1 / (1 + Math.exp(1.8)))) < 1e-12);
  var delta = logic.percentagePointDelta(probability, probability);
  assert.equal(logic.formatPoints(delta), '0.0 percentage points');
  assert.equal(logic.churnPercent(probability), probability * 100);
});

test('formula text discloses that the bars are not SHAP', function () {
  var text = logic.churnFormulaText();
  assert.match(text, /not fit on customer data/);
  assert.match(text, /not SHAP/);
  assert.match(text, /-4/);
  assert.match(text, /-0\.05/);
  assert.match(text, /0\.04/);
});

test('fraud counts follow the slider and reject impossible rates', function () {
  assert.deepEqual(logic.fraudCounts(1000, 5), { fraudCount: 50, legitCount: 950 });
  assert.deepEqual(logic.fraudCounts(10, 33), { fraudCount: 3, legitCount: 7 });
  assert.throws(function () { logic.fraudCounts(1000, 101); }, /between 0 and 100/);
  assert.throws(function () { logic.fraudCounts(-1, 5); }, /non-negative integer/);
});

test('sentiment mapping does not treat a missing label as positive', function () {
  var both = logic.mapSentimentScores([
    { label: 'NEGATIVE', score: 0.8 },
    { label: 'POSITIVE', score: 0.2 }
  ]);
  assert.equal(logic.sentimentVerdict(both), 'negative');
  assert.equal(logic.sentimentVerdict(logic.mapSentimentScores([
    { label: 'LABEL_1', score: 0.91 }
  ])), null);
  assert.equal(logic.sentimentVerdict({ positive: 0.5, negative: 0.5 }), 'tie');
  assert.equal(logic.sentimentVerdict(logic.mapSentimentScores([[
    { label: 'POSITIVE', score: 0.7 },
    { label: 'NEGATIVE', score: 0.3 }
  ]])), 'positive');
});

test('CSV parser keeps quoted commas and ignores blank rows', function () {
  var rows = logic.parseCSV('name,note\r\n"A, B","he said ""hi"""\r\n\r\nC,plain\n');
  assert.deepEqual(rows, [
    { name: 'A, B', note: 'he said "hi"' },
    { name: 'C', note: 'plain' }
  ]);
  assert.deepEqual(logic.parseCSV('\uFEFFonly\nvalue'), [{ only: 'value' }]);
  assert.deepEqual(logic.parseCSV(''), []);
});

test('numeric columns look past the first row and summaries are plain text', function () {
  var rows = logic.parseCSV('bill,label,mixed\n10,east,\n20,west,3\n,south,4');
  assert.deepEqual(logic.numericColumns(rows), ['bill', 'mixed']);
  var stats = logic.summarizeNumeric(rows.map(function (row) { return row.bill; }));
  assert.equal(stats.count, 2);
  assert.equal(stats.mean, 15);
  assert.equal(stats.min, 10);
  assert.equal(stats.max, 20);
  var text = logic.summaryText('<b>bill</b>', stats);
  assert.equal(text, 'The average of <b>bill</b> is 15.00 with a range from 10.00 to 20.00 based on 2 records.');
  assert.equal(logic.summarizeNumeric(['nope']), null);
});

test('example claims are checked against the column stats', function () {
  var rows = logic.parseCSV(logic.SAMPLE_CSV);
  var stats = logic.summarizeNumeric(rows.map(function (row) { return row.monthly_bill; }));
  assert.equal(stats.mean, 66);
  assert.equal(stats.min, 35);
  assert.equal(stats.max, 120);
  assert.equal(stats.count, 5);
  var claims = logic.exampleClaims('monthly_bill', stats);
  assert.equal(claims.length, 6);
  assert.deepEqual(claims.map(function (claim) { return claim.type; }), [
    'unsupported number',
    'wrong comparison',
    'invented cause',
    'unsupported number',
    'wrong comparison',
    'invented cause'
  ]);
  assert.match(claims[0].sentence, /83\.40/);
  assert.match(claims[0].falsifier, /Mean is 66\.00/);
  assert.match(claims[1].falsifier, /Minimum is 35\.00/);
  assert.match(claims[1].falsifier, /Maximum is 120\.00/);
  assert.match(claims[3].sentence, /1805 records/);
  assert.match(claims[3].falsifier, /Row count is 5/);
  var hostile = logic.exampleClaims('<img src=x>', stats);
  assert.match(hostile[0].sentence, /<img src=x>/);
  assert.doesNotMatch(hostile[0].sentence, /<strong>/);
});

test('sample CSV is synthetic and has two numeric columns', function () {
  var rows = logic.parseCSV(logic.SAMPLE_CSV);
  assert.deepEqual(logic.numericColumns(rows), ['monthly_bill', 'tickets']);
  assert.equal(rows.length, 5);
});

test('slider parsing falls back when the value is empty', function () {
  assert.equal(logic.readSliderInt('12', 0), 12);
  assert.equal(logic.readSliderInt('', 7), 7);
  assert.equal(logic.readSliderInt('08', 0), 8);
});

test('zero-shot labels are a positional array, not an options object', function () {
  var args = logic.zeroShotArguments(['price', 'shipping']);
  assert.ok(Array.isArray(args[0]));
  assert.deepEqual(args[0], ['price', 'shipping']);
  assert.equal(args[1].hypothesis_template, 'This review is about {}.');
  assert.equal(args[1].multi_label, true);
  assert.equal(Object.hasOwn(args[1], 'candidate_labels'), false);
  assert.throws(function () {
    logic.zeroShotArguments({ candidate_labels: ['price'] });
  }, /array of strings/);
  assert.equal(logic.topicChartData({ labels: ['[object Object]'], scores: [0.9] }), null);
  assert.deepEqual(
    logic.topicChartData({ labels: ['price', 'shipping'], scores: [0.2, 0.8] }),
    { labels: ['price', 'shipping'], scores: [0.2, 0.8] }
  );
});

test('a failed analysis stage does not cancel the next stage', async function () {
  var seen = [];
  await logic.runStages([
    {
      task: function () { throw new Error('sentiment down'); },
      onError: function (error) { seen.push(error.message); }
    },
    {
      task: function () { seen.push('topic'); return Promise.resolve(); },
      onError: function () { seen.push('topic-error'); }
    }
  ]);
  assert.deepEqual(seen, ['sentiment down', 'topic']);
});

test('reviews past the character cap are clipped', function () {
  assert.deepEqual(logic.clipReview('short'), { text: 'short', truncated: false });
  var long = 'a'.repeat(logic.MAX_REVIEW_CHARS + 5);
  var clipped = logic.clipReview(long);
  assert.equal(clipped.truncated, true);
  assert.equal(clipped.text.length, logic.MAX_REVIEW_CHARS);
  assert.equal(logic.MAX_REVIEW_CHARS, 2000);
});

test('duplicate and hostile CSV headers stay data instead of being dropped', function () {
  var rows = logic.parseCSV('bill,bill,__proto__,constructor\n10,11,1,2\n12,13,3,4\n');
  assert.equal(rows[0].bill, '10');
  assert.equal(rows[0]['bill (2)'], '11');
  assert.equal(rows[1]['bill (2)'], '13');
  assert.equal(rows[0]['__proto__'], '1');
  assert.equal(rows[0].constructor, '2');
  assert.equal({}.polluted, undefined);
  assert.deepEqual(rows.warnings, ['Duplicate column "bill" was kept as "bill (2)".']);
  assert.deepEqual(logic.numericColumns(rows), ['bill', 'bill (2)', '__proto__', 'constructor']);
  var blank = logic.parseCSV('bill,,tickets\n1,ignored,2\n');
  assert.deepEqual(logic.numericColumns(blank), ['bill', 'tickets']);
  assert.match(blank.warnings.join(' '), /empty name was skipped/);
  assert.throws(function () { logic.parseCSV('a,b\n"unterminated,1'); }, /unclosed quote/);
});
